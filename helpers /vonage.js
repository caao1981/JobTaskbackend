const vonage = require("../config/vonage");

const requestOtp = (phone) => {
  return new Promise((resolve, reject) => {
    vonage.verify.request(
      {
        number: phone,
        brand: "Job Task",
        code_length: 6,
      },
      (err, result) => {
        if (err) {
          console.error(err);
          reject(err);
        } else {
          console.log(result);
          const verifyRequestId = result.request_id;
          console.log("request_id", verifyRequestId);

          resolve(verifyRequestId);
        }
      }
    );
  });
};

const verifyOtp = async (code, REQUEST_ID) => {
  return new Promise((resolve, reject) => {
    vonage.verify.check(
      {
        request_id: REQUEST_ID,
        code: code,
      },
      (err, result) => {
        if (err) {
          console.error(err);
          resolve({
            error: err,
          });
        } else {
          console.log(result);
          let error = false;
          if (result.status !== "0") {
            error = true;
          }
          resolve({
            error: error,
          });
        }
      }
    );
  });
};

const cancelVerifyRequest = (REQUEST_ID) => {
  vonage.verify.control(
    {
      request_id: REQUEST_ID,
      cmd: "cancel",
    },
    (err, result) => {
      if (err) {
        console.error(err);
      } else {
        console.log(result);
      }
    }
  );
};

module.exports = {
  requestOtp,
  verifyOtp,
  cancelVerifyRequest,
};
