const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const SERVICE_SPECIALIZATIONS = [
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
  'carpenter',
  'general'
];

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    default: null,
  },
  avatar: {
    type: String,
    default: '',
  },
  phone: {
    type: String,
    default: '',
  },
  location: {
    type: String,
    default: 'Maroc',
  },
  role: {
    type: String,
    enum: ['client', 'provider', 'admin'],
    default: 'client',
  },
  specialization: {
    type: String,
    enum: [...SERVICE_SPECIALIZATIONS, ''],
    default: '',
  },
  googleId: {
    type: String,
    default: null,
  },
  facebookId: {
    type: String,
    default: null,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  authProvider: {
    type: String,
    enum: ['local', 'google', 'facebook'],
    default: 'local',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  profileViews: {
    type: Number,
    default: 0,
  },
  hourlyRate: {
    type: Number,
    default: 0,
  },
  profession: {
    type: String,
    default: '',
  },
  bio: {
    type: String,
    default: '',
  },
  city: {
    type: String,
    default: '',
  },
});

userSchema.pre('save', async function () {
  if (!this.isModified('password') || !this.password) return;
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (error) {
    throw error;
  }
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  obj.id = obj._id.toString();
  delete obj._id;
  delete obj.__v;
  return obj;
};

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1 });
userSchema.index({ specialization: 1 });
userSchema.index({ createdAt: -1 });

userSchema.statics.SERVICE_SPECIALIZATIONS = SERVICE_SPECIALIZATIONS;

module.exports = mongoose.model('User', userSchema);
