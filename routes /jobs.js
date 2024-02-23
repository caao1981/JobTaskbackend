const router = require("express").Router();
const { auth, isServiceProvider, isUser } = require("../middleware/auth");
const {
  create,
  listJobs,
  acceptJobRequest,
  jobReview,
  getSingleJob,
} = require("../controllers/job");

router.get("/list-jobs", [auth, isServiceProvider], listJobs);

router.use(auth);
router.put("/:jobId", acceptJobRequest);
router.get("/:id", getSingleJob);

router.get("/", listJobs);
router.post("/", isUser, create);
router.put("/review/:id", jobReview);

// router.get("/my-services", myServices);
// router.get("/detail/:serviceId", serviceDetail);

module.exports = router;
