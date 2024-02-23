const jobModel = require("../models/Job");
const serviceModel = require("../models/Service");
const newChatModel = require("../models/NewChat");
const htmlFormatter = require("../helpers/htmlFormatter");
const paymentModel = require("../models/Payment");
const NewService = require("../models/NewService");

const {
  status: {
    PENDING,
    ACTIVE,
    COMPLETED,
    SERVICE_PROVIDER_PENDING,
    ADMIN_APPROVAL,
    ASSIGNED_TO_SERVICE_PROVIDER,
    ADMIN_REJECT,
    REJECT,
  },
  GET_PAYMENT_DETAILS,
  DAYS,
} = require("../constants");
const stripe = require("../config/Stripe");
const User = require("../models/User");
const Owner = require("../models/Owner");
const uploadFile = require("../helpers/cloudinary-uploader");
const { validateCreateJob } = require("../validators/job.validator");
const { MOBILE_NAIL_TECHNICIANS } = require("../helpers/buildPaymentDetails");
const { getAmountForService, averageOfArray } = require("./local-helpers");
const { isSameDay } = require("date-fns");

const create = async (req, res, next) => {
  try {
    let requestFromClient = req.body;
    const { error } = validateCreateJob(requestFromClient);
    if (error) {
      return res.status(400).json({
        error: true,
        response: error.details[0].message,
        data: req.body,
      });
    }

    const { images, serviceName, ...order } = req.body;

    let uploadedImages = [];
    for (const image of images) {
      const { url } = await uploadFile(image);
      uploadedImages.push(url);
    }

    // create payment amount
    const amount = getAmountForService(serviceName, {
      bookingEstimate: order.bookingEstimate,
      lutonVans: order.lutonVans,
      menRequired: order.menRequired,
    });

    const createdOrder = await new NewService({
      user: req.user,
      name: serviceName,
      serviceDetails: {
        ...order,
        images: [...uploadedImages],
      },
      amount,
    }).save();

    const { socket } = req;
    socket.emit("new-job-request", {
      audience: "admin",
      data: createdOrder._doc,
    });

    return res.json({
      data: createdOrder._doc,
      error: null,
      response: "New Job requested! We will get back to you soon",
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

// ! pending,active and completed jobs for users
const listJobs = async (req, res, next) => {
  try {
    // ! check for the role from token
    // ! set status , user and owner key in where

    const { role } = req;
    const userId = req.user;

    const { status = PENDING } = req.query;
    let allServices = await NewService.find().populate("user serviceProvider");
    let servicesList = allServices.filter(
      (eachService) => eachService.status === status
    );
    if (role === "admin") {
      return res.json({
        data: servicesList,
        error: false,
        response: null,
      });
    }

    if (role === "owner" && status === PENDING) {
      const activeServices = allServices.filter(
        (eachService) => eachService.status === ACTIVE
      );

      // get the preferences from the owner document, and filter the services based on those preferences.
      const ownerInfo = await Owner.findById(userId);

      servicesList = servicesList.filter((eachService) => {
        // - from ownerInfo:
        // first find the service that matches with eachservice.name
        const { name } = eachService._doc;
        const {
          menAvailable,
          requireFurnitureAssembly,
          lutonVans,
          bookingEstimate,
          bookingDateTime,
        } = eachService._doc.serviceDetails;

        const availableService = ownerInfo.services.find((eachService) => {
          return eachService.name === name;
        });
        // second, if service is not found, return false
        if (!availableService) {
          return false;
        }

        // if service is found, lets name it availableService:
        // from eachService, check if menAvailable, then it should be lesser or equal to availableService.menAvailable

        if (menAvailable) {
          return +menRequired <= +availableService?.menAvailable;
        }

        // from eachService, check if requireFurnitureAssembly is true, then from availableService.provideFurnitureAssembly should also be true
        if (requireFurnitureAssembly) {
          return availableService?.provideFurnitureAssembly;
        }

        // from eachService, check if lutonVansRequired is there, then from availableService.lutonVansAvailable should also be true
        if (lutonVans && lutonVans.length !== 0) {
          return availableService?.lutonVansAvailable;
        }
        // ~~~ TYPES OF CLEANING NOT YET ENTERTAINED !!! ~~~
        // from eachService, check booking date/time and get following:
        // - get date, month, day, hour, minute from booking date/time
        const bookingDay = new Date(bookingDateTime).getDay();
        const startBookingHour = new Date(bookingDateTime).getHours();
        const startBookingMinute = new Date(bookingDateTime).getMinutes();
        // - get booking estimate
        const endBookingHour = startBookingHour + +bookingEstimate;
        // first see availability
        // go to availableService.schedule[day] and see if the returned objects value is true. If false, then return false
        const bookingDayInWords = DAYS[bookingDay].longName;
        const schedule = availableService.schedule[bookingDayInWords];
        const isAvailable = schedule.value;

        if (!isAvailable) {
          return false;
        }
        // if true, then check if booking date/time is after the start time and before end time.
        // similarly check, if booking date/time + booking estimate is before end time

        // if (
        //   !(
        //     schedule.startTime.hours <= startBookingHour &&
        //     schedule.endTime.hours >= endBookingHour
        //   )
        // ) {
        //   return false; // Booking is outside available hours
        // }

        // // then see clash
        // // clash management
        // // query service provider's other ACTIVE jobs. by NewService.find({serviceProvider})
        // const clashingServices = activeServices.find((eachActiveService) => {
        //   const iteratorBookingDateTime = new Date(
        //     eachActiveService.serviceDetails.bookingDateTime
        //   );

        //   const isSameDate = isSameDay(
        //     new Date(bookingDateTime),
        //     iteratorBookingDateTime
        //   );
        //   // get bookingEstimate, activeJobBookingHoursStart, activeJobBookingHoursEnd

        //   const activeJobBookingHoursStart = iteratorBookingDateTime.getHours();

        //   const activeJobBookingHoursEnd =
        //     iteratorBookingDateTime.getHours() +
        //     +eachActiveService.serviceDetails.bookingEstimate;

        //   const timeClash = !(
        //     startBookingHour <= activeJobBookingHoursStart &&
        //     endBookingHour >= activeJobBookingHoursEnd
        //   );
        //   return isSameDate && timeClash;
        // });

        // if (clashingServices) {
        //   return false;
        // }

        return true;
      });

      console.log({ servicesList });

      return res.json({
        data: servicesList,
        error: false,
        response: "Services retrieved successfully",
      });
    }

    if (role === "owner" || role === "user") {
      if (status === ACTIVE) {
        let manipulatedServices = [];

        // Use Promise.all to await all newChatModel.find() queries
        await Promise.all(
          servicesList.map(async (eachService) => {
            const { user, serviceProvider } = eachService;
            const chatInstance = await newChatModel.find({
              user,
              serviceProvider,
            });
            eachService.chatInstance = chatInstance;

            const payload = {
              ...eachService._doc,
              chatInstance: chatInstance,
            };
            console.log({
              servicesList,
            });
            manipulatedServices.push(payload);
          })
        );

        return res.json({
          data: manipulatedServices,
          error: false,
          response: null,
        });
      }
      if (status === COMPLETED) {
        servicesList = servicesList.filter((eachService) => {
          if (role === "owner") {
            return eachService.serviceProvider._id.equals(userId);
          }

          if (role === "user") {
            return eachService.user._id.equals(userId);
          }
        });

        return res.json({
          data: servicesList,
          error: false,
          response: null,
        });
      }
    }

    // if (role === "owner") {
    //   servicesList = servicesList.filter((eachService) => {
    //     return eachService._doc.serviceProvider === userId;
    //   });
    // }

    return res.json({
      data: [],
      error: true,
      response: "No conditions matched",
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

const acceptJobRequest = async (req, res) => {
  try {
    // ! handle for admin  and service provider
    // ! if admin accepts if status
    // ! a.1) update status to SERVICE_PROVIDER_PENDING
    // ! a.2) dispatch socket notification to service providers
    // ! if service provider
    // ! s.1) update status to ACTIVE
    // ! s.2) assign service provider id
    // ! if user
    // ! u.1) check for completed status  only else throw error

    const { jobId } = req.params;

    const jobDetail = await NewService.findById(jobId).populate(
      "user serviceProvider"
    );
    const { accepted = true, markedCompleted = false } = req.body;

    if (!jobDetail) {
      return res.status(400).json({
        error: true,
        response: "Job not Found!",
        data: null,
      });
    }
    const { socket } = req;
    //! =========== admin handler ===========
    if (req.role === "admin") {
      if (jobDetail.status !== ADMIN_APPROVAL) {
        return res.status(400).json({
          error: true,
          response:
            "Only ADMIN_APPROVAL status jobs can be accepted/rejected by admin.",
          data: null,
        });
      }

      if (!accepted) {
        //! refund service charges to user

        // ! get the payment details if it exists

        const paymentDetails = await paymentModel.findOne({
          job_id: jobId,
        });

        if (paymentDetails) {
          const refund = await stripe.refunds.create({
            payment_intent: paymentDetails?.payment_id,
          });
          if (refund.status === "succeeded") {
            await paymentDetails.updateOne({
              refunded: true,
            });
          }
        }

        //! refund service charges to user
        await jobDetail.updateOne({
          status: ADMIN_REJECT,
        });
      } else {
        await jobDetail.updateOne({
          status: SERVICE_PROVIDER_PENDING,
        });

        socket.emit("job-status-updated", {
          audience: "owner",
          data: jobDetail,
        });
      }

      //! =========== admin handler ends here ===========
    } else if (req.role === "owner") {
      // if (
      //   (jobDetail.status !== PENDING && !markedCompleted) ||
      //   (markedCompleted && jobDetail.status !== ACTIVE)
      // ) {
      //   return res.status(400).json({
      //     error: true,
      //     response: markedCompleted
      //       ? "Already marked completed"
      //       : "Only SERVICE_PROVIDER_PENDING status jobs can be accepted",
      //     data: null,
      //   });
      // }
      // create new converstion if not found

      // if job is pending, and if decision is accept, then accept job
      // if job is pending and decision is reject then reject job
      // if job is not pending, then show error

      // if markedCompleted is true, then complete the job but make sure accept reject functionality doesnt work there

      // disable chat if job is completed

      const user = jobDetail?.user?._id;
      const owner = req.user;
      const jobStatus = jobDetail.status;

      if (markedCompleted) {
        const completedJob = await NewService.findByIdAndUpdate(
          jobId,
          {
            status: COMPLETED,
            serviceProvider: req.user,
          },
          {
            new: true,
          }
        );
        const updatedJob = await newChatModel.findOneAndUpdate(
          {
            user,
            creator: owner,
          },
          {
            active: false,
          },
          {
            new: true,
          }
        );
        if (!updatedJob) {
          return res.status(200).json({
            data: updatedJob,
            response: "Chat not found but Job marked completed!",
            error: true,
          });
        }
        return res.status(200).json({
          data: completedJob,
          response: "Job Completed!",
          error: false,
        });
      } else if (accepted) {
        if (jobStatus !== PENDING) {
          return res.status(400).json({
            data: jobDetail,
            response: "To accept job, job status must be PENDING!",
            error: true,
          });
        }
        // const chatId = owner > user ? user + "-" + owner : owner + "-" + user;
        const conversation = await newChatModel.findOne({
          user,
          serviceProvider: owner,
        });
        if (conversation) {
          // add a new message to messages array
          const retrievedChat = await newChatModel.findByIdAndUpdate(
            conversation._id,
            {
              $push: {
                messages: {
                  message:
                    "Hello there! Welcome back! I have accepted your job request! You may contact me here if you need my assistance.",
                  sentBy: {
                    role: "owner",
                    sentById: user,
                  },
                },
              },
              active: true,
              serviceName: jobDetail.name,
            },
            { new: true }
          );
          await jobDetail.updateOne({
            status: ACTIVE,
            serviceProvider: req.user,
            chat: conversation._id,
          });
        } else {
          const savedChat = await new newChatModel({
            serviceProvider: owner,
            user: user,
            serviceName: jobDetail.name,
            messages: [
              {
                message:
                  "Hello there! I have accepted your job request! You may contact me here if you need my assistance.",
                sentBy: {
                  role: "owner",
                  sentById: user,
                },
              },
            ],
          }).save();
          await jobDetail.updateOne({
            status: ACTIVE,
            serviceProvider: req.user,
            chat: savedChat._id,
          });
        }
      } else {
        await jobDetail.updateOne({
          $set: {
            status: REJECT, // Set the status to "REJECTED"
          },
          $push: {
            rejectedBy: req.user,
          },
        });
      }
    } else {
      return res.status(403).json({
        data: null,
        error: null,
        response: "Un-Authorized access",
      });
    }

    const message = `Job request ${accepted ? "accepted" : "rejected"} `;
    return res.json({
      data: null,
      error: null,
      response: message,
    });
  } catch (error) {
    console.log("server error", error);
    return res.status(500).json({
      error: true,
      response: error.message,
      data: null,
    });
  }
};
const jobReview = async (req, res) => {
  try {
    const { role } = req;
    const { rating, review } = req.body;

    let updatePayload = {};

    if (role === "owner") {
      updatePayload = {
        $push: {
          ratings: {
            ratedByRole: "owner",
            rating: rating,
          },
          reviews: {
            reviewByRole: "owner",
            review: review,
          },
        },
      };
    } else if (role === "user") {
      updatePayload = {
        $push: {
          ratings: {
            ratedByRole: "user",
            rating: rating,
          },
          reviews: {
            reviewByRole: "user",
            review: review,
          },
        },
      };
    }

    const jobDetails = await NewService.findByIdAndUpdate(
      req.params.id,
      updatePayload,
      { new: true }
    );

    if (!jobDetails) {
      return res.status(400).json({
        error: true,
        response: "Invalid job id provided",
        data: null,
      });
    }

    return res.json({
      error: false,
      response: "Job Rated Successfully.",
      data: jobDetails,
    });
  } catch (error) {
    console.log("server error", error);
    return res.status(500).json({
      error: true,
      response: error.message,
      data: null,
    });
  }
};
const getSingleJob = async (req, res) => {
  try {
    const { id } = req.params;

    let jobDetails = await NewService.findById(id);

    if (!jobDetails) {
      return res.status(400).json({
        error: true,
        response: "Invalid job id provided",
        data: null,
      });
    }

    let payload = {
      ...jobDetails,
    };

    const ratingsArr = jobDetails.ratings;

    // payload?._doc.averageRating?.toString()

    if (ratingsArr?.length > 0) {
      // add average rating to job details object
      jobDetails = {
        ...jobDetails._doc,
        averageRating: averageOfArray([
          ...ratingsArr.map((eachDoc) => eachDoc.rating),
        ]),
      };
    }

    return res.json({
      error: false,
      response: "Job retrieved successfully!",
      data: jobDetails,
    });
  } catch (error) {
    console.log("server error", error);
    return res.status(500).json({
      error: true,
      response: error.message,
      data: null,
    });
  }
};
const confirmPayment = async (req, res) => {
  try {
    const { paymentId, jobId } = req.params;
    const toBeSaved = {
      captured: true,
      jobId,
    };
    const paymentDetails = await paymentModel.findOne({
      payment_id: paymentId,
    });

    if (!paymentDetails) {
      return res.status(400).json({
        error: true,
        response: "Invalid paymentId provided",
        data: null,
      });
    }
    if (paymentDetails.user_id !== req.user) {
      return res.status(400).json({
        error: true,
        response: "Un-Authorized Action",
        data: null,
      });
    }
    await paymentDetails.updateOne(toBeSaved);

    return res.json({
      error: false,
      response: "Job Rated Successfully.",
      data: paymentDetails,
    });
  } catch (error) {
    console.log("server error", error);
    return res.status(500).json({
      error: true,
      response: error.message,
      data: null,
    });
  }
};

module.exports = {
  create,
  // myServices,
  // serviceDetail,
  listJobs,
  acceptJobRequest,
  jobReview,
  getSingleJob,
};
