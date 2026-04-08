const User = require('../models/User');
const Provider = require('../models/Provider');
const Category = require('../models/Category');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

const generateToken = (userId, role) => {
  return jwt.sign({ id: userId, role }, JWT_SECRET, { expiresIn: '7d' });
};

exports.signup = async (req, res) => {
  try {
    const { name, email, password, role, phone, professionId, bio } = req.body;
    
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
    
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: role === 'provider' ? 'provider' : 'user',
      avatar: '',
      phone: phone || '',
      location: 'Maroc',
    });
    
    if (role === 'provider') {
      let categoryName = 'General Services';
      if (professionId) {
        const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(professionId);
        if (isValidObjectId) {
          const category = await Category.findById(professionId);
          if (category) categoryName = category.name;
        }
      }
      
      await Provider.create({
        user: user._id,
        profession: categoryName,
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
    const { password: _, ...userWithoutPassword } = user.toObject();
    const responseUser = { ...userWithoutPassword, id: user._id.toString() };
    
    res.json({ success: true, user: responseUser, token });
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
    console.log('[login] Request received', { body: { email: req.body.email } });
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }
    
    const user = await User.findOne({ email }).select('+password');
    console.log('[login] User found:', user ? user.email : null);
    
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
    
    const isMatch = await user.comparePassword(password);
    console.log('[login] Password match:', isMatch);
    
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
    
    const provider = await Provider.findOne({ user: user._id });
    const token = generateToken(user._id, user.role);
    
    const { password: _, ...userWithoutPassword } = user.toObject();
    const responseUser = { 
      ...userWithoutPassword, 
      id: user._id.toString(),
      profession: provider?.profession || '',
      bio: provider?.bio || '',
      rating: provider?.rating || 0,
      verified: provider?.verified || false,
    };
    
    res.json({ success: true, user: responseUser, token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: 'Login failed: ' + error.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    const provider = await Provider.findOne({ user: user._id });
    
    const { password: _, ...userWithoutPassword } = user.toObject();
    const responseUser = { 
      ...userWithoutPassword, 
      id: user._id.toString(),
      profession: provider?.profession || '',
      bio: provider?.bio || '',
      rating: provider?.rating || 0,
      verified: provider?.verified || false,
    };
    
    res.json(responseUser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const updates = req.body;
    
    const user = await User.findByIdAndUpdate(
      userId,
      { 
        name: updates.name, 
        phone: updates.phone, 
        location: updates.location, 
        avatar: updates.avatar,
        bio: updates.bio,
        city: updates.city,
      },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Update provider-specific fields
    if (user.role === 'provider') {
      const providerUpdate = {};
      if (updates.bio !== undefined) providerUpdate.bio = updates.bio;
      if (updates.profession !== undefined) providerUpdate.profession = updates.profession;
      if (updates.hourlyRate !== undefined) providerUpdate.hourlyRate = parseFloat(updates.hourlyRate);
      if (updates.serviceArea !== undefined) providerUpdate.serviceArea = updates.serviceArea;
      if (updates.city !== undefined) providerUpdate.city = updates.city;
      
      if (Object.keys(providerUpdate).length > 0) {
        await Provider.findOneAndUpdate(
          { user: user._id },
          providerUpdate
        );
      }
    }
    
    const provider = await Provider.findOne({ user: user._id });
    
    const { password: _, ...userWithoutPassword } = user.toObject();
    res.json({ 
      success: true, 
      user: { 
        ...userWithoutPassword, 
        id: user._id.toString(),
        profession: provider?.profession || '',
        bio: provider?.bio || user.bio || '',
        hourlyRate: provider?.hourlyRate || 0,
        city: provider?.city || user.city || '',
        rating: provider?.rating || 0,
        verified: provider?.verified || false,
      } 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.uploadAvatar = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    
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