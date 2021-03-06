const express = require('express');
const { check, body } = require('express-validator/check')
const User = require('../models/user')

const authController = require('../controllers/auth');

const router = express.Router();

router.get('/login', authController.getLogin);

router.get('/signup', authController.getSignup);

router.post('/login', [
    body('email')
        .isEmail()
        .withMessage('Invalid Credentials..')
        .normalizeEmail(),
    body('password', 'Invalid Credentials')
        .isLength({ min: 5 })
        .isAlphanumeric()
        .trim()
],
    authController.postLogin
);

router.post(
    '/signup',
    [
    check('email')
        .isEmail()
        .withMessage('Please Enter a valid email')
        .custom((value, { req }) => {
            // if (value === 'pita@pita.com') {
            //     throw new Error('This email is forbidden')
            // }
            // return true
            return User.findOne({ email: value })
                .then(userDoc => {
                    if (userDoc) {
                        return Promise.reject('Email already in Use!')
                    }
                })
        }).normalizeEmail(),
        body('password',
            'Please enter a password with only numbers and text and atleast 5 characters')
            .isLength({ min: 5 })
            .isAlphanumeric()
            .trim()
        
        ,
        body('confirmPassword').trim().custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error('Passwords have to match')
            }
            return true
        })
    ],
    authController.postSignup
);

router.post('/logout', authController.postLogout);

router.get('/reset', authController.getReset)

router.post('/reset', authController.postReset)

router.get('/reset/:token',authController.getNewPassword)

router.post('/new-password', authController.postNewPassword)

module.exports = router;