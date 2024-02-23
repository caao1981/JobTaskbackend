const Joi = require("joi");
const {
  SERVICES,
  NAIL_TYPES,
  ALREADY_BOUGH_ITEMS,
} = require("../constants/index.js");

function validateAddServiceToServiceProvider(body) {
  const schema = Joi.object({
    gaurded: Joi.boolean(),
    name: Joi.string().required(),
    menAvailable: Joi.number(),
    provideFurnitureAssembly: Joi.boolean(),
    lutonVansAvailable: Joi.number(),
    typeOfCleaning: Joi.array().items(Joi.string().valid("regular", "deep")),
    schedule: Joi.object({
      monday: Joi.object({
        value: Joi.boolean().required(),
        startTime: Joi.string().regex(/^\d{2}:\d{2}$/),
        endTime: Joi.string().regex(/^\d{2}:\d{2}$/),
      }),
      tuesday: Joi.object({
        value: Joi.boolean().required(),
        startTime: Joi.string().regex(/^\d{2}:\d{2}$/),
        endTime: Joi.string().regex(/^\d{2}:\d{2}$/),
      }),
      wednesday: Joi.object({
        value: Joi.boolean().required(),
        startTime: Joi.string().regex(/^\d{2}:\d{2}$/),
        endTime: Joi.string().regex(/^\d{2}:\d{2}$/),
      }),
      thursday: Joi.object({
        value: Joi.boolean().required(),
        startTime: Joi.string().regex(/^\d{2}:\d{2}$/),
        endTime: Joi.string().regex(/^\d{2}:\d{2}$/),
      }),
      friday: Joi.object({
        value: Joi.boolean().required(),
        startTime: Joi.string().regex(/^\d{2}:\d{2}$/),
        endTime: Joi.string().regex(/^\d{2}:\d{2}$/),
      }),
      saturday: Joi.object({
        value: Joi.boolean().required(),
        startTime: Joi.string().regex(/^\d{2}:\d{2}$/),
        endTime: Joi.string().regex(/^\d{2}:\d{2}$/),
      }),
      sunday: Joi.object({
        value: Joi.boolean().required(),
        startTime: Joi.string().regex(/^\d{2}:\d{2}$/),
        endTime: Joi.string().regex(/^\d{2}:\d{2}$/),
      }),
    }),
  });
  return schema.validate(body);
}

module.exports = {
  validateAddServiceToServiceProvider,
};
