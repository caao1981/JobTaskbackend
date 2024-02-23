var CryptoJS = require("crypto-js");

exports.encrypt = (text) => {
  try {
    const ciphertext = CryptoJS.AES.encrypt(
      text,
      process.env.CRYPTOSECRET
    ).toString();
    return ciphertext;
  } catch (error) {
    console.log("error in AES encryption");
  }
};

exports.descrypt = (text) => {
  try {
    const bytes = CryptoJS.AES.decrypt(text, process.env.CRYPTOSECRET);
    const originalText = bytes.toString(CryptoJS.enc.Utf8);
    return originalText;
  } catch (error) {
    console.log(error);
    console.log("error in AES decryption");
  }
};
