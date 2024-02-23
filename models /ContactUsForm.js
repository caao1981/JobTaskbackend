const mongoose = require("mongoose");

const contactUsSchema = new mongoose.Schema(
  {
    firstName: String,
    lastName: String,
    email: String,
    subject: String,
    message: String,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("contact-us", contactUsSchema);
