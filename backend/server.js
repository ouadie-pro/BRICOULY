const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const User = require('./models/User');
const Provider = require('./models/Provider');
const Service = require('./models/Service');
const Portfolio = require('./models/Portfolio');
const Post = require('./models/Post');
const Video = require('./models/Video');
const Article = require('./models/Article');
const Message = require('./models/Message');
const Conversation = require('./models/Conversation');
const Notification = require('./models/Notification');
const Review = require('./models/Review');
const Follow = require('./models/Follow');
const FollowRequest = require('./models/FollowRequest');
const ServiceRequest = require('./models/ServiceRequest');
const Category = require('./models/Category');

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

// Start server after connecting to MongoDB and seeding
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('MongoDB Connected');
    await seedCategories();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => console.error('MongoDB Connection Error:', err));

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

// ============ AUTH ROUTES ============

app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password, role, phone, professionId, bio } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
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
      role: role || 'client',
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
    
    const { password: _, ...userWithoutPassword } = user.toObject();
    const responseUser = { ...userWithoutPassword, id: user._id };
    
    res.json({ success: true, user: responseUser });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
    
    const provider = await Provider.findOne({ user: user._id });
    
    const { password: _, ...userWithoutPassword } = user.toObject();
    const responseUser = { 
      ...userWithoutPassword, 
      id: user._id,
      profession: provider?.profession || '',
      bio: provider?.bio || '',
      rating: provider?.rating || 0,
      verified: provider?.verified || false,
    };
    
    res.json({ success: true, user: responseUser });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/auth/me', async (req, res) => {
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
      id: user._id,
      profession: provider?.profession || '',
      bio: provider?.bio || '',
      rating: provider?.rating || 0,
      verified: provider?.verified || false,
    };
    
    res.json(responseUser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/users/profile', async (req, res) => {
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
    
    if (updates.bio || updates.profession) {
      await Provider.findOneAndUpdate(
        { user: user._id },
        { bio: updates.bio, profession: updates.profession }
      );
    }
    
    const { password: _, ...userWithoutPassword } = user.toObject();
    res.json({ success: true, user: { ...userWithoutPassword, id: user._id } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/users/avatar', upload.single('file'), async (req, res) => {
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
});

// ============ PROFESSIONS/CATEGORIES ROUTES ============

app.get('/api/professions', async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/professions', async (req, res) => {
  try {
    const { name, icon, color } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, error: 'Name is required' });
    }
    const category = await Category.create({ name, icon: icon || 'work', color: color || '#64748b' });
    res.json({ success: true, profession: category });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ PROVIDERS ROUTES ============

app.get('/api/providers', async (req, res) => {
  try {
    const { profession, search, sort } = req.query;
    
    let providers = await Provider.find().populate('user', 'name avatar phone location').populate('category');
    
    let providersList = providers.map(p => ({
      id: p.user._id,
      name: p.user.name,
      email: p.user.email,
      avatar: p.user.avatar,
      phone: p.user.phone,
      location: p.user.location,
      role: 'provider',
      professionId: p.category?._id,
      profession: p.profession,
      bio: p.bio,
      hourlyRate: p.hourlyRate,
      distance: Math.random() * 5 + 0.5,
      experience: p.experience,
      verified: p.verified,
      rating: p.rating,
      reviewCount: p.reviewCount,
      jobsDone: p.jobsDone,
      serviceArea: p.serviceArea,
    }));
    
    if (profession) {
      providersList = providersList.filter(p => p.profession?.toLowerCase() === profession.toLowerCase());
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
    
    if (sort === 'price_low') {
      providersList.sort((a, b) => (a.hourlyRate || 0) - (b.hourlyRate || 0));
    }
    
    if (sort === 'price_high') {
      providersList.sort((a, b) => (b.hourlyRate || 0) - (a.hourlyRate || 0));
    }
    
    for (let p of providersList) {
      const services = await Service.find({ provider: p.id });
      const portfolio = await Portfolio.find({ provider: p.id });
      const reviews = await Review.find({ provider: p.id });
      p.services = services;
      p.portfolio = portfolio;
      p.reviews = reviews;
    }
    
    res.json(providersList);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/providers/:id', async (req, res) => {
  try {
    const provider = await Provider.findOne({ user: req.params.id }).populate('user', 'name avatar phone location email').populate('category');
    
    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }
    
    const services = await Service.find({ provider: provider._id });
    const portfolio = await Portfolio.find({ provider: provider._id });
    const reviews = await Review.find({ provider: provider._id }).populate('user', 'name avatar');
    
    res.json({
      id: provider.user._id,
      name: provider.user.name,
      email: provider.user.email,
      avatar: provider.user.avatar,
      phone: provider.user.phone,
      location: provider.user.location,
      role: 'provider',
      professionId: provider.category?._id,
      profession: provider.profession,
      bio: provider.bio,
      hourlyRate: provider.hourlyRate,
      distance: provider.distance,
      experience: provider.experience,
      verified: provider.verified,
      rating: provider.rating,
      reviewCount: provider.reviewCount,
      jobsDone: provider.jobsDone,
      serviceArea: provider.serviceArea,
      services,
      portfolio,
      reviews,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ SERVICES ROUTES ============

app.get('/api/providers/:id/services', async (req, res) => {
  try {
    const provider = await Provider.findOne({ user: req.params.id });
    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }
    const services = await Service.find({ provider: provider._id });
    res.json(services);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/services', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(403).json({ error: 'User not found' });
    }
    
    const provider = await Provider.findOne({ user: userId });
    if (!provider) {
      return res.status(403).json({ error: 'Only providers can add services' });
    }
    
    const { name, description, price, category } = req.body;
    
    const service = await Service.create({
      provider: provider._id,
      name,
      description,
      price: parseInt(price),
      category: category || 'other',
    });
    
    res.json({ success: true, service });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/services/:id', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const provider = await Provider.findOne({ user: userId });
    
    if (!provider) {
      return res.status(403).json({ error: 'Only providers can update services' });
    }
    
    const service = await Service.findOneAndUpdate(
      { _id: req.params.id, provider: provider._id },
      req.body,
      { new: true }
    );
    
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }
    
    res.json({ success: true, service });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/services/:id', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const provider = await Provider.findOne({ user: userId });
    
    if (!provider) {
      return res.status(403).json({ error: 'Only providers can delete services' });
    }
    
    const service = await Service.findOneAndDelete({ _id: req.params.id, provider: provider._id });
    
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ PORTFOLIO ROUTES ============

app.get('/api/providers/:id/portfolio', async (req, res) => {
  try {
    const provider = await Provider.findOne({ user: req.params.id });
    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }
    const portfolio = await Portfolio.find({ provider: provider._id });
    res.json(portfolio);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/portfolio', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    const provider = await Provider.findOne({ user: userId });
    if (!provider) {
      return res.status(403).json({ error: 'Only providers can add portfolio' });
    }
    
    const { imageUrl, caption } = req.body;
    
    const portfolio = await Portfolio.create({
      provider: provider._id,
      imageUrl,
      caption: caption || '',
    });
    
    res.json({ success: true, portfolio });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/portfolio/:id', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const provider = await Provider.findOne({ user: userId });
    
    if (!provider) {
      return res.status(403).json({ error: 'Only providers can delete portfolio' });
    }
    
    const portfolio = await Portfolio.findOneAndDelete({ _id: req.params.id, provider: provider._id });
    
    if (!portfolio) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ POSTS ROUTES ============

app.get('/api/posts', async (req, res) => {
  try {
    const posts = await Post.find().populate('author', 'name avatar role').sort({ createdAt: -1 });
    const postsWithAuthor = posts.map(p => ({
      id: p._id,
      authorId: p.author._id,
      authorName: p.author.name,
      authorAvatar: p.author.avatar,
      content: p.content,
      image: p.image,
      likes: p.likes,
      comments: p.comments,
      type: p.type,
      createdAt: p.createdAt,
    }));
    res.json(postsWithAuthor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/posts', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { content, image } = req.body;
    
    const post = await Post.create({
      author: userId,
      content,
      image: image || null,
      type: 'post',
    });
    
    const populatedPost = await Post.findById(post._id).populate('author', 'name avatar');
    
    res.json({ 
      success: true, 
      post: {
        id: populatedPost._id,
        authorId: populatedPost.author._id,
        authorName: populatedPost.author.name,
        authorAvatar: populatedPost.author.avatar,
        content: populatedPost.content,
        image: populatedPost.image,
        likes: populatedPost.likes,
        comments: populatedPost.comments,
        type: populatedPost.type,
        createdAt: populatedPost.createdAt,
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/posts/:id/like', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    post.likes += 1;
    await post.save();
    
    res.json({ success: true, likes: post.likes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ VIDEOS ROUTES ============

app.get('/api/videos', async (req, res) => {
  try {
    const videos = await Video.find().populate('user', 'name avatar role').sort({ createdAt: -1 });
    const videosWithUsers = videos.map(v => ({
      id: v._id,
      userId: v.user._id,
      userName: v.user.name,
      userAvatar: v.user.avatar,
      userRole: v.user.role,
      videoUrl: v.videoUrl,
      title: v.title,
      description: v.description,
      likes: v.likes,
      views: v.views,
      createdAt: v.createdAt,
    }));
    res.json(videosWithUsers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/videos', upload.single('video'), async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No video file uploaded' });
    }
    
    const { title, description } = req.body;
    
    const video = await Video.create({
      user: userId,
      videoUrl: `/uploads/${req.file.filename}`,
      title: title || '',
      description: description || '',
    });
    
    const populatedVideo = await Video.findById(video._id).populate('user', 'name avatar role');
    
    res.json({ 
      success: true, 
      video: {
        id: populatedVideo._id,
        userId: populatedVideo.user._id,
        userName: populatedVideo.user.name,
        userAvatar: populatedVideo.user.avatar,
        userRole: populatedVideo.user.role,
        videoUrl: populatedVideo.videoUrl,
        title: populatedVideo.title,
        description: populatedVideo.description,
        likes: populatedVideo.likes,
        views: populatedVideo.views,
        createdAt: populatedVideo.createdAt,
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/videos/:id/like', async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }
    
    video.likes += 1;
    await video.save();
    
    res.json({ success: true, likes: video.likes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/videos/:id', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const video = await Video.findOneAndDelete({ _id: req.params.id, user: userId });
    
    if (!video) {
      return res.status(404).json({ error: 'Video not found or not authorized' });
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ ARTICLES ROUTES ============

app.get('/api/articles', async (req, res) => {
  try {
    const articles = await Article.find().populate('user', 'name avatar role').sort({ createdAt: -1 });
    const articlesWithUsers = articles.map(a => ({
      id: a._id,
      userId: a.user._id,
      userName: a.user.name,
      userAvatar: a.user.avatar,
      userRole: a.user.role,
      title: a.title,
      content: a.content,
      imageUrl: a.imageUrl,
      likes: a.likes,
      createdAt: a.createdAt,
    }));
    res.json(articlesWithUsers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/users/:id/articles', async (req, res) => {
  try {
    const articles = await Article.find({ user: req.params.id }).sort({ createdAt: -1 });
    res.json(articles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/articles', upload.single('image'), async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { title, content } = req.body;
    
    const article = await Article.create({
      user: userId,
      title: title || '',
      content: content || '',
      imageUrl: req.file ? `/uploads/${req.file.filename}` : null,
    });
    
    const populatedArticle = await Article.findById(article._id).populate('user', 'name avatar role');
    
    res.json({ 
      success: true, 
      article: {
        id: populatedArticle._id,
        userId: populatedArticle.user._id,
        userName: populatedArticle.user.name,
        userAvatar: populatedArticle.user.avatar,
        userRole: populatedArticle.user.role,
        title: populatedArticle.title,
        content: populatedArticle.content,
        imageUrl: populatedArticle.imageUrl,
        likes: populatedArticle.likes,
        createdAt: populatedArticle.createdAt,
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/articles/:id/like', async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }
    
    article.likes += 1;
    await article.save();
    
    res.json({ success: true, likes: article.likes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/articles/:id', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const article = await Article.findOneAndDelete({ _id: req.params.id, user: userId });
    
    if (!article) {
      return res.status(404).json({ error: 'Article not found or not authorized' });
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ REVIEWS ROUTES ============

app.get('/api/providers/:id/reviews', async (req, res) => {
  try {
    const provider = await Provider.findOne({ user: req.params.id });
    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }
    const reviews = await Review.find({ provider: provider._id }).populate('user', 'name avatar');
    const reviewsData = reviews.map(r => ({
      id: r._id,
      providerId: provider._id,
      clientId: r.user._id,
      clientName: r.user.name,
      clientAvatar: r.user.avatar,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
    }));
    res.json(reviewsData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/reviews', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(403).json({ error: 'User not found' });
    }
    
    const { providerId, rating, comment } = req.body;
    const provider = await Provider.findOne({ user: providerId });
    
    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }
    
    const review = await Review.create({
      user: userId,
      provider: provider._id,
      rating: parseInt(rating),
      comment: comment || '',
    });
    
    res.json({ success: true, review });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ USERS SEARCH ROUTES ============

app.get('/api/users/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.json([]);
    }
    
    const query = q.toLowerCase();
    const users = await User.find({ name: { $regex: query, $options: 'i' } });
    const providers = await Provider.find({ profession: { $regex: query, $options: 'i' } }).populate('user', 'name avatar location');
    
    const matchingUsers = [
      ...users.map(u => ({
        id: u._id,
        name: u.name,
        avatar: u.avatar,
        role: u.role,
        profession: '',
        location: u.location || '',
        rating: 0,
      })),
      ...providers.map(p => ({
        id: p.user._id,
        name: p.user.name,
        avatar: p.user.avatar,
        role: 'provider',
        profession: p.profession || '',
        location: p.location || '',
        rating: p.rating || 0,
      })),
    ];
    
    res.json(matchingUsers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ FOLLOWS ROUTES ============

app.post('/api/follow/:userId', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const targetUserId = req.params.userId;
    
    if (userId === targetUserId) {
      return res.status(400).json({ success: false, error: 'Cannot follow yourself' });
    }
    
    const existingFollow = await Follow.findOne({ user: new mongoose.Types.ObjectId(userId), targetUser: new mongoose.Types.ObjectId(targetUserId) });
    const existingRequest = await FollowRequest.findOne({ fromUser: new mongoose.Types.ObjectId(userId), toUser: new mongoose.Types.ObjectId(targetUserId), status: 'pending' });
    
    if (existingFollow) {
      await Follow.findByIdAndDelete(existingFollow._id);
      res.json({ success: true, following: false });
    } else if (existingRequest) {
      await FollowRequest.findByIdAndDelete(existingRequest._id);
      res.json({ success: true, following: false, message: 'Request cancelled' });
    } else {
      const fromUser = await User.findById(userId);
      const targetUser = await User.findById(targetUserId);
      
      await FollowRequest.create({
        fromUser: new mongoose.Types.ObjectId(userId),
        toUser: new mongoose.Types.ObjectId(targetUserId),
        status: 'pending',
      });
      
      await Notification.create({
        user: new mongoose.Types.ObjectId(targetUserId),
        type: 'follow_request',
        title: 'New Follow Request',
        text: `${fromUser?.name || 'Someone'} wants to follow you`,
        fromUser: new mongoose.Types.ObjectId(userId),
      });
      
      res.json({ success: true, following: false, message: 'Follow request sent' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/follow/respond', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const { requestId, action } = req.body;
    
    const request = await FollowRequest.findOne({ _id: new mongoose.Types.ObjectId(requestId), toUser: new mongoose.Types.ObjectId(userId) });
    
    if (!request) {
      return res.status(404).json({ success: false, error: 'Request not found' });
    }
    
    if (action === 'accept') {
      await Follow.create({
        user: request.fromUser,
        targetUser: request.toUser,
      });
      
      request.status = 'accepted';
      await request.save();
      
      await Notification.create({
        user: request.fromUser,
        type: 'follow_accepted',
        title: 'Follow Request Accepted',
        text: 'accepted your follow request',
      });
      
      res.json({ success: true, following: true });
    } else {
      request.status = 'declined';
      await request.save();
      res.json({ success: true, following: false });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/follow/requests', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const pendingRequests = await FollowRequest.find({ toUser: new mongoose.Types.ObjectId(userId), status: 'pending' }).populate('fromUser', 'name avatar');
    const requestsData = pendingRequests.map(r => ({
      id: r._id,
      fromUserId: r.fromUser._id,
      fromUserName: r.fromUser.name,
      fromUserAvatar: r.fromUser.avatar,
      toUserId: r.toUser,
      status: r.status,
      createdAt: r.createdAt,
    }));
    res.json(requestsData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/following', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const following = await Follow.find({ user: new mongoose.Types.ObjectId(userId) });
    res.json(following.map(f => f.targetUser));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/users/:id/followers', async (req, res) => {
  try {
    const userId = req.params.id;
    const follows = await Follow.find({ targetUser: new mongoose.Types.ObjectId(userId) }).populate('user', 'name avatar location');
    const followers = follows.map(f => ({
      id: f.user._id,
      name: f.user.name,
      avatar: f.user.avatar,
      role: 'user',
      profession: '',
      location: f.user.location || '',
    }));
    res.json(followers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/users/:id/following', async (req, res) => {
  try {
    const userId = req.params.id;
    const following = await Follow.find({ user: new mongoose.Types.ObjectId(userId) }).populate('targetUser', 'name avatar location');
    const followingData = following.map(f => ({
      id: f.targetUser._id,
      name: f.targetUser.name,
      avatar: f.targetUser.avatar,
      role: 'user',
      profession: '',
      location: f.targetUser.location || '',
    }));
    res.json(followingData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single user
app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const { password, ...userWithoutPassword } = user.toObject();
    res.json({ ...userWithoutPassword, id: user._id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ SERVICE REQUESTS ROUTES ============

app.post('/api/service-requests', async (req, res) => {
  try {
    const clientId = req.headers['x-user-id'];
    const { providerId, serviceName, description } = req.body;
    
    const provider = await Provider.findOne({ user: providerId });
    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }
    
    const serviceRequest = await ServiceRequest.create({
      client: clientId,
      provider: provider._id,
      serviceName,
      description,
      status: 'pending',
    });
    
    await Notification.create({
      user: providerId,
      type: 'request',
      title: 'New Service Request',
      text: `${serviceName} - ${description.substring(0, 50)}`,
    });
    
    res.json({ success: true, request: serviceRequest });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/service-requests', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    let userRequests;
    if (user.role === 'client') {
      userRequests = await ServiceRequest.find({ client: userId }).populate('provider');
    } else {
      const provider = await Provider.findOne({ user: userId });
      if (provider) {
        userRequests = await ServiceRequest.find({ provider: provider._id }).populate('client');
      } else {
        userRequests = [];
      }
    }
    
    const enrichedRequests = await Promise.all(userRequests.map(async (r) => {
      let otherUser;
      if (user.role === 'client') {
        otherUser = await User.findById(r.provider.user);
      } else {
        otherUser = await User.findById(r.client);
      }
      return {
        id: r._id,
        clientId: r.client,
        providerId: r.provider._id,
        serviceName: r.serviceName,
        description: r.description,
        status: r.status,
        createdAt: r.createdAt,
        otherUserName: otherUser?.name || 'Unknown',
        otherUserAvatar: otherUser?.avatar || '',
        otherUserProfession: '',
      };
    }));
    
    res.json(enrichedRequests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/service-requests/:id', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const { status } = req.body;
    
    const serviceRequest = await ServiceRequest.findById(req.params.id).populate('client provider');
    
    if (!serviceRequest) {
      return res.status(404).json({ error: 'Request not found' });
    }
    
    serviceRequest.status = status;
    await serviceRequest.save();
    
    await Notification.create({
      user: serviceRequest.client._id,
      type: 'request_update',
      title: 'Service Request Update',
      text: `Your request for ${serviceRequest.serviceName} has been ${status}`,
    });
    
    res.json({ success: true, request: serviceRequest });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ MESSAGES ROUTES ============

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id) && id.toString().length === 24 && /^[a-fA-F0-9]{24}$/.test(id);

app.get('/api/conversations', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];

    if (!userId || !isValidObjectId(userId)) {
      return res.json([]);
    }

    // Get conversations where user is a participant
    const conversations = await Conversation.find({
      participants: new mongoose.Types.ObjectId(userId)
    }).sort({ lastMessageAt: -1 });

    const conversationData = await Promise.all(conversations.map(async (conv) => {
      // Get the other participant
      const otherUserId = conv.participants.find(p => p.toString() !== userId);
      const otherUser = await User.findById(otherUserId).select('name avatar role');
      
      let profession = '';
      if (otherUser?.role === 'provider') {
        const provider = await Provider.findOne({ user: otherUserId });
        profession = provider?.profession || '';
      }

      // Get unread count
      const unreadCount = await Message.countDocuments({
        conversationId: conv._id,
        receiver: new mongoose.Types.ObjectId(userId),
        read: false
      });

      return {
        id: conv._id,
        conversationId: conv._id,
        userId: otherUserId,
        userName: otherUser?.name || 'Unknown',
        userAvatar: otherUser?.avatar || '',
        userRole: otherUser?.role || 'user',
        userProfession: profession,
        lastMessage: conv.lastMessage || '',
        lastMessageTime: conv.lastMessageAt,
        unread: unreadCount,
      };
    }));

    res.json(conversationData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/messages/:userId', async (req, res) => {
  try {
    const currentUserId = req.headers['x-user-id'];
    const otherUserId = req.params.userId;

    if (!currentUserId || !isValidObjectId(currentUserId) || !isValidObjectId(otherUserId)) {
      return res.json([]);
    }

    // Find or create conversation
    let conversation = await Conversation.findOne({
      participants: { $all: [new mongoose.Types.ObjectId(currentUserId), new mongoose.Types.ObjectId(otherUserId)] }
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [new mongoose.Types.ObjectId(currentUserId), new mongoose.Types.ObjectId(otherUserId)],
      });
    }

    const messages = await Message.find({
      conversationId: conversation._id
    })
      .populate('sender', 'name avatar')
      .populate('receiver', 'name avatar')
      .sort({ createdAt: 1 });

    await Message.updateMany(
      { conversationId: conversation._id, receiver: new mongoose.Types.ObjectId(currentUserId), read: false },
      { read: true }
    );

    const messagesData = messages.map(m => ({
      id: m._id,
      conversationId: m.conversationId,
      senderId: m.sender._id,
      senderName: m.sender.name,
      senderAvatar: m.sender.avatar,
      receiverId: m.receiver._id,
      content: m.content,
      mediaUrl: m.mediaUrl,
      audioUrl: m.audioUrl,
      type: m.type,
      time: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: m.read,
      createdAt: m.createdAt,
    }));

    res.json(messagesData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/messages', async (req, res) => {
  try {
    const senderId = req.headers['x-user-id'];
    const { receiverId, content, mediaUrl, audioUrl, type } = req.body;

    if (!receiverId) {
      return res.status(400).json({ error: 'receiverId is required' });
    }

    // Find or create conversation
    let conversation = await Conversation.findOne({
      participants: { $all: [new mongoose.Types.ObjectId(senderId), new mongoose.Types.ObjectId(receiverId)] }
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [new mongoose.Types.ObjectId(senderId), new mongoose.Types.ObjectId(receiverId)],
      });
    }

    const message = await Message.create({
      conversationId: conversation._id,
      sender: new mongoose.Types.ObjectId(senderId),
      receiver: new mongoose.Types.ObjectId(receiverId),
      content: content || '',
      mediaUrl: mediaUrl || null,
      audioUrl: audioUrl || null,
      type: type || 'text',
      read: false
    });

    // Update conversation
    conversation.lastMessage = content || (mediaUrl ? '[Media]' : '');
    conversation.lastMessageAt = new Date();
    await conversation.save();

    // Create notification
    await Notification.create({
      user: new mongoose.Types.ObjectId(receiverId),
      type: 'message',
      title: 'New Message',
      text: content?.substring(0, 50) || 'New message',
      fromUser: new mongoose.Types.ObjectId(senderId),
    });

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name avatar')
      .populate('receiver', 'name avatar');

    res.json({
      id: populatedMessage._id,
      conversationId: conversation._id,
      senderId: populatedMessage.sender._id,
      senderName: populatedMessage.sender.name,
      senderAvatar: populatedMessage.sender.avatar,
      receiverId: populatedMessage.receiver._id,
      content: populatedMessage.content || '',
      mediaUrl: populatedMessage.mediaUrl,
      audioUrl: populatedMessage.audioUrl,
      type: populatedMessage.type,
      time: new Date(populatedMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: populatedMessage.read,
      createdAt: populatedMessage.createdAt,
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
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

app.get('/api/notifications', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const notifications = await Notification.find({ user: userId }).populate('fromUser', 'name avatar').sort({ createdAt: -1 });
    const notificationsData = notifications.map(n => ({
      id: n._id,
      userId: n.user,
      type: n.type,
      title: n.title,
      text: n.text,
      fromUserId: n.fromUser?._id,
      fromUserAvatar: n.fromUser?.avatar,
      fromUserName: n.fromUser?.name,
      read: n.read,
      createdAt: n.createdAt,
    }));
    res.json(notificationsData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/notifications/read', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    await Notification.updateMany({ user: userId }, { read: true });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/notifications/unread-count', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const count = await Notification.countDocuments({ user: userId, read: false });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ CATEGORIES ============

app.get('/api/categories', async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  });
}
