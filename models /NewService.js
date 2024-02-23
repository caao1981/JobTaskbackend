const mongoose = require("mongoose");
const {
  status,
  SERVICES,
  NAIL_TYPES,
  EXTRAS,
  HAVE_ITEMS,
  ALREADY_BOUGHT_ITEMS,
} = require("../constants");

const ratingsSchema = new mongoose.Schema({
  ratedByRole: {
    type: String,
    enum: ["user", "owner"],
  },
  // We dont need this because we already have the user and service provider attached to the Job.
  // ratedBy: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: function () {
  //     // Conditionally set the reference based on ratedByRole
  //     if (this.ratedByRole === "user") {
  //       return "user"; // Replace 'User' with the actual name of your user model
  //     } else if (this.ratedByRole === "owner") {
  //       return "owner"; // Replace 'Owner' with the actual name of your owner model
  //     }
  //     // Default to 'User' or 'Owner' based on your logic
  //     return "user"; // You can change this default as needed
  //   },
  // },
  rating: {
    type: Number,
  },
});
const reviewSchema = new mongoose.Schema({
  reviewByRole: {
    type: String,
    enum: ["user", "owner"],
  },
  review: {
    type: String,
  },
});

const newServiceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: [true, "There must be a user who places an order"],
    },
    serviceProvider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "owners",
      required: false,
    },
    name: {
      type: String,
      enum: SERVICES,
    },
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "new-chats",
      required: false,
    },
    serviceDetails: {
      bookingEstimate: String,
      ccZone: Boolean,
      ultraLowEmissionZone: Boolean,
      bookingDateTime: Date,
      address_1: String,
      address_2: String,
      postCode: String,
      collectionAddressPhoneNumber: String,
      nameOfPersonAtCollectionAddress: String,
      collectionPropertyTerm: String,
      hasLift: Boolean,
      floorLevel: String,
      images: [String],
      specialRequirements: String,
      notes: String,
      // Additional Fields for Specific Services
      menRequired: String, // Used in shop-and-deliver and furniture assembly
      lutonVans: [Number], // Used in removals and man-and-van
      deliveryAddress_1: String, // Used in shop-and-deliver and deliveries
      deliveryAddress_2: String, // Used in shop-and-deliver and deliveries
      deliveryPostCode: String, // Used in shop-and-deliver and deliveries
      deliveryAppropriateTerm: String, // Used in shop-and-deliver and deliveries
      deliveryLift: Boolean, // Used in shop-and-deliver and deliveries
      deliveryFloorLevel: String, // Used in shop-and-deliver and deliveries
      bedrooms: String, // Used in removals and cleaning
      largestItems: [String], // Used in removals and furniture assembly
      requireFurnitureAssembly: Boolean, // Used in removals and deliveries
      numOfPeopleWithHairCut: Number, // Used in mobile-hair-dresser, mobile-barbers
      nailTypes: {
        type: [
          {
            type: String,
            enum: NAIL_TYPES,
          },
        ],
         default: undefined,
      },
      extras: {
        type: [
          {
            type: String,
            enum: EXTRAS,
          },
        ],
        default: undefined,
      },
      haveItems: {
        type: [
          {
            type: String,
            enum: HAVE_ITEMS,
          },
        ],
        default: undefined,
      },
      numOfPeopleWithNailsDone: String, // Used in mobile-nail-technicians
      typeOfHair: String, // Used in mobile-hair-dresser, mobile-barbers
      typeOfBooking: String, // Used in cleaning
      notice_doNotDoEndOfTenancyCleaning: Boolean, // Used in cleaning
      numberOfCars: String, // Used in car-transport
      isNameAndContactDetailsSame: String, // Used in car-transport
      nameOfPersonAtDelivery: String, // Used in car-transport, deliveries
      phoneNumberOfPersonAtDelivery: String, // Used in car-transport, deliveries
      doesCarStart: Boolean, // Used in car-transport
      canCarRunAndDrive: Boolean, // Used in car-transport
      requireFurniteAssembly: Boolean,
      itemsNeedAssembling: Number,
      mountedItems: [String],
      hairOptions: [String],
      largestItems: [String],
      alreadyBoughtItems: Boolean,
      wantUsToBuy: {
        type: String,
        enum: ALREADY_BOUGHT_ITEMS,
      },
    },
    paid: {
      type: Boolean,
      default: false,
    },
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: [...Object.values(status)],
      default: status.PENDING,
    },
    rejectedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "owners",
      },
    ],
    ratings: [ratingsSchema],
    reviews: [reviewSchema],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("new-service", newServiceSchema);
