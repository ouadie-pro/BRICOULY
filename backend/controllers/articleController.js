const Article = require('../models/Article');
const ArticleComment = require('../models/ArticleComment');
const User = require('../models/User');
const Provider = require('../models/Provider');

exports.getArticles = async (req, res) => {
  try {
    const userId = req.user?.id?.toString() || req.headers['x-user-id'];
    const articles = await Article.find()
      .populate('user', 'name avatar role')
      .sort({ createdAt: -1 });
    
    const articlesWithUsers = await Promise.all(articles.map(async a => {
      if (!a.user) {
        return null;
      }
      let authorProfession = null;
      if (a.user.role === 'provider') {
        const provider = await Provider.findOne({ user: a.user._id });
        authorProfession = provider?.profession || null;
      }
      
      const isLiked = userId ? a.likes.some(id => id.toString() === userId) : false;
      const images = a.images?.map(img => 
        img.startsWith('http') ? img : `${req.protocol}://${req.get('host')}${img}`
      ) || [];
      
      return {
        id: a._id.toString(),
        authorId: a.user._id.toString(),
        authorName: a.user.name || 'Unknown',
        authorAvatar: a.user.avatar,
        authorRole: a.user.role,
        authorProfession,
        title: a.title,
        content: a.content,
        images,
        likesCount: a.likes?.length || 0,
        isLiked,
        commentsCount: a.commentsCount || 0,
        createdAt: a.createdAt,
      };
    }));

    const validArticles = articlesWithUsers.filter(a => a !== null);
    res.json(validArticles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getUserArticles = async (req, res) => {
  try {
    const articles = await Article.find({ user: req.params.id }).sort({ createdAt: -1 });
    const articlesData = articles.map(a => ({
      id: a._id.toString(),
      title: a.title,
      content: a.content,
      images: a.images || [],
      likesCount: a.likes?.length || 0,
      commentsCount: a.commentsCount || 0,
      createdAt: a.createdAt,
    }));
    res.json(articlesData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createArticle = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const userId = req.user.id.toString();
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { title, content, type } = req.body;
    
    let images = [];
    if (req.files && req.files.length > 0) {
      images = req.files.map(file => `/uploads/${file.filename}`);
    }
    
    const article = await Article.create({
      user: userId,
      title: title || '',
      content: content || '',
      images,
    });
    
    const populatedArticle = await Article.findById(article._id).populate('user', 'name avatar role');
    
    let authorProfession = null;
    if (user.role === 'provider') {
      const provider = await Provider.findOne({ user: userId });
      authorProfession = provider?.profession || null;
    }
    
    const imageUrls = populatedArticle.images?.map(img => 
      img.startsWith('http') ? img : `${req.protocol}://${req.get('host')}${img}`
    ) || [];
    
    res.json({ 
      success: true, 
      article: {
        id: populatedArticle._id.toString(),
        authorId: populatedArticle.user._id.toString(),
        authorName: populatedArticle.user.name,
        authorAvatar: populatedArticle.user.avatar,
        authorRole: populatedArticle.user.role,
        authorProfession,
        title: populatedArticle.title,
        content: populatedArticle.content,
        images: imageUrls,
        likesCount: 0,
        isLiked: false,
        commentsCount: 0,
        createdAt: populatedArticle.createdAt,
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.likeArticle = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const userId = req.user.id.toString();
    const mongoose = require('mongoose');
    const article = await Article.findById(req.params.id);
    
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }
    
    const userIdObj = new mongoose.Types.ObjectId(userId);
    const alreadyLiked = article.likes.some(id => id.toString() === userId);
    
    if (alreadyLiked) {
      article.likes = article.likes.filter(id => id.toString() !== userId);
    } else {
      article.likes.push(userIdObj);
    }
    
    await article.save();
    
    res.json({ 
      success: true, 
      likesCount: article.likes.length, 
      isLiked: !alreadyLiked 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteArticle = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const userId = req.user.id.toString();
    const article = await Article.findOneAndDelete({ _id: req.params.id, user: userId });
    
    if (!article) {
      return res.status(404).json({ error: 'Article not found or not authorized' });
    }
    
    await ArticleComment.deleteMany({ article: req.params.id });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getArticleComments = async (req, res) => {
  try {
    const comments = await ArticleComment.find({ article: req.params.id })
      .populate('author', 'name avatar role')
      .sort({ createdAt: 1 });
    
    const commentsData = await Promise.all(comments.map(async c => {
      let authorProfession = null;
      if (c.author.role === 'provider') {
        const provider = await Provider.findOne({ user: c.author._id });
        authorProfession = provider?.profession || null;
      }
      return {
        id: c._id.toString(),
        articleId: c.article.toString(),
        authorId: c.author._id.toString(),
        authorName: c.author.name,
        authorAvatar: c.author.avatar,
        authorRole: c.author.role,
        authorProfession,
        content: c.content,
        createdAt: c.createdAt,
      };
    }));
    
    res.json(commentsData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createArticleComment = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const userId = req.user.id.toString();
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { content } = req.body;
    
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Comment content is required' });
    }
    
    const article = await Article.findById(req.params.id);
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }
    
    const comment = await ArticleComment.create({
      article: req.params.id,
      author: userId,
      content: content.trim(),
    });
    
    article.commentsCount = (article.commentsCount || 0) + 1;
    await article.save();
    
    const populatedComment = await ArticleComment.findById(comment._id).populate('author', 'name avatar role');
    
    let authorProfession = null;
    if (user.role === 'provider') {
      const provider = await Provider.findOne({ user: userId });
      authorProfession = provider?.profession || null;
    }
    
    res.json({
      success: true,
      comment: {
        id: populatedComment._id.toString(),
        articleId: populatedComment.article.toString(),
        authorId: populatedComment.author._id.toString(),
        authorName: populatedComment.author.name,
        authorAvatar: populatedComment.author.avatar,
        authorRole: populatedComment.author.role,
        authorProfession,
        content: populatedComment.content,
        createdAt: populatedComment.createdAt,
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};