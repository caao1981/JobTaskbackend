const cloudinary = require("cloudinary").v2;

const uploadFile = async (fileToUpload) => {
  try {
    const res = await cloudinary.uploader.upload(fileToUpload);
    return res;
  } catch (err) {
    console.error(err.message);
    throw new Error(err.message);
  }
};

module.exports = uploadFile;
