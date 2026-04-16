const mongoose = require('mongoose');

const SERVICE_CATEGORIES = [
  'Plumber', 'Electrician', 'Painter', 'Carpenter', 'Home Cleaner', 
  'Mover', 'HVAC Technician', 'Landscaper', 'Roofer', 'Appliance Repair', 'General'
];

const postSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  content: {
    type: String,
    required: [true, 'Content is required'],
  },
  images: [{
    type: String,
  }],
  type: {
    type: String,
    enum: ['post', 'promo', 'tip', 'work'],
    default: 'post',
  },
  serviceCategory: {
    type: String,
    enum: [...SERVICE_CATEGORIES, null],
    default: null,
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  commentsCount: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Post', postSchema);
