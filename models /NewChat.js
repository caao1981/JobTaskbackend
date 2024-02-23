const mongoose = require("mongoose");
const { USER_ROLES } = require("./../constants");

const messageSchema = new mongoose.Schema(
  {
    message: { type: String, required: true },
    sentBy: {
      role: {
        type: String,
        enum: USER_ROLES,
      },
      sentById: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        ref: (params) => {
          const checkRole = this.role;
          if (checkRole === "user") {
            return "users";
          }
          if (checkRole === "owner") {
            return "owners";
          }
          if (checkRole === "admin") {
            return "admins";
          }
        },
      },
    },
  },
  { timestamps: { createdAt: true } }
);

const chatSchema = new mongoose.Schema(
  {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      ref: "admins",
    },
    serviceProvider: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      ref: "owners",
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      ref: "users",
    },
    serviceName: {
      type: String,
      required: false,
    },
    active: {
      type: Boolean,
      default: true,
    },
    messages: [messageSchema],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("new-chats", chatSchema);
