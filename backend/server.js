const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Multer setup for file uploads
const multer = require('multer');
const fs = require('fs');

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
  limits: { fileSize: 50 * 1024 * 1024 },
});

// Professions/Categories
const professions = [
  { id: 1, name: 'Plumber', icon: 'plumbing', color: '#3b82f6' },
  { id: 2, name: 'Electrician', icon: 'bolt', color: '#eab308' },
  { id: 3, name: 'Painter', icon: 'format_paint', color: '#ec4899' },
  { id: 4, name: 'Carpenter', icon: 'carpenter', color: '#f59e0b' },
  { id: 5, name: 'Home Cleaner', icon: 'cleaning_services', color: '#8b5cf6' },
  { id: 6, name: 'Mover', icon: 'local_shipping', color: '#22c55e' },
  { id: 7, name: 'HVAC Technician', icon: 'ac_unit', color: '#06b6d4' },
  { id: 8, name: 'Landscaper', icon: 'grass', color: '#84cc16' },
  { id: 9, name: 'Roofer', icon: 'roofing', color: '#dc2626' },
  { id: 10, name: 'Appliance Repair', icon: 'kitchen', color: '#6366f1' },
];

let professionIdCounter = professions.length + 1;

// Users Database
const users = [
  {
    id: 1,
    name: 'Alex Johnson',
    email: 'alex@example.com',
    password: 'password123',
    avatar: null,
    role: 'client',
    phone: '+1 234 567 8900',
    address: '123 Main St, New York, NY',
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 2,
    name: 'John Doe',
    email: 'john@example.com',
    password: 'password123',
    avatar: null,
    role: 'provider',
    professionId: 1,
    profession: 'Plumber',
    bio: 'Reliable and experienced plumber specializing in residential repairs and installations. I pride myself on quick response times, transparent pricing, and quality workmanship.',
    experience: '8 Years Exp.',
    location: 'Brooklyn, NY',
    serviceArea: '15km radius',
    verified: true,
    rating: 4.8,
    reviewCount: 124,
    jobsDone: 450,
    createdAt: '2024-01-10T10:00:00Z',
  },
  {
    id: 3,
    name: 'Sarah Smith',
    email: 'sarah@example.com',
    password: 'password123',
    avatar: null,
    role: 'provider',
    professionId: 2,
    profession: 'Electrician',
    bio: 'Certified electrician with 10+ years of experience. Specializing in residential and commercial electrical work.',
    experience: '10 Years Exp.',
    location: 'Manhattan, NY',
    serviceArea: '20km radius',
    verified: true,
    rating: 4.9,
    reviewCount: 89,
    jobsDone: 320,
    createdAt: '2024-02-01T10:00:00Z',
  },
  {
    id: 4,
    name: 'Mike Ross',
    email: 'mike@example.com',
    password: 'password123',
    avatar: null,
    role: 'provider',
    professionId: 3,
    profession: 'Painter',
    bio: 'Professional painter specializing in interior and exterior painting. Quality work at fair prices.',
    experience: '5 Years Exp.',
    location: 'Queens, NY',
    serviceArea: '10km radius',
    verified: false,
    rating: 4.7,
    reviewCount: 56,
    jobsDone: 180,
    createdAt: '2024-02-15T10:00:00Z',
  },
];

// Provider Services
const services = [
  {
    id: 1,
    providerId: 2,
    name: 'Pipe Repair',
    description: 'Fix leaky pipes and pipe replacements',
    price: 50,
    category: 'plumbing',
  },
  {
    id: 2,
    providerId: 2,
    name: 'Water Heater Installation',
    description: 'Install and repair water heaters',
    price: 150,
    category: 'plumbing',
  },
  {
    id: 3,
    providerId: 2,
    name: 'Drain Cleaning',
    description: 'Professional drain cleaning services',
    price: 75,
    category: 'plumbing',
  },
  {
    id: 4,
    providerId: 3,
    name: 'Electrical Wiring',
    description: 'Complete electrical wiring solutions',
    price: 80,
    category: 'electrical',
  },
  {
    id: 5,
    providerId: 3,
    name: 'Switch & Outlet Installation',
    description: 'Install switches, outlets, and fixtures',
    price: 40,
    category: 'electrical',
  },
  {
    id: 6,
    providerId: 4,
    name: 'Interior Painting',
    description: 'Professional interior painting services',
    price: 35,
    category: 'painting',
  },
];

// Portfolio/Work Photos
const portfolios = [
  {
    id: 1,
    providerId: 2,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBAYxHEmX7ceP2j44nnPeJefxrCkFNwNK5BbA1L1fYBttFRjs17MEjJ9t-wBWSqfD4gXx6uZpQXO5EM-Pp1Hv1Kv-rG1ldSme0G_1IoDS9LVu6IQKPiL1HxAp7A4gqmAk5nz-UbQ8IusHcpCX37KgMeXsZoynf4qcvgczOjfjr4nOYnVOb8rYP96HWadFsSH7gQ6Ofyn8j-szZdsHwOZy_Rtp-iRoCxxJWGt939kS3t_jNZVr_HDcJ33GdhotY7dYd5c8Ta01-TeKc',
    caption: 'Complete bathroom pipe renovation',
    createdAt: '2026-02-20T10:00:00Z',
  },
  {
    id: 2,
    providerId: 2,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAIsO1XU-VvZ2ibKbxfPnai3sM9XXi0S-vfmBo-tRfSHVoUb2LKGdXCDGTvZol0W1HdWcjWXHZiONA20Babxfs64hf3t72ADgM7YgQQ8zh3aG1ZoiOQBxK4gB5GLkvO5PbMwAvqOLt5NKUNp287_DkXsCC69NbCfSOp3XW2EVnqWv4IvvA5L-WWYWnQeGKU4z4WviIZrfZTjS47LlMR8vAZnUt-mkyUS5Cl_b2d9jn8-_hbIj16arJcReceb8qR9pQNLCZEj0etVtY',
    caption: 'Kitchen sink installation',
    createdAt: '2026-02-15T10:00:00Z',
  },
  {
    id: 3,
    providerId: 3,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDi8rWEn7JXFV1f3EdsW2Pr0thlOAcF4XIDFVpC73pBTA6Ca9WCyTrk-cQgzQONQA9o2RtsPskzNi8_dxWGun48iizf9OPVS-igo1Iffvwd7W-PW1A5Uug7-ksoIs-5J30lQNjePqLmkpwd0bdIR0hbgQP_SIvOKM5b1UcD5BSTq_4li3OyQucgwFd2Vd6QxikSSlrVgiWE9KXgzay29BhV12eqJFCPjYdKvDAh4NqC6-TZnZYQurIXMF7EcvBya-1h7xqcKeQVdwg',
    caption: 'Modern lighting installation',
    createdAt: '2026-02-18T10:00:00Z',
  },
];

// Posts for home page
const posts = [
  {
    id: 1,
    authorId: 2,
    authorName: 'John Doe',
    authorAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBbEun0wuS1a1YIMlnQrJqPXhtDY5uCMHrrw3MjQWIIACEi0UX9t7iRsPdf5Odg8v7QBZveVJbdvrbJ_c7ZfMd7TIe67prcE7z1Az3flEXT0WGbFhv43-euJEF9yp3vUdFrLRrHsQGbLmhABa-1PlqahwDCKoRSihEhtwZb8iYY4x7uDmLe3K3LDhFCrfUTc037DzxY58seS9Mmq5lBConLMW3ZUcRdhkIvjw5oCQ3sIujLtACmitspcgj-aydmpTdLoyTOAnaxoeU',
    content: '🎉 New Year Special! Get 20% off on all plumbing services this month. Book now and save!',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBAYxHEmX7ceP2j44nnPeJefxrCkFNwNK5BbA1L1fYBttFRjs17MEjJ9t-wBWSqfD4gXx6uZpQXO5EM-Pp1Hv1Kv-rG1ldSme0G_1IoDS9LVu6IQKPiL1HxAp7A4gqmAk5nz-UbQ8IusHcpCX37KgMeXsZoynf4qcvgczOjfjr4nOYnVOb8rYP96HWadFsSH7gQ6Ofyn8j-szZdsHwOZy_Rtp-iRoCxxJWGt939kS3t_jNZVr_HDcJ33GdhotY7dYd5c8Ta01-TeKc',
    likes: 24,
    comments: 5,
    createdAt: '2026-02-25T10:00:00Z',
    type: 'promo',
  },
  {
    id: 2,
    authorId: 2,
    authorName: 'John Doe',
    authorAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBbEun0wuS1a1YIMlnQrJqPXhtDY5uCMHrrw3MjQWIIACEi0UX9t7iRsPdf5Odg8v7QBZveVJbdvrbJ_c7ZfMd7TIe67prcE7z1Az3flEXT0WGbFhv43-euJEF9yp3vUdFrLRrHsQGbLmhABa-1PlqahwDCKoRSihEhtwZb8iYY4x7uDmLe3K3LDhFCrfUTc037DzxY58seS9Mmq5lBConLMW3ZUcRdhkIvjw5oCQ3sIujLtACmitspcgj-aydmpTdLoyTOAnaxoeU',
    content: '🛠️ Quick tip: Don\'t wait for small leaks to become big problems. Early detection saves money! Contact me for a free inspection.',
    image: null,
    likes: 18,
    comments: 2,
    createdAt: '2026-02-24T14:30:00Z',
    type: 'tip',
  },
  {
    id: 3,
    authorId: 3,
    authorName: 'Sarah Smith',
    authorAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDi8rWEn7JXFV1f3EdsW2Pr0thlOAcF4XIDFVpC73pBTA6Ca9WCyTrk-cQgzQONQA9o2RtsPskzNi8_dxWGun48iizf9OPVS-igo1Iffvwd7W-PW1A5Uug7-ksoIs-5J30lQNjePqLmkpwd0bdIR0hbgQP_SIvOKM5b1UcD5BSTq_4li3OyQucgwFd2Vd6QxikSSlrVgiWE9KXgzay29BhV12eqJFCPjYdKvDAh4NqC6-TZnZYQurIXMF7EcvBya-1h7xqcKeQVdwg',
    content: '⚡ Just completed a full rewiring project in Manhattan. Safety is our top priority!',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDi8rWEn7JXFV1f3EdsW2Pr0thlOAcF4XIDFVpC73pBTA6Ca9WCyTrk-cQgzQONQA9o2RtsPskzNi8_dxWGun48iizf9OPVS-igo1Iffvwd7W-PW1A5Uug7-ksoIs-5J30lQNjePqLmkpwd0bdIR0hbgQP_SIvOKM5b1UcD5BSTq_4li3OyQucgwFd2Vd6QxikSSlrVgiWE9KXgzay29BhV12eqJFCPjYdKvDAh4NqC6-TZnZYQurIXMF7EcvBya-1h7xqcKeQVdwg',
    likes: 32,
    comments: 8,
    createdAt: '2026-02-23T10:00:00Z',
    type: 'work',
  },
];

// Service Requests
const serviceRequests = [
  {
    id: 1,
    clientId: 1,
    providerId: 2,
    serviceName: 'Pipe Repair',
    description: 'Kitchen sink pipe is leaking',
    status: 'pending',
    createdAt: '2026-02-26T09:00:00Z',
  },
];

// Reviews/Ratings
const reviews = [
  {
    id: 1,
    providerId: 2,
    clientId: 1,
    clientName: 'Alex Johnson',
    clientAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBUJIOG9G-58r7EKqhdutYCCf6PGxFa9J3i_xjisTVTzBs1VdEp463KDXWOgCnuPF47kVClvUTuWFkqbpsE_Nf4cdPqmcfsyoHArd_-Ge39dTlJn5kFuphsIjdewe7vh48txl9W5n923xjPEK3Bbokn1UY1kAPqKgGjpQrO4imJ3Oi0sjIBF_RRyZh4kiq6ouOczH9Hpxo4VZqPZ7P1qEOjhUVImlJZU5oYeXp1LyJ_uzs-p64sMrvMT75QRRcVQavaw-EEWpr8BeU',
    rating: 5,
    comment: 'John did an amazing job fixing our kitchen sink. He arrived on time, was very professional, and cleaned up afterwards.',
    createdAt: '2026-02-24T10:00:00Z',
  },
  {
    id: 2,
    providerId: 2,
    clientId: 1,
    clientName: 'Michael Ross',
    clientAvatar: '',
    rating: 4,
    comment: 'Great service overall, but arrived slightly later than expected due to traffic. Work quality was excellent though.',
    createdAt: '2026-02-17T10:00:00Z',
  },
];

// Follows
const follows = [];
const followRequests = [];

// Messages
const messages = [
  {
    id: 1,
    senderId: 1,
    receiverId: 2,
    text: 'Hi, are you available to fix a leak today?',
    time: '10:30 AM',
    read: true,
    createdAt: '2026-02-26T10:30:00Z',
  },
  {
    id: 2,
    senderId: 2,
    receiverId: 1,
    text: 'Yes, I can be there by 2 PM.',
    time: '10:32 AM',
    read: true,
    createdAt: '2026-02-26T10:32:00Z',
  },
  {
    id: 3,
    senderId: 1,
    receiverId: 2,
    text: 'Great, see you then.',
    time: '10:34 AM',
    read: true,
    createdAt: '2026-02-26T10:34:00Z',
  },
];

// Notifications
const notifications = [
  {
    id: 1,
    userId: 1,
    type: 'message',
    title: 'New message from John Doe',
    text: 'Yes, I can be there by 2 PM.',
    read: false,
    createdAt: '2026-02-26T10:32:00Z',
  },
];

// Helper functions
const getProvidersFromUsers = () => {
  return users.filter(u => u.role === 'provider').map(u => ({
    ...u,
    hourlyRate: services.filter(s => s.providerId === u.id)[0]?.price || 50,
    distance: Math.random() * 5 + 0.5,
    services: services.filter(s => s.providerId === u.id),
    portfolio: portfolios.filter(p => p.providerId === u.id),
    reviews: reviews.filter(r => r.providerId === u.id),
  }));
};

// ============ AUTH ROUTES ============

app.post('/api/auth/signup', (req, res) => {
  const { name, email, password, role, phone, professionId, bio } = req.body;
  
  if (users.find(u => u.email === email)) {
    res.status(400).json({ success: false, error: 'Email already exists' });
    return;
  }
  
  const profession = professions.find(p => p.id === parseInt(professionId));
  
  const newUser = {
    id: users.length + 1,
    name,
    email,
    password,
    role: role || 'client',
    avatar: null,
    phone: phone || '',
    address: '',
    professionId: professionId ? parseInt(professionId) : null,
    profession: role === 'provider' ? (profession?.name || '') : '',
    bio: bio || '',
    verified: role === 'provider' ? false : undefined,
    rating: role === 'provider' ? 0 : undefined,
    reviewCount: 0,
    jobsDone: 0,
    createdAt: new Date().toISOString(),
  };
  
  users.push(newUser);
  
  const { password: _, ...userWithoutPassword } = newUser;
  res.json({ success: true, user: userWithoutPassword });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email && u.password === password);
  
  if (user) {
    const { password: _, ...userWithoutPassword } = user;
    res.json({ success: true, user: userWithoutPassword });
  } else {
    res.status(401).json({ success: false, error: 'Invalid credentials' });
  }
});

app.get('/api/auth/me', (req, res) => {
  const userId = parseInt(req.headers['x-user-id']);
  const user = users.find(u => u.id === userId);
  
  if (user) {
    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } else {
    res.status(401).json({ error: 'User not found' });
  }
});

app.put('/api/users/profile', (req, res) => {
  const userId = parseInt(req.headers['x-user-id']);
  console.log('Profile update - userId:', userId, 'updates:', req.body);
  
  const updates = req.body;
  
  const userIndex = users.findIndex(u => u.id === userId);
  if (userIndex === -1) {
    console.log('User not found');
    res.status(404).json({ error: 'User not found' });
    return;
  }
  
  users[userIndex] = { ...users[userIndex], ...updates };
  console.log('Updated user:', users[userIndex]);
  const { password: _, ...userWithoutPassword } = users[userIndex];
  res.json({ success: true, user: userWithoutPassword });
});

app.post('/api/users/avatar', upload.single('file'), (req, res) => {
  const userId = parseInt(req.headers['x-user-id']);
  console.log('Avatar upload - userId:', userId, 'type:', typeof userId);
  
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No file uploaded' });
  }
  
  console.log('Uploaded file:', req.file);
  console.log('Users array:', users.map(u => ({ id: u.id, name: u.name })));
  
  const userIndex = users.findIndex(u => u.id === userId);
  console.log('User index:', userIndex);
  
  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  const avatarUrl = `/uploads/${req.file.filename}`;
  users[userIndex].avatar = avatarUrl;
  console.log('Updated user avatar:', users[userIndex].avatar);
  
  res.json({ success: true, filePath: avatarUrl });
});

// ============ PROFESSIONS ROUTES ============

app.get('/api/professions', (req, res) => {
  res.json(professions);
});

app.post('/api/professions', (req, res) => {
  const { name, icon, color } = req.body;
  if (!name) {
    return res.status(400).json({ success: false, error: 'Name is required' });
  }
  const newProfession = {
    id: professionIdCounter++,
    name,
    icon: icon || 'work',
    color: color || '#64748b',
  };
  professions.push(newProfession);
  res.json({ success: true, profession: newProfession });
});

// ============ PROVIDERS ROUTES ============

app.get('/api/providers', (req, res) => {
  const { profession, search, sort } = req.query;
  let providersList = getProvidersFromUsers();
  
  if (profession) {
    providersList = providersList.filter(p => p.profession.toLowerCase() === profession.toLowerCase());
  }
  
  if (search) {
    providersList = providersList.filter(p => 
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.profession.toLowerCase().includes(search.toLowerCase())
    );
  }
  
  if (sort === 'rating') {
    providersList.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  }
  
  if (sort === 'price_low') {
    providersList.sort((a, b) => (a.hourlyRate || 0) - (b.hourlyRate || 0));
  }
  
  if (sort === 'price_high') {
    providersList.sort((a, b) => (b.hourlyRate || 0) - (a.hourlyRate || 0));
  }
  
  res.json(providersList);
});

app.get('/api/providers/:id', (req, res) => {
  const providersList = getProvidersFromUsers();
  const provider = providersList.find(p => p.id === parseInt(req.params.id));
  
  if (provider) {
    res.json(provider);
  } else {
    res.status(404).json({ error: 'Provider not found' });
  }
});

// ============ SERVICES ROUTES ============

app.get('/api/providers/:id/services', (req, res) => {
  const providerId = parseInt(req.params.id);
  const providerServices = services.filter(s => s.providerId === providerId);
  res.json(providerServices);
});

app.post('/api/services', (req, res) => {
  const userId = parseInt(req.headers['x-user-id']);
  const user = users.find(u => u.id === userId);
  
  if (!user || user.role !== 'provider') {
    res.status(403).json({ error: 'Only providers can add services' });
    return;
  }
  
  const { name, description, price, category } = req.body;
  
  const newService = {
    id: services.length + 1,
    providerId: userId,
    name,
    description,
    price: parseInt(price),
    category: category || 'other',
  };
  
  services.push(newService);
  res.json({ success: true, service: newService });
});

app.put('/api/services/:id', (req, res) => {
  const userId = parseInt(req.headers['x-user-id']);
  const serviceId = parseInt(req.params.id);
  
  const serviceIndex = services.findIndex(s => s.id === serviceId && s.providerId === userId);
  if (serviceIndex === -1) {
    res.status(404).json({ error: 'Service not found' });
    return;
  }
  
  services[serviceIndex] = { ...services[serviceIndex], ...req.body };
  res.json({ success: true, service: services[serviceIndex] });
});

app.delete('/api/services/:id', (req, res) => {
  const userId = parseInt(req.headers['x-user-id']);
  const serviceId = parseInt(req.params.id);
  
  const serviceIndex = services.findIndex(s => s.id === serviceId && s.providerId === userId);
  if (serviceIndex === -1) {
    res.status(404).json({ error: 'Service not found' });
    return;
  }
  
  services.splice(serviceIndex, 1);
  res.json({ success: true });
});

// ============ PORTFOLIO ROUTES ============

app.get('/api/providers/:id/portfolio', (req, res) => {
  const providerId = parseInt(req.params.id);
  const providerPortfolio = portfolios.filter(p => p.providerId === providerId);
  res.json(providerPortfolio);
});

app.post('/api/portfolio', (req, res) => {
  const userId = parseInt(req.headers['x-user-id']);
  const user = users.find(u => u.id === userId);
  
  if (!user || user.role !== 'provider') {
    res.status(403).json({ error: 'Only providers can add portfolio' });
    return;
  }
  
  const { imageUrl, caption } = req.body;
  
  const newPortfolio = {
    id: portfolios.length + 1,
    providerId: userId,
    imageUrl,
    caption: caption || '',
    createdAt: new Date().toISOString(),
  };
  
  portfolios.push(newPortfolio);
  res.json({ success: true, portfolio: newPortfolio });
});

app.delete('/api/portfolio/:id', (req, res) => {
  const userId = parseInt(req.headers['x-user-id']);
  const portfolioId = parseInt(req.params.id);
  
  const portfolioIndex = portfolios.findIndex(p => p.id === portfolioId && p.providerId === userId);
  if (portfolioIndex === -1) {
    res.status(404).json({ error: 'Portfolio not found' });
    return;
  }
  
  portfolios.splice(portfolioIndex, 1);
  res.json({ success: true });
});

// ============ POSTS ROUTES ============

app.get('/api/posts', (req, res) => {
  res.json(posts);
});

app.post('/api/posts', (req, res) => {
  const userId = parseInt(req.headers['x-user-id']);
  const user = users.find(u => u.id === userId);
  
  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  
  const { content, image } = req.body;
  
  const newPost = {
    id: posts.length + 1,
    authorId: userId,
    authorName: user.name,
    authorAvatar: user.avatar,
    content,
    image: image || null,
    likes: 0,
    comments: 0,
    createdAt: new Date().toISOString(),
    type: 'post',
  };
  
  posts.unshift(newPost);
  res.json({ success: true, post: newPost });
});

app.post('/api/posts/:id/like', (req, res) => {
  const postId = parseInt(req.params.id);
  const post = posts.find(p => p.id === postId);
  
  if (post) {
    post.likes += 1;
    res.json({ success: true, likes: post.likes });
  } else {
    res.status(404).json({ error: 'Post not found' });
  }
});

// ============ REVIEWS ROUTES ============

app.get('/api/providers/:id/reviews', (req, res) => {
  const providerId = parseInt(req.params.id);
  const providerReviews = reviews.filter(r => r.providerId === providerId);
  res.json(providerReviews);
});

app.post('/api/reviews', (req, res) => {
  const userId = parseInt(req.headers['x-user-id']);
  const user = users.find(u => u.id === userId);
  
  if (!user || user.role !== 'client') {
    res.status(403).json({ error: 'Only clients can leave reviews' });
    return;
  }
  
  const { providerId, rating, comment } = req.body;
  const providerIdInt = parseInt(providerId);
  
  const newReview = {
    id: reviews.length + 1,
    providerId: providerIdInt,
    clientId: userId,
    clientName: user.name,
    clientAvatar: user.avatar,
    rating: parseInt(rating),
    comment,
    createdAt: new Date().toISOString(),
  };
  
  reviews.push(newReview);
  
  // Update provider rating
  const providerReviews = reviews.filter(r => r.providerId === providerIdInt);
  const avgRating = providerReviews.reduce((sum, r) => sum + r.rating, 0) / providerReviews.length;
  const providerIndex = users.findIndex(u => u.id === providerIdInt);
  if (providerIndex !== -1) {
    users[providerIndex].rating = Math.round(avgRating * 10) / 10;
    users[providerIndex].reviewCount = providerReviews.length;
  }
  
  res.json({ success: true, review: newReview });
});

// ============ FOLLOWS ROUTES ============

app.post('/api/follow/:providerId', (req, res) => {
  const userId = parseInt(req.headers['x-user-id']);
  const providerId = parseInt(req.params.providerId);
  
  const existingFollow = follows.find(f => f.userId === userId && f.providerId === providerId);
  const existingRequest = followRequests.find(r => r.fromUserId === userId && r.toUserId === providerId && r.status === 'pending');
  
  if (existingFollow) {
    // Unfollow
    const index = follows.indexOf(existingFollow);
    follows.splice(index, 1);
    res.json({ success: true, following: false });
  } else if (existingRequest) {
    // Cancel request
    const reqIndex = followRequests.indexOf(existingRequest);
    followRequests.splice(reqIndex, 1);
    res.json({ success: true, following: false, message: 'Request cancelled' });
  } else {
    // Send follow request (don't follow immediately)
    const fromUser = users.find(u => u.id === userId);
    
    followRequests.push({
      id: followRequests.length + 1,
      fromUserId: userId,
      fromUserName: fromUser?.name || 'Someone',
      toUserId: providerId,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });
    
    // Send notification to the provider/client
    notifications.push({
      id: notifications.length + 1,
      userId: providerId,
      type: 'follow_request',
      title: 'New Follow Request',
      text: `${fromUser?.name || 'Someone'} wants to follow you`,
      read: false,
      createdAt: new Date().toISOString(),
    });
    
    res.json({ success: true, following: false, message: 'Follow request sent' });
  }
});

// Accept or decline follow request
app.post('/api/follow/respond', (req, res) => {
  const userId = parseInt(req.headers['x-user-id']);
  const { requestId, action } = req.body; // action: 'accept' or 'decline'
  
  const request = followRequests.find(r => r.id === parseInt(requestId) && r.toUserId === userId);
  
  if (!request) {
    return res.status(404).json({ success: false, error: 'Request not found' });
  }
  
  if (action === 'accept') {
    // Add to follows
    follows.push({
      userId: request.fromUserId,
      providerId: request.toUserId,
      createdAt: new Date().toISOString(),
    });
    
    // Update request status
    request.status = 'accepted';
    
    // Notify the request sender
    const fromUser = users.find(u => u.id === request.fromUserId);
    notifications.push({
      id: notifications.length + 1,
      userId: request.fromUserId,
      type: 'follow_accepted',
      title: 'Follow Request Accepted',
      text: 'accepted your follow request',
      read: false,
      createdAt: new Date().toISOString(),
    });
    
    res.json({ success: true, following: true });
  } else {
    // Decline
    request.status = 'declined';
    res.json({ success: true, following: false });
  }
});

// Get pending follow requests for current user
app.get('/api/follow/requests', (req, res) => {
  const userId = parseInt(req.headers['x-user-id']);
  const pendingRequests = followRequests.filter(r => r.toUserId === userId && r.status === 'pending');
  res.json(pendingRequests);
});

// Get accepted followers
app.get('/api/following', (req, res) => {
  const userId = parseInt(req.headers['x-user-id']);
  const following = follows.filter(f => f.userId === userId).map(f => f.providerId);
  res.json(following);
});

app.get('/api/providers/:id/followers', (req, res) => {
  const providerId = parseInt(req.params.id);
  const followers = follows.filter(f => f.providerId === providerId).map(f => f.userId);
  res.json(followers);
});

// ============ SERVICE REQUESTS ROUTES ============

app.post('/api/service-requests', (req, res) => {
  const clientId = parseInt(req.headers['x-user-id']);
  const { providerId, serviceName, description } = req.body;
  
  const newRequest = {
    id: serviceRequests.length + 1,
    clientId,
    providerId: parseInt(providerId),
    serviceName,
    description,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  
  serviceRequests.push(newRequest);
  
  // Send notification to provider
  const provider = users.find(u => u.id === parseInt(providerId));
  if (provider) {
    notifications.push({
      id: notifications.length + 1,
      userId: provider.id,
      type: 'request',
      title: 'New Service Request',
      text: `${serviceName} - ${description.substring(0, 50)}`,
      read: false,
      createdAt: new Date().toISOString(),
    });
  }
  
  res.json({ success: true, request: newRequest });
});

app.get('/api/service-requests', (req, res) => {
  const userId = parseInt(req.headers['x-user-id']);
  const user = users.find(u => u.id === userId);
  
  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  
  let userRequests;
  if (user.role === 'client') {
    userRequests = serviceRequests.filter(r => r.clientId === userId);
  } else {
    userRequests = serviceRequests.filter(r => r.providerId === userId);
  }
  
  const enrichedRequests = userRequests.map(r => {
    const otherUser = users.find(u => u.id === (user.role === 'client' ? r.providerId : r.clientId));
    return {
      ...r,
      otherUserName: otherUser?.name || 'Unknown',
      otherUserAvatar: otherUser?.avatar || '',
      otherUserProfession: otherUser?.profession || '',
    };
  });
  
  res.json(enrichedRequests);
});

app.put('/api/service-requests/:id', (req, res) => {
  const userId = parseInt(req.headers['x-user-id']);
  const requestId = parseInt(req.params.id);
  const { status } = req.body;
  
  const requestIndex = serviceRequests.findIndex(r => r.id === requestId);
  if (requestIndex === -1) {
    res.status(404).json({ error: 'Request not found' });
    return;
  }
  
  serviceRequests[requestIndex].status = status;
  
  // Send notification to client
  const request = serviceRequests[requestIndex];
  notifications.push({
    id: notifications.length + 1,
    userId: request.clientId,
    type: 'request_update',
    title: 'Service Request Update',
    text: `Your request for ${request.serviceName} has been ${status}`,
    read: false,
    createdAt: new Date().toISOString(),
  });
  
  res.json({ success: true, request: serviceRequests[requestIndex] });
});

// ============ MESSAGES ROUTES ============

app.get('/api/conversations', (req, res) => {
  const userId = parseInt(req.headers['x-user-id']);
  
  const conversationMap = new Map();
  
  messages.forEach(msg => {
    const otherId = msg.senderId === userId ? msg.receiverId : msg.senderId;
    if (msg.senderId === userId || msg.receiverId === userId) {
      if (!conversationMap.has(otherId) || new Date(msg.createdAt) > new Date(conversationMap.get(otherId).lastMessageTime)) {
        const otherUser = users.find(u => u.id === otherId);
        conversationMap.set(otherId, {
          userId: otherId,
          userName: otherUser?.name || 'Unknown',
          userAvatar: otherUser?.avatar || '',
          userRole: otherUser?.role || '',
          userProfession: otherUser?.profession || '',
          lastMessage: msg.text,
          lastMessageTime: msg.createdAt,
          unread: msg.receiverId === userId && !msg.read,
        });
      }
    }
  });
  
  const conversations = Array.from(conversationMap.values()).sort((a, b) => 
    new Date(b.lastMessageTime) - new Date(a.lastMessageTime)
  );
  
  res.json(conversations);
});

app.get('/api/messages/:userId', (req, res) => {
  const currentUserId = parseInt(req.headers['x-user-id']);
  const otherUserId = parseInt(req.params.userId);
  
  const conversation = messages.filter(m => 
    (m.senderId === currentUserId && m.receiverId === otherUserId) ||
    (m.senderId === otherUserId && m.receiverId === currentUserId)
  ).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  
  // Mark as read
  messages.forEach(m => {
    if (m.senderId === otherUserId && m.receiverId === currentUserId) {
      m.read = true;
    }
  });
  
  res.json(conversation);
});

app.post('/api/messages', (req, res) => {
  const senderId = parseInt(req.headers['x-user-id']);
  const { receiverId, text, mediaUrl, type } = req.body;
  const receiverIdInt = parseInt(receiverId);
  
  const newMessage = {
    id: messages.length + 1,
    senderId,
    receiverId: receiverIdInt,
    text: text || '',
    mediaUrl: mediaUrl || null,
    type: type || 'text',
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    read: false,
    createdAt: new Date().toISOString(),
  };
  
  messages.push(newMessage);
  
  // Send notification
  const notificationText = mediaUrl 
    ? `${type}: ${mediaUrl}` 
    : (text || 'New message');
  notifications.push({
    id: notifications.length + 1,
    userId: receiverIdInt,
    type: 'message',
    title: 'New Message',
    text: notificationText.substring(0, 50),
    read: false,
    createdAt: new Date().toISOString(),
  });
  
  res.json(newMessage);
});

// Upload media endpoint
app.post('/api/messages/media', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No file uploaded' });
  }
  res.json({
    success: true,
    filePath: `/uploads/${req.file.filename}`,
    filename: req.file.filename,
  });
});

// ============ NOTIFICATIONS ROUTES ============

app.get('/api/notifications', (req, res) => {
  const userId = parseInt(req.headers['x-user-id']);
  const userNotifications = notifications.filter(n => n.userId === userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(userNotifications);
});

app.put('/api/notifications/read', (req, res) => {
  const userId = parseInt(req.headers['x-user-id']);
  
  notifications.forEach(n => {
    if (n.userId === userId) {
      n.read = true;
    }
  });
  
  res.json({ success: true });
});

app.get('/api/notifications/unread-count', (req, res) => {
  const userId = parseInt(req.headers['x-user-id']);
  const count = notifications.filter(n => n.userId === userId && !n.read).length;
  res.json({ count });
});

// ============ CATEGORIES (for backward compatibility) ============

const categories = professions.map(p => ({
  id: p.id,
  name: p.name,
  icon: p.icon,
  color: `bg-[${p.color}]`,
}));

app.get('/api/categories', (req, res) => {
  res.json(categories);
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
