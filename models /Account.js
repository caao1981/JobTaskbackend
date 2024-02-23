const mongoose = require("mongoose");

const AccountSchema = new mongoose.Schema({
  account_type: {
    type: Number,
    // 1 for stripe
    //other may be in future
    default: 1,
    enum: [1, 2],
  },
  account_id: {
    type: String,
    unique: true,
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
  },
  amount: {
    type: Number,
    min: 0,
    default: 0,
  },
});

module.exports = mongoose.model("account", AccountSchema);
