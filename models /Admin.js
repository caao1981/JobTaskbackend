const { Schema, model } = require("mongoose");
const { genSalt, getRounds, hash } = require("bcrypt");
const adminSchema = new Schema(
  {
    fullName: {
      type: String,
    },
    email: {
      type: String,
      required: [true, "email is required"],
      unique: true,
    },
    password: {
      type: String,
      required: [true, "password is required"],
      min: [8, "password should be at least 8 characters"],
    },
    phone: {
      type: String,
    },
    address: {
      type: String,
    },
    // firebaseUid:{
    //   type: String,
    //   required: true,
    //   unique: true,
    // },
    profileImage: String,
    verified: {
      type: Boolean,
      default: false,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

adminSchema.pre("save", async function (next) {
  if (this.password) {
    const saltRounds = 10;
    const salt = await genSalt(saltRounds);
    this.password = await hash(this.password, salt);
  }
  next();
});

module.exports = model("admins", adminSchema);
