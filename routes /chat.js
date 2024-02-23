const router = require("express").Router();
const {
  getInbox,
  chatDetail,
  sendMessage,
  deleteMessage,
} = require("../controllers/chat");
const { auth } = require("../middleware/auth");

router.use(auth);
router.get("/inbox", getInbox);
router.get("/:chatId", chatDetail);
router.post("/send/:chatId", sendMessage);
router.delete("/chatId/:chatId/messageId/:messageId", deleteMessage);

module.exports = router;
