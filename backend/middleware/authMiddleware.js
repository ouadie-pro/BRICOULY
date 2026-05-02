const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: "Unauthorized - No token provided" });
    }
    
    const token = authHeader.split(' ')[1];
    
    const decoded = jwt.verify(token, JWT_SECRET);
    
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized - User not found" });
    }
    
    req.user = {
      id: user._id,
      role: user.role,
      specialization: user.specialization,
      name: user.name,
      email: user.email,
    };
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: "Unauthorized - Invalid or expired token" });
    }
    return res.status(500).json({ success: false, error: 'Authentication failed', message: error.message });
  }
};

const requireClient = (req, res, next) => {
  if (req.user && req.user.role !== 'client') {
    return res.status(403).json({ 
      success: false, 
      message: "Forbidden - Only clients can perform this action" 
    });
  }
  next();
};

const requireProvider = (req, res, next) => {
  if (req.user && req.user.role !== 'provider') {
    return res.status(403).json({ 
      success: false, 
      message: "Forbidden - Only providers can perform this action" 
    });
  }
  next();
};

const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      message: "Forbidden - Admin access required" 
    });
  }
  next();
};

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `Forbidden - Required role: ${roles.join(' or ')}` 
      });
    }
    next();
  };
};

const generateToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Helper to check if user has specific role
const hasRole = (user, role) => {
  return user && user.role === role;
};

// Helper to check if user is authenticated
const isAuthenticated = (user) => {
  return user && user.id;
};

// Get user ID from request (handles both auth methods)
const getUserIdFromRequest = (req) => {
  if (req.user && req.user.id) {
    return req.user.id.toString();
  }
  return req.headers['x-user-id'];
};

// Get user role from request
const getUserRoleFromRequest = (req) => {
  if (req.user && req.user.role) {
    return req.user.role;
  }
  return null;
};

module.exports = {
  auth,
  requireClient,
  requireProvider,
  requireAdmin,
  requireRole,
  generateToken,
  JWT_SECRET,
  hasRole,
  isAuthenticated,
  getUserIdFromRequest,
  getUserRoleFromRequest
};
