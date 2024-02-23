const { model, Schema } = require("mongoose");

const AuthSchema = new Schema({
  phone: {
    type: String,
    required: true,
  },
  requestId: {
    type: String,
    required: true,
  },
});

module.exports = model("auth", AuthSchema);
