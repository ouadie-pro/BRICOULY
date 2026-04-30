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
    
    // Create direct follow (no request needed)
    await Follow.create({
      user: new mongoose.Types.ObjectId(userId),
      targetUser: new mongoose.Types.ObjectId(targetUserId),
    });
    
    // Optionally notify the target user
    await Notification.create({
      user: new mongoose.Types.ObjectId(targetUserId),
      type: 'follow_accepted',
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
    console.error('Error in follow request:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.respondFollowRequest = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    let userId = req.user.id.toString();
    let { requestId, action, userId: bodyUserId } = req.body;
    
    console.log('respondFollowRequest - header userId:', userId, 'body userId:', bodyUserId, 'requestId:', requestId);
    
    // Also check body for userId in case frontend sends it there
    if (!userId && bodyUserId) {
      userId = bodyUserId;
    }
    
    if (!requestId || !userId) {
      return res.status(400).json({ success: false, error: 'Missing requestId or userId' });
    }

    // Handle case where userId might be an array (comma-separated values)
    if (Array.isArray(userId)) {
      userId = userId[0];
    }
    
    // Trim whitespace and newlines
    const requestIdStr = String(requestId).trim().replace(/[\r\n]/g, '');
    const userIdStr = String(userId).trim().replace(/[\r\n]/g, '');
    
    console.log('respondFollowRequest - final userIdStr:', userIdStr, 'length:', userIdStr.length, 'isValid:', mongoose.Types.ObjectId.isValid(userIdStr));
    
    // Check with regex for exact 24 hex char match
    const isValidObjectId = (id) => /^[a-fA-F0-9]{24}$/.test(id);
    
    if (!isValidObjectId(requestIdStr)) {
      return res.status(400).json({ success: false, error: 'Invalid requestId format', received: requestIdStr, len: requestIdStr.length });
    }
    
    if (!isValidObjectId(userIdStr)) {
      return res.status(400).json({ success: false, error: 'Invalid user ID format', received: userIdStr, len: userIdStr.length });
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
    console.log('[getFollowRequests] Request received', { headers: req.headers });
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const userId = req.user.id.toString();
    console.log('[getFollowRequests] userId:', userId);
    
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      console.log('[getFollowRequests] Invalid userId');
      return res.status(400).json({ success: false, error: 'Invalid userId' });
    }
    
    const pendingRequests = await FollowRequest.find({ 
      toUser: new mongoose.Types.ObjectId(userId), 
      status: 'pending' 
    }).populate('fromUser', 'name avatar').lean();
    console.log('[getFollowRequests] Found requests:', pendingRequests.length);
    
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
    console.error('[getFollowRequests] Error:', error.message, error.stack);
    res.status(500).json({ error: error.message });
  }
};

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