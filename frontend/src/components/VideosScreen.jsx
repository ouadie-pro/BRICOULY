import { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { FiPlus, FiPlay, FiHeart, FiEye, FiVideo, FiX } from 'react-icons/fi';

export default function VideosScreen({ isDesktop }) {
  const [videos, setVideos] = useState([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const videoInputRef = useRef(null);

  const isProvider = currentUser?.role === 'provider';

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setCurrentUser(user);
    loadVideos();
  }, []);

  const loadVideos = async () => {
    const videosData = await api.getVideos();
    setVideos(videosData);
  };

  const handleVideoSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setVideoFile(file);
      const url = URL.createObjectURL(file);
      setVideoPreview(url);
    }
  };

  const handleUpload = async () => {
    if (!videoFile || !title.trim()) return;

    setIsUploading(true);
    try {
      const result = await api.uploadVideo(videoFile, title, description);
      if (result.success) {
        setVideos([result.video, ...videos]);
        setShowUploadModal(false);
        setVideoFile(null);
        setVideoPreview(null);
        setTitle('');
        setDescription('');
      }
    } catch (err) {
      console.error('Error uploading video:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleLikeVideo = async (videoId) => {
    const res = await api.likeVideo(videoId);
    if (res.success) {
      setVideos(videos.map(v => v.id === videoId ? { ...v, likes: res.likes } : v));
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays < 1) return 'Today';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (!isDesktop) {
    return (
      <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark pb-24">
        <div className="sticky top-0 z-50 flex items-center bg-card-light dark:bg-card-dark p-4 pb-2 justify-between border-b border-gray-100 dark:border-gray-800 shadow-sm">
          <h2 className="text-lg font-bold text-text-light dark:text-text-dark flex-1 text-center">Videos</h2>
          {isProvider && (
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center justify-center size-10 rounded-full bg-primary text-white"
            >
              <FiPlus style={{ fontSize: '24px' }} />
            </button>
          )}
        </div>

        <div className="p-4 space-y-4">
          {videos.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto">
                <FiVideo style={{ fontSize: '40px' }} className="text-slate-300" />
              </div>
              <p className="text-slate-500 mt-4 font-medium">No videos yet</p>
              <p className="text-slate-400 text-sm mt-1 max-w-xs mx-auto">
                {isProvider 
                  ? 'Upload service demos, before/after projects, or tips for clients'
                  : 'Service videos will appear here'
                }
              </p>
              {isProvider && (
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="mt-4 px-4 py-2 bg-primary text-white rounded-lg"
                >
                  Upload First Video
                </button>
              )}
            </div>
          ) : (
            videos.map((video) => (
              <div key={video.id} className="bg-card-light dark:bg-card-dark rounded-xl overflow-hidden shadow-sm">
                <div className="relative aspect-video bg-slate-900">
                  <video
                    src={video.videoUrl && video.videoUrl.startsWith('http') ? video.videoUrl : (video.videoUrl ? window.location.origin + video.videoUrl : '')}
                    className="w-full h-full object-contain"
                    controls
                  />
                </div>
                <div className="p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-8 h-8 rounded-full bg-cover bg-center"
                      style={{ backgroundImage: video.userAvatar ? `url("${video.userAvatar.startsWith('http') ? video.userAvatar : window.location.origin + video.userAvatar}")` : undefined }}
                    >
                      {!video.userAvatar && (
                        <div className="w-full h-full rounded-full bg-slate-300 flex items-center justify-center">
                          <span className="text-xs font-bold text-slate-500">
                            {video.userName?.charAt(0).toUpperCase() || '?'}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-text-light dark:text-text-dark">{video.userName}</p>
                      <p className="text-xs text-slate-500">{formatDate(video.createdAt)}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium shrink-0 ${
                      video.userRole === 'provider' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {video.userRole === 'provider' ? video.userProfession : 'Client'}
                    </span>
                  </div>
                  <h3 className="font-semibold text-text-light dark:text-text-dark">{video.title}</h3>
                  {video.description && (
                    <p className="text-sm text-slate-500 mt-1">{video.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2">
                    <button
                      onClick={() => handleLikeVideo(video.id)}
                      className="flex items-center gap-1 text-slate-500 text-sm"
                    >
                      <FiHeart style={{ fontSize: '18px' }} />
                      {video.likes}
                    </button>
                    <span className="flex items-center gap-1 text-slate-500 text-sm">
                                            <FiEye style={{ fontSize: '18px' }} />
                      {video.views}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {showUploadModal && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-surface-dark rounded-2xl w-full max-w-md p-4">
              <h3 className="text-lg font-bold mb-4">Upload Video</h3>
              <div
                onClick={() => videoInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center cursor-pointer hover:border-primary transition-colors"
              >
                {videoPreview ? (
                  <video src={videoPreview} className="w-full max-h-40 object-contain rounded" />
                ) : (
                  <>
                    <FiVideo style={{ fontSize: '40px' }} className="text-4xl text-slate-400" />
                    <p className="text-slate-500 mt-2">Tap to select video</p>
                  </>
                )}
              </div>
              <input
                type="file"
                ref={videoInputRef}
                onChange={handleVideoSelect}
                accept="video/*"
                className="hidden"
              />
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Video title"
                className="w-full mt-4 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent"
              />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description (optional)"
                className="w-full mt-3 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent resize-none"
                rows={2}
              />
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 py-2 rounded-lg border border-slate-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={!videoFile || !title.trim() || isUploading}
                  className="flex-1 py-2 rounded-lg bg-primary text-white disabled:opacity-50"
                >
                  {isUploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto w-full">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Videos</h1>
        {isProvider && (
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white hover:bg-blue-600 transition-colors"
          >
            <FiPlus style={{ fontSize: '20px' }} />
            Upload Video
          </button>
        )}
      </div>

      {videos.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center mx-auto">
            <FiVideo style={{ fontSize: '48px' }} className="text-slate-300" />
          </div>
          <p className="text-slate-500 mt-4 text-lg font-medium">No videos yet</p>
          <p className="text-slate-400 text-sm mt-2 max-w-md mx-auto">
            {isProvider 
              ? 'Share service demos, before/after projects, or helpful tips for clients. Great for showcasing your expertise!'
              : 'Service demonstration videos from providers will appear here.'
            }
          </p>
          {isProvider && (
            <button
              onClick={() => setShowUploadModal(true)}
              className="mt-6 px-6 py-3 bg-primary text-white rounded-lg font-medium"
            >
              Upload First Video
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {videos.map((video) => (
            <div key={video.id} className="bg-white rounded-xl overflow-hidden shadow-sm border border-slate-200">
              <div className="relative aspect-video bg-slate-900">
                <video
                  src={video.videoUrl && video.videoUrl.startsWith('http') ? video.videoUrl : (video.videoUrl ? window.location.origin + video.videoUrl : '')}
                  className="w-full h-full object-contain"
                  controls
                />
              </div>
              <div className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-10 h-10 rounded-full bg-cover bg-center"
                    style={{ backgroundImage: video.userAvatar ? `url("${video.userAvatar.startsWith('http') ? video.userAvatar : window.location.origin + video.userAvatar}")` : undefined }}
                  >
                    {!video.userAvatar && (
                      <div className="w-full h-full rounded-full bg-slate-300 flex items-center justify-center">
                        <span className="text-sm font-bold text-slate-500">
                          {video.userName?.charAt(0).toUpperCase() || '?'}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">{video.userName}</p>
                    <p className="text-xs text-slate-500">{formatDate(video.createdAt)}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    video.userRole === 'provider' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {video.userRole === 'provider' ? video.userProfession : 'Client'}
                  </span>
                </div>
                <h3 className="font-semibold text-slate-900 mb-1">{video.title}</h3>
                {video.description && (
                  <p className="text-sm text-slate-500 mb-3">{video.description}</p>
                )}
                <div className="flex items-center gap-4 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => handleLikeVideo(video.id)}
                    className="flex items-center gap-1.5 text-slate-500 hover:text-red-500 text-sm transition-colors"
                  >
                    <FiHeart className="text-[20px]" />
                    {video.likes}
                  </button>
                  <span className="flex items-center gap-1.5 text-slate-500 text-sm">
                    <FiEye className="text-[20px]" />
                    {video.views}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

        {showUploadModal && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-surface-dark rounded-2xl w-full max-w-lg p-6">
              <h3 className="text-xl font-bold mb-4">Upload Video</h3>
              <div className="bg-blue-50 rounded-lg p-3 mb-4">
                <p className="text-sm text-blue-700 font-medium">Video ideas for providers:</p>
                <ul className="text-xs text-blue-600 mt-1 space-y-1">
                  <li>• Service demonstrations</li>
                  <li>• Before/after project showcases</li>
                  <li>• Tips and how-to guides</li>
                  <li>• Quick tips for clients</li>
                </ul>
              </div>
              <div
                onClick={() => videoInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center cursor-pointer hover:border-primary transition-colors"
              >
                {videoPreview ? (
                  <video src={videoPreview} className="w-full max-h-48 object-contain rounded" />
                ) : (
                  <>
                    <FiVideo style={{ fontSize: '48px' }} className="text-slate-400 mx-auto" />
                    <p className="text-slate-500 mt-2">Click to select video file</p>
                    <p className="text-xs text-slate-400 mt-1">MP4, WebM, MOV supported</p>
                  </>
                )}
              </div>
            <input
              type="file"
              ref={videoInputRef}
              onChange={handleVideoSelect}
              accept="video/*"
              className="hidden"
            />
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Video title *"
              className="w-full mt-4 px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (optional)"
              className="w-full mt-3 px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent resize-none"
              rows={3}
            />
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setVideoFile(null);
                  setVideoPreview(null);
                }}
                className="flex-1 py-3 rounded-lg border border-slate-200 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={!videoFile || !title.trim() || isUploading}
                className="flex-1 py-3 rounded-lg bg-primary text-white font-medium disabled:opacity-50"
              >
                {isUploading ? 'Uploading...' : 'Upload Video'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
