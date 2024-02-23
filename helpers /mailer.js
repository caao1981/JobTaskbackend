const nodemailer = require("nodemailer");
//send email
function sendEmail(recipient, subject, html) {
  return new Promise(function (resolve, reject) {
    const mail = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.mailerHost, // Your email id
        pass: process.env.mailerPassword, // Your password,
      },
    });

    const mailOptions = {
      from: process.env.mailerHost,
      to: recipient,
      subject,
      html
    //   html,
    };

    mail.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(1);
        reject(error);
      } else {
        resolve(info);
        console.log(0);
      }
    });
  });
}

module.exports = {
  sendEmail,
};
