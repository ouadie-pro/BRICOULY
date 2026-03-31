const Video = require('../models/Video');

exports.getVideos = async (req, res) => {
  try {
    const videos = await Video.find().populate('user', 'name avatar role').sort({ createdAt: -1 });
    const videosWithUsers = videos.map(v => ({
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
    res.status(500).json({ error: error.message });
  }
};

exports.createVideo = async (req, res) => {
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
};

exports.deleteVideo = async (req, res) => {
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
};