const ContactUsModel = require("../models/ContactUsForm");
const { contactUsSchema } = require("../validators/public.validator");

const contactUs = async (req, res, next) => {
  try {
    const { error } = contactUsSchema(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        response: error.details[0].message,
        data: req.body,
      });
    }

    const contactUsFormInput = new ContactUsModel(req.body);

    await contactUsFormInput.save();
    return res.status(201).json({
      error: false,
      response: "Form submitted Successfully",
      data: null,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: true,
      response: error.message,
      data: null,
    });
  }
};

const getContactUsRequests = async (req, res, next) => {
  try {
    const requests = await ContactUsModel.find({});

    return res.status(201).json({
      error: false,
      response: null,
      data: requests,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: true,
      response: error.message,
      data: null,
    });
  }
};

module.exports = {
  getContactUsRequests,
  contactUs,
};
