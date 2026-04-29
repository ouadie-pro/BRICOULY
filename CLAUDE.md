# BRICOULY — Agent Context File

> **This file is the single source of truth for AI coding agents (OpenCode, Windsurf, etc.).**
> Read it entirely before touching any file. Do not assume anything not written here.

---

## 1. Project Identity

**Bricouly** is a MERN-stack service marketplace for Morocco that connects **clients** (people who need home services) with **providers** (tradespeople: plumbers, electricians, painters, etc.).

It also has social features: posts/articles, follow system, messaging, notifications, and video content.

| Layer    | Tech                                         |
|----------|----------------------------------------------|
| Backend  | Node.js + Express 5 + MongoDB + Mongoose     |
| Frontend | React 18 + Vite + TailwindCSS                |
| Auth     | JWT (Bearer) + legacy `x-user-id` header     |
| Realtime | Socket.IO (already installed, partial impl.) |
| Upload   | Multer (local disk, `/backend/uploads/`)     |

---

## 2. Repository Structure

```
ouadie-pro-bricouly/
├── backend/
│   ├── server.js              ← Entry point; Socket.IO, all routes registered here
│   ├── config/db.js           ← MongoDB connection (exports async function)
│   ├── seed.js                ← Seeds categories on startup
│   ├── middleware/
│   │   ├── authMiddleware.js  ← JWT auth; sets req.user = { id, role }
│   │   ├── rateLimiter.js
│   │   └── upload.js          ← Multer config
│   ├── models/                ← Mongoose schemas (see §4)
│   ├── controllers/           ← Business logic (see §5)
│   └── routers/               ← Express routers (see §6)
└── frontend/
    └── src/
        ├── App.jsx            ← Routes, ProtectedRoute, isDesktop detection
        ├── services/api.js    ← ALL API calls go through here (safeFetch wrapper)
        ├── components/        ← All screens/components (flat structure)
        ├── context/ToastContext.jsx
        └── utils/categoryIcons.jsx
```

---

## 3. Environment & Running

```
backend/.env (copy from .env.example)
  PORT=3001
  MONGODB_URI=mongodb://127.0.0.1:27017/bricouly
  JWT_SECRET=<secret>
  JWT_EXPIRE=30d
  FRONTEND_URL=http://localhost:5173

frontend/.env
  VITE_API_URL=http://localhost:3001
```

```bash
# Backend
cd backend && npm install && npm run dev    # nodemon server.js

# Frontend
cd frontend && npm install && npm run dev  # Vite on :5173
```

---

## 4. Data Models

### 4.1 User (`backend/models/User.js`)
```
_id, name, email, password (hashed bcrypt), role: 'client'|'provider',
specialization (provider only), avatar, phone, location (string),
city, bio, hourlyRate, isVerified, profileViews, createdAt
```

### 4.2 Provider (`backend/models/Provider.js`)
Separate document linked to User via `user` (ObjectId ref).
```
user (ref User), profession (string = specialization),
bio, rating, reviewCount, completedJobs / jobsDone,
hourlyRate, available (bool), category (ref Category), createdAt
```
> **Important**: A `provider` role user always has BOTH a `User` doc AND a `Provider` doc.
> When resolving a provider, you typically need both. Use `Provider.findOne({ user: userId })`.

### 4.3 ServiceRequest (`backend/models/ServiceRequest.js`)
```
clientId (ref User), title, description, serviceType (string),
status: 'open'|'in_progress'|'completed',
location, budget, preferredDate, preferredTime,
applications: [{ providerId, status: 'pending'|'accepted'|'rejected', message, proposedPrice, createdAt }],
acceptedProviderId (ref User), completedAt, createdAt
```

### 4.4 Booking (`backend/models/Booking.js`)
Direct booking (separate from ServiceRequest applications).
```
user (ref User = client), provider (ref Provider),
service, date, time, address, notes, price,
status: 'pending'|'confirmed'|'completed'|'cancelled', createdAt
```

### 4.5 Review (`backend/models/Review.js`)
```
clientId (ref User), provider (ref Provider), serviceRequestId (ref ServiceRequest),
rating (1-5), punctuality (1-5), professionalism (1-5), comment, createdAt
```

### 4.6 Post (`backend/models/Post.js`)
Social feed posts by any user.
```
author (ref User), content, images[], likes[], comments (embedded), createdAt
```

### 4.7 Article (`backend/models/Article.js`)
Long-form content (separate from Post).
```
author (ref User), title, content, type, images[],
likes[], comments (via ArticleComment model), createdAt
```

### 4.8 Message / Conversation
```
Conversation: participants[](ref User), lastMessage, updatedAt
Message: conversation (ref Conversation), sender (ref User),
         receiver (ref User), content, mediaUrl, type ('text'|'image'|'video'), createdAt
```

### 4.9 Follow / FollowRequest
```
Follow: follower (ref User), following (ref User), createdAt
FollowRequest: from (ref User), to (ref User), status: 'pending'|'accepted'|'rejected'
```

### 4.10 Other models
`Application`, `Category`, `Comment`, `Notification`, `Portfolio`, `Service`, `Video`

---

## 5. Authentication — CRITICAL

### Current Reality (dual-auth system)
The codebase uses **two auth mechanisms simultaneously** — do not remove either until full migration is complete:

| Mechanism | Where used | How it works |
|---|---|---|
| **JWT Bearer token** | `bookingController`, `authMiddleware.js`, `uploadAvatar` | `Authorization: Bearer <token>` → `req.user = { id, role }` |
| **`x-user-id` header** | Most other controllers | `req.headers['x-user-id']` → raw MongoDB `_id` string |

**Frontend storage:**
```javascript
localStorage.getItem('token')      // JWT token
localStorage.getItem('userId')     // raw MongoDB _id
localStorage.getItem('user')       // JSON stringified full user object
```

**`safeFetch` in `api.js`** automatically attaches both headers on every request:
```javascript
headers: {
  'Authorization': `Bearer ${token}`,
  'x-user-id': userId,
  'Content-Type': 'application/json'
}
```

> **Rule**: Never remove the `x-user-id` header from controllers that use it. Never remove JWT from controllers that depend on `req.user`. When fixing a controller, check which mechanism it expects.

### JWT token structure (decoded)
```javascript
{ id: userId, role: 'client'|'provider', iat, exp }
```
Note: field is `id` not `userId` inside the token payload.

---

## 6. API Routes Reference

All routes are prefixed with `/api`. Backend runs on `:3001`.

| Router file | Mount path |
|---|---|
| `auth.js` | `/api/auth` |
| `user.js` | `/api/users` |
| `providers.js` | `/api/providers` |
| `serviceRequest.js` | `/api/service-requests` |
| `booking.js` | `/api/bookings` |
| `review.js` | `/api/reviews` |
| `post.js` | `/api/posts` |
| `article.js` | `/api/articles` |
| `follow.js` | `/api/follow` |
| `message.js` | `/api/messages` |
| `notification.js` | `/api/notifications` |
| `service.js` | `/api/services` |
| `portfolio.js` | `/api/portfolio` |
| `video.js` | `/api/videos` |
| `category.js` | `/api/categories` |
| `application.js` | `/api/applications` |
| `profession.js` | `/api/professions` |

### Key endpoint signatures

**Auth**
```
POST /api/auth/signup      body: { name, email, password, role, specialization? }
POST /api/auth/login       body: { email, password }  → { token, user, provider? }
GET  /api/auth/me          → current user
PUT  /api/auth/profile     → update profile (name, phone, location, bio, city, hourlyRate, specialization)
POST /api/auth/avatar      multipart/form-data file → { filePath }
PATCH /api/auth/users/:id/view → increment profileViews
```

**Service Requests**
```
GET  /api/service-requests/all       → all open requests (public)
GET  /api/service-requests/client    → client's own requests
GET  /api/service-requests/provider  → requests matching provider's specialization
POST /api/service-requests           body: { title, description, serviceType, location, budget, preferredDate, preferredTime }
PUT  /api/service-requests/:id/applications/:applicationId/status  body: { status: 'accepted'|'rejected' }
PUT  /api/service-requests/:id/complete
DELETE /api/service-requests/:id/apply  (cancel own application)
```

**Bookings** (JWT required — uses `req.user`)
```
GET  /api/bookings          → role-filtered (client sees own, provider sees theirs)
POST /api/bookings          body: { provider (userId), service, date, time, address, notes, price }
PUT  /api/bookings/:id      body: { status }
DELETE /api/bookings/:id    → cancel
```

**Reviews**
```
GET  /api/reviews/can-review/:providerId  → { canReview, reason?, serviceRequestId? }
GET  /api/providers/:id/reviews
POST /api/reviews    body: { providerId, serviceRequestId, rating, punctuality, professionalism, comment }
PUT  /api/reviews/:reviewId
DELETE /api/reviews/:reviewId
```

**Messages**
```
GET  /api/messages/conversations
GET  /api/messages/:userId       → conversation with specific user
POST /api/messages               body: { receiverId, content, mediaUrl?, type? }
POST /api/messages/media         multipart → { url }
```

**Follow**
```
POST /api/follow/:targetUserId
POST /api/follow/respond         body: { requestId, action: 'accept'|'reject' }
GET  /api/follow/requests        → pending follow requests
GET  /api/follow/following       → who I follow
GET  /api/follow/status/:targetUserId
GET  /api/follow/:userId/followers
GET  /api/follow/:userId/following
```

---

## 7. Business Logic Rules (NEVER VIOLATE)

1. **Only `client` role** can: create service requests, create bookings, submit reviews, accept/reject applications.
2. **Only `provider` role** can: apply to service requests (matching their specialization only), manage services/portfolio.
3. **A provider cannot apply** to a service request whose `serviceType` doesn't match their `profession`.
4. **A provider cannot apply** to their own requests.
5. **Accepting one application** automatically rejects all other applications on the same service request and sets `status: 'in_progress'`.
6. **Reviews require**: a `completed` ServiceRequest where the reviewer is the `clientId` and the reviewee is the `acceptedProviderId`. One review per (client, provider, serviceRequest) combination.
7. **Provider stats** (rating, reviewCount, jobsDone) are recalculated live from the Review and Booking collections. Do not store them as static counters in critical paths — they may be cached in the Provider doc but must be recalculated on profile fetches.
8. **Bookings** and **ServiceRequests** are two separate flows. Bookings are direct appointments; ServiceRequests are public posts with an application workflow.
9. **Follow system**: providers can be followed; follow requests exist for private/pending cases. `getMyFollowing` returns an array of user objects (not just IDs).
10. **Socket.IO** is initialised in `server.js`. The `io` instance is accessible in controllers via `req.app.get('io')`. Rooms are named `user:{userId}`.

---

## 8. Frontend Architecture

### Routing (App.jsx)
- `ProtectedRoute` checks `localStorage.getItem('token')` and `localStorage.getItem('userId')`.
- `isDesktop` is computed in App.jsx via `window.innerWidth >= 768`.
- **Every route passes `isDesktop={isDesktop}`** (not just `isDesktop` as a boolean attribute).

### API layer (services/api.js)
- Single export object with all API methods.
- `safeFetch(url, options)` wraps fetch, auto-attaches auth headers, handles JSON parsing.
- Never call `fetch` directly from components — always use `api.*` methods.
- All methods return either `{ success: true, ...data }` or `{ success: false, error: '...' }`.

### State
- No global state manager (no Redux/Zustand). State is local to each component.
- Auth state is read directly from `localStorage` in each component when needed.
- `ToastContext` provides toast notifications app-wide.

### Key components
| Component | Role |
|---|---|
| `AuthScreen.jsx` | Login + signup, role selection |
| `WelcomeScreen.jsx` | Landing for unauthenticated users |
| `Layout.jsx` | App shell with bottom nav / sidebar |
| `ProviderDashboard.jsx` | Provider's main view: stats, bookings, services |
| `MyRequestsScreen.jsx` | Client's service request management |
| `MessagesScreen.jsx` + `ConversationList.jsx` + `MessageBubble.jsx` + `ChatInput.jsx` | Messaging UI |
| `BookingScreen.jsx` / `BookingsScreen.jsx` | Booking creation and list |
| `ReviewScreen.jsx` + `RatingModal.jsx` | Review submission |
| `SearchScreen.jsx` | Search providers |
| `VideosScreen.jsx` | Video content feed |
| `FollowersScreen.jsx` / `FollowingScreen.jsx` | Social follow lists |
| `ApplyModal.jsx` | Provider applies to a service request |

---

## 9. Known Bugs & Issues (Do Not Reintroduce)

### FIXED issues (do not revert)
- `isDesktop` was passed as bare attribute instead of `{isDesktop}` — fixed in App.jsx.
- `db.js` was incorrectly imported as an object; it exports a function — now called correctly.
- Fake `Math.random()` distance in `userController.js` replaced with real Haversine calculation (returns `null` when coordinates unavailable).

### OPEN bugs to fix (with correct approach)

**BUG-1: Profile update endpoint mismatch**
- Frontend `api.updateProfile` calls `PUT /api/users/profile` but the actual endpoint is `PUT /api/auth/profile`.
- Fix: change `api.js` line for `updateProfile` to use `/api/auth/profile`.
- Do NOT add a duplicate route in `server.js`.

**BUG-2: Follow status check uses wrong field**
- `getMyFollowing()` returns an array of user objects `[{ id, name, ... }]`.
- `ProfileScreen.jsx` was comparing against raw ID strings.
- Fix: use `myFollowingIds.some((u) => String(u.id) === String(targetUserId))`.

**BUG-3: `bookingController.js` uses `req.user` but some call paths don't pass JWT**
- The booking controller requires `req.user.id` and `req.user.role` from the JWT middleware.
- The `authMiddleware.js` must be applied to ALL booking routes.
- Never access bookings using `x-user-id` — bookings are JWT-only.

**BUG-4: `uploadAvatar` decodes JWT with field `decoded.id`**
- Payload uses `{ id: userId }` (set during login in `authController.js`).
- Ensure `decoded.id` is used, not `decoded.userId`.

**BUG-5: `serviceController.js` uses `x-user-id` for auth instead of JWT**
- Should be migrated to use `req.user` after auth middleware is applied consistently.
- For now, do NOT change — it will break existing service CRUD.

---

## 10. What You MUST NOT Modify

1. **`backend/config/db.js`** — Working. Do not touch.
2. **`backend/server.js` route registrations** — All routes are correctly mounted. Do not reorder or remove any.
3. **`backend/models/*.js`** — Schema fields are stable. Only add fields; never rename or remove existing ones.
4. **`frontend/src/services/api.js` `safeFetch` function** — The auth header injection logic is correct. Do not rewrite it.
5. **`frontend/src/utils/categoryIcons.jsx`** — Icons mapping is intentional. Do not change existing keys.
6. **Socket.IO setup in `server.js`** — Already integrated (`io`, `server`, exported). Do not reinitialise.
7. **The dual-auth approach** — Do not remove `x-user-id` from controllers that use it until explicitly instructed to migrate each one.

---

## 11. Code Style & Conventions

- **Backend**: CommonJS (`require`/`module.exports`), no TypeScript.
- **Frontend**: ES Modules (`import`/`export`), JSX, functional components with hooks only.
- **No TypeScript** anywhere in this project.
- **Error responses** always have shape: `{ success: false, error: 'string' }`.
- **Success responses** always have shape: `{ success: true, ...data }`.
- **Controller pattern**: Every controller function is `async (req, res)`, has `try/catch`, returns JSON.
- **No `console.log` spam** — some controllers have debug logs; do not add more in production paths.
- **TailwindCSS only** for styling — no custom CSS files (except `index.css` for globals).
- **No external UI libraries** — only Lucide icons (`lucide-react`) for icons.

---

## 12. Service Types / Specializations

These are the canonical values. Use exactly these strings — case-sensitive:

```
plumber, electrician, painter, carpenter, cleaner,
mover, hvac, landscaper, roofer, appliance_repair, general
```

Used in: `ServiceRequest.serviceType`, `User.specialization`, `Provider.profession`, frontend category filters.

---

## 13. Socket.IO Events Reference

| Event name | Direction | Payload |
|---|---|---|
| `join` | client→server | `userId` (string) |
| `newMessage` | server→client | `{ id, conversationId, senderId, senderName, content, mediaUrl?, type }` |
| `notification` | server→client | `{ type, title, text, fromUser }` |
| `userTyping` | server→client | `{ fromUserId }` |
| `userStoppedTyping` | server→client | `{ fromUserId }` |
| `typing` | client→server | `{ fromUserId, toUserId }` |
| `stopTyping` | client→server | `{ fromUserId, toUserId }` |
| `onlineUsers` | server→client (broadcast) | `string[]` (array of userIds) |

Rooms: `user:{userId}` — join on socket connect.

---

## 14. Prompt Template for New Issues

When I give you a new bug or feature, use this structure to respond:

```
## Task: [short title]

### Affected files
- backend/controllers/xController.js
- frontend/src/components/XScreen.jsx

### Root cause
[Explain exactly why it's broken]

### Fix
[Step-by-step, file by file, showing exact code to change with before/after]

### Do NOT touch
[List files that are adjacent but should remain unchanged]

### Test
[How to verify the fix works]
```

---

## 15. Dependency Versions (Installed)

**Backend** (`backend/package.json`):
- express ^5.2.1, mongoose ^9.2.3, jsonwebtoken ^9.0.3
- bcryptjs ^3.0.3, multer ^2.0.2, socket.io ^4.8.3
- cors ^2.8.6, dotenv ^17.3.1, express-rate-limit ^8.3.2
- express-mongo-sanitize ^2.2.0, nodemon ^3.1.0 (dev)

**Frontend** (`frontend/package.json`):
- react ^18, react-dom ^18, react-router-dom, vite
- tailwindcss, lucide-react, axios (or native fetch via safeFetch)

Do NOT install packages not already present without explicit instruction.

---

## 16. Checklist Before Any Code Change

- [ ] Have I read the relevant controller AND its router to understand which auth mechanism is in use?
- [ ] Am I touching a model schema? If so, am I only adding (not removing/renaming) fields?
- [ ] Does the endpoint I'm changing return `{ success: true/false, ... }` shape?
- [ ] If frontend, am I calling `api.*` (not raw fetch)?
- [ ] Have I checked if Socket.IO notification should be emitted for this action?
- [ ] Does my change break the dual-auth system for any path?
- [ ] Is `isDesktop` passed as `{isDesktop}` (not bare attribute) in App.jsx routes?
