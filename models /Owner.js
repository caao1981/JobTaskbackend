const mongoose = require("mongoose");
const { SERVICES, CLEANING_TYPES } = require("../constants");

const eachDayScheduleSchema = new mongoose.Schema({
  value: {
    type: Boolean,
  },
  startTime: {
    hours: {
      type: Number,
      validate: (val) => val < 24 && val >= 0,
    },
    minutes: {
      type: Number,
      validate: (val) => val < 60 && val >= 0,
    },
  },
  endTime: {
    hours: {
      type: Number,
      validate: (val) => val < 24 && val >= 0,
    },
    minutes: {
      type: Number,
      validate: (val) => val < 60 && val >= 0,
    },
  },
});

const withdrawalSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true,
    },
    adminWhoPaid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "admins",
    },
  },
  {
    timestamps: true,
  }
);

const eachServiceSchema = new mongoose.Schema({
  name: {
    type: String,
    enum: SERVICES,
  },
  menAvailable: {
    type: Number,
  },
  provideFurnitureAssembly: {
    type: Boolean,
  },
  lutonVansAvailable: {
    type: Number,
  },
  typeOfCleaning: [
    {
      type: String,
      enum: CLEANING_TYPES,
    },
  ],
  schedule: {
    monday: eachDayScheduleSchema,
    tuesday: eachDayScheduleSchema,
    wednesday: eachDayScheduleSchema,
    thursday: eachDayScheduleSchema,
    friday: eachDayScheduleSchema,
    saturday: eachDayScheduleSchema,
    sunday: eachDayScheduleSchema,
  },
});

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
    },
    address: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
     services: [eachServiceSchema],
    withdrawals: [withdrawalSchema],
    description: {
      type: String,
    },
    zipCode: {
      type: String,
      required: true,
    },
    fileUri: String,
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
    profilePic: String,
    reviews: [],
    accountConnected: {
      type: Boolean,
      default: false,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("owners", userSchema);
