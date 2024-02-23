const jwt = require("jsonwebtoken");
const UserModel = require("../models/User");
const AdminModel = require("../models/Admin");
const OwnerModel = require("../models/Owner");

exports.auth = async function (req, res, next) {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }
  if (!token) {
    return res.status(401).json({
      data: null,
      response: "Please provide authorization token.",
      error: true,
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWTSECRET);

    let model;
    switch (decoded.role) {
      case "admin":
        model = AdminModel;
        break;
      case "owner":
        model = OwnerModel;
        break;
      case "user":
        model = UserModel;
        break;
    }
    const userInfo = await model.findById(decoded.id);

    if (!userInfo || userInfo.disabled) {
      return res.status(400).json({
        data: null,
        error: true,
        response: "Account suspended.Please contact admin",
      });
    }
    const { email, phone, disabled, _id, fullName, address, city, zipCode } =
      userInfo;
    req.user = _id;
    req.phone = phone;
    req.email = email;
    req.fullName = fullName;
    req.role = decoded.role;
    req.disabled = disabled;
    req.FCM = decoded.FCM;
    req.zipCode = zipCode;
    req.address = address;
    req.city = city;

    next();
  } catch (error) {
    console.error("error", error.message);
    return res.status(400).json({
      data: null,
      error: true,
      response: "Invalid authorization token provided",
    });
  }
};

exports.isServiceProvider = (req, res, next) => {
  if (req.user && req.role && req.role === "owner") {
    next();
    return;
  }
  return res.status(403).json({
    data: null,
    error: true,
    response: "Service provider protected route",
  });
};

exports.isAdmin = (req, res, next) => {
  if (req.user && req.role && req.role === "admin") {
    next();
    return;
  }
  return res.status(403).json({
    data: null,
    error: true,
    response: "Admin  protected route",
  });
};

exports.isUser = (req, res, next) => {
  if (req.user && req.role && req.role === "user") {
    next();
    return;
  }
  return res.status(403).json({
    data: null,
    error: true,
    response: "User  protected route",
  });
};
