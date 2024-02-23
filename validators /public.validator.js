const Joi = require("joi");

function contactUsSchema(body) {
  const schema = Joi.object({
    firstName: Joi.string(),
    lastName: Joi.string(),
    email: Joi.string().email(),
    subject: Joi.string(),
    message: Joi.string(),
  });

  return schema.validate(body);
}

module.exports = {
  contactUsSchema,
};
