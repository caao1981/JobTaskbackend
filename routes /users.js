const router = require("express").Router();
const {
  register,
  login,
  me,
  sendOtp,
  accountCheck,
  verifyOtp,
  uploadProfilePic,
  setProfile,
  deleteuserAccount,
} = require("../controllers/user");
const { auth, isUser } = require("../middleware/auth");

router.post("/", register);
router.post("/login", login);
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.get("/account-check/:phone", accountCheck);
router.use([auth, isUser]);
router.get("/me", me);
router.put("/", setProfile);
router.put("/upload-image", uploadProfilePic);
router.delete("/", deleteuserAccount);

module.exports = router;
