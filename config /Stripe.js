const Stripe = require("stripe")(process.env.STRIPE_SK);
// const Stripe = require("stripe")("sk_test_5J3kxIvZa5KTXhTsaXaPPJNl");

module.exports = Stripe;
