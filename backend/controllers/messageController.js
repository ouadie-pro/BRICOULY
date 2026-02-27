const Message = require('../models/Message');

exports.getMessages = async (req, res) => {
  try {
    const { providerId } = req.params;
    const userId = req.user.id;

    const messages = await Message.find({
      $or: [
        { sender: userId, provider: providerId },
        { receiver: userId, provider: providerId },
      ],
    })
      .populate('sender', 'name avatar')
      .populate('receiver', 'name avatar')
      .sort({ createdAt: 1 });

    res.json({
      success: true,
      count: messages.length,
      messages,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { providerId, text, type } = req.body;
    const senderId = req.user.id;

    const provider = await require('../models/Provider').findById(providerId);
    
    const message = await Message.create({
      sender: senderId,
      receiver: provider.user,
      provider: providerId,
      text,
      type: type || 'text',
    });

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name avatar')
      .populate('receiver', 'name avatar');

    res.status(201).json({
      success: true,
      message: populatedMessage,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    await Message.updateMany(
      { receiver: req.user.id, provider: req.params.providerId, read: false },
      { read: true }
    );

    res.json({
      success: true,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
