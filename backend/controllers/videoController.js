const mongoose = require('mongoose');
const Video = require('../models/Video');
const User = require('../models/User');

exports.getVideos = async (req, res) => {
  try {
    const videos = await Video.find().populate('user', 'name avatar role').sort({ createdAt: -1 });
    const videosWithUsers = videos
      .filter(v => v.user)
      .map(v => ({
        id: v._id.toString(),
        userId: v.user._id.toString(),
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
    console.error('getVideos error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.createVideo = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const userId = req.user.id.toString();
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
        id: populatedVideo._id.toString(),
        userId: populatedVideo.user._id.toString(),
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
};

exports.likeVideo = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const userId = req.user.id.toString();
    const video = await Video.findById(req.params.id);
    
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }
    
    const userIdObj = userId ? new mongoose.Types.ObjectId(userId) : null;
    const alreadyLiked = userIdObj && video.likedBy.some(id => id.toString() === userId);
    
    if (alreadyLiked) {
      video.likedBy = video.likedBy.filter(id => id.toString() !== userId);
      video.likes = Math.max(0, video.likes - 1);
    } else {
      if (userIdObj) {
        video.likedBy.push(userIdObj);
      }
      video.likes += 1;
    }
    
    await video.save();
    
    res.json({ success: true, likes: video.likes, liked: !alreadyLiked });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteVideo = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const userId = req.user.id.toString();
    const video = await Video.findOneAndDelete({ _id: req.params.id, user: userId });
    
    if (!video) {
      return res.status(404).json({ error: 'Video not found or not authorized' });
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.incrementView = async (req, res) => {
  try {
    const video = await Video.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    );
    
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }
    
    res.json({ success: true, views: video.views });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};