const Joi = require("joi");
const {
  SERVICES,
  NAIL_TYPES,
  EXTRAS,
  HAVE_ITEMS,
  ALREADY_BOUGHT_ITEMS,
} = require("./../constants/index.js");

function validateCreateJob(body) {
  const schema = Joi.object({
    gaurded: Joi.boolean().optional(),
    serviceName: Joi.string().valid(...SERVICES),
    bookingEstimate: Joi.number().integer().min(2).max(14),
    ccZone: Joi.boolean(),
    ultraLowEmissionZone: Joi.boolean(),
    bookingDateTime: Joi.date(),
    address_1: Joi.string(),
    address_2: Joi.string().allow(""),
    postCode: Joi.string(),
    collectionPropertyTerm: Joi.string().allow(""),
    hasLift: Joi.boolean(),
    floorLevel: Joi.string().allow(""),
    images: Joi.array().items(Joi.string()),
    specialRequirements: Joi.string().allow(""),
    notes: Joi.string().allow(""),
    menRequired: Joi.number(),
    lutonVans: Joi.array().items(Joi.number()),
    deliveryAddress_1: Joi.string(),
    deliveryAddress_2: Joi.string().allow(""),
    deliveryPostCode: Joi.string(),
    deliveryAppropriateTerm: Joi.string().allow(""),
    deliveryLift: Joi.boolean(),
    deliveryFloorLevel: Joi.string().allow(""),
    bedrooms: Joi.string().allow(""),
    largestItems: Joi.array().items(Joi.string()),
    requireFurnitureAssembly: Joi.boolean(),
    numOfPeopleWithHairCut: Joi.number(),
    nailTypes: Joi.array().items(Joi.string().valid(...NAIL_TYPES)),
    numOfPeopleWithNailsDone: Joi.number(),
    typeOfHair: Joi.string().allow(""),
    typeOfBooking: Joi.string().allow(""),
    notice_doNotDoEndOfTenancyCleaning: Joi.boolean(),
    numberOfCars: Joi.string().allow(""),
    isNameAndContactDetailsSame: Joi.boolean(),
    nameOfPersonAtDelivery: Joi.string().allow(""),
    phoneNumberOfPersonAtDelivery: Joi.string().allow(""),
    doesCarStart: Joi.boolean(),
    wantUsToBuy: Joi.string(),
    canCarRunAndDrive: Joi.boolean(),
    extras: Joi.array()
      .items(Joi.string().valid(...EXTRAS))
      .optional(),
    haveItems: Joi.array()
      .items(Joi.string().valid(...HAVE_ITEMS))
      .optional(),
    alreadyBoughtItems: Joi.boolean(),
    collectionAddressPhoneNumber: Joi.string(),
    nameOfPersonAtCollectionAddress: Joi.string(),
    requireFurniteAssembly: Joi.boolean(),
    itemsNeedAssembling: Joi.number(),
    mountedItems: Joi.array().items(Joi.string()),
    largestItems: Joi.array().items(Joi.string()),
    hairOptions: Joi.array().items(Joi.string()),
  });
  return schema.validate(body);
}

module.exports = {
  validateCreateJob,
};
