const express = require("express");
const app = express();
const httpServer = require("http").Server(app);
const Axios = require("axios");
const moment = require("moment");
const helmet = require("helmet");
const logger = require("morgan");
require("dotenv").config({});
const cron = require("node-cron");
const { Server } = require("socket.io");
const cloudinary = require("cloudinary").v2;
const stripe = require("./config/Stripe");
const { errorFormatter } = require("./middleware/errorHandler");
const AccountModel = require("./models/Account");
const OwnerModel = require("./models/Owner");
const PaymentModel = require("./models/Payment");
const JobModel = require("./models/Job");
const { auth, isUser } = require("./middleware/auth");
const { stripeWebhooks } = require("./webhooks/stripe");
const NewService = require("./models/NewService");

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET_KEY,
  secure: true,
});

// put on the helmet :)
app.use(helmet());
app.set("view engine", "ejs");
const corsOptions = {
  origin: "*",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true, // Allow cookies
};
app.use(require("cors")(corsOptions));
app.use(logger("dev"));
app.set("view engine", "ejs");
app.use(express.static("./public"));
app.use(function (req, res, next) {
  // Website you wish to allow to connect
  res.setHeader("Access-Control-Allow-Origin", "*");

  // Request methods you wish to allow
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE"
  );

  // Request headers you wish to allow
  // res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-Requested-With,Content-Type,Content-Length,Host,Authorization"
  );

  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader("Access-Control-Allow-Credentials", true);

  // Pass to next layer of middleware
  next();
});

const ENVIROMENT =
  process.env.NODE_ENV === undefined ? "Development" : process.env.NODE_ENV;

if (ENVIROMENT === "Development") {
  require("dotenv").config({ path: __dirname + "/.env" });
}

// connecting to db
require("./config/db")();

// middlewares
app.use(
  express.json({
    limit: "50mb",
  })
);
app.use(express.urlencoded({ extended: true }));

app.use(express.static("./public"));

const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  console.log("new user");
  console.log(
    "a new  user connected!",
    socket.id + " ->user_id " + socket.data.user
  );

  socket.emit("new-job", {
    job: "Cleaning",
  });
  // let preConnected = alreadyConnected(socket.data.user);
  // if (preConnected !== null) {
  //   activeClients[preConnected]["socket_id"] = socket.id;
  // } else {
  //   activeClients.push({
  //     user_id: socket.data.user,
  //     socket_id: socket.id,
  //   });
  // }
  // socket.emit("new-user-connected", {
  //   active_users: activeClients,
  //   connected_user_id: socket.data.user,
  // });

  // console.log({ activeClients: activeClients });
  // socket.on("disconnect", () => {
  //   console.log("client disconnected", socket.data.user);
  //   let updatedConnectedClients = activeClients.filter(
  //     (client) => client.user_id !== socket.data.user
  //   );
  //   activeClients = updatedConnectedClients;
  //   console.log({ updatedConnectedClients });
  //   socket.emit("user-disconnected", {
  //     active_users: updatedConnectedClients,
  //     disconnected_user_id: socket.data.user,
  //   });
  // });
});

const alreadyConnected = (newConnection) => {
  let foundIndex = null;
  for (let i = 0; i < activeClients.length; i++) {
    if (newConnection === activeClients[i].user_id) {
      foundIndex = i;
      break;
    }
  }
  return foundIndex;
};

//
// ################# stripe connected accounts ########################

app.get("/api/stripe-connect/:user", async (req, res) => {
  let userInfo = await OwnerModel.findById(req.params.user.toString());
  if (!userInfo) {
    return res.json({
      data: null,
      error: "Invalid user account",
    });
  }
  // const user = require("./utils/encrypt")(req.user);
  const user = req.params.user;

  console.log(
    `https://connect.stripe.com/express/oauth/authorize?redirect_uri=${process.env.STRIPE_CONNECT_REDIRECT_URI}&client_id=${process.env.STRIPE_CLIENT_ID}&state=${user}`
  );
  res.redirect(
    `https://connect.stripe.com/express/oauth/authorize?redirect_uri=${process.env.STRIPE_CONNECT_REDIRECT_URI}&client_id=${process.env.STRIPE_CLIENT_ID}&state=${user}`
  );
});

app.get("/stripe-connect-redirect", async (req, res) => {
  try {
    let code = req.query.code;
    let user = req.query.state;
    // user = require("./utils/decrypt")(user);

    if (!code || !user) {
      return res.send("<h3>Stripe-Connect<h3/><p>Sorry Invalid request</p> ");
    }

    // via a post request

    const response = await Axios.post(
      "https://connect.stripe.com/oauth/token",
      {
        client_secret: process.env.STRIPE_SK,
        code,
        grant_type: "authorization_code",
      }
    );

    console.log("StripeConnectResponse>>>", response.data);
    console.log(
      "response.data.stripe_user_id>>>",
      response.data.stripe_user_id
    );
    let connected_account_id = response.data.stripe_user_id;

    console.log(`connected_account_id ${connected_account_id}`);
    // save Stripe detaills of user to Db

    await AccountModel.updateOne(
      { user_id: user },
      {
        account_id: connected_account_id,
      },
      {
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );
    await OwnerModel.findByIdAndUpdate(user, { accountConnected: true });
    // console.log("Account Created", newAccount);

    return res.render("stripeSuccess");
  } catch (error) {
    console.log("Server error in stripe Connect", error.message);
    return res.send("<h5>Stripe Connect error</h5>");
  }
});

app.get("/card/payment/success", (req, res) => {
  return res.render("paymentSuccess");
});

app.get("/", (req, res) =>
  res.json({ msg: "Welcome to Job-Task API", error: false, data: null })
);
app.use((req, res, next) => {
  // const pathsToInjectSocketInstance = [
  //   "/api/job",
  //   "/api/job/user",
  //   "/api/job/",
  //   "/api/chat/",

  // ];
  // if (pathsToInjectSocketInstance.includes(req.path)) {
  // }
  req.socket = io;
  next();
});

//  create payment intent

app.post(
  "/api/stripe-payment-intent",
  [auth, isUser],
  async (req, res, next) => {
    try {
      const { currency = "gbp", amount, jobId } = req.body;
      const ServiceInfo = await NewService.findById(jobId).select("name");
      const customer = await stripe.customers.create();

      const ephemeralKey = await stripe.ephemeralKeys.create(
        {
          customer: customer.id,
        },
        { apiVersion: "2017-12-14" }
      );
      const params = {
        amount,
        currency,

        // payment_method_options: {
        //   card: {
        //     request_three_d_secure: "automatic",
        //   },
        //   sofort: {
        //     preferred_language: "en",
        //   },
        // },
        // payment_method_types: ["card", "klarna", "paypal"],
        automatic_payment_methods: { enabled: true },
        confirm: false,
      };

      const paymentIntent = await stripe.paymentIntents.create(params);

      const savePaymentIntentDetails = await new PaymentModel({
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        payment_id: paymentIntent.id,
        // add service provider ID ~~ TASK
        user_id: req.user,
        job_id: jobId,
        service: ServiceInfo?.name,
      }).save();

      return res.json({
        error: false,
        response: "Payment intent created",
        data: paymentIntent.client_secret,
        ephemeralKey: ephemeralKey.secret,
        customer: customer.id,
      });
    } catch (error) {
      console.log(
        `================================${error} in creating  payment intent ================================================`
      );

      return res.json({
        error: true,
        response: "Error in payment intent",
        data: null,
      });
    }
  }
);

// ####################### STRIPE WEBHOOKS LISTENERS ###################################

app.post(
  "/stripe/webhook",
  express.raw({ type: "application/json" }),
  (request, response) => {
    stripeWebhooks(request, response);
  }
);

// #####################################################################################

//
app.use("/api/owner", require("./routes/owners"));
app.use("/api/public", require("./routes/public"));
app.use("/api/admin", require("./routes/admins"));
app.use("/api/user", require("./routes/users"));
app.use("/api/job", require("./routes/jobs"));
app.use("/api/chat", require("./routes/chat"));
app.use(errorFormatter);

// #####  Cron to run at midNight ##########

cron.schedule("00 00 * * *", async () => {
  console.log("###### counter reset #####");
});

// ##################################################################

// ********************** 404 route handler  ************************
app.use((req, res) => {
  res.status(404).json({ msg: "API not found", error: true, data: null });
});
// ********************** 404 route handler  ************************
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`listening on PORT ${PORT} in ${ENVIROMENT}`);
});
