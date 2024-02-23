const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema(
  {
    chatId: {
      type: String,
      unique: true,
      required: true,
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      ref: "owners",
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      ref: "users",
    },

    active: {
      type: Boolean,
      default: true,
    },
    participants: [],
    messages: [
      {
        message: { type: String, required: true },
        receiver: { type: mongoose.Schema.Types.ObjectId, required: true },
        sender: { type: mongoose.Schema.Types.ObjectId, required: true },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("chats", chatSchema);
