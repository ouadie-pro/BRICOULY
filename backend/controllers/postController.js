const User = require('../models/User');
const Provider = require('../models/Provider');
const Post = require('../models/Post');
const Comment = require('../models/Comment');

exports.getPosts = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const posts = await Post.find()
      .populate('author', 'name avatar role')
      .sort({ createdAt: -1 });
    
    const postsWithAuthor = await Promise.all(posts.map(async p => {
      let authorProfession = null;
      if (p.author.role === 'provider') {
        const provider = await Provider.findOne({ user: p.author._id });
        authorProfession = provider?.profession || null;
      }
      
      const isLiked = userId ? p.likes.some(id => id.toString() === userId) : false;
      const images = p.images?.map(img => 
        img.startsWith('http') ? img : `${req.protocol}://${req.get('host')}${img}`
      ) || [];
      
      return {
        id: p._id.toString(),
        authorId: p.author._id.toString(),
        authorName: p.author.name,
        authorAvatar: p.author.avatar,
        authorRole: p.author.role,
        authorProfession,
        content: p.content,
        images,
        likesCount: p.likes?.length || 0,
        isLiked,
        commentsCount: p.commentsCount || 0,
        type: p.type,
        createdAt: p.createdAt,
      };
    }));
    res.json(postsWithAuthor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createPost = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { content, type } = req.body;
    
    let images = [];
    if (req.files && req.files.length > 0) {
      images = req.files.map(file => `/uploads/${file.filename}`);
    }
    
    const post = await Post.create({
      author: userId,
      content,
      images,
      type: type || 'post',
      likes: [],
      commentsCount: 0,
    });
    
    const populatedPost = await Post.findById(post._id).populate('author', 'name avatar role');
    
    let authorProfession = null;
    if (user.role === 'provider') {
      const provider = await Provider.findOne({ user: userId });
      authorProfession = provider?.profession || null;
    }
    
    const imageUrls = populatedPost.images?.map(img => 
      img.startsWith('http') ? img : `${req.protocol}://${req.get('host')}${img}`
    ) || [];
    
    res.json({ 
      success: true, 
      post: {
        id: populatedPost._id.toString(),
        authorId: populatedPost.author._id.toString(),
        authorName: populatedPost.author.name,
        authorAvatar: populatedPost.author.avatar,
        authorRole: populatedPost.author.role,
        authorProfession,
        content: populatedPost.content,
        images: imageUrls,
        likesCount: 0,
        isLiked: false,
        commentsCount: 0,
        type: populatedPost.type,
        createdAt: populatedPost.createdAt,
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.likePost = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const mongoose = require('mongoose');
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    const userIdObj = new mongoose.Types.ObjectId(userId);
    const alreadyLiked = post.likes.some(id => id.toString() === userId);
    
    if (alreadyLiked) {
      post.likes = post.likes.filter(id => id.toString() !== userId);
    } else {
      post.likes.push(userIdObj);
    }
    
    await post.save();
    
    res.json({ 
      success: true, 
      likesCount: post.likes.length, 
      isLiked: !alreadyLiked 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getComments = async (req, res) => {
  try {
    const comments = await Comment.find({ post: req.params.id })
      .populate('author', 'name avatar')
      .sort({ createdAt: 1 });
    
    const commentsData = comments.map(c => ({
      id: c._id.toString(),
      postId: c.post.toString(),
      authorId: c.author._id.toString(),
      authorName: c.author.name,
      authorAvatar: c.author.avatar,
      content: c.content,
      createdAt: c.createdAt,
    }));
    
    res.json(commentsData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createComment = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { content } = req.body;
    
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Comment content is required' });
    }
    
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    const comment = await Comment.create({
      post: req.params.id,
      author: userId,
      content: content.trim(),
    });
    
    post.commentsCount = (post.commentsCount || 0) + 1;
    await post.save();
    
    const populatedComment = await Comment.findById(comment._id).populate('author', 'name avatar');
    
    res.json({
      success: true,
      comment: {
        id: populatedComment._id.toString(),
        postId: populatedComment.post.toString(),
        authorId: populatedComment.author._id.toString(),
        authorName: populatedComment.author.name,
        authorAvatar: populatedComment.author.avatar,
        content: populatedComment.content,
        createdAt: populatedComment.createdAt,
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    if (post.author.toString() !== userId) {
      return res.status(403).json({ error: 'You can only delete your own posts' });
    }
    
    await Comment.deleteMany({ post: post._id });
    
    await post.deleteOne();
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};