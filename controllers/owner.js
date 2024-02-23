const userModel = require("../models/Owner");
const { generateAccessToken } = require("../helpers/jwt");
const vonage = require("../helpers/vonage");
const serviceModel = require("../models/Service");
const cloudinary = require("cloudinary").v2;
const AuthModel = require("../models/Auth");
const {
  IS_OTP_ENABLED,
  DEMO_NUMBER,
  DEMO_REQUEST_ID,
  DEMO_OTP,
} = require("../constants");
const {
  validateAddServiceToServiceProvider,
} = require("./../validators/owner.validator");

const {
  convertInputTimeObjectToRequiredScheduleFormat,
  buildPayloadObj,
} = require("./local-helpers");

const Owner = require("../models/Owner");
const { request } = require("express");
const NewService = require("../models/NewService");

const sendOtp = async (req, res, next) => {
  try {
    const { phone } = req.body;
    const demoRequestId = DEMO_REQUEST_ID;
    const demoNumber = DEMO_NUMBER;

    const userInfo = await userModel.findOne({ phone });
    let requestId = null;
    if (IS_OTP_ENABLED && phone !== demoNumber) {
      requestId = await vonage.requestOtp(phone);

      if (!requestId) {
        return res.status(400).json({
          error: true,
          response: "Request ID is invalid",
          data: null,
        });
      }
    }

    if (requestId || !IS_OTP_ENABLED || phone === demoNumber) {
      await AuthModel.updateOne(
        { phone: phone === demoNumber ? demoNumber : phone },
        {
          phone,
          requestId: IS_OTP_ENABLED
            ? phone === demoNumber
              ? demoRequestId
              : requestId
            : demoRequestId,
        },
        {
          upsert: true,
          setDefaultsOnInsert: true,
        }
      );
    }

    // update user with request id

    if (userInfo) {
      await userInfo.update({
        requestId: requestId || demoRequestId,
      });
    }

    return res.json({
      data: requestId || demoRequestId,
      response: "Otp sent to your mobile number",
      error: false,
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

const verifyOtp = async (req, res, next) => {
  try {
    const { phone, otp } = req.body;
    const demoNumber = DEMO_NUMBER;
    // const demoNumber = process.env.demoNumber;
    const demoOTP = DEMO_OTP;

    if (IS_OTP_ENABLED && phone !== demoNumber) {
      // if signup is true then if otp is invalid delete the user account
      const authInstance = await AuthModel.findOne({ phone });

      if (!authInstance) {
        return res.status(400).json({
          data: null,
          response: "Request Not Found!",
          error: true,
        });
      }

      const response = await vonage.verifyOtp(otp, authInstance.requestId);
      console.log(response);
      if (response.error) {
        return res.status(401).json({
          data: null,
          response: response.message || "Invalid otp provided",
          error: true,
        });
      }
    } else {
      if (otp !== demoOTP) {
        return res.status(401).json({
          data: null,
          response: "Invalid otp provided",
          error: true,
        });
      }
    }

    return res.json({
      data: null,
      response: " otp verified",
      error: false,
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
const register = async (req, res, next) => {
  try {
    const { fullName, email, city, address, zipCode, phone, requestId } =
      req.body;

    // check for requestId
    // authorization

    let findQuery = {
      phone,
    };

    if (IS_OTP_ENABLED) {
      findQuery.requestId = requestId;
    }

    const isFound = await AuthModel.findOne({
      phone,
      requestId,
    });
    if (!isFound) {
      return res.status(400).json({
        data: null,
        error: true,
        response: "un-authorized request",
      });
    }

    const phoneAlreadyExists = await userModel.findOne({ phone });

    if (phoneAlreadyExists) {
      return res.status(409).json({
        data: null,
        error: true,
        response: "User already exists",
      });
    }

    const emailAlreadyExists = await userModel.findOne({ email });

    if (emailAlreadyExists) {
      return res.status(409).json({
        data: null,
        error: true,
        response: "User already exists",
      });
    }

    const savedUser = await new userModel({
      fullName,
      email,
      city,
      address,
      zipCode,
      phone,
      requestId,
    }).save();

    // await isFound.delete();

    return res.json({
      data: savedUser,
      error: false,
      response: "User created successfully",
    });
  } catch (error) {
    let errorMsg = "Something went wrong";
    let status = 500;
    if (error.code === 11000) {
      if (error.keyPattern) {
        status = 400;
        const { email, phone } = error.keyPattern;
        const { email: emailVal, phone: phoneVal } = error.keyValue;
        if (email) {
          errorMsg = `${emailVal} email already in use`;
        }
        if (phone) {
          errorMsg = `${phoneVal} phone already in use`;
        }
      }
    }
    console.log(error);

    return res.status(status).json({
      error: true,
      response: error.message,
      data: null,
    });
  }
};

const login = async (req, res, next) => {
  try {
    let { phone, requestId } = req.body;

    const demoNumber = DEMO_NUMBER;
    const demoRequestId = DEMO_REQUEST_ID;
    if (phone === demoNumber) {
      requestId = demoRequestId;
    }
    const userInfo = await userModel.findOne({ phone, disabled: false });
    const authInstance = await AuthModel.findOne({ phone });

    if (!userInfo) {
      return res.status(404).json({
        data: null,
        response: "User not found!",
        error: true,
      });
    }

    if (
      !userInfo ||
      (IS_OTP_ENABLED &&
        userInfo.requestId &&
        userInfo.requestId !== authInstance.requestId)
    ) {
      return res.status(400).json({
        data: null,
        response: "Invalid request | Account disabled",
        error: true,
      });
    }

    const payload = {
      id: userInfo._id,
      phone,
      role: "owner",
    };
    const token = await generateAccessToken(payload);
    return res.json({
      data: userInfo,
      response: null,
      accessToken: token,
      error: false,
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

const me = async (req, res, next) => {
  try {
    const userInfo = await userModel
      .findById(req.user)
      .select("-password -createdAt -updatedAt");

    return res.json({
      data: { ...userInfo._doc, CRYPTOSECRET: process.env.CRYPTOSECRET },
      response: null,
      error: false,
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

const listOwners = async (req, res, next) => {
  try {
    // check for query params

    const { service } = req.query;

    const serviceProviders = await Owner.find(
      service ? { "services.name": service } : {}
    );

    return res.json({
      data: serviceProviders,
      response: null,
      error: false,
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

const addOrUpdateService = async (req, res, next) => {
  try {
    const { error } = validateAddServiceToServiceProvider(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        response: error.details[0].message,
        data: req.body,
      });
    }
    const ownerId = req.user;

    const {
      name,
      menAvailable,
      provideFurnitureAssembly,
      lutonVansAvailable,
      typeOfCleaning,
      schedule,
    } = req.body;

    let payload = {};

    if (name) {
      payload.name = name;
    }
    if (menAvailable) {
      payload.menAvailable = menAvailable;
    }
    if (provideFurnitureAssembly) {
      payload.provideFurnitureAssembly = provideFurnitureAssembly;
    }
    if (lutonVansAvailable) {
      payload.lutonVansAvailable = lutonVansAvailable;
    }
    if (typeOfCleaning) {
      payload.typeOfCleaning = typeOfCleaning;
    }

    if (schedule) {
      payload.schedule = {};
      Object.entries(schedule).forEach((eachScheduleDay) => {
        const convertedDay = convertInputTimeObjectToRequiredScheduleFormat(
          eachScheduleDay[1]
        );

        payload.schedule[eachScheduleDay[0]] = convertedDay; // Add convertedDay to the payload.schedule
      });
    }

    const serviceAlreadyAdded = await Owner.findOne({
      _id: ownerId,
      "services.name": name,
    });

    if (serviceAlreadyAdded) {
      // Replace the existing service with the payload object
      await Owner.updateOne(
        { _id: ownerId, "services.name": name },
        { $set: { "services.$": payload } }
      );

      return res.json({
        data: payload,
        response: null,
        error: false,
      });
    } else {
      let ownerWithServiceAdded = await Owner.findByIdAndUpdate(
        ownerId,
        { $push: { services: payload } },
        { new: true }
      );

      return res.json({
        data: ownerWithServiceAdded,
        response: null,
        error: false,
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: true,
      response: error.message,
      data: null,
    });
  }
};

const getAllServices = async (req, res, next) => {
  const ownerId = req.user;
  try {
    const services = await Owner.findById(ownerId).select("services");
    return res.json({
      data: services,
      response: null,
      error: false,
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

const deleteService = async (req, res, next) => {
  try {
    const { name } = req.query;
    const ownerId = req.user;

    if (!name) {
      return res.status(400).json({
        response: "Must send `name` as Query Parameter",
        error: true,
      });
    }

    // Use $pull to remove the service with the specified name
    const updatedOwner = await Owner.findByIdAndUpdate(
      ownerId,
      { $pull: { services: { name: name } } },
      { new: true } // Get the updated document after the operation
    );

    if (!updatedOwner) {
      return res.status(404).json({
        response: "Owner not found",
        error: true,
      });
    }

    return res.json({
      data: updatedOwner,
      response: "Service deleted successfully",
      error: false,
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

const accountCheck = async (req, res, next) => {
  try {
    const email = req.query.email;
    let where = {
      $or: [{ phone: req.params.phone }],
    };
    if (email) {
      where.$or.push({
        email,
      });
    }
    const ownerInfo = await userModel.findOne(where);

    if (!ownerInfo) {
      return res.status(400).json({
        data: null,
        response: "Account details not found.Please register first",
        error: true,
      });
    }

    if (ownerInfo && ownerInfo?.disabled === true) {
      return res.status(400).json({
        data: null,
        response: "Account delete.Please contact admin",
        error: true,
      });
    }
    return res.json({
      data: ownerInfo,
      response: null,
      error: false,
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

const accountDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    console.log(id);
    const userInfo = await userModel.findById(id);

    return res.json({
      data: userInfo,
      response: null,
      error: false,
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

const setProfile = async (req, res, next) => {
  try {
    const allowedAttribs = ["fullName", "email", "address", "description"];
    const updateBody = {};
    Object.keys(req.body).forEach((key) => {
      if (
        allowedAttribs.indexOf(key) !== -1 &&
        req.body[key] !== undefined &&
        req.body[key] !== ""
      ) {
        updateBody[key] = req.body[key];
      }
    });

    const updatedProfile = await userModel.findByIdAndUpdate(
      req.user,
      updateBody,
      { new: true }
    );

    return res.json({
      error: false,
      response: "owner profile updated",
      data: updatedProfile,
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

const uploadProfilePic = async (req, res, next) => {
  try {
    const { profileImage } = req.body;
    if (!profileImage) {
      return res.status(400).json({
        error: true,
        response: "Please provider valid image",
        data: null,
      });
    }

    cloudinary.uploader.upload(profileImage, async (err, data) => {
      if (err) {
        console.log(err.message);
        return res.status(400).json({
          error: true,
          response: err.message,
          data: null,
        });
      } else {
        await userModel.findByIdAndUpdate(req.user, {
          profilePic: data.secure_url,
        });
        return res.json({
          data,
          response: null,
          error: false,
        });
      }
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

const uploadVerifyDoc = async (req, res, next) => {
  try {
    // console.log(req.files);
    // console.log(pdf2base64(req.file.path));

    const { doc } = req.body;
    if (!doc) {
      return res.status(400).json({
        error: true,
        response: "Please provider valid image",
        data: null,
      });
    }

    cloudinary.uploader.upload(doc, async (err, data) => {
      if (err) {
        console.log(err.message);
        return res.status(400).json({
          error: true,
          response: err.message,
          data: null,
        });
      } else {
        await userModel.findByIdAndUpdate(req.user, {
          fileUri: data.secure_url,
        });
        return res.json({
          data,
          response: null,
          error: false,
        });
      }
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

const deleteuserAccount = async (req, res, next) => {
  try {
    const demoUserId = "630a442a4d7b8e0bdc69f6d5";
    if (req.user.toString() !== demoUserId) {
      console.log("====================================");
      await userModel.findByIdAndDelete(req.user.toString());
      await NewService.deleteMany({
        user: req.user.toString(),
      });
      console.log("====================================");
    }
    return res.json({
      error: false,
      response: "user account deleted",
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
const getEarnings = async (req, res, next) => {
  try {
    const ownerId = req.user;
    const serviceProvideInfo = await Owner.findById(ownerId).select(
      "withdrawals"
    );

    const withdrawalArr = serviceProvideInfo.withdrawals;

    const services = await NewService.find({ serviceProvider: ownerId })
      .populate("user name")
      .select("serviceProvider amount user name");

    // if services are 0, then show no services taken, return all 0
    // if services more than 0, then:
    // if withdrawals is falsy, then show 0 withdrawal
    // if withdrawals is truthy, and is 0 then do same
    // if withdrawals is more than 0, then subtract

    if (services.length === 0) {
      return res.status(200).json({
        error: null,
        response: "No services provided by the service provider",
        data: buildPayloadObj(),
      });
    } else {
      const earnings = services.reduce((totalEarnings, service) => {
        return totalEarnings + service.amount;
      }, 0);

      if (!withdrawalArr) {
        return res.status(200).json({
          data: buildPayloadObj({ totalEarnings: earnings, history: services }),
          response: "Total earning information by the service provider",
          error: null,
        });
      } else {
        if (withdrawalArr.length === 0) {
          return res.status(200).json({
            data: buildPayloadObj({
              totalEarnings: earnings,
              history: services,
            }),
            response: "Total earning information by the service provider",
            error: null,
          });
        } else {
          console.log(serviceProvideInfo);
          const totalWithdrawals = withdrawalArr.reduce(
            (accumulator, currentItem) => {
              return accumulator + currentItem.amount;
            },
            0
          );

          return res.status(200).json({
            data: buildPayloadObj({
              totalEarnings: earnings,
              history: services,
              withdrawen: totalWithdrawals,
            }),
            response: "Total earning information by the service provider",
            error: null,
          });
        }
      }

      return res.status(200).json({
        data: buildPayloadObj({ totalEarnings: earnings, history: services }),
        response: "Total earning information by the service provider",
        error: null,
      });
    }
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
  register,
  login,
  me,
  listOwners,
  accountCheck,
  sendOtp,
  verifyOtp,
  accountDetails,
  setProfile,
  uploadProfilePic,
  uploadVerifyDoc,
  deleteuserAccount,
  addOrUpdateService,
  deleteService,
  getAllServices,
  getEarnings,
};
