const mongoose = require("mongoose");
const mongoURI = process.env.CONNECTION_URI;
// const mongoURI = undefined;
//   process.env.NODE_ENV === "undefined"
//     ? "mongodb://localhost/job-task"
//     : // process.env.CONNECTION_URI
//       process.env.CONNECTION_URI;
// console.log("MONGOURI", mongoURI);

const dbConnect = async () => {
  mongoose.connect(
    mongoURI,
    {
      useNewUrlParser: true,
    },
    (error) => {
      if (error) {
        console.log("Db connection error", error.message);
        process.exit(1);
      } else {
        console.log("connected to Database successfully");
      }
    }
  );
};

module.exports = dbConnect;
