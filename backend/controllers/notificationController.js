const Notification = require('../models/Notification');

exports.getNotifications = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const notifications = await Notification.find({ user: userId }).populate('fromUser', 'name avatar').sort({ createdAt: -1 });
    const notificationsData = notifications.map(n => ({
      id: n._id.toString(),
      userId: n.user.toString(),
      type: n.type,
      title: n.title,
      text: n.text,
      fromUserId: n.fromUser?._id?.toString(),
      fromUserAvatar: n.fromUser?.avatar,
      fromUserName: n.fromUser?.name,
      read: n.read,
      createdAt: n.createdAt,
    }));
    res.json(notificationsData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    await Notification.updateMany({ user: userId }, { read: true });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const count = await Notification.countDocuments({ user: userId, read: false });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};