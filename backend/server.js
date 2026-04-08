const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const multer = require('multer');
const fs = require('fs');
const rateLimit = require('express-rate-limit');
const passport = require('passport');
// NOTE: express-mongo-sanitize disabled - incompatible with Express 5
// const mongoSanitize = require('express-mongo-sanitize');
const http = require('http');
const { Server } = require('socket.io');

dotenv.config();

const app = express();
const server = http.createServer(app);
// FIXED: #15 - Add Socket.io for real-time messaging
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Make io available globally
app.set('io', io);

const PORT = process.env.PORT || 3001;

// NOTE: express-mongo-sanitize disabled - incompatible with Express 5
// FIXED: #11 - Add rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: { success: false, error: 'Too many attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(passport.initialize());

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

app.get('/api/test-db', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const state = mongoose.connection.readyState;
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    res.json({
      success: true,
      dbState: states[state] || 'unknown',
      mongoUri: process.env.MONGODB_URI ? 'set' : 'NOT SET'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

if (!fs.existsSync(path.join(__dirname, 'uploads'))) {
  fs.mkdirSync(path.join(__dirname, 'uploads'));
}

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

// FIXED: #8 - Inline /api/following route removed (now handled by routers/follow.js)

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
    // FIXED: #13 - Hide stack trace in production
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
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

const connectDB = require('./config/db');
connectDB()
  .then(async () => {
    console.log('MongoDB Connected successfully');
    await seedCategories();
    server.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('MongoDB Connection Error:', err.message);
    console.error('Full error:', err);
    if (!process.env.MONGODB_URI) {
      console.error('Please set MONGODB_URI in your .env file');
      console.error('Example: MONGODB_URI=mongodb://localhost:27017/yourdb');
    } else {
      console.error('Make sure MongoDB is running on your system');
      console.error('Run: mongod (to start MongoDB)');
    }
    process.exit(1);
  });

module.exports = { app, server, io };