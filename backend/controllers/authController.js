const User = require('../models/User');
const Provider = require('../models/Provider');
const Category = require('../models/Category');
const { generateToken } = require('../middleware/authMiddleware');

exports.signup = async (req, res) => {
  try {
    console.log('[signup] Request received', { body: req.body });
    const { name, email, password, role, phone, professionId, bio } = req.body;
    console.log('[signup] role:', role);
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('[signup] Email already exists:', email);
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
      role: role || 'user',
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
    
    const token = generateToken(user._id, user.role);
    const { password: _, ...userWithoutPassword } = user.toObject();
    const responseUser = { ...userWithoutPassword, id: user._id.toString() };
    
    res.json({ success: true, user: responseUser, token });
  } catch (error) {
    console.error('[signup] Error:', error.message, error.stack);
    res.status(500).json({ success: false, error: error.message });
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
      { name: updates.name, phone: updates.phone, location: updates.location, avatar: updates.avatar },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // FIXED: #10 - Guard provider profile updates by role
    if ((updates.bio || updates.profession) && user.role === 'provider') {
      await Provider.findOneAndUpdate(
        { user: user._id },
        { bio: updates.bio, profession: updates.profession }
      );
    } else if (updates.bio || updates.profession) {
      return res.status(403).json({ error: 'Only providers can update provider-specific fields (bio, profession)' });
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