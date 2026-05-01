const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
  },
  serviceRequestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceRequest',
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
  readAt: { 
    type: Date, 
    default: null 
  },
  seen: {
    type: Boolean,
    default: false,
  },
  seenAt: Date,
}, { timestamps: true });

messageSchema.index({ conversationId: 1 });
messageSchema.index({ sender: 1, receiver: 1 });
messageSchema.index({ bookingId: 1 });
messageSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);