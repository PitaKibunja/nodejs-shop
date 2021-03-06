// This example sets up an endpoint using the Express framework.
// Watch this video to get started: https://youtu.be/rPR2aJ6XnAc.

const express = require('express');
const app = express();
const stripe = require('stripe')('sk_test_51J97f7ErN3x6hH0NT3lNXjB8rdhg5lXq4el5ZmX2qPgUjVhYnTLa1vPE5A1QrjQBGnb6zodWBRGPBooGCF2uJ71s00OGpjxs1Y')

app.post('/create-checkout-session', async (req, res) => {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'T-shirt',
          },
          unit_amount: 2000,
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: 'https://example.com/success',
    cancel_url: 'https://example.com/cancel',
  });

  res.redirect(303, session.url)
});

app.listen(4242, () => console.log(`Listening on port ${4242}!`));