# BRICOULY - Service Marketplace Architecture

## Project Overview

This is a MERN stack (MongoDB, Express, React, Node.js) service marketplace platform connecting clients with service providers.

## User Roles

### 1. Client
- Can create service posts/requests
- Can search for providers
- Can leave reviews for providers
- Can accept/reject provider applications
- Cannot apply to posts as a provider

### 2. Provider
- Has a `specialization` field (e.g., electrician, plumber, carpenter)
- Can only see posts matching their specialization
- Can apply to open posts
- Can be reviewed by clients
- Cannot create reviews

## Core Data Models

### User Model
```javascript
{
  name: String,
  email: String (unique),
  password: String,
  role: 'client' | 'provider' | 'admin',
  specialization: String, // Only for providers
  avatar: String,
  phone: String,
  location: String,
  city: String,
  bio: String,
  hourlyRate: Number,
  isVerified: Boolean,
  createdAt: Date
}
```

### ServiceRequest Model (Posts)
```javascript
{
  clientId: ObjectId (ref: User),
  title: String,
  description: String,
  serviceType: String, // plumber, electrician, etc.
  status: 'open' | 'in_progress' | 'completed',
  location: String,
  budget: Number,
  preferredDate: Date,
  preferredTime: String,
  applications: [{
    providerId: ObjectId (ref: User),
    status: 'pending' | 'accepted' | 'rejected',
    message: String,
    proposedPrice: Number,
    createdAt: Date
  }],
  acceptedProviderId: ObjectId (ref: User),
  completedAt: Date,
  createdAt: Date
}
```

### Review Model
```javascript
{
  clientId: ObjectId (ref: User),
  providerId: ObjectId (ref: User),
  serviceRequestId: ObjectId (ref: ServiceRequest),
  rating: Number (1-5),
  punctuality: Number (1-5),
  professionalism: Number (1-5),
  comment: String,
  createdAt: Date
}
```

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register user (client/provider) |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/profile` | Update profile |

### Service Requests (Posts)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/service-requests/all` | Get all requests (public) |
| GET | `/api/service-requests/provider` | Get provider's matching requests |
| GET | `/api/service-requests/client` | Get client's own requests |
| GET | `/api/service-requests/:id` | Get single request |
| POST | `/api/service-requests` | Create request (client only) |
| PUT | `/api/service-requests/:id` | Update request (owner only) |
| DELETE | `/api/service-requests/:id` | Delete request (owner only) |
| POST | `/api/service-requests/:id/apply` | Apply to request (provider only) |
| DELETE | `/api/service-requests/:id/apply` | Cancel application (provider only) |
| PUT | `/api/service-requests/:id/applications/:appId/status` | Accept/reject (client only) |
| PUT | `/api/service-requests/:id/complete` | Mark complete |

### Providers
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/providers` | Get all providers |
| GET | `/api/providers/search?service=plumber` | Search by specialization |
| GET | `/api/providers/:id` | Get provider details |
| GET | `/api/providers/:id/reviews` | Get provider reviews |

### Reviews
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reviews/:providerId` | Get reviews for provider |
| POST | `/api/reviews` | Create review (client only) |
| PUT | `/api/reviews/:reviewId` | Update review |
| DELETE | `/api/reviews/:reviewId` | Delete review |

## Business Rules

### 1. Service Requests
- Only clients can create service requests
- Service type determines which providers can see the post
- Posts can only be updated/deleted by their owner
- Posts can only be deleted if status is 'open'

### 2. Applications
- Providers can only apply to posts matching their specialization
- Providers cannot apply to their own posts
- Providers cannot apply twice to the same post
- Only the client who created the post can accept/reject applications
- Accepting an application changes status to 'in_progress' and rejects others

### 3. Reviews
- Only clients can leave reviews
- One client can only review a provider once per service completion
- Reviews require a completed service request
- Provider's average rating is calculated automatically

### 4. Search
- Search by service type returns matching providers
- Provider search is case-insensitive

## Service Types (Specializations)

```javascript
const SERVICE_TYPES = [
  'plumber',
  'electrician',
  'painter',
  'carpenter',
  'cleaner',
  'mover',
  'hvac',
  'landscaper',
  'roofer',
  'appliance_repair',
  'general'
];
```

## Frontend Pages

### Client Pages
1. **Home** - Browse providers, search
2. **My Requests** - View/manage service requests
3. **New Request** - Create service request
4. **Provider Profile** - View provider details/reviews
5. **Messages** - Chat with providers

### Provider Pages
1. **Dashboard** - Stats, manage services, view applications
2. **Service Requests** - Browse matching requests, apply
3. **My Jobs** - Active/completed jobs
4. **Messages** - Chat with clients

## Common Issues & Solutions

### 1. JWT Token Not Stored
**Problem**: Users logged in before token implementation can't access protected routes.
**Solution**: Implement dual authentication (JWT + x-user-id header)

### 2. Provider Dashboard Not Loading
**Problem**: Frontend expects old data format.
**Solution**: Update frontend to match new API response structure.

### 3. Reviews Not Working
**Problem**: Provider search returns providers without reviews.
**Solution**: Calculate average rating when fetching providers.

## Recommended Improvements

### 1. Database Indexes
```javascript
// ServiceRequest indexes
serviceRequestSchema.index({ clientId: 1, createdAt: -1 });
serviceRequestSchema.index({ serviceType: 1, status: 1 });
serviceRequestSchema.index({ acceptedProviderId: 1 });

// Review indexes
reviewSchema.index({ clientId: 1, providerId: 1 }, { unique: true });

// Provider search
providerSchema.index({ profession: 'text', bio: 'text' });
```

### 2. Rate Limiting
Protect sensitive endpoints with rate limiting:
```javascript
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many attempts'
});
```

### 3. Input Validation
Use Joi or express-validator for request validation.

### 4. Error Handling
Create standardized error responses:
```javascript
{
  success: false,
  error: 'Error message',
  code: 'ERROR_CODE',
  details: {} // optional
}
```

### 5. Logging
Implement structured logging with Winston or Morgan.

## Testing Checklist

- [ ] Client can create service request with service type
- [ ] Provider sees only posts matching their specialization
- [ ] Provider can apply to a post
- [ ] Client can accept/reject applications
- [ ] Client can mark job as complete
- [ ] Client can leave review after completion
- [ ] Provider's average rating is calculated correctly
- [ ] Search returns providers matching the service
- [ ] Duplicate reviews are prevented
