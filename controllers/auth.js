const bcrypt = require('bcryptjs');
const crypto = require('crypto')
const { validationResult } = require('express-validator/check')

const User = require('../models/user');
const nodemailer = require('nodemailer')

var transport = nodemailer.createTransport({
  host: "smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: "602544fe38b0e6",
    pass: "019b98ca8025d9"
  }
});
exports.getLogin = (req, res, next) => {
  let message = req.flash('error')
  if (message.length > 0) {

    message = message[0]
    
  } else {
    message = null
    
  }
  res.render('auth/login', {
    path: '/login',
    pageTitle: 'Login',
    //get the error message from the session 
    //after which it's then removed from the session.
    errorMessage: message
    
  });
};

exports.getSignup = (req, res, next) => {
  let message = req.flash('error')
  if (message.length > 0) {

    message = message[0]
    
  } else {
    message = null
    
  }
  res.render('auth/signup', {
    path: '/signup',
    pageTitle: 'Signup',
    errorMessage: message
    
  });
};

exports.postLogin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  User.findOne({ email: email })
    .then(user => {
      if (!user) {
        //temporalily flash the error message to the
        //the session, then clear it after use...
        req.flash('error','Invalid Email or Password')
        return res.redirect('/login');
      }
      bcrypt
        .compare(password, user.password)
        .then(doMatch => {
          if (doMatch) {
            req.session.isLoggedIn = true;
            req.session.user = user;
            return req.session.save(err => {
              console.log(err);
              res.redirect('/');
            });
          }
          req.flash('error','Invalid Email or Password')
          res.redirect('/login');
        })
        .catch(err => {
          console.log(err);
          res.redirect('/login');
        });
    })
    .catch(err => console.log(err));
};

exports.postSignup = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    console.log(errors.array())
    //if there are errors, send 422 status and re-render the page again
    return res.status(422).render('auth/signup', {
      path: '/signup',
      pageTitle: 'Signup',
      errorMessage: errors.array()[0].msg
      
    });
  }
  // User.findOne({ email: email })
  //   .then(userDoc => {
  //     if (userDoc) {
  //       req.flash('error','Email already in Use!')
  //       return res.redirect('/signup');
  //     }
      bcrypt
        .hash(password, 12)
        .then(hashedPassword => {
          const user = new User({
            email: email,
            password: hashedPassword,
            cart: { items: [] }
          });
          return user.save();
        })
        .then(result => {
          res.redirect('/login');
         return transport.sendMail({

            from:'node@shop.com',
            to: email,
            subject: 'Signup success',
            html:'<b>Signed up to Node shop successfully</b>'
          })
          
        }).catch(err => {
          console.log(err)
        })
    
    .catch(err => {
      console.log(err);
    });
};

exports.postLogout = (req, res, next) => {
  req.session.destroy(err => {
    console.log(err);
    res.redirect('/');
  });
};

exports.getReset = (req, res, next) => {
  let message = req.flash('error')
  if (message.length > 0) {
    message=message[0]
  } else {
    message=null
  }
  res.render('auth/reset', {
    path: '/reset',
    pageTitle: ' Reset Password..',
    errorMessage: message
  });

}

exports.postReset = (req, res, next) => {
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      console.log(err)
      return res.redirect('reset')    
    }
    const token = buffer.toString('hex')
    User.findOne({ email: req.body.email })
      .then(user => {
        if (!user) {
          req.flash('error', 'No account with that email found')
          return res.redirect('/reset')
        }
        user.resetToken = token
        user.resetTokenExpiration = Date.now() + 3600000
        return user.save()

      }).then(result => {
        //send the token to the email, since
        //we assume that the token was saved in the db
        res.redirect('/')

        transport.sendMail({
          from:'node@shop.com',
          to: req.body.email,
          subject: 'Password Reset',
          html: `
          <p>You requested a password reset</p>
          <p>Click this <a href="http://localhost:3000/reset/${token}">link</a> to set a new password

          `
        })
      })
      .catch(err => {
      
        console.log(err)
        
    })
    
  })
}

exports.getNewPassword = (req, res, next) => {
  const token = req.params.token
  User.findOne({ resetToken: token, resetTokenExpiration: { $gt: Date.now() } })
    .then(user => {
      let message = req.flash('error')
      if (message.length > 0) {
        message=message[0]
      } else {
        message=null
      }
      res.render('auth/new-password', {
        
        path:'/new-password',
        pageTitle:'New Password',
        errorMessage: message,
        userId: user._id.toString(),
        passwordToken:token
        
      })
    })
    .catch(err => {
      console.log(err)
    })
 
}
exports.postNewPassword = (req, res, next) => {
  const newPassword = req.body.password
  const userId = req.body.userId
  const passwordToken = req.body.passwordToken
  let resetUser

  User.findOne({
    resetToken: passwordToken,
    resetTokenExpiration: { $gt: Date.now() },
    _id:userId
  }).then(user => {
    resetUser=user
    return bcrypt.hash(newPassword,12)

  }).then(hashedPassword => {

    resetUser.password = hashedPassword
    resetUser.resetToken = undefined
    resetUser.resetTokenExpiration = undefined
    return resetUser.save()

  }).then(result => {
    res.redirect('/login')
  })
    .catch(err => {
    console.log(err)

  })
  
}