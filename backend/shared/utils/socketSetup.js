const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

const setupSocket = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(decoded.id).select('_id name email role');
      
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.name} (${socket.user._id})`);

    socket.join(`user:${socket.user._id}`);

    socket.on('joinConversation', (conversationId) => {
      socket.join(`conversation:${conversationId}`);
      console.log(`User ${socket.user.name} joined conversation ${conversationId}`);
    });

    socket.on('leaveConversation', (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
    });

    socket.on('typing', (data) => {
      socket.to(`conversation:${data.conversationId}`).emit('userTyping', {
        userId: socket.user._id,
        userName: socket.user.name,
        conversationId: data.conversationId
      });
    });

    socket.on('stopTyping', (data) => {
      socket.to(`conversation:${data.conversationId}`).emit('userStoppedTyping', {
        userId: socket.user._id,
        conversationId: data.conversationId
      });
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.name}`);
    });
  });

  return io;
};

module.exports = { setupSocket };