const Application = require('../models/Application');
const Post = require('../models/Post');
const Provider = require('../models/Provider');
const User = require('../models/User');
const Notification = require('../models/Notification');

exports.applyToPost = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const { postId, message, proposedPrice } = req.body;

    if (!postId) {
      return res.status(400).json({ error: 'Post ID is required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(403).json({ error: 'User not found' });
    }

    const provider = await Provider.findOne({ user: userId });
    if (!provider) {
      return res.status(403).json({ error: 'Only providers can apply to posts' });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const existing = await Application.findOne({ post: postId, user: userId });
    if (existing) {
      return res.status(400).json({ error: 'You have already applied to this post' });
    }

    const application = await Application.create({
      post: postId,
      provider: provider._id,
      user: userId,
      message: message || '',
      proposedPrice: proposedPrice || null,
    });

    const populatedApp = await Application.findById(application._id)
      .populate('user', 'name avatar')
      .populate('provider');

    if (post.author.toString() !== userId) {
      await Notification.create({
        user: post.author,
        type: 'application',
        title: 'New Application',
        text: `${user.name} applied to your post`,
        fromUser: userId,
      });

      const io = req.app.get('io');
      if (io) {
        io.to(`user:${post.author.toString()}`).emit('notification', {
          type: 'application',
          title: 'New Application',
          text: `${user.name} applied to your post`,
          fromUser: userId,
        });
      }
    }

    res.status(201).json({
      success: true,
      application: {
        id: populatedApp._id.toString(),
        postId: populatedApp.post.toString(),
        providerId: populatedApp.provider._id.toString(),
        userName: populatedApp.user.name,
        userAvatar: populatedApp.user.avatar,
        message: populatedApp.message,
        proposedPrice: populatedApp.proposedPrice,
        status: populatedApp.status,
        createdAt: populatedApp.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getPostApplications = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const { postId } = req.params;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (post.author.toString() !== userId) {
      return res.status(403).json({ error: 'Not authorized to view applications' });
    }

    const applications = await Application.find({ post: postId })
      .populate('user', 'name avatar')
      .populate({
        path: 'provider',
        populate: { path: 'user', select: 'name avatar phone' },
      })
      .sort({ createdAt: -1 });

    const appsData = applications.map(app => ({
      id: app._id.toString(),
      userId: app.user._id.toString(),
      userName: app.user.name,
      userAvatar: app.user.avatar,
      providerDbId: app.provider._id.toString(),
      providerPhone: app.provider.user?.phone,
      message: app.message,
      proposedPrice: app.proposedPrice,
      status: app.status,
      createdAt: app.createdAt,
    }));

    res.json(appsData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getMyApplications = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];

    const applications = await Application.find({ user: userId })
      .populate('post', 'content serviceType')
      .sort({ createdAt: -1 });

    const appsData = applications.map(app => ({
      id: app._id.toString(),
      postId: app.post._id.toString(),
      postContent: app.post.content,
      serviceType: app.post.serviceType,
      message: app.message,
      proposedPrice: app.proposedPrice,
      status: app.status,
      createdAt: app.createdAt,
    }));

    res.json(appsData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateApplicationStatus = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const { applicationId, status } = req.body;

    if (!applicationId || !status) {
      return res.status(400).json({ error: 'Application ID and status are required' });
    }

    if (!['pending', 'accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const application = await Application.findById(applicationId);
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const post = await Post.findById(application.post);
    if (post.author.toString() !== userId) {
      return res.status(403).json({ error: 'Not authorized to update this application' });
    }

    application.status = status;
    application.updatedAt = new Date();
    await application.save();

    const providerUser = await User.findById(application.user);
    await Notification.create({
      user: application.user,
      type: 'application_update',
      title: `Application ${status}`,
      text: `Your application has been ${status}`,
      fromUser: userId,
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`user:${application.user.toString()}`).emit('notification', {
        type: 'application_update',
        title: `Application ${status}`,
        text: `Your application has been ${status}`,
        fromUser: userId,
      });
    }

    res.json({ success: true, status });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.withdrawApplication = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const { applicationId } = req.params;

    const application = await Application.findById(applicationId);
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    if (application.user.toString() !== userId) {
      return res.status(403).json({ error: 'Not authorized to withdraw this application' });
    }

    if (application.status !== 'pending') {
      return res.status(400).json({ error: 'Can only withdraw pending applications' });
    }

    await application.deleteOne();

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
