const adminModel = require("../models/Admin");
const { generateAccessToken } = require("../helpers/jwt");
const ownerModel = require("../models/Owner");
const jobModel = require("../models/Job");
const userModel = require("../models/User");
const chatModel = require("../models/NewChat");
const moment = require("moment");
const { compare, genSalt, hash } = require("bcrypt");
const Payment = require("../models/Payment");
const clock = require("../helpers/clock");
const NewService = require("../models/NewService");
const { averageOfArray } = require("./local-helpers");

const { ACTIVE, COMPLETED, ADMIN_REJECT, PENDING } =
  require("../constants").status;
const { MONTHS } = require("../constants");
const {
  validateGivePaymentToProvider,
  validateSendMessageToAdmin,
} = require("../validators/admin.validator");
const Owner = require("../models/Owner");
const register = async (req, res, next) => {
  try {
    console.log(req.body);
    const { fullName, email, phone, password } = req.body;

    const savedUser = await new adminModel({
      fullName,
      email,
      phone,
      password,
    }).save();

    return res.json({
      data: savedUser,
      error: false,
      response: "Admin accout created successfully.",
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    let { email, password } = req.body;

    if (!email || !password) {
      return res.status(403).json({
        data: null,
        response: "Please provide a valid email and password",
        error: true,
      });
    }

    const userInfo = await adminModel
      .findOne({ email })
      .select("-createdAt -updatedAt");

    if (!userInfo) {
      return res.status(400).json({
        data: null,
        response: "User not found",
        error: true,
      });
    }

    if (!(await compare(password, userInfo.password))) {
      return res.status(400).json({
        data: null,
        response: "Invalid email or password",
        error: true,
      });
    }

    const payload = {
      id: userInfo._id,
      email,
      role: "admin",
    };
    const token = await generateAccessToken(payload);
    return res.json({
      data: { ...userInfo._doc, password: undefined, __v: undefined },
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
    const userInfo = await adminModel
      .findById(req.user)
      .select("-password -createdAt -updatedAt");

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

const getKeys = async (req, res, next) => {
  try {
    return res.json({
      data: {
        stripe_SK: process.env.STRIPE_SK,
        encryption_KEY: process.env.CRYPTOSECRET,
        publisherKey: process.env.STRIPE_PK,
      },
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

const updatePassword = async (req, res, next) => {
  try {
    let { password } = req.body;
    const salt = await genSalt(10);
    password = await hash(password, salt);
    await adminModel.findByIdAndUpdate(req.user, {
      password,
    });
    return res.json({
      data: null,
      response: "Password updated successfully",
      error: false,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      response: error.message,
      data: null,
    });
  }
};

const updateProfile = async (req, res, next) => {
  try {
    let payload = req.body;
    const allowedAttribs = ["fullName", "email", "phone"];

    const updates = {};
    Object.keys(payload).forEach((item) => {
      if (
        allowedAttribs.includes(item) &&
        payload[item] &&
        payload[item] !== ""
      ) {
        if (item === "email") {
          let regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
          if (!payload[item].match(regex)) {
            throw new Error(
              "Invalid email address: " + payload[item] + "provided"
            );
          }
        }

        updates[item] = payload[item];
      }
    });

    if (Object.keys(updates).length) {
      await adminModel.findByIdAndUpdate(req.user, updates);
    }
    return res.json({
      data: null,
      response: "Profile updated successfully",
      error: false,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      response: error.message,
      data: null,
    });
  }
};
const stats = async (req, res, next) => {
  try {
    const jobsArr = await NewService.find();
    let modifiedJobs = [...jobsArr.map((eachJob) => eachJob._doc)];

    const numberOfUsers = await userModel.countDocuments({});
    const numberOfServiceProviders = await ownerModel.countDocuments({});

    // START
    const services = await NewService.find(
      {},
      {
        createdAt: 1,
        status: 1,
      }
    ); // Fetch all services and only extract the 'createdAt' field

    // Create an object to store job counts by date
    const jobCountsByDate = {};

    // Iterate through the services and count jobs by date
    services.forEach((service) => {
      const creationDate = service.createdAt.toISOString().split("T")[0]; // Extract the date part from 'createdAt'

      if (jobCountsByDate[creationDate]) {
        jobCountsByDate[creationDate]++;
      } else {
        jobCountsByDate[creationDate] = 1;
      }
    });

    const activeJobs = services.filter((eachService) => {
      return eachService.status === ACTIVE;
    }).length;
    const completedJobs = services.filter((eachService) => {
      return eachService.status === COMPLETED;
    }).length;
    const pendingJobs = services.filter((eachService) => {
      return eachService.status === PENDING;
    }).length;

    // Convert the job counts into the desired format
    const resultArray = Object.entries(jobCountsByDate).map(
      ([date, bookings]) => ({
        date: new Date(date),
        bookings,
      })
    );

    // Sort the result array by date if needed
    resultArray.sort((a, b) => a.date - b.date);

    // Add the first and last date
    const firstDate = new Date(resultArray[0].date);
    const lastDate = new Date();

    // Create an array with dates between the first and last date
    const dateRange = [];
    let currentDate = new Date(firstDate);

    while (currentDate <= lastDate) {
      dateRange.push({
        date: new Date(currentDate),
        bookings: jobCountsByDate[currentDate.toISOString().split("T")[0]] || 0,
      });

      currentDate.setDate(currentDate.getDate() + 1); // Move to the next day
    }
    // END

    return res.json({
      data: {
        activeJobs,
        pendingJobs,
        completedJobs,
        users: numberOfUsers,
        owners: numberOfServiceProviders,
        numberOfJobsPerDay: Object.entries(jobCountsByDate).map(
          (eachJobPair) => ({
            date: eachJobPair[0],
            numberOfJobs: eachJobPair[1],
          })
        ),
      },
      error: false,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      response: error.message,
      data: null,
    });
  }
};

const listUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, users = "true" } = req.query;
    const requestedModel = users && users === "true" ? userModel : ownerModel;
    const list = await requestedModel
      .find()
      .select(
        "_id fullName email phone address city profilePic zipCode reviews disabled"
      )
      .exec();
    const count = await requestedModel.countDocuments();
    res.json({
      data: list,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      error: false,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      response: error.message,
      data: null,
    });
  }
};

const recentOrders = async (req, res, next) => {
  try {
    const { limit = 4 } = req.query;
    const RecentOrders = await NewService.find()
      .populate("user serviceProvider")
      .limit(parseInt(limit, 10))
      .sort({ createdAt: -1 });

    res.json({
      data: RecentOrders,
      error: false,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      response: error.message,
      data: null,
    });
  }
};

const topServiceProviders = async (req, res, next) => {
  try {
    const { limit = 2 } = req.query;
    let topServiceProvidersArr = [];

    const services = await NewService.find({}).populate("serviceProvider");

    for (let service of services) {
      const { ratings, serviceProvider } = service._doc;

      const ratedByUser = ratings.filter(
        (eachRating) => eachRating.ratedByRole === "user"
      );
      // get average rating for the service by user
      if (ratedByUser.length > 0) {
        const averageRating = averageOfArray([
          ...ratedByUser.map((eachRating) => {
            return eachRating.rating;
          }),
        ]);

        // find in topServiceProvidersArr <for el find el.serviceProvider>
        let existingServiceProvider = topServiceProvidersArr.find(
          (eachEl) => eachEl.serviceProviderId === serviceProvider._id
        );

        if (existingServiceProvider) {
          // if it contains the serviceProviderId that you get from service
          // get average rating and add to previous rating and divide by 2
          const { rating } = existingServiceProvider;
          const newRating = (rating + averageRating) / 2;
          existingServiceProvider.rating = newRating;
        } else {
          // if there is no serviceProviderId:
          // create a payload object { serviceProvider: <ID>, serviceProviderInfo: <serviceprovider object>, averageRating: average rating }
          const payloadObj = {
            serviceProviderId: serviceProvider._id,
            serviceProviderInfo: serviceProvider,
            rating: averageRating,
          };

          topServiceProvidersArr.push(payloadObj);
        }
      }
    }

    // Sort the array based on the 'rating' property in descending order
    topServiceProvidersArr.sort((a, b) => b.rating - a.rating);

    // Get the first 'limit' elements
    const topNServiceProviders = topServiceProvidersArr.slice(0, limit);

    res.json({
      data: topNServiceProviders,
      error: false,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      response: error.message,
      data: null,
    });
  }
};

const listJobs = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const services = await NewService.find(status ? { status } : {})
      .populate("user serviceProvider")
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await NewService.countDocuments();

    res.json({
      data: services,
      error: false,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      response: error.message,
      data: null,
    });
  }
};

const givePaymentToServiceProvider = async (req, res, next) => {
  try {
    const { error } = validateGivePaymentToProvider(req.body);

    if (error) {
      return res.status(400).json({
        error: true,
        response: error.details[0].message,
        data: req.body,
      });
    }

    const { paymentAmount, serviceProviderId } = req.body;

    const adminId = req.user;

    // NOT HANDLED: (TOTAL AMOUNT - TOTAL WITHDRAWAN HISTORY) - WITHDRAWAN SHOULD BE POSITIVE.
    // THIS IS SUPPOSED TO BE HANDLED ON FRONTEND

    const payload = {
      amount: +paymentAmount,
      adminWhoPaid: adminId,
    };

    const serviceProviderAfterWithDrawal = await ownerModel.findByIdAndUpdate(
      serviceProviderId,
      { $push: { withdrawals: payload } },
      { new: true }
    );

    return res.status(200).json({
      data: serviceProviderAfterWithDrawal,
      response: "Withdrawal given",
      error: null,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      response: error.message,
      data: null,
    });
  }
};

const analytics = async (req, res, next) => {
  try {
    // Calculate totalJobs using the new model
    const totalJobs = await NewService.countDocuments();

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set the time to the start of the day

    const tomorrow = new Date();
    tomorrow.setHours(0, 0, 0, 0);
    tomorrow.setDate(tomorrow.getDate() + 1); // Set the time to the start of the next day

    const servicesAddedToday = await NewService.find({
      createdAt: {
        $gte: today,
        $lt: tomorrow,
      },
    });

    const numberOfJobsAddedToday = servicesAddedToday.length;
    const totalSalesForToday = servicesAddedToday.reduce((total, service) => {
      // Summing the prices of services for today
      return total + service.amount;
    }, 0);

    // Calculate totalSales using the new model
    const totalSales = await NewService.aggregate([
      {
        $group: {
          _id: null,
          totalSales: { $sum: "$amount" },
        },
      },
    ]);

    // Calculate todaySales using the new model
    const todaysDate = moment().startOf("day");
    const todaySales = await NewService.aggregate([
      {
        $match: {
          createdAt: {
            $gte: todaysDate.toDate(),
          },
        },
      },
      {
        $group: {
          _id: null,
          todaySales: { $sum: "$amount" },
        },
      },
    ]);

    // Calculate todaysJobs using the new model
    const todaysJobs = await NewService.countDocuments({
      createdAt: {
        $gte: todaysDate.toDate(),
      },
    });

    // Calculate canceledOrders using the new model
    const canceledOrders = await NewService.countDocuments({
      status: "ADMIN_REJECT", // Replace with the appropriate status value
    });

    // Calculate totalOrders using the new model
    const totalOrders = await NewService.countDocuments({});

    res.json({
      data: {
        totalJobs,
        newAddedJobs: numberOfJobsAddedToday,
        salesForToday: totalSalesForToday,
        totalSales:
          (totalSales?.length &&
            totalSales &&
            totalSales[0] &&
            totalSales[0].totalSales) ||
          0,
        todaySales:
          (todaySales?.length &&
            todaySales &&
            todaySales[0] &&
            todaySales[0].todaySales) ||
          0,
        canceledOrders,
        totalOrders,
      },
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

const jobsByMonth = async (req, res, next) => {
  try {
    const startOfMonth = moment(new Date())
      .clone()
      .endOf("month")
      .format("YYYY-MM-DD hh:mm");

    const prevMonthsStart = moment(startOfMonth)
      .subtract(6, "month")
      .format("YYYY-MM-DD hh:mm");
    const months = [
      ,
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const monthlyJobs = await NewService.aggregate([
      {
        $match: {
          "serviceDetails.bookingDateTime": {
            $gte: new Date(prevMonthsStart),
            $lte: new Date(startOfMonth),
          },
        },
      },
      {
        $project: {
          month: { $month: "$serviceDetails.bookingDateTime" },
        },
      },
      {
        $group: {
          _id: { month: "$month" },
          jobs: { $sum: 1 },
        },
      },
      {
        $addFields: {
          monthDesc: {
            $let: {
              vars: {
                monthsInString: months,
              },
              in: {
                $arrayElemAt: ["$$monthsInString", "$_id.month"],
              },
            },
          },
        },
      },
    ]);

    res.json({
      data: monthlyJobs,
      error: false,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      response: error.message,
      data: null,
    });
  }
};

const earnings = async (req, res, next) => {
  try {
    const startOfMonth = moment(new Date())
      .clone()
      .endOf("month")
      .format("YYYY-MM-DD hh:mm");

    const prevMonthsStart = moment(startOfMonth)
      .subtract(6, "month")
      .format("YYYY-MM-DD hh:mm");

    const totalRevenueFromDB = await NewService.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$amount" },
        },
      },
    ]);

    const totalEarnings = totalRevenueFromDB[0].totalRevenue || 0;

    const totalRevenue = totalEarnings;

    const serviceProviderEarnings = totalEarnings;

    res.json({
      data: { totalRevenue, totalEarnings, serviceProviderEarnings },
      error: false,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      response: error.message,
      data: null,
    });
  }
};

const getRevenue = async (req, res) => {
  try {
    const { service } = req.params;
    let { duration = "monthly" } = req.query;

    if (!["daily", "monthly", "annually"].includes(duration)) {
      duration = "monthly";
    }
    //

    let spanStage = {
      _id: {
        month: { $month: "$createdAt" },
      },
      amount: { $sum: "$amount" },
    };

    switch (duration) {
      case "monthly":
        spanStage = {
          _id: {
            month: { $month: "$createdAt" },
          },
          amount: { $sum: "$amount" },
        };
        break;
      case "daily":
        spanStage = {
          _id: {
            day: { $dayOfMonth: "$createdAt" },
          },
          amount: { $sum: "$amount" },
        };
        break;
      case "annually":
        spanStage = {
          _id: {
            year: { $year: "$createdAt" },
          },
          amount: { $sum: "$amount" },
        };
        break;

      default:
        spanStage = {
          _id: {
            month: { $month: "$createdAt" },
          },
          amount: { $sum: "$amount" },
        };
        break;
    }

    const earning = await Payment.aggregate([
      {
        $match: {
          service,
        },
      },
      {
        $group: spanStage,
      },
      {
        $project: {
          _id: 0,
          year: "$_id.year",
          day: "$_id.day",
          month: "$_id.month",
          amount: 1,
        },
      },
      { $sort: { year: 1, month: 1, day: 1 } },
    ]);

    let income = 0;
    if (earning && earning.length) {
      income = earning.reduce(function (accumulator, currentValue) {
        return accumulator + currentValue.amount;
      }, 0);
    }

    return res.json({
      data: { earning, income },
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

const monthlyServiceProviderRevenue = async (req, res) => {
  try {
    const { serviceProviderId } = req.params;

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    // Calculate start date 6 months ago from today
    const sixMonthsAgo = new Date(
      currentYear,
      currentMonth - 5,
      currentDate.getDate()
    );

    const servicesPerformedByServiceProvider = await NewService.find({
      serviceProvider: serviceProviderId,
      createdAt: {
        $gte: sixMonthsAgo,
        $lte: currentDate, // Include services created today
      },
    });

    if (
      !servicesPerformedByServiceProvider ||
      servicesPerformedByServiceProvider.length === 0
    ) {
      return res.json({
        data: null,
        response: "No services were performed by this service provider",
        error: false,
      });
    }

    // Calculate monthly revenue
    const monthlyRevenue = Array.from({ length: 6 }, (_, index) => {
      const startOfMonth = new Date(currentYear, currentMonth - index, 1);
      const endOfMonth = new Date(currentYear, currentMonth - index + 1, 0);

      const revenue = servicesPerformedByServiceProvider
        .filter(
          (service) =>
            service.createdAt >= startOfMonth && service.createdAt <= endOfMonth
        )
        .reduce((total, service) => total + service.amount, 0);

      return {
        month: MONTHS[currentMonth - index],
        revenue,
      };
    });

    return res.json({
      data: monthlyRevenue,
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

// for update profile of  service providers and users
const updateUsers = async (req, res, next) => {
  try {
    const { resource, resourceId } = req.params;

    if (["user", "provider"].indexOf(resource) === -1) {
      return res.status(400).json({
        error: true,
        response:
          "Invalid resource requested (possible values are user,provider)",
        data: null,
      });
    }

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

    const resourceModel = resource === "user" ? userModel : ownerModel;
    const updatedProfile = await resourceModel.findByIdAndUpdate(
      resourceId,
      updateBody,
      { new: true }
    );

    if (!updatedProfile) {
      return res.status(400).json({
        error: true,
        response: `Invalid resourceId ${resourceId} provided`,
        data: null,
      });
    }

    return res.json({
      error: false,
      response: `${
        resource === "user" ? "user" : "service Provider"
      } profile updated`,
      data: updatedProfile,
    });
  } catch (error) {
    let errorMsg = "Something went wrong";
    let status = 500;
    if (error.kind === "ObjectId") {
      status = 400;
      errorMsg = `Invalid resourceId (${req.params.resourceId})  provided`;
    }

    console.log(error);
    return res.status(status).json({
      error: true,
      response: error.message,
      data: null,
    });
  }
};

const disableUsers = async (req, res, next) => {
  try {
    const { resource, resourceId } = req.params;

    if (["user", "provider"].indexOf(resource) === -1) {
      return res.status(400).json({
        error: true,
        response:
          "Invalid resource requested (possible values are user,provider)",
        data: null,
      });
    }

    const resourceModel = resource === "user" ? userModel : ownerModel;
    const updatedProfile = await resourceModel.findByIdAndUpdate(
      resourceId,
      {
        disabled: true,
      },
      { new: true }
    );

    if (!updatedProfile) {
      return res.status(400).json({
        error: true,
        response: `Invalid resourceId ${resourceId} provided`,
        data: null,
      });
    }

    return res.json({
      error: false,
      response: `${
        resource === "user" ? "user" : "service Provider"
      } account disabled`,
      data: null,
    });
  } catch (error) {
    let errorMsg = "Something went wrong";
    let status = 500;
    if (error.kind === "ObjectId") {
      status = 400;
      errorMsg = `Invalid resourceId (${req.params.resourceId})  provided`;
    }

    console.log(error);
    return res.status(status).json({
      error: true,
      response: error.message,
      data: null,
    });
  }
};

const sendMessage = async (req, res, next) => {
  try {
    const { reciever } = req.query;
    const { message } = req.body;

    const { error } = validateSendMessageToAdmin({ message });

    if (error) {
      return res.status(400).json({
        error: true,
        response: error.details[0].message,
        data: req.body,
      });
    }

    const serviceProvider = await ownerModel.findById(reciever);

    const user = await userModel.findById(reciever);

    // first check if convo already exists, then if not then do following
    // if chat already exists. then find the chat ID and append into message. Also set active as true

    let query = {
      admin: req.user,
    };

    if (user) {
      query.user = user;
    }

    if (serviceProvider) {
      query.serviceProvider = serviceProvider;
    }

    const chatInstance = await chatModel.findOne(query);

    if (chatInstance) {
      let messagePayload = {
        message,
        sentBy: {
          role: "admin",
          sentById: req.user,
        },
      };

      await chatModel.findByIdAndUpdate(chatInstance._id, {
        $set: { active: true },
        $push: { messages: messagePayload },
      });
    } else {
      let payload = {
        admin: req.user,
        active: true,
        messages: [
          {
            message,
            sentBy: {
              role: "admin",
              sentById: req.user,
            },
          },
        ],
      };

      if (user) {
        payload.user = user;
      }

      if (serviceProvider) {
        payload.serviceProvider = serviceProvider;
      }

      const chat = new chatModel(payload);

      chat.save();
    }

    return res.json({
      error: false,
      response: ``,
      data: null,
    });
  } catch (error) {
    let errorMsg = "Something went wrong";
    let status = 500;
    if (error.kind === "ObjectId") {
      status = 400;
      errorMsg = `Invalid resourceId (${req.params.resourceId})  provided`;
    }

    console.log(error);
    return res.status(status).json({
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
  getKeys,
  updatePassword,
  stats,
  listUsers,
  recentOrders,
  listJobs,
  topServiceProviders,
  analytics,
  jobsByMonth,
  earnings,
  updateProfile,
  getRevenue,
  updateUsers,
  disableUsers,
  monthlyServiceProviderRevenue,
  givePaymentToServiceProvider,
  sendMessage,
};
