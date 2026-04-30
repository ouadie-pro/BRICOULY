const User = require('../models/User');
const Provider = require('../models/Provider');
const { generateToken } = require('../middleware/authMiddleware');

const SERVICE_SPECIALIZATIONS = User.SERVICE_SPECIALIZATIONS;

exports.signup = async (req, res) => {
  try {
    const { name, email, password, role, phone, specialization, bio } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Name, email, and password are required' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
    }
    
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'Email already exists' });
    }
    
    const userRole = role === 'provider' ? 'provider' : 'client';
    
    if (userRole === 'provider' && specialization) {
      const validSpecialization = SERVICE_SPECIALIZATIONS.includes(specialization);
      if (!validSpecialization) {
        return res.status(400).json({ 
          success: false, 
          error: `Invalid specialization. Must be one of: ${SERVICE_SPECIALIZATIONS.join(', ')}` 
        });
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
    
    if (userRole === 'provider') {
      await Provider.create({
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
    
    const token = generateToken(user._id, user.role);
    
    res.status(201).json({ 
      success: true, 
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        specialization: user.specialization,
        phone: user.phone,
        location: user.location,
        avatar: user.avatar,
        bio: user.bio,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
      }, 
      token 
    });
  } catch (error) {
    console.error('[signup] Error:', error.message);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, error: 'Email already exists' });
    }
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message).join(', ');
      return res.status(400).json({ success: false, error: messages });
    }
    res.status(500).json({ success: false, error: 'Signup failed: ' + error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }
    
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
    
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
    
    const provider = await Provider.findOne({ user: user._id });
    const token = generateToken(user._id, user.role);
    
    res.json({ 
      success: true, 
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        specialization: user.specialization,
        phone: user.phone,
        location: user.location,
        avatar: user.avatar,
        bio: user.bio,
        hourlyRate: provider?.hourlyRate || 0,
        rating: provider?.rating || 0,
        verified: provider?.verified || false,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
      }, 
      token 
    });
  } catch (error) {
    console.error('[login] Error:', error.message);
    res.status(500).json({ success: false, error: 'Login failed: ' + error.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const token = authHeader.split(' ')[1];
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const provider = await Provider.findOne({ user: user._id });
    
    res.json({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      specialization: user.specialization,
      phone: user.phone,
      location: user.location,
      avatar: user.avatar,
      bio: user.bio,
      hourlyRate: provider?.hourlyRate || 0,
      rating: provider?.rating || 0,
      verified: provider?.verified || false,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    res.status(500).json({ error: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const userId = req.user.id.toString();
    
    const { name, phone, location, avatar, bio, city, specialization, hourlyRate } = req.body;
    
    const updateData = {};
    if (name) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (location !== undefined) updateData.location = location;
    if (avatar !== undefined) updateData.avatar = avatar;
    if (bio !== undefined) updateData.bio = bio;
    if (city !== undefined) updateData.city = city;
    
    if (Object.keys(updateData).length > 0) {
      await User.findByIdAndUpdate(userId, updateData);
    }
    
    if (req.user?.role === 'provider') {
      const providerUpdate = {};
      if (bio !== undefined) providerUpdate.bio = bio;
      if (specialization) {
        if (!SERVICE_SPECIALIZATIONS.includes(specialization)) {
          return res.status(400).json({ 
            success: false, 
            error: `Invalid specialization. Must be one of: ${SERVICE_SPECIALIZATIONS.join(', ')}` 
          });
        }
        providerUpdate.profession = specialization;
        await User.findByIdAndUpdate(userId, { specialization });
      }
      if (hourlyRate !== undefined) providerUpdate.hourlyRate = parseFloat(hourlyRate);
      if (city !== undefined) providerUpdate.city = city;
      
      if (Object.keys(providerUpdate).length > 0) {
        await Provider.findOneAndUpdate({ user: userId }, providerUpdate);
      }
    }
    
    const user = await User.findById(userId);
    const provider = await Provider.findOne({ user: user._id });
    
    res.json({ 
      success: true, 
      user: {
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
        verified: provider?.verified || false,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
      } 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const userId = req.user.id.toString();
    
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }
    
    const avatarUrl = `/uploads/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(
      userId,
      { avatar: avatarUrl },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ success: true, filePath: avatarUrl });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.incrementProfileView = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndUpdate(
      id,
      { $inc: { profileViews: 1 } },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ success: true, profileViews: user.profileViews });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getSpecializations = async (req, res) => {
  try {
    res.json({
      success: true,
      specializations: SERVICE_SPECIALIZATIONS.map(s => ({
        value: s,
        label: s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' ')
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
