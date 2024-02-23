const { compareAsc } = require("date-fns");
const chatModel = require("../models/NewChat");
const jobModel = require("../models/NewService");
const { ACTIVE } = require("./../constants/index").status;
const getInbox = async function (req, res, next) {
  try {
    const inbox = await chatModel
      .find({
        $or: [
          {
            admin: req.user,
          },
          {
            serviceProvider: req.user,
          },
          {
            user: req.user,
          },
        ],
      })
      .populate("admin user serviceProvider", {
        _id: 1,
        fullName: 1,
        profilePic: { $ifNull: ["$profilePic", ""] },
        email: 1,
      });

    const inboxWithServices = await Promise.all(
      inbox.map(async (chat) => {
        const service = await jobModel.findOne({
          chat: chat._id,
          status: ACTIVE,
        });

        // Sort messages in descending order based on timestamps
        chat._doc.messages.sort((a, b) => {
          const firstDt = new Date(a.createdAt);
          const secondDt = new Date(b.createdAt);
          return compareAsc(secondDt, firstDt);
        });

        chat._doc.service = service;
        console.log(chat);
        return chat;
      })
    );

    return res.json({
      data: inboxWithServices,
      error: false,
      response: "",
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      response: error.message,
      data: null,
    });
  }
};
const chatDetail = async function (req, res, next) {
  try {
    const inbox = await chatModel
      .findById(req.params.chatId)
      .populate("user serviceProvider admin", {
        _id: 1,
        fullName: 1,
        profilePic: 1,
      });

    return res.json({
      data: inbox,
      error: false,
      response: "",
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      response: error.message,
      data: null,
    });
  }
};

const sendMessage = async function (req, res, next) {
  try {
    const { chatId } = req.params;
    const { message } = req.body;

    const chatInstanceFromDb = await chatModel
      .findById(chatId)
      .populate("user serviceProvider admin");
    const updatedChatInstance = await chatModel.findByIdAndUpdate(
      chatId,
      {
        $push: {
          messages: {
            message,
            sentBy: {
              role: req.role,
              sentById: req.user,
            },
          },
        },
      },
      { new: true }
    );

    const { socket } = req;
    socket.emit("new-message", {
      message,
      sender: req.user,
      chatId,
      user: updatedChatInstance.user,
      serviceProvider: updatedChatInstance.serviceProvider,
      admin: updatedChatInstance.admin,
      sentByRole: req.role,
    });
    return res.json({
      data: updatedChatInstance,
      error: false,
      response: "",
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      response: error.message,
      data: null,
    });
  }
};

const deleteMessage = async function (req, res, next) {
  try {
    const { messageId, chatId } = req.params;

    await chatModel.updateOne(
      {
        _id: chatId,
      },
      {
        $pull: {
          messages: {
            _id: messageId,
          },
        },
      }
    );

    return res.json({
      data: null,
      error: false,
      response: "Message deleted successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: true,
      response: error.message,
      data: null,
    });
  }
};

module.exports = { getInbox, chatDetail, sendMessage, deleteMessage };
