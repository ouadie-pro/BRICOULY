const authService = require('./authService');
const { asyncHandler, ApiResponse } = require('../../shared/utils/responseWrapper');
const { upload } = require('../../shared/middleware/upload');

const signup = asyncHandler(async (req, res) => {
  const result = await authService.signup(req.body);
  return ApiResponse.created(res, {
    user: result.user,
    accessToken: result.accessToken,
    refreshToken: result.refreshToken
  });
});

const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  return ApiResponse.success(res, {
    user: result.user,
    accessToken: result.accessToken,
    refreshToken: result.refreshToken
  });
});

const getMe = asyncHandler(async (req, res) => {
  const user = await authService.getMe(req.user.id);
  return ApiResponse.success(res, user);
});

const updateProfile = asyncHandler(async (req, res) => {
  const user = await authService.updateProfile(req.user.id, req.body);
  return ApiResponse.success(res, { user });
});

const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    return ApiResponse.error(res, 'No file uploaded', 400);
  }
  
  const avatarUrl = `/uploads/${req.file.filename}`;
  return ApiResponse.success(res, { filePath: avatarUrl });
});

const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    return ApiResponse.error(res, 'Refresh token is required', 400);
  }
  
  const result = await authService.refreshAccessToken(refreshToken);
  return ApiResponse.success(res, result);
});

const getSpecializations = asyncHandler(async (req, res) => {
  const specializations = authService.getSpecializations();
  return ApiResponse.success(res, { specializations });
});

const incrementProfileView = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const User = require('../../models/User');
  
  const user = await User.findByIdAndUpdate(
    id,
    { $inc: { profileViews: 1 } },
    { new: true }
  );
  
  if (!user) {
    return ApiResponse.error(res, 'User not found', 404);
  }
  
  return ApiResponse.success(res, { profileViews: user.profileViews });
});

module.exports = {
  signup,
  login,
  getMe,
  updateProfile,
  uploadAvatar,
  refreshToken,
  getSpecializations,
  incrementProfileView
};