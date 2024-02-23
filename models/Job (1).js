const mongoose = require("mongoose");
const { status } = require("../constants");
// useless
const jobSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "owners",
      // required: [true, "Please provide owner id"],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: [true, "Please provide user id"],
    },
    service: {
      type: String,
      enum: [
        "cleaning",
        "bulk_deliveries",
        "shop_deliver",
        "furniture_assembly",
        "removal",
        "car_transport",
      ],
    },
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "services",
    },
    deepClean: {
      type: Boolean,
      default: false,
      required: true,
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
    numOfRooms: {
      type: Number,
      min: [0, "Number of rooms should be greate than 0"],
      max: [100, "Number of men should not be greater than 100"],
    },
    roomType: {
      type: String,
    },
    sizeOfRooms: {
      type: Number,
      min: [0, "Size of rooms should be greate than 0"],
      max: [2000, "Number of men should not be greater than 2000"],
    },
    deepCleanPrice: {
      type: Number,
      min: [0, "Price should be greate than 0"],
    },
    appliances: [],

    // min: [0, "Number of appliances should be greate than 0"],
    // max: [20, "Number of appliances should not be greater than 20"],

    Dishes: {
      type: Number,
      min: [0, "Number of dishes should be greate than 0"],
      max: [2000, "Number of dishes should not be greater than 2000"],
    },
    laundry: {
      type: Number,
      min: [0, "Number of laundry should be greate than 0"],
      max: [2000, "Number of laundry should not be greater than 2000"],
    },
    timing: [
      {
        day: {
          type: String,
          enum: ["Sun", "Mon", "Tue", "Wed", "Thu", "Frid"],
        },
        opening: String,
        closing: String,
      },
    ],
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
    // status: {
    //   type: String,
    //   enum: [...Object.values(status)],
    //   default: status.ADMIN_APPROVAL,
    // },
    dateTime: {
      type: Date,
      required: true,
    },
    scheduled: {
      type: Boolean,
      default: false,
    },
    rejectedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "owners",
      },
    ],
    providerRating: Number,
    userRating: Number,
    providerReview: String,
    userReview: String,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("jobs", jobSchema);
