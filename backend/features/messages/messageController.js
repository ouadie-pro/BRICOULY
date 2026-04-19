const mongoose = require('mongoose');
const User = require('../../models/User');
const Provider = require('../../models/Provider');
const Conversation = require('../../models/Conversation');
const Message = require('../../models/Message');
const Notification = require('../../models/Notification');
const { asyncHandler, ApiResponse } = require('../../shared/utils/responseWrapper');
const { NotFoundError } = require('../../shared/errors/AppError');

const isValidObjectId = (id) => {
  if (!id || typeof id !== 'string') return false;
  return mongoose.Types.ObjectId.isValid(id) && String(id).length === 24 && /^[a-fA-F0-9]{24}$/.test(String(id));
};

const getConversations = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const conversations = await Conversation.find({
    participants: userId
  }).sort({ lastMessageAt: -1 });

  const conversationData = await Promise.all(conversations.map(async (conv) => {
    const otherUserId = conv.participants.find(p => p.toString() !== userId.toString());
    const otherUser = await User.findById(otherUserId).select('name avatar role');
    
    let profession = '';
    if (otherUser?.role === 'provider') {
      const provider = await Provider.findOne({ user: otherUserId });
      profession = provider?.profession || '';
    }

    const unreadCount = await Message.countDocuments({
      conversationId: conv._id,
      receiver: userId,
      read: false
    });

    return {
      id: conv._id.toString(),
      conversationId: conv._id.toString(),
      userId: otherUserId?.toString(),
      userName: otherUser?.name || 'Unknown',
      userAvatar: otherUser?.avatar || '',
      userRole: otherUser?.role || 'user',
      userProfession: profession,
      lastMessage: conv.lastMessage || '',
      lastMessageTime: conv.lastMessageAt,
      unread: unreadCount,
    };
  }));

  return ApiResponse.success(res, conversationData.filter(Boolean));
});

const getMessages = asyncHandler(async (req, res) => {
  const currentUserId = req.user.id;
  const otherUserId = req.params.userId;
  const { page = 1, limit = 50 } = req.query;
  
  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 50;
  const skip = (pageNum - 1) * limitNum;

  let conversation = await Conversation.findOne({
    participants: { $all: [currentUserId, otherUserId] }
  });

  if (!conversation) {
    conversation = await Conversation.create({
      participants: [currentUserId, otherUserId],
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
    { conversationId: conversation._id, receiver: currentUserId, read: false },
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

  return ApiResponse.paginated(res, messagesData.reverse(), {
    total,
    page: pageNum,
    limit: limitNum,
    pages: Math.ceil(total / limitNum)
  });
});

const sendMessage = asyncHandler(async (req, res) => {
  const senderId = req.user.id;
  const { receiverId, content, mediaUrl, audioUrl, type } = req.body;

  if (!receiverId) {
    return ApiResponse.error(res, 'receiverId is required', 400);
  }

  let conversation = await Conversation.findOne({
    participants: { $all: [senderId, receiverId] }
  });

  if (!conversation) {
    conversation = await Conversation.create({
      participants: [senderId, receiverId],
    });
  }

  const message = await Message.create({
    conversationId: conversation._id,
    sender: senderId,
    receiver: receiverId,
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
    user: receiverId,
    type: 'message',
    title: 'New Message',
    text: content?.substring(0, 50) || 'New message',
    fromUser: senderId,
  });

  const populatedMessage = await Message.findById(message._id)
    .populate('sender', 'name avatar')
    .populate('receiver', 'name avatar');

  const io = req.app.get('io');
  if (io) {
    io.to(`user:${receiverId}`).emit('newMessage', {
      id: populatedMessage._id.toString(),
      conversationId: conversation._id.toString(),
      senderId: populatedMessage.sender._id.toString(),
      senderName: populatedMessage.sender.name,
      senderAvatar: populatedMessage.sender.avatar,
      receiverId: populatedMessage.receiver._id.toString(),
      content: populatedMessage.content,
      mediaUrl: populatedMessage.mediaUrl,
      type: populatedMessage.type,
      createdAt: populatedMessage.createdAt,
    });
  }

  return ApiResponse.created(res, {
    id: populatedMessage._id.toString(),
    conversationId: conversation._id.toString(),
    senderId: populatedMessage.sender._id.toString(),
    senderName: populatedMessage.sender.name,
    senderAvatar: populatedMessage.sender.avatar,
    receiverId: populatedMessage.receiver._id.toString(),
    content: populatedMessage.content || '',
    mediaUrl: populatedMessage.mediaUrl,
    type: populatedMessage.type,
    time: new Date(populatedMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    read: populatedMessage.read,
    createdAt: populatedMessage.createdAt,
  });
});

const uploadMedia = asyncHandler(async (req, res) => {
  if (!req.file) {
    return ApiResponse.error(res, 'No file uploaded', 400);
  }
  return ApiResponse.success(res, {
    filePath: `/uploads/${req.file.filename}`,
    filename: req.file.filename,
  });
});

const markAsRead = asyncHandler(async (req, res) => {
  const currentUserId = req.user.id;
  const otherUserId = req.params.providerId;

  await Message.updateMany(
    {
      sender: otherUserId,
      receiver: currentUserId,
      read: false
    },
    { read: true }
  );

  return ApiResponse.success(res, { message: 'Messages marked as read' });
});

module.exports = {
  getConversations,
  getMessages,
  sendMessage,
  uploadMedia,
  markAsRead
};