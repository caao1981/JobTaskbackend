const jwt = require("jsonwebtoken");
module.exports = {
  generateAccessToken: (payload) => {
    return new Promise((resolve, reject) => {
      jwt.sign(
        payload,
        process.env.JWTSECRET,
        // { expiresIn: "10h" },
        (err, data) => {
          if (err) {
            console.log(err);
            reject("Error in generating accessToken");
          }

          resolve(data);
        }
      );
    });
  },
  generateRefreshToken: (payload) => {
    return new Promise((resolve, reject) => {
      jwt.sign(
        payload,
        process.env.JWTREFRESHSECRET,
        // { expiresIn: "1y" },
        (err, data) => {
          if (err) {
            console.log(err);
            reject("Error in generating RefreshToken");
          }

          resolve(data);
        }
      );
    });
  },
  verifyRefreshToken: (refreshToken) => {
    return new Promise((resolve, reject) => {
      try {
        const decoded = jwt.verify(refreshToken, process.env.JWTREFRESHSECRET);
        resolve(decoded);
      } catch (error) {
        console.log("verifyRefreshToken", error);
        reject("Invalid refresh token");
      }
    });
  },
};
