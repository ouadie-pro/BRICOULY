const Article = require('../models/Article');

exports.getArticles = async (req, res) => {
  try {
    const articles = await Article.find().populate('user', 'name avatar role').sort({ createdAt: -1 });
    const articlesWithUsers = articles.map(a => ({
      id: a._id.toString(),
      userId: a.user._id.toString(),
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
};

exports.getUserArticles = async (req, res) => {
  try {
    const articles = await Article.find({ user: req.params.id }).sort({ createdAt: -1 });
    res.json(articles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createArticle = async (req, res) => {
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
        id: populatedArticle._id.toString(),
        userId: populatedArticle.user._id.toString(),
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
};

exports.likeArticle = async (req, res) => {
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
};

exports.deleteArticle = async (req, res) => {
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
};