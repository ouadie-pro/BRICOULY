// backend/controllers/authController.js
const User = require('../models/User');
const Provider = require('../models/Provider');
const { generateToken } = require('../middleware/authMiddleware');
const fs = require('fs');
const path = require('path');

const SERVICE_SPECIALIZATIONS = User.SERVICE_SPECIALIZATIONS;

exports.signup = async (req, res) => {
  try {
    const { name, email, password, role, phone, specialization, bio } = req.body;
    
    // Normalize specialization: map display names to backend enum values
    const normalizeSpecialization = (raw) => {
      if (!raw) return 'general';
      const map = {
        'plumber':          'plumber',
        'electrician':      'electrician',
        'painter':          'painter',
        'carpenter':        'carpenter',
        'home cleaner':     'cleaner',
        'cleaner':          'cleaner',
        'mover':            'mover',
        'hvac technician':  'hvac',
        'hvac':             'hvac',
        'landscaper':       'landscaper',
        'roofer':           'roofer',
        'appliance repair': 'appliance_repair',
        'appliance_repair': 'appliance_repair',
        'general':          'general',
      };
      return map[raw.toLowerCase().trim()] || 'general';
    };
    const normalizedSpecialization = normalizeSpecialization(specialization);
    
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
    
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: userRole,
      avatar: '',
      phone: phone || '',
      location: 'Maroc',
      specialization: userRole === 'provider' ? normalizedSpecialization : '',
    });
    
    if (userRole === 'provider') {
      await Provider.create({
        user: user._id,
        profession: normalizedSpecialization,
        bio: bio || '',
        hourlyRate: parseFloat(req.body.hourlyRate) || 50,
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
    
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    
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
    // Check both JWT and x-user-id for compatibility
    let userId = null;
    
    if (req.user && req.user.id) {
      userId = req.user.id.toString();
    } else {
      // Fallback to x-user-id header
      userId = req.headers['x-user-id'];
    }
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const user = await User.findById(userId);
    
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
    res.status(500).json({ error: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    let userId = null;
    
    if (req.user && req.user.id) {
      userId = req.user.id.toString();
    } else {
      userId = req.headers['x-user-id'];
    }
    
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    
    const { name, phone, location, bio, city, specialization, hourlyRate } = req.body;
    
    const updateData = {};
    if (name) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (location !== undefined) updateData.location = location;
    if (bio !== undefined) updateData.bio = bio;
    if (city !== undefined) updateData.city = city;
    
    if (Object.keys(updateData).length > 0) {
      await User.findByIdAndUpdate(userId, updateData);
    }
    
    const user = await User.findById(userId);
    
    if (user.role === 'provider') {
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

// FIXED: Added file validation for avatar upload
exports.uploadAvatar = async (req, res) => {
  try {
    let userId = null;
    
    if (req.user && req.user.id) {
      userId = req.user.id.toString();
    } else {
      userId = req.headers['x-user-id'];
    }
    
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      // Delete the uploaded file if invalid
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.' 
      });
    }
    
    // Validate file size (max 5MB)
    if (req.file.size > 5 * 1024 * 1024) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ 
        success: false, 
        error: 'File too large. Maximum size is 5MB.' 
      });
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
    // Clean up uploaded file if error occurs
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
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