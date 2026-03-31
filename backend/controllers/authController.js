const User = require('../models/User');
const Provider = require('../models/Provider');
const Category = require('../models/Category');

exports.signup = async (req, res) => {
  try {
    const { name, email, password, role, phone, professionId, bio } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'Email already exists' });
    }
    
    let category = null;
    if (professionId) {
      category = await Category.findById(professionId);
    }
    
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'client',
      avatar: '',
      phone: phone || '',
      location: '',
    });
    
    if (role === 'provider') {
      await Provider.create({
        user: user._id,
        profession: category?.name || '',
        bio: bio || '',
        hourlyRate: 50,
        rating: 0,
        reviewCount: 0,
        jobsDone: 0,
        experience: '1 Year Exp.',
        verified: false,
        serviceArea: '10km radius',
        location: 'New York, NY',
        category: category?._id,
      });
    }
    
    const { password: _, ...userWithoutPassword } = user.toObject();
    const responseUser = { ...userWithoutPassword, id: user._id.toString() };
    
    res.json({ success: true, user: responseUser });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const bcrypt = require('bcryptjs');
    const user = await User.findOne({ email }).select('+password');
    
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
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
    
    res.json({ success: true, user: responseUser });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
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
      id: user._id,
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
      { name: updates.name, phone: updates.phone, location: updates.location, avatar: updates.avatar },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (updates.bio || updates.profession) {
      await Provider.findOneAndUpdate(
        { user: user._id },
        { bio: updates.bio, profession: updates.profession }
      );
    }
    
    const { password: _, ...userWithoutPassword } = user.toObject();
    res.json({ success: true, user: { ...userWithoutPassword, id: user._id.toString() } });
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