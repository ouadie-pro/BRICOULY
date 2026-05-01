// backend/controllers/followController.js
const mongoose = require('mongoose');
const User = require('../models/User');
const Follow = require('../models/Follow');
const FollowRequest = require('../models/FollowRequest');
const Notification = require('../models/Notification');
const Provider = require('../models/Provider');

const isValidObjectId = (id) => {
  if (!id || typeof id !== 'string') return false;
  return mongoose.Types.ObjectId.isValid(id) && String(id).length === 24 && /^[a-fA-F0-9]{24}$/.test(String(id));
};

exports.followUser = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const userId = req.user.id.toString();
    const targetUserId = req.params.userId;
    
    if (!userId || !targetUserId) {
      return res.status(400).json({ success: false, error: 'User IDs required' });
    }
    
    if (userId === targetUserId) {
      return res.status(400).json({ success: false, error: 'Cannot follow yourself' });
    }
    
    if (!isValidObjectId(userId) || !isValidObjectId(targetUserId)) {
      return res.status(400).json({ success: false, error: 'Invalid user ID format' });
    }
    
    const fromUser = await User.findById(userId);
    const targetUser = await User.findById(targetUserId);
    
    if (!fromUser || !targetUser) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    // Check if already following - if so, unfollow
    const existingFollow = await Follow.findOne({ 
      user: new mongoose.Types.ObjectId(userId), 
      targetUser: new mongoose.Types.ObjectId(targetUserId) 
    });
    
    if (existingFollow) {
      // Unfollow - remove the follow
      await Follow.findByIdAndDelete(existingFollow._id);
      return res.json({ success: true, following: false, message: 'Unfollowed successfully' });
    }
    
    // For private profiles, you might want to create a follow request
    // For now, create direct follow for simplicity
    await Follow.create({
      user: new mongoose.Types.ObjectId(userId),
      targetUser: new mongoose.Types.ObjectId(targetUserId),
    });
    
    // Notify the target user
    await Notification.create({
      user: new mongoose.Types.ObjectId(targetUserId),
      type: 'new_follower',
      title: 'New Follower',
      text: `${fromUser.name} started following you`,
      fromUser: new mongoose.Types.ObjectId(userId),
    });
    
    res.json({ 
      success: true, 
      following: true, 
      message: 'Following successfully'
    });
  } catch (error) {
    console.error('Error in followUser:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.respondFollowRequest = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    let userId = req.user.id.toString();
    let { requestId, action } = req.body;
    
    if (!requestId || !userId) {
      return res.status(400).json({ success: false, error: 'Missing requestId or userId' });
    }

    const requestIdStr = String(requestId).trim();
    const userIdStr = String(userId).trim();
    
    if (!isValidObjectId(requestIdStr)) {
      return res.status(400).json({ success: false, error: 'Invalid requestId format' });
    }
    
    if (!isValidObjectId(userIdStr)) {
      return res.status(400).json({ success: false, error: 'Invalid user ID format' });
    }

    const followRequest = await FollowRequest.findById(requestIdStr)
      .populate('fromUser', 'name avatar')
      .populate('toUser', 'name avatar');

    if (!followRequest) {
      return res.status(404).json({ success: false, error: 'Follow request not found' });
    }

    if (!followRequest.fromUser || !followRequest.toUser) {
      return res.status(400).json({ success: false, error: 'Follow request data corrupted' });
    }

    if (followRequest.toUser._id.toString() !== userIdStr) {
      return res.status(403).json({ success: false, error: 'Unauthorized to respond to this request' });
    }

    if (followRequest.status !== 'pending') {
      return res.status(400).json({ success: false, error: 'Follow request already processed' });
    }

    if (action === 'accept') {
      await Follow.create({
        user: followRequest.fromUser._id,
        targetUser: followRequest.toUser._id,
      });
      
      followRequest.status = 'accepted';
      await followRequest.save();
      
      await Notification.deleteOne({
        user: followRequest.toUser._id,
        type: 'follow_request',
        requestId: followRequest._id,
      });
      
      await Notification.create({
        user: followRequest.fromUser._id,
        type: 'follow_accepted',
        title: 'Follow Request Accepted',
        text: `${followRequest.toUser.name} accepted your follow request`,
        fromUser: followRequest.toUser._id,
      });
      
      return res.json({ success: true, message: 'Follow request accepted', following: true });

    } else if (action === 'decline') {
      followRequest.status = 'declined';
      await followRequest.save();
      
      await Notification.deleteOne({
        user: followRequest.toUser._id,
        type: 'follow_request',
        requestId: followRequest._id,
      });
      
      return res.json({ success: true, message: 'Follow request declined', following: false });
    } else {
      return res.status(400).json({ success: false, error: 'Invalid action. Must be "accept" or "decline"' });
    }

  } catch (error) {
    console.error('Error in /api/follow/respond:', error);
    if (error.code === 11000) {
      return res.status(409).json({ success: false, error: 'Follow relationship already exists' });
    }
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.getFollowRequests = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const userId = req.user.id.toString();
    
    if (!userId || !isValidObjectId(userId)) {
      return res.json([]);
    }
    
    const pendingRequests = await FollowRequest.find({ 
      toUser: new mongoose.Types.ObjectId(userId), 
      status: 'pending' 
    }).populate('fromUser', 'name avatar').lean();
    
    const requestsData = pendingRequests.map(r => ({
      id: r._id.toString(),
      _id: r._id.toString(),
      fromUserId: r.fromUser._id.toString(),
      fromUserName: r.fromUser.name,
      fromUserAvatar: r.fromUser.avatar,
      toUserId: r.toUser.toString(),
      status: r.status,
      createdAt: r.createdAt,
    }));
    
    res.json(requestsData);
  } catch (error) {
    console.error('[getFollowRequests] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// FIXED: Returns array of user objects with id property
exports.getFollowing = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const userId = req.user.id.toString();
    
    if (!userId || !isValidObjectId(userId)) {
      return res.json([]);
    }
    
    const following = await Follow.find({ user: new mongoose.Types.ObjectId(userId) })
      .populate('targetUser', 'name avatar location role');
    
    const followingData = await Promise.all(following.map(async f => {
      if (!f.targetUser) return null;
      const provider = await Provider.findOne({ user: f.targetUser._id });
      return {
        id: f.targetUser._id.toString(),
        name: f.targetUser.name,
        avatar: f.targetUser.avatar,
        role: provider ? 'provider' : 'user',
        profession: provider?.profession || '',
        location: f.targetUser.location || '',
      };
    }));
    
    res.json(followingData.filter(Boolean));
  } catch (error) {
    console.error('Error in getFollowing:', error.message);
    res.status(500).json({ error: error.message });
  }
};

exports.getFollowers = async (req, res) => {
  try {
    const userId = req.params.id;
    
    if (!userId || !isValidObjectId(userId)) {
      return res.json([]);
    }
    
    const follows = await Follow.find({ targetUser: new mongoose.Types.ObjectId(userId) }).populate('user', 'name avatar location');
    const followers = await Promise.all(follows.map(async f => {
      if (!f.user) return null;
      const provider = await Provider.findOne({ user: f.user._id });
      return {
        id: f.user._id.toString(),
        name: f.user.name,
        avatar: f.user.avatar,
        role: provider ? 'provider' : 'user',
        profession: provider?.profession || '',
        location: f.user.location || '',
      };
    }));
    res.json(followers.filter(Boolean));
  } catch (error) {
    console.error('Error in getFollowers:', error.message);
    res.status(500).json({ error: error.message });
  }
};

exports.getFollowingByUserId = async (req, res) => {
  try {
    const userId = req.params.id;
    
    if (!userId || !isValidObjectId(userId)) {
      return res.json([]);
    }
    
    const following = await Follow.find({ user: new mongoose.Types.ObjectId(userId) }).populate('targetUser', 'name avatar location');
    const followingData = await Promise.all(following.map(async f => {
      if (!f.targetUser) return null;
      const provider = await Provider.findOne({ user: f.targetUser._id });
      return {
        id: f.targetUser._id.toString(),
        name: f.targetUser.name,
        avatar: f.targetUser.avatar,
        role: provider ? 'provider' : 'user',
        profession: provider?.profession || '',
        location: f.targetUser.location || '',
      };
    }));
    res.json(followingData.filter(Boolean));
  } catch (error) {
    console.error('Error in getFollowingByUserId:', error.message);
    res.status(500).json({ error: error.message });
  }
};

exports.checkFollowStatus = async (req, res) => {
  try {
    const userId = req.user?.id?.toString() || req.headers['x-user-id'];
    const targetUserId = req.params.userId;
    
    if (!userId || !targetUserId) {
      return res.json({ following: false });
    }
    
    if (!isValidObjectId(userId) || !isValidObjectId(targetUserId)) {
      return res.json({ following: false });
    }
    
    const existingFollow = await Follow.findOne({
      user: new mongoose.Types.ObjectId(userId),
      targetUser: new mongoose.Types.ObjectId(targetUserId)
    });
    
    res.json({ following: !!existingFollow });
  } catch (error) {
    console.error('Error in checkFollowStatus:', error.message);
    res.status(500).json({ following: false, error: error.message });
  }
};