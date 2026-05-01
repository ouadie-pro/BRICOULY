const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const fs = require('fs');
const http = require('http');
const { Server } = require('socket.io');

dotenv.config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.set('io', io);

const onlineUsers = new Map();

io.on('connection', (socket) => {
  socket.on('join', (userId) => {
    if (userId) {
      socket.join(`user:${userId}`);
      socket.userId = userId;
      onlineUsers.set(userId, socket.id);
      io.emit('onlineUsers', Array.from(onlineUsers.keys()));
    }
  });

  socket.on('disconnect', () => {
    if (socket.userId) {
      onlineUsers.delete(socket.userId);
      io.emit('onlineUsers', Array.from(onlineUsers.keys()));
    }
  });

  // Booking events
  socket.on('booking_created', (data) => {
    const { providerId, bookingId, service } = data;
    io.to(`user:${providerId}`).emit('new_booking_notification', {
      bookingId,
      service,
      message: 'New booking request received'
    });
  });

  socket.on('booking_confirmed', (data) => {
    const { clientId, bookingId } = data;
    io.to(`user:${clientId}`).emit('booking_status_updated', {
      bookingId,
      status: 'confirmed',
      message: 'Your booking has been confirmed'
    });
  });

  socket.on('booking_completed', (data) => {
    const { clientId, bookingId } = data;
    io.to(`user:${clientId}`).emit('booking_status_updated', {
      bookingId,
      status: 'completed',
      message: 'Service has been marked as completed'
    });
  });
});

const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Track lastActive for providers
app.use(async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production');
      if (decoded?.id) {
        const Provider = require('./models/Provider');
        Provider.findOneAndUpdate(
          { user: decoded.id },
          { lastActive: new Date() }
        ).exec().catch(() => {});
      }
    }
  } catch (_) {}
  next();
});

if (!fs.existsSync(path.join(__dirname, 'uploads'))) {
  fs.mkdirSync(path.join(__dirname, 'uploads'));
}

const Category = require('./models/Category');

let categoriesData = null;
try {
  categoriesData = require('./seed').categoriesData;
} catch (e) {
  categoriesData = [
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
}

const seedCategories = async () => {
  try {
    const count = await Category.countDocuments();
    if (count === 0 && categoriesData) {
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
app.use('/api/applications', require('./routers/application'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  console.error(`${err.name}: ${err.message}`);
  
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
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.url
  });
});

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