# BRICOULY - Project Organization Guide

## Current Project Structure

```
backend/
├── config/
│   └── db.js
├── controllers/
│   ├── applicationController.js
│   ├── articleController.js
│   ├── authController.js
│   ├── bookingController.js
│   ├── categoryController.js
│   ├── followController.js
│   ├── messageController.js
│   ├── notificationController.js
│   ├── portfolioController.js
│   ├── postController.js
│   ├── providerController.js
│   ├── reviewController.js
│   ├── serviceController.js
│   ├── serviceRequestController.js
│   ├── userController.js
│   └── videoController.js
├── middleware/
│   ├── authMiddleware.js
│   ├── rateLimiter.js
│   └── upload.js
├── models/
│   ├── Application.js
│   ├── Article.js
│   ├── ArticleComment.js
│   ├── Booking.js
│   ├── Category.js
│   ├── Comment.js
│   ├── Conversation.js
│   ├── Follow.js
│   ├── FollowRequest.js
│   ├── Message.js
│   ├── Notification.js
│   ├── Notification.js
│   ├── Portfolio.js
│   ├── Post.js
│   ├── Provider.js
│   ├── Review.js
│   ├── Service.js
│   ├── ServiceRequest.js
│   ├── User.js
│   └── Video.js
├── routers/
│   ├── application.js
│   ├── article.js
│   ├── auth.js
│   ├── booking.js
│   ├── category.js
│   ├── follow.js
│   ├── message.js
│   ├── notification.js
│   ├── portfolio.js
│   ├── post.js
│   ├── providers.js
│   ├── profession.js
│   ├── review.js
│   ├── service.js
│   ├── serviceRequest.js
│   ├── user.js
│   └── video.js
├── server.js
└── uploads/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   ├── services/
│   ├── utils/
│   ├── App.jsx
│   └── main.jsx
└── package.json
```

## Recommended Improvements

### 1. Separate Core Business Logic

Create a dedicated folder for marketplace-specific features:

```
backend/
├── features/
│   ├── auth/
│   │   ├── authController.js
│   │   ├── authMiddleware.js
│   │   └── authRoutes.js
│   ├── users/
│   │   ├── userController.js
│   │   ├── userMiddleware.js
│   │   └── userRoutes.js
│   ├── providers/
│   │   ├── providerController.js
│   │   ├── providerRoutes.js
│   │   └── providerService.js
│   ├── serviceRequests/
│   │   ├── serviceRequestController.js
│   │   ├── serviceRequestRoutes.js
│   │   └── serviceRequestService.js
│   └── reviews/
│       ├── reviewController.js
│       ├── reviewRoutes.js
│       └── reviewService.js
├── shared/
│   ├── middleware/
│   ├── validators/
│   ├── errors/
│   └── utils/
└── config/
```

### 2. Request/Response DTOs (Data Transfer Objects)

Create standardized response formats:

```javascript
// backend/shared/utils/response.js
class ApiResponse {
  static success(res, data, message = 'Success') {
    return res.json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    });
  }

  static created(res, data, message = 'Created') {
    return res.status(201).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    });
  }

  static error(res, statusCode, message, details = null) {
    return res.status(statusCode).json({
      success: false,
      error: message,
      ...(details && { details }),
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = ApiResponse;
```

### 3. Input Validation

Use Joi for validation:

```javascript
// backend/shared/validators/serviceRequest.js
const Joi = require('joi');

const createServiceRequestSchema = Joi.object({
  title: Joi.string().max(100).required(),
  description: Joi.string().max(1000).required(),
  serviceType: Joi.string().valid([
    'plumber', 'electrician', 'painter', 'carpenter',
    'cleaner', 'mover', 'hvac', 'landscaper',
    'roofer', 'appliance_repair', 'general'
  ]).required(),
  location: Joi.string().max(200),
  budget: Joi.number().min(0),
  preferredDate: Joi.date().greater('now'),
  preferredTime: Joi.string().valid(['morning', 'afternoon', 'evening', 'anytime'])
});

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message
    });
  }
  next();
};

module.exports = { createServiceRequestSchema, validate };
```

### 4. Error Handling

Create custom error classes:

```javascript
// backend/shared/errors/AppError.js
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403);
  }
}

class ValidationError extends AppError {
  constructor(message = 'Validation failed') {
    super(message, 400);
  }
}

module.exports = { AppError, NotFoundError, UnauthorizedError, ForbiddenError, ValidationError };
```

### 5. Service Layer Pattern

Move business logic to service classes:

```javascript
// backend/features/providers/providerService.js
const Provider = require('../../models/Provider');
const User = require('../../models/User');
const Review = require('../../models/Review');

class ProviderService {
  async getById(providerId) {
    const provider = await Provider.findById(providerId)
      .populate('user', 'name avatar email phone location');
    
    if (!provider) {
      throw new NotFoundError('Provider not found');
    }
    
    const stats = await this.calculateStats(provider._id);
    return { ...provider.toObject(), ...stats };
  }

  async searchByService(serviceType) {
    return Provider.find({
      profession: { $regex: serviceType, $options: 'i' },
      available: true
    })
      .populate('user', 'name avatar phone email')
      .sort({ rating: -1 });
  }

  async calculateStats(providerId) {
    const reviews = await Review.find({ provider: providerId });
    return {
      rating: reviews.length > 0 
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
        : 0,
      reviewCount: reviews.length
    };
  }
}

module.exports = new ProviderService();
```

### 6. Frontend Organization

```
frontend/src/
├── api/                    # API configuration
│   └── client.js
├── components/              # Reusable UI components
│   ├── common/             # Buttons, inputs, modals
│   ├── layout/             # Header, Footer, Sidebar
│   └── providers/          # Provider-specific components
├── features/               # Feature-based modules
│   ├── auth/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── AuthScreen.jsx
│   ├── dashboard/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── Dashboard.jsx
│   ├── providers/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── ProviderProfile.jsx
│   └── serviceRequests/
│       ├── components/
│       ├── hooks/
│       └── ServiceRequests.jsx
├── hooks/                  # Global custom hooks
├── services/               # API services
├── store/                  # State management (Zustand/Redux)
├── styles/                # Global styles
├── types/                  # TypeScript types (if using TS)
└── utils/                 # Utility functions
```

### 7. Custom Hooks for API Calls

```javascript
// frontend/src/hooks/useServiceRequests.js
import { useState, useEffect } from 'react';
import { api } from '../services/api';

export function useServiceRequests(params = {}) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const result = await api.getServiceRequests(params);
      if (result.success) {
        setRequests(result.requests || []);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  return { requests, loading, error, refetch: fetchRequests };
}
```

### 8. Environment Configuration

Create environment-specific configs:

```javascript
// backend/config/index.js
const config = {
  development: {
    env: 'development',
    port: process.env.PORT || 3001,
    mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/bricouly_dev',
    jwtSecret: process.env.JWT_SECRET || 'dev-secret',
    jwtExpire: '7d'
  },
  production: {
    env: 'production',
    port: process.env.PORT || 8080,
    mongodbUri: process.env.MONGODB_URI,
    jwtSecret: process.env.JWT_SECRET,
    jwtExpire: '7d'
  }
};

module.exports = config[process.env.NODE_ENV || 'development'];
```

## Testing Strategy

### 1. Backend Tests (Jest)

```javascript
// backend/tests/serviceRequest.test.js
describe('ServiceRequest API', () => {
  describe('GET /api/service-requests/provider', () => {
    it('should only return requests matching provider specialization', async () => {
      // Test implementation
    });
    
    it('should reject non-provider users', async () => {
      // Test implementation
    });
  });
});
```

### 2. Frontend Tests (React Testing Library)

```javascript
// frontend/src/features/serviceRequests/__tests__/ServiceRequestCard.test.jsx
describe('ServiceRequestCard', () => {
  it('should display service request details', () => {
    render(<ServiceRequestCard request={mockRequest} />);
    expect(screen.getByText(mockRequest.title)).toBeInTheDocument();
  });
});
```

## Security Checklist

- [ ] Input validation on all endpoints
- [ ] Rate limiting on auth endpoints
- [ ] JWT token expiration
- [ ] CORS configuration
- [ ] Helmet.js for security headers
- [ ] SQL/NoSQL injection prevention
- [ ] XSS protection
- [ ] File upload validation
- [ ] Role-based access control
- [ ] Sensitive data encryption

## Performance Optimizations

1. **Database**
   - Index frequently queried fields
   - Use pagination for large datasets
   - Implement caching (Redis)

2. **API**
   - Response compression
   - Batch similar requests
   - Use ETag for caching

3. **Frontend**
   - Code splitting
   - Lazy loading
   - Image optimization
   - Service worker for offline support
