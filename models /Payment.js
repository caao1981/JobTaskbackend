const mongoose = require("mongoose");
const { SERVICES } = require("../constants");

const paymentModel = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    job_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "new-service",
      // required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    payment_id: {
      type: String,
    },
    currency: {
      type: String,
      required: true,
    },
    balance_transaction: {
      type: String,
    },
    payment_method: {
      type: String,
    },
    receipt_url: {
      type: String,
    },
    refund_url: {
      // refund url if captured
      type: String,
    },
    status: {
      type: String,
    },
    transfered: {
      type: Boolean,
      default: false,
    },
    captured: {
      type: Boolean,
      default: false,
    },
    refunded: {
      type: Boolean,
      default: false,
    },
    service: {
      type: String,
      enum: SERVICES,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("payment", paymentModel);
