const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "FullName is required"],
    },
    email: {
      type: String,
      required: [true, "email is required"],
      unique: true,
    },
    phone: {
      type: String,
      required: [true, "phone is required"],

      unique: true,
    },
    address: {
      type: String,
      required: [true, "address is required"],
    },
    city: {
      type: String,
      required: [true, "city is required"],
    },
    description: {
      type: String,
    },
    zipCode: {
      type: String,
      required: [true, "zipCode is required"],
    },
    profilePic: String,
    verified: {
      type: Boolean,
      default: false,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    requestId: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("users", userSchema);
