const router = require("express").Router();
const { contactUs, getContactUsRequests } = require("../controllers/public");
const { auth, isAdmin } = require("../middleware/auth");

router.post("/contact-us", contactUs);

module.exports = router;
