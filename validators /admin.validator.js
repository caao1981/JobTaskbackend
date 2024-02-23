const Joi = require("joi");
const { SERVICES, NAIL_TYPES } = require("../constants/index.js");

function validateGivePaymentToProvider(body) {
  const schema = Joi.object({
    gaurded: Joi.boolean().optional(),
    paymentAmount: Joi.number().required(),
    serviceProviderId: Joi.string().required(),
  });
  return schema.validate(body);
}
function validateSendMessageToAdmin(body) {
  const schema = Joi.object({
    message: Joi.string(),
  });
  return schema.validate(body);
}

module.exports = {
  validateSendMessageToAdmin,
  validateGivePaymentToProvider,
};
