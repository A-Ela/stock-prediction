const Notification = require("../models/Notification");

exports.getNotifications = async (req, res) => {
  const notes = await Notification.find({ userID: req.user.id })
    .sort({ createdAt: -1 });

  res.json(notes);
};

exports.markRead = async (req, res) => {
  await Notification.findByIdAndUpdate(req.params.id, {
    isRead: true
  });

  res.json({ msg: "Updated" });
};