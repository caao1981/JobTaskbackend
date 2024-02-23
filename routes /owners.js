const router = require("express").Router();
const {
  register,
  login,
  me,
  listOwners,
  accountCheck,
  sendOtp,
  verifyOtp,
  accountDetails,
  setProfile,
  uploadProfilePic,
  uploadVerifyDoc,
  deleteuserAccount,
  addOrUpdateService,
  getAllServices,
  deleteService,
  getEarnings,
} = require("../controllers/owner");
const fileUpload = require("express-fileupload");
const { auth, isServiceProvider } = require("../middleware/auth");
const multer = require("multer");
const parser = multer({ dest: "uploads/" });
const upload = parser.any("doc");
router.post("/", register);
router.post("/login", login);
router.get("/", auth, listOwners);
router.get("/details/:id", auth, accountDetails);
router.get("/account-check/:phone", accountCheck);
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);

router.use(
  fileUpload({
    limits: { fileSize: 50 * 1024 * 1024 },
  })
);
router.use([auth, isServiceProvider]);
router.get("/me", me);
router.put("/", setProfile);
router.put("/upload-image", uploadProfilePic);
router.post("/upload-doc", uploadVerifyDoc);
router.delete("/", deleteuserAccount);
router.put("/service", addOrUpdateService);
router.delete("/service", deleteService);
router.get("/service", getAllServices);
router.get("/earnings", getEarnings);

module.exports = router;
