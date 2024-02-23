const router = require("express").Router();
const {
  login,
  register,
  me,
  getKeys,
  updatePassword,
  stats,
  listUsers,
  recentOrders,
  listJobs,
  topServiceProviders,
  analytics,
  jobsByMonth,
  earnings,
  updateProfile,
  getRevenue,
  updateUsers,
  disableUsers,
  monthlyServiceProviderRevenue,
  givePaymentToServiceProvider,
  sendMessage,
} = require("../controllers/admin");
const { getContactUsRequests } = require("../controllers/public");
const { auth, isAdmin } = require("../middleware/auth");

router.post("/", register);
router.post("/login", login);
router.get("/get-keys", auth, getKeys);
router.use([auth, isAdmin]);
router.get("/me", me);
router.get("/stats", stats);
router.get("/list-users", listUsers);
router.get("/recent-orders", recentOrders);
router.get("/jobs", listJobs);
router.post("/contact-us-requests", getContactUsRequests);
router.get("/top-service-providers", topServiceProviders);
router.get("/analytics", analytics);
router.get("/monthly-jobs", jobsByMonth);
router.get("/earnings", earnings);
router.put("/profile", updateProfile);
router.put("/update-password", updatePassword);
router.get("/revenue/:service", getRevenue);
router.put("/:resource/:resourceId", updateUsers);
router.delete("/:resource/:resourceId", disableUsers);
router.get("/monthlyRevenue/:serviceProviderId", monthlyServiceProviderRevenue);

router.put("/makez-payment-to-service-provider", givePaymentToServiceProvider);
router.post("/send-message", sendMessage);

module.exports = router;
