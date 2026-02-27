const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    unique: true,
    trim: true,
  },
  icon: {
    type: String,
    required: [true, 'Icon is required'],
  },
  color: {
    type: String,
    default: 'bg-blue-50 text-primary',
  },
  description: {
    type: String,
    default: '',
  },
  providers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Provider',
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Category', categorySchema);
