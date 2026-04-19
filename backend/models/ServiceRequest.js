const mongoose = require('mongoose');

const APPLICATION_STATUSES = ['pending', 'accepted', 'rejected'];
const SERVICE_TYPES = [
  'plumber',
  'electrician',
  'painter',
  'carpenter',
  'cleaner',
  'mover',
  'hvac',
  'landscaper',
  'roofer',
  'appliance_repair',
  'general'
];
const POST_STATUSES = ['open', 'in_progress', 'completed'];

const applicationSchema = new mongoose.Schema({
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: APPLICATION_STATUSES,
    default: 'pending',
  },
  message: {
    type: String,
    default: '',
  },
  proposedPrice: {
    type: Number,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const serviceRequestSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters'],
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [1000, 'Description cannot exceed 1000 characters'],
  },
  serviceType: {
    type: String,
    required: [true, 'Service type is required'],
    enum: SERVICE_TYPES,
  },
  status: {
    type: String,
    enum: POST_STATUSES,
    default: 'open',
  },
  location: {
    type: String,
    default: '',
  },
  budget: {
    type: Number,
    default: null,
  },
  preferredDate: {
    type: Date,
    default: null,
  },
  preferredTime: {
    type: String,
    enum: ['morning', 'afternoon', 'evening', 'anytime', ''],
    default: 'anytime',
  },
  applications: [applicationSchema],
  acceptedProviderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  completedAt: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

serviceRequestSchema.pre('save', async function () {
  this.updatedAt = new Date();
});

serviceRequestSchema.index({ clientId: 1, createdAt: -1 });
serviceRequestSchema.index({ serviceType: 1, status: 1 });
serviceRequestSchema.index({ acceptedProviderId: 1 });
serviceRequestSchema.index({ 'applications.providerId': 1 });

serviceRequestSchema.statics.SERVICE_TYPES = SERVICE_TYPES;
serviceRequestSchema.statics.POST_STATUSES = POST_STATUSES;
serviceRequestSchema.statics.APPLICATION_STATUSES = APPLICATION_STATUSES;

module.exports = mongoose.model('ServiceRequest', serviceRequestSchema);
