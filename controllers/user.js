const userModel = require("../models/User");
const jobModel = require("../models/Job");
const { generateAccessToken } = require("../helpers/jwt");
const vonage = require("../helpers/vonage");
const cloudinary = require("cloudinary").v2;
const AuthModel = require("../models/Auth");
const {
  IS_OTP_ENABLED,
  DEMO_NUMBER,
  DEMO_REQUEST_ID,
  DEMO_OTP,
} = require("../constants");
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
      role: "user",
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
    const userInfo = await userModel.findById(req.user);

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

const accountCheck = async (req, res, next) => {
  try {
    const { email } = req.query;
    const andWhere = [
      {
        phone: req.params.phone,
      },
    ];
    const userInfo = await userModel.findOne({
      $and: andWhere,
    });
    if (email) {
    }
    const disabled = userInfo && userInfo?.disabled === true ? true : false;
    let response = disabled
      ? "Account delete.Please contact admin"
      : "Account details not found.Please register first";
    if (disabled || !userInfo) {
      return res.status(400).json({
        data: null,
        response,
        error: true,
      });
    }
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

const setProfile = async (req, res, next) => {
  try {
    const allowedAttribs = ["fullName", "email", "address"];
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
      response: "user profile updated",
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

module.exports = {
  register,
  login,
  me,
  sendOtp,
  accountCheck,
  verifyOtp,
  uploadProfilePic,
  setProfile,
  deleteuserAccount,
};
