# Project Fix, Improvement & Completion Plan

This document provides a comprehensive plan to fix critical bugs, implement missing features, improve performance, and complete this marketplace/social platform.

---

## Phase 1: Critical Bug Fixes (Week 1)

### 1.1 Frontend - isDesktop Prop Fix
**File**: `frontend/src/App.jsx`

**Issue**: Line 59-70 passes `isDesktop` as a static prop instead of the actual value.

**Fix**:
```jsx
// BEFORE (broken)
<Route path="/home" element={<ProtectedRoute><HomeScreen isDesktop /></ProtectedRoute>} />

// AFTER (correct)
<Route path="/home" element={<ProtectedRoute><HomeScreen isDesktop={isDesktop} /></ProtectedRoute>} />
```

Apply to all routes: `/search`, `/videos`, `/user/:id`, `/provider/:id`, `/dashboard`, `/requests`, `/profile`, `/messages`, `/messages/:providerId`, `/review/:providerId`

---

### 1.2 Backend Route Mismatch - updateProfile
**Files**: `frontend/src/services/api.js` (line 86), `backend/routers/auth.js`

**Issue**: Frontend calls `/api/users/profile`, but actual endpoint is `/api/auth/profile`

**Fix** - Option A (Change frontend):
```javascript
// frontend/src/services/api.js - updateProfile
updateProfile: async (updates) => {
  return safeFetch(`${API_BASE}/auth/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': getUserId(),
    },
    body: JSON.stringify(updates),
  });
},
```

Option B (Add route alias in server.js):
```javascript
app.use('/api/users', require('./routers/user'));
// Add this alias for profile
app.put('/api/users/profile', require('./controllers/authController').updateProfile);
```

**Recommended**: Option A (fix frontend to use correct endpoint).

---

### 1.3 Avatar URL Validation
**File**: `backend/controllers/authController.js` (line 149-172)

**Issue**: Avatar can be set to arbitrary URL via `updateProfile`.

**Fix**:
```javascript
exports.uploadAvatar = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({ success: false, error: 'Invalid file type' });
    }
    
    const avatarUrl = `/uploads/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(
      userId,
      { avatar: avatarUrl },
      { new: true }
    );
    
    res.json({ success: true, filePath: avatarUrl });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

Then in `updateProfile`, remove avatar from allowed updates:
```javascript
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const { name, phone, location, bio, profession } = req.body; // Remove avatar
    
    const user = await User.findByIdAndUpdate(
      userId,
      { name, phone, location },
      { new: true }
    );
    // ... rest of code
  }
};
```

---

### 1.4 Comments Endpoint Fix
**Files**: `backend/routers/post.js`, `backend/routers/article.js`

**Issue**: Separate endpoints for posts and articles.

**Current routes**:
- Posts: `/api/posts/:id/comments` ✓
- Articles: `/api/articles/:id/comments` ✓

Frontend calls need verification - check `frontend/src/services/api.js` lines 254-267 (posts) and 328-341 (articles).

---

### 1.5 Follow System - Populate User Data
**File**: `backend/controllers/followController.js` (line 224-253)

**Issue**: `getMyFollowing` (via `/api/following`) returns populated data correctly (see lines 232-248), but frontend might be checking by ID array incorrectly.

**Frontend Fix** - `frontend/src/components/ProfileScreen.jsx` line 84-87:
```javascript
// BEFORE (incorrect - checks if id is in array of objects)
const myFollowingIds = await api.getMyFollowing();
if (Array.isArray(myFollowingIds)) {
  setIsFollowing(myFollowingIds.some((id) => String(id) === String(targetUserId)));
}

// AFTER (correct - check id property)
if (Array.isArray(myFollowingIds)) {
  setIsFollowing(myFollowingIds.some((u) => String(u.id) === String(targetUserId)));
}
```

---

### 1.6 Fake Distance - Replace Math.random()
**File**: `backend/controllers/userController.js` (line 26)

**Issue**: `distance: Math.random() * 5 + 0.5` is fake data.

**Fix** - Option A: Store location in User model and calculate real distance:
```javascript
// Add geolocation to User model
location: {
  type: { type: String, default: 'Point' },
  coordinates: [Number], // [lng, lat]
  address: String
}

// Calculate distance using MongoDB $geoNear or frontend Haversine formula
```

Option B (Quick fix): Remove fake data, return null:
```javascript
// In getProviders
distance: null, // Remove Math.random()
```

---

### 1.7 Duplicate Router Registration
**File**: `backend/server.js` (line 93)

**Issue**: Check if `/api/reviews` has duplicate registration.

**Current**:
```javascript
app.use('/api/reviews', require('./routers/review'));
```

Only one registration exists. No fix needed unless conflict with other files.

---

### 1.8 Handle Null User in Feed
**File**: `backend/controllers/postController.js` (line 10-15)

**Current code** already handles null targetUser:
```javascript
const followingData = await Promise.all(following.map(async f => {
  if (!f.targetUser) return null;
  // ...
}));
```

Ensure frontend handles "Unknown" gracefully in `HomeScreen.jsx`.

---

## Phase 2: Authentication & Security (Week 1-2)

### 2.1 JWT Authentication Implementation

**Step 1**: Install dependencies
```bash
npm install jsonwebtoken bcryptjs
```

**Step 2**: Create JWT middleware
```javascript
// backend/middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    req.user = { id: user._id.toString() };
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
};

const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
};

const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' });
};

module.exports = { auth, generateToken, generateRefreshToken, JWT_SECRET };
```

**Step 3**: Update auth controller to issue tokens
```javascript
// backend/controllers/authController.js
const { generateToken, generateRefreshToken } = require('../middleware/auth');

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email }).select('+password');
    
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
    
    const accessToken = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    
    const provider = await Provider.findOne({ user: user._id });
    const { password: _, ...userWithoutPassword } = user.toObject();
    
    res.json({
      success: true,
      user: { ...userWithoutPassword, id: user._id.toString() },
      accessToken,
      refreshToken
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.signup = async (req, res) => {
  // ... existing code ...
  // At the end, generate tokens
  const accessToken = generateToken(user._id);
  const refreshToken = generateRefreshToken(user._id);
  
  res.json({
    success: true,
    user: responseUser,
    accessToken,
    refreshToken
  });
};
```

**Step 4**: Add refresh token endpoint
```javascript
// backend/routers/auth.js
const { auth, generateToken } = require('../middleware/auth');

router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }
    
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET || 'your-secret-key-change-in-production');
    const newAccessToken = generateToken(decoded.userId);
    
    res.json({ accessToken: newAccessToken });
  } catch (error) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});
```

**Step 5**: Update protected routes to use middleware
```javascript
// backend/routers/booking.js
const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { getBookings, createBooking, updateBookingStatus, cancelBooking } = require('../controllers/bookingController');

router.use(auth); // Protect all routes

router.get('/', getBookings);
router.post('/', createBooking);
router.put('/:id', updateBookingStatus);
router.delete('/:id', cancelBooking);

module.exports = router;
```

**Step 6**: Update frontend API to use tokens
```javascript
// frontend/src/services/api.js
const getToken = () => {
  return localStorage.getItem('accessToken');
};

export const api = {
  // Auth - update all methods to use Bearer token
  getCurrentUser: async () => {
    return safeFetch(`${API_BASE}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${getToken()}`,
      },
    });
  },
  
  // Update all other methods similarly...
};
```

---

### 2.2 Password Reset Functionality

**Step 1**: Add password reset routes
```javascript
// backend/routers/auth.js
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  
  // Generate reset token (send via email in production)
  const resetToken = crypto.randomBytes(32).toString('hex');
  user.resetToken = resetToken;
  user.resetTokenExpiry = Date.now() + 3600000; // 1 hour
  await user.save();
  
  // In production: send email with reset link
  // For now: return token (development only!)
  res.json({ success: true, resetToken });
});

router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;
  
  const user = await User.findOne({
    resetToken: token,
    resetTokenExpiry: { $gt: Date.now() }
  });
  
  if (!user) {
    return res.status(400).json({ success: false, error: 'Invalid or expired token' });
  }
  
  user.password = newPassword;
  user.resetToken = undefined;
  user.resetTokenExpiry = undefined;
  await user.save();
  
  res.json({ success: true, message: 'Password reset successful' });
});
```

---

## Phase 3: Real-Time Features (Week 2)

### 3.1 Socket.IO Integration

**Step 1**: Install dependencies
```bash
npm install socket.io
```

**Step 2**: Update server.js
```javascript
// backend/server.js additions
const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // Join user's personal room
  socket.on('join', (userId) => {
    socket.join(`user:${userId}`);
    console.log(`User ${userId} joined room`);
  });
  
  // Handle typing indicator
  socket.on('typing', ({ fromUserId, toUserId }) => {
    io.to(`user:${toUserId}`).emit('userTyping', { fromUserId });
  });
  
  socket.on('stopTyping', ({ fromUserId, toUserId }) => {
    io.to(`user:${toUserId}`).emit('userStoppedTyping', { fromUserId });
  });
  
  // Handle message sent
  socket.on('sendMessage', ({ message, toUserId }) => {
    io.to(`user:${toUserId}`).emit('newMessage', message);
  });
  
  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Make io accessible in routes
app.set('io', io);

// Update mongoose.connect to use server.listen instead of app.listen
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('MongoDB Connected successfully');
    await seedCategories();
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  });
```

**Step 3**: Update message controller to emit events
```javascript
// backend/controllers/messageController.js - sendMessage function
exports.sendMessage = async (req, res) => {
  try {
    // ... existing code to save message ...
    
    // Get io from app
    const io = req.app.get('io');
    
    // Emit real-time event
    io.to(`user:${receiverId}`).emit('newMessage', {
      id: populatedMessage._id,
      conversationId: conversation._id,
      senderId: populatedMessage.sender._id,
      senderName: populatedMessage.sender.name,
      content: populatedMessage.content,
      // ... other fields
    });
    
    res.json(messageData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

**Step 4**: Frontend Socket.IO client
```javascript
// frontend/src/services/socket.js
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  auth: {
    token: localStorage.getItem('accessToken')
  }
});

export const connectSocket = (userId) => {
  if (!socket.connected) {
    socket.connect();
    socket.emit('join', userId);
  }
};

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};
```

**Step 5**: Update MessagesScreen to use Socket.IO
```javascript
// frontend/src/components/MessagesScreen.jsx
import { useEffect, useState } from 'react';
import { socket, connectSocket, disconnectSocket } from '../services/socket';

export default function MessagesScreen({ isDesktop }) {
  // ... existing state ...
  
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.id) {
      connectSocket(user.id);
      
      socket.on('newMessage', (message) => {
        setMessages(prev => [...prev, message]);
      });
      
      socket.on('userTyping', ({ fromUserId }) => {
        setTypingUser(fromUserId);
      });
    }
    
    return () => {
      socket.off('newMessage');
      socket.off('userTyping');
      disconnectSocket();
    };
  }, []);
  
  // Handle typing indicator
  const handleTyping = () => {
    socket.emit('typing', {
      fromUserId: currentUser.id,
      toUserId: providerId
    });
  };
  
  const handleStopTyping = () => {
    socket.emit('stopTyping', {
      fromUserId: currentUser.id,
      toUserId: providerId
    });
  };
  
  // Remove polling interval from useEffect
}
```

---

### 3.2 Online/Offline Presence

**Step 1**: Add presence tracking to Socket.IO
```javascript
// backend/server.js
const onlineUsers = new Map();

io.on('connection', (socket) => {
  socket.on('join', (userId) => {
    onlineUsers.set(userId, socket.id);
    io.emit('onlineUsers', Array.from(onlineUsers.keys()));
  });
  
  socket.on('disconnect', () => {
    // Find and remove userId by socket.id
    for (let [userId, sid] of onlineUsers.entries()) {
      if (sid === socket.id) {
        onlineUsers.delete(userId);
        break;
      }
    }
    io.emit('onlineUsers', Array.from(onlineUsers.keys()));
  });
});
```

**Step 2**: Frontend presence indicator
```javascript
// In MessagesScreen
const [onlineUsers, setOnlineUsers] = useState([]);

useEffect(() => {
  socket.on('onlineUsers', (users) => {
    setOnlineUsers(users);
  });
}, []);

const isOnline = onlineUsers.includes(provider?.id);
```

---

## Phase 4: Booking System (Week 2-3)

### 4.1 Connect Backend Booking with Frontend

**Step 1**: Add booking API methods
```javascript
// frontend/src/services/api.js
createBooking: async (bookingData) => {
  return safeFetch(`${API_BASE}/bookings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`,
    },
    body: JSON.stringify(bookingData),
  });
},

getBookings: async (role) => {
  return safeFetch(`${API_BASE}/bookings?role=${role || 'client'}`, {
    headers: { 'Authorization': `Bearer ${getToken()}` },
  });
},

updateBookingStatus: async (bookingId, status) => {
  return safeFetch(`${API_BASE}/bookings/${bookingId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`,
    },
    body: JSON.stringify({ status }),
  });
},

cancelBooking: async (bookingId) => {
  return safeFetch(`${API_BASE}/bookings/${bookingId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${getToken()}` },
  });
},
```

**Step 2**: Create Booking UI component
```javascript
// frontend/src/components/BookingScreen.jsx
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/api';

export default function BookingScreen({ isDesktop }) {
  const { providerId } = useParams();
  const [provider, setProvider] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [formData, setFormData] = useState({
    service: '',
    date: '',
    time: '',
    address: '',
    notes: '',
    price: 0
  });

  useEffect(() => {
    loadData();
  }, [providerId]);

  const loadData = async () => {
    const providerData = await api.getProvider(providerId);
    setProvider(providerData);
    
    const bookingsData = await api.getBookings();
    setBookings(bookingsData.bookings || []);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await api.createBooking({
      ...formData,
      provider: providerId
    });
    if (result.success) {
      setShowBookingForm(false);
      loadData();
    }
  };

  const handleStatusChange = async (bookingId, status) => {
    await api.updateBookingStatus(bookingId, status);
    loadData();
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Bookings</h2>
      
      <button 
        onClick={() => setShowBookingForm(true)}
        className="bg-primary text-white px-4 py-2 rounded-lg mb-4"
      >
        New Booking
      </button>

      {showBookingForm && (
        <form onSubmit={handleSubmit} className="bg-white p-4 rounded-lg shadow mb-4">
          <select 
            value={formData.service}
            onChange={(e) => setFormData({...formData, service: e.target.value})}
            className="w-full p-2 border rounded mb-2"
          >
            <option value="">Select Service</option>
            {provider?.services?.map(s => (
              <option key={s._id} value={s.name}>{s.name} - ${s.price}</option>
            ))}
          </select>
          
          <input 
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({...formData, date: e.target.value})}
            className="w-full p-2 border rounded mb-2"
          />
          
          <input 
            type="time"
            value={formData.time}
            onChange={(e) => setFormData({...formData, time: e.target.value})}
            className="w-full p-2 border rounded mb-2"
          />
          
          <input 
            type="text"
            placeholder="Address"
            value={formData.address}
            onChange={(e) => setFormData({...formData, address: e.target.value})}
            className="w-full p-2 border rounded mb-2"
          />
          
          <textarea 
            placeholder="Notes"
            value={formData.notes}
            onChange={(e) => setFormData({...formData, notes: e.target.value})}
            className="w-full p-2 border rounded mb-2"
          />
          
          <button type="submit" className="bg-primary text-white px-4 py-2 rounded">
            Book Now
          </button>
        </form>
      )}

      <div className="space-y-4">
        {bookings.map(booking => (
          <div key={booking._id} className="bg-white p-4 rounded-lg shadow">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold">{booking.service}</h3>
                <p className="text-sm text-slate-500">
                  {new Date(booking.date).toLocaleDateString()} at {booking.time}
                </p>
                <p className="text-sm">{booking.address}</p>
              </div>
              <span className={`px-2 py-1 rounded text-sm ${
                booking.status === 'pending' ? 'bg-yellow-100' :
                booking.status === 'confirmed' ? 'bg-green-100' :
                booking.status === 'completed' ? 'bg-blue-100' :
                'bg-red-100'
              }`}>
                {booking.status}
              </span>
            </div>
            
            {booking.status === 'pending' && (
              <div className="mt-2 flex gap-2">
                <button 
                  onClick={() => handleStatusChange(booking._id, 'confirmed')}
                  className="bg-green-500 text-white px-3 py-1 rounded text-sm"
                >
                  Confirm
                </button>
                <button 
                  onClick={() => handleStatusChange(booking._id, 'cancelled')}
                  className="bg-red-500 text-white px-3 py-1 rounded text-sm"
                >
                  Cancel
                </button>
              </div>
            )}
            
            {booking.status === 'confirmed' && (
              <button 
                onClick={() => handleStatusChange(booking._id, 'completed')}
                className="mt-2 bg-blue-500 text-white px-3 py-1 rounded text-sm"
              >
                Mark Completed
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Step 3**: Add route in App.jsx
```javascript
import BookingScreen from './components/BookingScreen';

// In Routes:
<Route path="/bookings" element={<ProtectedRoute><BookingScreen isDesktop={isDesktop} /></ProtectedRoute>} />
<Route path="/bookings/:providerId" element={<ProtectedRoute><BookingScreen isDesktop={isDesktop} /></ProtectedRoute>} />
```

---

## Phase 5: Payment Integration (Week 3)

### 5.1 Stripe Integration

**Step 1**: Install dependencies
```bash
npm install stripe
```

**Step 2**: Create payment routes
```javascript
// backend/routers/payment.js
const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const { auth } = require('../middleware/auth');

router.post('/create-payment-intent', auth, async (req, res) => {
  try {
    const { amount, bookingId } = req.body;
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Convert to cents
      currency: 'usd',
      metadata: { bookingId }
    });
    
    res.json({ 
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(
      req.body, 
      sig, 
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    // Update booking payment status
    const Booking = require('../models/Booking');
    await Booking.findOneAndUpdate(
      { _id: paymentIntent.metadata.bookingId },
      { paymentStatus: 'paid', paymentId: paymentIntent.id }
    );
  }
  
  res.json({ received: true });
});

module.exports = router;
```

**Step 3**: Frontend payment component
```javascript
// frontend/src/components/PaymentModal.jsx
import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

function PaymentForm({ amount, onSuccess, onCancel }) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    setError(null);

    // Create payment intent on server
    const response = await fetch('/api/payments/create-payment-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      },
      body: JSON.stringify({ amount })
    });

    const { clientSecret } = await response.json();

    const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
      clientSecret,
      { payment_method: { card: elements.getElement(CardElement) } }
    );

    if (stripeError) {
      setError(stripeError.message);
      setProcessing(false);
    } else if (paymentIntent.status === 'succeeded') {
      onSuccess(paymentIntent.id);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4">
      <CardElement className="p-3 border rounded" />
      {error && <p className="text-red-500 mt-2">{error}</p>}
      <div className="flex gap-2 mt-4">
        <button 
          type="submit" 
          disabled={!stripe || processing}
          className="bg-primary text-white px-4 py-2 rounded"
        >
          {processing ? 'Processing...' : `Pay $${amount}`}
        </button>
        <button 
          type="button" 
          onClick={onCancel}
          className="bg-slate-300 px-4 py-2 rounded"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function PaymentModal({ amount, onSuccess, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 className="text-xl font-bold mb-4">Payment</h3>
        <Elements stripe={stripePromise}>
          <PaymentForm amount={amount} onSuccess={onSuccess} onCancel={onCancel} />
        </Elements>
      </div>
    </div>
  );
}
```

---

## Phase 6: Performance Optimization (Week 3-4)

### 6.1 Fix N+1 Query Problem in getProviders

**Current** (backend/controllers/userController.js lines 58-65):
```javascript
// N+1 problem - queries for each provider separately
for (let p of providersList) {
  const services = await Service.find({ provider: p.id });
  const portfolio = await Portfolio.find({ provider: p.id });
  const reviews = await Review.find({ provider: p.id });
  p.services = services;
  p.portfolio = portfolio;
  p.reviews = reviews;
}
```

**Optimized**:
```javascript
// Use Promise.all for parallel queries
exports.getProviders = async (req, res) => {
  try {
    const { profession, search, sort } = req.query;
    
    // Single query with aggregation
    let providers = await Provider.find()
      .populate('user', 'name avatar phone location email')
      .populate('category')
      .lean();
    
    // Get all IDs for batch queries
    const providerIds = providers.map(p => p._id);
    
    // Parallel batch queries
    const [services, portfolios, reviews] = await Promise.all([
      Service.find({ provider: { $in: providerIds } }).lean(),
      Portfolio.find({ provider: { $in: providerIds } }).lean(),
      Review.find({ provider: { $in: providerIds } }).lean()
    ]);
    
    // Group by provider
    const servicesByProvider = new Map();
    const portfoliosByProvider = new Map();
    const reviewsByProvider = new Map();
    
    services.forEach(s => {
      const key = s.provider.toString();
      if (!servicesByProvider.has(key)) servicesByProvider.set(key, []);
      servicesByProvider.get(key).push(s);
    });
    
    portfolios.forEach(p => {
      const key = p.provider.toString();
      if (!portfoliosByProvider.has(key)) portfoliosByProvider.set(key, []);
      portfoliosByProvider.get(key).push(p);
    });
    
    reviews.forEach(r => {
      const key = r.provider.toString();
      if (!reviewsByProvider.has(key)) reviewsByProvider.set(key, []);
      reviewsByProvider.get(key).push(r);
    });
    
    // Map results
    let providersList = providers.map(p => {
      const pid = p._id.toString();
      return {
        id: p.user._id.toString(),
        name: p.user.name,
        avatar: p.user.avatar,
        location: p.user.location,
        role: 'provider',
        profession: p.profession,
        bio: p.bio,
        hourlyRate: p.hourlyRate,
        rating: p.rating,
        distance: null,
        services: servicesByProvider.get(pid) || [],
        portfolio: portfoliosByProvider.get(pid) || [],
        reviews: reviewsByProvider.get(pid) || [],
      };
    });
    
    // Filters
    if (profession) {
      providersList = providersList.filter(p => 
        p.profession?.toLowerCase() === profession.toLowerCase()
      );
    }
    
    if (search) {
      providersList = providersList.filter(p => 
        p.name?.toLowerCase().includes(search.toLowerCase()) ||
        p.profession?.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    if (sort === 'rating') {
      providersList.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }
    
    res.json(providersList);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

---

## Phase 7: Frontend Improvements (Week 4)

### 7.1 Error Handling & Loading States

**Step 1**: Create reusable components
```javascript
// frontend/src/components/LoadingSpinner.jsx
export default function LoadingSpinner({ size = 'md' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };
  
  return (
    <div className={`${sizeClasses[size]} border-2 border-primary border-t-transparent rounded-full animate-spin`} />
  );
}

// frontend/src/components/ErrorMessage.jsx
export default function ErrorMessage({ message, onRetry }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <p className="text-red-600">{message}</p>
      {onRetry && (
        <button 
          onClick={onRetry}
          className="mt-2 text-red-500 underline"
        >
          Retry
        </button>
      )}
    </div>
  );
}

// frontend/src/components/AsyncWrapper.jsx
export default function AsyncWrapper({ loading, error, children, onRetry }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner />
      </div>
    );
  }
  
  if (error) {
    return <ErrorMessage message={error} onRetry={onRetry} />;
  }
  
  return children;
}
```

### 7.2 Search URL Persistence

**Step 1**: Update SearchScreen to read/write URL params
```javascript
// frontend/src/components/SearchScreen.jsx
import { useSearchParams } from 'react-router-dom';

export default function SearchScreen() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  
  const handleSearch = (searchQuery) => {
    setSearchParams({ q: searchQuery });
    // Trigger search...
  };
  
  // On mount, perform search if query exists
  useEffect(() => {
    if (query) {
      performSearch(query);
    }
  }, [query]);
}
```

### 7.3 Upload Progress Indicators

```javascript
// frontend/src/components/MediaUploader.jsx
export default function MediaUploader({ onUpload, accept, label }) {
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  
  const handleUpload = async (file) => {
    setUploading(true);
    setProgress(0);
    
    // Using XMLHttpRequest for progress tracking
    const xhr = new XMLHttpRequest();
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        setProgress(Math.round((e.loaded / e.total) * 100));
      }
    };
    
    xhr.onload = () => {
      setUploading(false);
      if (xhr.status === 200) {
        const result = JSON.parse(xhr.responseText);
        onUpload(result.filePath);
      }
    };
    
    const formData = new FormData();
    formData.append('file', file);
    xhr.open('POST', '/api/upload');
    xhr.send(formData);
  };
  
  return (
    <div>
      <input 
        type="file" 
        accept={accept}
        onChange={(e) => handleUpload(e.target.files[0])}
      />
      {uploading && (
        <div className="mt-2">
          <div className="h-2 bg-slate-200 rounded overflow-hidden">
            <div 
              className="h-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-slate-500">{progress}%</p>
        </div>
      )}
    </div>
  );
}
```

---

## Phase 8: Admin Panel (Week 4-5)

### 8.1 Admin Routes & Middleware

```javascript
// backend/middleware/admin.js
const User = require('../models/User');

const adminAuth = async (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'];
    const user = await User.findById(userId);
    
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { adminAuth };
```

### 8.2 Admin Controllers

```javascript
// backend/controllers/adminController.js
const User = require('../models/User');
const Provider = require('../models/Provider');

exports.getAllUsers = async (req, res) => {
  const users = await User.find().select('-password');
  res.json(users);
};

exports.approveProvider = async (req, res) => {
  const provider = await Provider.findById(req.params.id);
  provider.verified = true;
  await provider.save();
  res.json({ success: true, provider });
};

exports.deleteUser = async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ success: true });
};

exports.getStats = async (req, res) => {
  const [userCount, providerCount, bookingCount] = await Promise.all([
    User.countDocuments(),
    Provider.countDocuments(),
    require('../models/Booking').countDocuments()
  ]);
  
  res.json({ users: userCount, providers: providerCount, bookings: bookingCount });
};
```

---

## Phase 9: Broken/Incomplete Features (Week 5)

### 9.1 Provider Edit Route

```javascript
// backend/routers/provider.js
router.put('/edit', auth, async (req, res) => {
  // Update provider profile
});
```

### 9.2 OAuth Implementation (Google/Facebook)

```javascript
// backend/routers/oauth.js
const express = require('express');
const router = express.Router();
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

router.post('/google', async (req, res) => {
  const { token } = req.body;
  
  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: process.env.GOOGLE_CLIENT_ID
  });
  
  const payload = ticket.getPayload();
  // Find or create user...
});

module.exports = router;
```

---

## Summary of Priority Changes

| Priority | Task | Estimated Time |
|----------|------|----------------|
| P0 | Fix isDesktop prop | 5 min |
| P0 | Fix updateProfile route | 5 min |
| P0 | Avatar validation | 30 min |
| P0 | Follow system fix | 15 min |
| P1 | JWT Authentication | 4 hours |
| P1 | Socket.IO messaging | 6 hours |
| P1 | Booking system | 8 hours |
| P2 | Payment integration | 8 hours |
| P2 | Performance optimization | 4 hours |
| P2 | Admin panel | 8 hours |
| P3 | OAuth, password reset | 6 hours |

---

## Database Schema Updates (If Needed)

```javascript
// backend/models/User.js - additions
{
  resetToken: String,
  resetTokenExpiry: Date,
  role: { type: String, enum: ['client', 'provider', 'admin'], default: 'client' },
  location: {
    type: { type: String, default: 'Point' },
    coordinates: [Number],
    address: String
  }
}

// backend/models/Booking.js - additions
{
  paymentId: String,
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' }
}
```

---

## Testing Checklist

- [ ] Authentication flow (signup, login, logout)
- [ ] JWT token refresh
- [ ] Protected routes
- [ ] Real-time messaging
- [ ] Booking creation/management
- [ ] Payment flow
- [ ] Provider approval
- [ ] Performance under load
