const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  content: {
    type: String,
    default: '',
  },
  type: {
    type: String,
    enum: ['text', 'image', 'video', 'voice'],
    default: 'text',
  },
  mediaUrl: {
    type: String,
    default: null,
  },
  audioUrl: {
    type: String,
    default: null,
  },
  read: {
    type: Boolean,
    default: false,
  },
  readAt: { type: Date, default: null },
});

messageSchema.index({ conversationId: 1 });
messageSchema.index({ sender: 1, receiver: 1 });

messageSchema.set('timestamps', true);

module.exports = mongoose.model('Message', messageSchema);
