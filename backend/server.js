const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const multer = require('multer');
const fs = require('fs');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const statusSymbol = status >= 500 ? '❌' : status >= 400 ? '⚠️' : '✅';
    console.log(`${statusSymbol} ${req.method} ${req.url} - ${status} (${duration}ms)`);
  });
  next();
});

app.post('/api/test', (req, res) => {
  console.log('✅ /api/test endpoint reached!');
  console.log('   Body:', req.body);
  console.log('   Headers:', req.headers);
  res.json({ success: true, message: 'Server is working!', received: req.body });
});

if (!fs.existsSync(path.join(__dirname, 'uploads'))) {
  fs.mkdirSync(path.join(__dirname, 'uploads'));
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 },
});

const Category = require('./models/Category');

const categoriesData = [
  { name: 'Plumber', icon: 'plumbing', color: '#3b82f6' },
  { name: 'Electrician', icon: 'bolt', color: '#eab308' },
  { name: 'Painter', icon: 'format_paint', color: '#ec4899' },
  { name: 'Carpenter', icon: 'carpenter', color: '#f59e0b' },
  { name: 'Home Cleaner', icon: 'cleaning_services', color: '#8b5cf6' },
  { name: 'Mover', icon: 'local_shipping', color: '#22c55e' },
  { name: 'HVAC Technician', icon: 'ac_unit', color: '#06b6d4' },
  { name: 'Landscaper', icon: 'grass', color: '#84cc16' },
  { name: 'Roofer', icon: 'roofing', color: '#dc2626' },
  { name: 'Appliance Repair', icon: 'kitchen', color: '#6366f1' },
];

const seedCategories = async () => {
  try {
    const count = await Category.countDocuments();
    if (count === 0) {
      await Category.insertMany(categoriesData);
      console.log('Categories seeded');
    }
  } catch (error) {
    console.error('Error seeding categories:', error.message);
  }
};

app.use('/api/auth', require('./routers/auth'));
app.use('/api/categories', require('./routers/category'));
app.use('/api/professions', require('./routers/profession'));
app.use('/api/providers', require('./routers/providers'));
app.use('/api/users', require('./routers/user'));
app.use('/api/services', require('./routers/service'));
app.use('/api/portfolio', require('./routers/portfolio'));
app.use('/api/posts', require('./routers/post'));
app.use('/api/videos', require('./routers/video'));
app.use('/api/articles', require('./routers/article'));
app.use('/api/reviews', require('./routers/review'));
app.use('/api/follow', require('./routers/follow'));
app.use('/api/service-requests', require('./routers/serviceRequest'));
app.use('/api/messages', require('./routers/message'));
app.use('/api/notifications', require('./routers/notification'));
app.use('/api/bookings', require('./routers/booking'));

// Alias route for getMyFollowing
app.get('/api/following', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }
    const Follow = require('./models/Follow');
    const Provider = require('./models/Provider');
    const User = require('./models/User');
    const mongoose = require('mongoose');
    
    const following = await Follow.find({ user: new mongoose.Types.ObjectId(userId) })
      .populate('targetUser', 'name avatar location role');
    
    const followingData = await Promise.all(following.map(async f => {
      if (!f.targetUser) return null;
      const provider = await Provider.findOne({ user: f.targetUser._id });
      return {
        id: f.targetUser._id.toString(),
        name: f.targetUser.name,
        avatar: f.targetUser.avatar,
        role: provider ? 'provider' : 'user',
        profession: provider?.profession || '',
        location: f.targetUser.location || '',
      };
    }));
    
    res.json(followingData.filter(Boolean));
  } catch (error) {
    console.error('Error in /api/following:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  console.error('\n==========================================');
  console.error('🔥 UNHANDLED ERROR:');
  console.error('   Route:', req.method, req.url);
  console.error('   Error name:', err.name);
  console.error('   Error message:', err.message);
  console.error('   Error code:', err.code);
  console.error('   Stack:', err.stack);
  console.error('==========================================\n');
  
  if (err.name === 'MongoServerError') {
    return res.status(500).json({
      success: false,
      error: 'Database error',
      details: err.message,
      code: err.code
    });
  }
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: err.message
    });
  }

  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ success: false, error: 'File too large', message: 'Maximum file size is 50MB' });
    }
    return res.status(400).json({ success: false, error: err.message });
  }
  
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message,
    stack: err.stack
  });
});

app.use((req, res) => {
  console.log('❌ 404 - Route not found:', req.method, req.url);
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.url
  });
});

console.log('Attempting to connect to MongoDB...');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'set' : 'NOT SET');

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('MongoDB Connected successfully');
    await seedCategories();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('MongoDB Connection Error:', err.message);
    console.error('Full error:', err);
    if (!process.env.MONGODB_URI) {
      console.error('Please set MONGODB_URI in your .env file');
    } else {
      console.error('Make sure MongoDB is running on your system');
      console.error('For local MongoDB: brew services start mongodb-community (mac) or mongod (linux/windows)');
    }
    process.exit(1);
  });

module.exports = { app, upload };