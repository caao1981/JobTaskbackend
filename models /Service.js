const mongoose = require("mongoose");
// USELESS
const serviceSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "owner",
    // required: [true, "Please provide owner id"],
  },
  service: {
    type: String,
    required: true,
    enum: [
      "cleaning",
      "car_transport",
      "shop_deliver",
      "furniture_assembly",
      "removal",
    ],
  },
  label: {
    type: String,
    required: true,
  },
  deepClean: {
    type: Boolean,
    default: false,
  },
  regularClean: {
    type: Boolean,
    default: false,
  },

  specialities: [
    {
      title: String,
    },
  ],
  regularCleanPrice: {
    type: Number,
    min: [0, "Price should be greate than 0"],
  },
  deepCleanPrice: {
    type: Number,
    min: [0, "Price should be greate than 0"],
  },
  timing: [
    {
      day: {
        type: String,
        enum: [
          "Sunday",
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ],
      },
      opening: String,
      closing: String,
      open: Boolean,
    },
  ],
  // removal screen 1
  pickUpLocation: {
    type: String,
  },
  dropOffLocation: {
    type: String,
  },
  description: {
    type: String,
  },
  normalDelivery: {
    type: Boolean,
    default: false,
  },
  bulkDelivery: {
    type: Boolean,
    default: false,
  },
  category: {
    type: String,
  },
  numOfMen: {
    type: Number,
    min: [0, "Number of men should be greate than 0"],
    max: [100, "Number of men should not be greater than 100"],
  },
  numOfHours: {
    type: Number,
    min: [0, "Number of hours should be greate than 0"],
    max: [500, "Number of hours should not be greater than 500"],
  },
  itemCategory: [
    {
      title: String,
    },
  ],
  // additional info removal
  // departure

  numOfMovers: {
    type: Number,
    min: [0, "Number of men should be greate than 0"],
    max: [100, "Number of men should not be greater than 100"],
  },
  numOfFloors: {
    type: Number,
    min: [0, "Number of floors should be greate than 0"],
    max: [200, "Number of floors should not be greater than 200"],
  },
  lift: {
    type: Boolean,
    default: false,
  },
  packing: {
    type: Boolean,
    default: false,
  },
  disassemble: {
    type: Boolean,
    default: false,
  },
  // destination attribs
  numOfFloorsDest: {
    type: Number,
    min: [0, "Number of floors should be greate than 0"],
    max: [200, "Number of floors should not be greater than 200"],
  },
  liftDest: {
    type: Boolean,
    default: false,
  },

  reassemble: {
    type: Boolean,
    default: false,
  },

  // furniture attribs

  numOfItems: {
    type: Number,
    min: [0, "Number of items should be greate than 0"],
    max: [100, "Number of items should not be greater than 100"],
  },

  // car Transport

  carManufacturer: {
    type: String,
  },
  carModel: {
    type: String,
  },
  carCategory: {
    type: String,
  },
  // shop and deliver

  deliveryAddress: {
    type: String,
  },
  price: {
    type: Number,
    required: true,
    default: 0,
  },
});

module.exports = mongoose.model("services", serviceSchema);
