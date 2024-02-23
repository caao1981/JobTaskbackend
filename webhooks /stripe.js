const stripe = require("stripe");

// This is your Stripe CLI webhook secret for testing your endpoint locally.


exports.stripeWebhooks = (request, response) => {
  const sig = request.headers["stripe-signature"];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      request.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    response.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }
  let charge, paymentIntent, payout;

  // Handle the event
  switch (event.type) {
    case "charge.captured":
      charge = event.data.object;
      // Then define and call a function to handle the event charge.captured
      break;
    case "charge.expired":
      charge = event.data.object;
      // Then define and call a function to handle the event charge.expired
      break;
    case "charge.failed":
      charge = event.data.object;
      // Then define and call a function to handle the event charge.failed
      break;
    case "charge.refunded":
      charge = event.data.object;
      // Then define and call a function to handle the event charge.refunded
      break;
    case "charge.succeeded":
      charge = event.data.object;
      // Then define and call a function to handle the event charge.succeeded
      break;
    case "charge.dispute.created":
      dispute = event.data.object;
      // Then define and call a function to handle the event charge.dispute.created
      break;
    case "payment_intent.canceled":
      paymentIntent = event.data.object;
      // Then define and call a function to handle the event payment_intent.canceled
      break;
    case "payment_intent.created":
      paymentIntent = event.data.object;
      // Then define and call a function to handle the event payment_intent.created
      break;
    case "payment_intent.payment_failed":
      paymentIntent = event.data.object;
      // Then define and call a function to handle the event payment_intent.payment_failed
      break;
    case "payment_intent.succeeded":
      paymentIntent = event.data.object;
      // Then define and call a function to handle the event payment_intent.succeeded
      break;
    case "payout.created":
      payout = event.data.object;
      // Then define and call a function to handle the event payout.created
      break;
    case "payout.paid":
      payout = event.data.object;
      // Then define and call a function to handle the event payout.paid
      break;
    // ... handle other event types
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  response.send();
};
