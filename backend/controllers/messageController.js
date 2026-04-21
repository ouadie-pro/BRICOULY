const mongoose = require('mongoose');
const User = require('../models/User');
const Provider = require('../models/Provider');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Notification = require('../models/Notification');

const isValidObjectId = (id) => {
  if (!id || typeof id !== 'string') return false;
  return mongoose.Types.ObjectId.isValid(id) && String(id).length === 24 && /^[a-fA-F0-9]{24}$/.test(String(id));
};

exports.getConversations = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];

    if (!userId || !isValidObjectId(userId)) {
      return res.json([]);
    }

    const conversations = await Conversation.find({
      participants: new mongoose.Types.ObjectId(userId)
    }).sort({ lastMessageAt: -1 });

    const conversationData = await Promise.all(conversations.map(async (conv) => {
      try {
        const otherUserId = conv.participants.find(p => p.toString() !== userId);
        const otherUser = await User.findById(otherUserId).select('name avatar role');
        
        let profession = '';
        if (otherUser?.role === 'provider') {
          const provider = await Provider.findOne({ user: otherUserId });
          profession = provider?.profession || '';
        }

        const unreadCount = await Message.countDocuments({
          conversationId: conv._id,
          receiver: new mongoose.Types.ObjectId(userId),
          read: false
        });

        return {
          id: conv._id,
          conversationId: conv._id,
          userId: otherUserId,
          userName: otherUser?.name || 'Unknown',
          userAvatar: otherUser?.avatar || '',
          userRole: otherUser?.role || 'user',
          userProfession: profession,
          lastMessage: conv.lastMessage || '',
          lastMessageTime: conv.lastMessageAt,
          unread: unreadCount,
        };
      } catch (convError) {
        return null;
      }
    }));

    res.json(conversationData.filter(Boolean));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const currentUserId = req.headers['x-user-id'];
    const otherUserId = req.params.userId;
    const { page = 1, limit = 50 } = req.query;
    
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 50;
    const skip = (pageNum - 1) * limitNum;

    if (!currentUserId || !isValidObjectId(currentUserId) || !isValidObjectId(otherUserId)) {
      return res.json({ data: [], pagination: { total: 0, page: 1, limit: 50, pages: 0 } });
    }

    let conversation = await Conversation.findOne({
      participants: { $all: [new mongoose.Types.ObjectId(currentUserId), new mongoose.Types.ObjectId(otherUserId)] }
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [new mongoose.Types.ObjectId(currentUserId), new mongoose.Types.ObjectId(otherUserId)],
      });
    }

    const total = await Message.countDocuments({ conversationId: conversation._id });
    
    const messages = await Message.find({
      conversationId: conversation._id
    })
      .populate('sender', 'name avatar')
      .populate('receiver', 'name avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    await Message.updateMany(
      { conversationId: conversation._id, receiver: new mongoose.Types.ObjectId(currentUserId), read: false },
      { read: true }
    );

    const messagesData = messages.map(m => ({
      id: m._id.toString(),
      conversationId: m.conversationId.toString(),
      senderId: m.sender._id.toString(),
      senderName: m.sender.name,
      senderAvatar: m.sender.avatar,
      receiverId: m.receiver._id.toString(),
      content: m.content,
      mediaUrl: m.mediaUrl,
      audioUrl: m.audioUrl,
      type: m.type,
      time: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: m.read,
      createdAt: m.createdAt,
    }));

    // FIXED: #20 - Add pagination to messages response
    res.json({
      data: messagesData.reverse(),
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const senderId = req.headers['x-user-id'];
    const { receiverId, content, mediaUrl, audioUrl, type } = req.body;

    if (!receiverId) {
      return res.status(400).json({ error: 'receiverId is required' });
    }

    let conversation = await Conversation.findOne({
      participants: { $all: [new mongoose.Types.ObjectId(senderId), new mongoose.Types.ObjectId(receiverId)] }
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [new mongoose.Types.ObjectId(senderId), new mongoose.Types.ObjectId(receiverId)],
      });
    }

    const message = await Message.create({
      conversationId: conversation._id,
      sender: new mongoose.Types.ObjectId(senderId),
      receiver: new mongoose.Types.ObjectId(receiverId),
      content: content || '',
      mediaUrl: mediaUrl || null,
      audioUrl: audioUrl || null,
      type: type || 'text',
      read: false
    });

    conversation.lastMessage = content || (mediaUrl ? '[Media]' : '');
    conversation.lastMessageAt = new Date();
    await conversation.save();

    await Notification.create({
      user: new mongoose.Types.ObjectId(receiverId),
      type: 'message',
      title: 'New Message',
      text: content?.substring(0, 50) || 'New message',
      fromUser: new mongoose.Types.ObjectId(senderId),
    });

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name avatar')
      .populate('receiver', 'name avatar');

    // FIXED: #15 - Emit new message event to recipient's socket room
    const io = req.app.get('io');
    if (io) {
      io.to(`user:${receiverId}`).emit('newMessage', {
        id: populatedMessage._id.toString(),
        conversationId: conversation._id.toString(),
        senderId: populatedMessage.sender._id.toString(),
        senderName: populatedMessage.sender.name,
        senderAvatar: populatedMessage.sender.avatar,
        receiverId: populatedMessage.receiver._id.toString(),
        receiverName: populatedMessage.receiver.name,
        content: populatedMessage.content,
        mediaUrl: populatedMessage.mediaUrl,
        audioUrl: populatedMessage.audioUrl,
        type: populatedMessage.type,
        createdAt: populatedMessage.createdAt,
      });
    }

    res.json({
      id: populatedMessage._id,
      conversationId: conversation._id,
      senderId: populatedMessage.sender._id,
      senderName: populatedMessage.sender.name,
      senderAvatar: populatedMessage.sender.avatar,
      receiverId: populatedMessage.receiver._id,
      content: populatedMessage.content || '',
      mediaUrl: populatedMessage.mediaUrl,
      audioUrl: populatedMessage.audioUrl,
      type: populatedMessage.type,
      time: new Date(populatedMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: populatedMessage.read,
      createdAt: populatedMessage.createdAt,
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.uploadMedia = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No file uploaded' });
  }
  res.json({
    success: true,
    filePath: `/uploads/${req.file.filename}`,
    filename: req.file.filename,
  });
};

exports.markAsRead = async (req, res) => {
  try {
    const currentUserId = req.headers['x-user-id'];
    const otherUserId = req.params.providerId;

    if (!currentUserId || !isValidObjectId(currentUserId) || !isValidObjectId(otherUserId)) {
      return res.status(400).json({ success: false, error: 'Invalid user ID' });
    }

    await Message.updateMany(
      {
        sender: new mongoose.Types.ObjectId(otherUserId),
        receiver: new mongoose.Types.ObjectId(currentUserId),
        read: false
      },
      { read: true }
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};