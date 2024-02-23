const SERVICES = [
  "car-transport",
  "cleaning",
  "deliveries",
  "furniture-assembly",
  "man-and-van",
  "mobile-barbers",
  "mobile-hair-dressers",
  "mobile-nail-technicians",
  "removals",
  "shop-and-deliver",
];

const ALREADY_BOUGHT_ITEMS = ["mattress", "wardrobe", "bed-base", "table"];

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dev",
];

const DAYS = [
  { shortName: "sun", longName: "sunday" },
  { shortName: "mon", longName: "monday" },
  { shortName: "tue", longName: "tuesday" },
  { shortName: "wed", longName: "wednesday" },
  { shortName: "thu", longName: "thursday" },
  { shortName: "fri", longName: "friday" },
  { shortName: "sat", longName: "saturday" },
];

const CLEANING_TYPES = ["regular", "deep"];

const NAIL_TYPES = [
  "natural",
  "oval",
  "square",
  "squoval",
  "almond",
  "rounded",
  "stiletto",
  "mountain_peak",
  "edge",
  "lipstick",
  "ballerina",
  "wide",
];

const USER_ROLES = ["owner", "user", "admin"];

const IS_OTP_ENABLED = true;

const JOB_STATUSES = {
  ADMIN_APPROVAL: "ADMIN_APPROVAL",
  ADMIN_REJECT: "ADMIN_REJECT",
  SERVICE_PROVIDER_PENDING: "SERVICE_PROVIDER_PENDING",
  ASSIGNED_TO_SERVICE_PROVIDER: "ASSIGNED_TO_SERVICE_PROVIDER",
  USER_PAYMENT_CONFIRMATION: "USER_PAYMENT_CONFIRMATION",
  ACTIVE: "ACTIVE",
  PENDING: "PENDING",
  COMPLETED: "COMPLETED",
  REJECT: "REJECTED",
};

const HAVE_ITEMS = ["bucket", "cleaningProducts", "mop", "vacuumHover"];
const EXTRAS = [
  "bucket",
  "cleanInsideOven",
  "cleaningProducts",
  "mop",
  "vacuum",
];

const DEMO_NUMBER = "+923348506479";
const DEMO_OTP = "123456";
const DEMO_REQUEST_ID = "b193d0379db842a3a4a867e9b304c032";

module.exports = {
  status: JOB_STATUSES,
  SERVICES,
  NAIL_TYPES: NAIL_TYPES,
  IS_OTP_ENABLED,
  CLEANING_TYPES,
  MONTHS,
  USER_ROLES,
  HAVE_ITEMS,
  EXTRAS,
  ALREADY_BOUGHT_ITEMS,
  DAYS,
  DEMO_NUMBER,
  DEMO_OTP,
  DEMO_REQUEST_ID,
};
