const User = require('../../models/User');
const Provider = require('../../models/Provider');
const { generateToken, generateRefreshToken, verifyRefreshToken } = require('../../shared/utils/jwtHelper');
const { ConflictError, NotFoundError, UnauthorizedError } = require('../../shared/errors/AppError');

const SERVICE_SPECIALIZATIONS = [
  'plumber', 'electrician', 'painter', 'carpenter', 'cleaner',
  'mover', 'hvac', 'landscaper', 'roofer', 'appliance_repair', 'general'
];

const formatUser = (user, provider = null) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  role: user.role,
  specialization: user.specialization,
  phone: user.phone,
  location: user.location,
  avatar: user.avatar,
  bio: user.bio,
  city: user.city,
  hourlyRate: provider?.hourlyRate || 0,
  rating: provider?.rating || 0,
  reviewCount: provider?.reviewCount || 0,
  jobsDone: provider?.jobsDone || 0,
  verified: provider?.verified || false,
  isVerified: user.isVerified,
  createdAt: user.createdAt
});

const signup = async (userData) => {
  const { name, email, password, role, phone, specialization, bio } = userData;

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new ConflictError('Email already exists');
  }

  const userRole = role === 'provider' ? 'provider' : 'client';

  if (userRole === 'provider' && specialization) {
    if (!SERVICE_SPECIALIZATIONS.includes(specialization)) {
      throw new ConflictError(`Invalid specialization`);
    }
  }

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password,
    role: userRole,
    avatar: '',
    phone: phone || '',
    location: 'Maroc',
    specialization: userRole === 'provider' ? specialization || 'general' : '',
  });

  let provider = null;
  if (userRole === 'provider') {
    provider = await Provider.create({
      user: user._id,
      profession: specialization || 'general',
      bio: bio || '',
      hourlyRate: 50,
      rating: 0,
      reviewCount: 0,
      jobsDone: 0,
      experience: '1 Year Exp.',
      verified: false,
      serviceArea: '10km radius',
      location: 'Maroc',
    });
  }

  const accessToken = generateToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id);

  return {
    user: formatUser(user, provider),
    accessToken,
    refreshToken
  };
};

const login = async (credentials) => {
  const { email, password } = credentials;

  const user = await User.findOne({ email }).select('+password');
  
  if (!user) {
    throw new UnauthorizedError('Invalid credentials');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new UnauthorizedError('Invalid credentials');
  }

  const provider = await Provider.findOne({ user: user._id });

  const accessToken = generateToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id);

  return {
    user: formatUser(user, provider),
    accessToken,
    refreshToken
  };
};

const getMe = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  const provider = await Provider.findOne({ user: user._id });

  return formatUser(user, provider);
};

const updateProfile = async (userId, updateData) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  const userUpdate = {};
  if (updateData.name) userUpdate.name = updateData.name;
  if (updateData.phone !== undefined) userUpdate.phone = updateData.phone;
  if (updateData.location !== undefined) userUpdate.location = updateData.location;
  if (updateData.avatar !== undefined) userUpdate.avatar = updateData.avatar;
  if (updateData.bio !== undefined) userUpdate.bio = updateData.bio;
  if (updateData.city !== undefined) userUpdate.city = updateData.city;

  if (Object.keys(userUpdate).length > 0) {
    await User.findByIdAndUpdate(userId, userUpdate);
  }

  if (user.role === 'provider') {
    const providerUpdate = {};
    if (updateData.bio !== undefined) providerUpdate.bio = updateData.bio;
    if (updateData.specialization) {
      if (!SERVICE_SPECIALIZATIONS.includes(updateData.specialization)) {
        throw new ConflictError('Invalid specialization');
      }
      providerUpdate.profession = updateData.specialization;
      await User.findByIdAndUpdate(userId, { specialization: updateData.specialization });
    }
    if (updateData.hourlyRate !== undefined) {
      providerUpdate.hourlyRate = parseFloat(updateData.hourlyRate);
    }
    if (updateData.city !== undefined) providerUpdate.city = updateData.city;

    if (Object.keys(providerUpdate).length > 0) {
      await Provider.findOneAndUpdate({ user: userId }, providerUpdate);
    }
  }

  const updatedUser = await User.findById(userId);
  const provider = await Provider.findOne({ user: userId });

  return formatUser(updatedUser, provider);
};

const refreshAccessToken = async (refreshToken) => {
  try {
    const decoded = verifyRefreshToken(refreshToken);
    const user = await User.findById(decoded.id);
    
    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    const accessToken = generateToken(user._id, user.role);
    return { accessToken };
  } catch (error) {
    throw new UnauthorizedError('Invalid refresh token');
  }
};

const getSpecializations = () => {
  return SERVICE_SPECIALIZATIONS.map(s => ({
    value: s,
    label: s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' ')
  }));
};

module.exports = {
  signup,
  login,
  getMe,
  updateProfile,
  refreshAccessToken,
  getSpecializations,
  SERVICE_SPECIALIZATIONS
};