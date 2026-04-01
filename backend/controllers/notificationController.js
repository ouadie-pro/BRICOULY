const Notification = require('../models/Notification');

exports.getNotifications = async (req, res) => {
  try {
    console.log('[getNotifications] Request received', { headers: req.headers });
    const userId = req.headers['x-user-id'];
    console.log('[getNotifications] userId:', userId);
    
    if (!userId) {
      console.log('[getNotifications] No userId, returning empty');
      return res.json([]);
    }
    
    const notifications = await Notification.find({ user: userId }).populate('fromUser', 'name avatar').sort({ createdAt: -1 });
    console.log('[getNotifications] Found notifications:', notifications.length);
    
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
    console.error('[getNotifications] Error:', error.message, error.stack);
    res.status(500).json({ error: error.message });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    console.log('[markAsRead] Request received', { headers: req.headers });
    const userId = req.headers['x-user-id'];
    await Notification.updateMany({ user: userId }, { read: true });
    console.log('[markAsRead] Success for user:', userId);
    res.json({ success: true });
  } catch (error) {
    console.error('[markAsRead] Error:', error.message, error.stack);
    res.status(500).json({ error: error.message });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    console.log('[getUnreadCount] Request received', { headers: req.headers });
    const userId = req.headers['x-user-id'];
    const count = await Notification.countDocuments({ user: userId, read: false });
    console.log('[getUnreadCount] Count:', count, 'for user:', userId);
    res.json({ count });
  } catch (error) {
    console.error('[getUnreadCount] Error:', error.message, error.stack);
    res.status(500).json({ error: error.message });
  }
};