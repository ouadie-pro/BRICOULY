import { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { 
  FiPlus, FiPlay, FiHeart, FiEye, FiVideo, FiX, FiSearch,
  FiHome, FiClock, FiBookmark, FiChevronRight, FiMessageCircle,
  FiShare2, FiMoreHorizontal, FiUser, FiCheck, FiVolume2
} from 'react-icons/fi';

export default function VideosScreen({ isDesktop }) {
  const [videos, setVideos] = useState([]);
  const [filteredVideos, setFilteredVideos] = useState([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('home');
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [playingVideo, setPlayingVideo] = useState(null);
  const videoInputRef = useRef(null);
  const videoRef = useRef(null);

  const isProvider = currentUser?.role === 'provider';

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setCurrentUser(user);
    loadVideos();
  }, []);

  useEffect(() => {
    filterVideos();
  }, [videos, searchQuery, activeFilter, currentUser]);

  useEffect(() => {
    if (selectedVideo && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, [selectedVideo]);

  const loadVideos = async () => {
    const videosData = await api.getVideos();
    setVideos(videosData || []);
  };

  const filterVideos = () => {
    let filtered = [...videos];
    
    if (searchQuery) {
      filtered = filtered.filter(v => 
        v.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.userName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (activeFilter === 'mine' && currentUser) {
      filtered = filtered.filter(v => 
        String(v.userId) === String(currentUser.id)
      );
    }
    
    setFilteredVideos(filtered);
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

  const handleLikeVideo = async (videoId, e) => {
    e?.stopPropagation();
    const res = await api.likeVideo(videoId);
    if (res.success) {
      setVideos(videos.map(v => v.id === videoId ? { ...v, likes: res.likes, isLiked: !v.isLiked } : v));
    }
  };

  const handleViewVideo = async (video) => {
    setPlayingVideo(video);
    setSelectedVideo(video);
    if (video.id) {
      try {
        const res = await api.incrementVideoView(video.id);
        if (res.success) {
          setVideos(videos.map(v => v.id === video.id ? { ...v, views: (v.views || 0) + 1 } : v));
        }
      } catch (err) {
        console.error('Error incrementing view:', err);
      }
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const formatViews = (views) => {
    if (!views) return '0';
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toString();
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getVideoUrl = (video) => {
    if (!video.videoUrl) return '';
    return video.videoUrl.startsWith('http') 
      ? video.videoUrl 
      : window.location.origin + video.videoUrl;
  };

  const getAvatarUrl = (video) => {
    if (!video.userAvatar) return null;
    return video.userAvatar.startsWith('http')
      ? video.userAvatar
      : window.location.origin + video.userAvatar;
  };

  const VideoCard = ({ video, featured = false }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [duration, setDuration] = useState('');
    const videoUrl = getVideoUrl(video);
    const avatarUrl = getAvatarUrl(video);

    const handleLoadedMetadata = (e) => {
      if (e.target.duration && !isNaN(e.target.duration)) {
        setDuration(formatDuration(e.target.duration));
      }
    };

    return (
      <div 
        className={`group bg-white rounded-xl overflow-hidden shadow-sm border border-slate-200 cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 ${
          featured ? 'col-span-full' : ''
        }`}
        onClick={() => handleViewVideo(video)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className={`relative bg-black ${featured ? 'aspect-video' : 'aspect-video'}`}>
          <video 
            src={videoUrl}
            className="w-full h-full object-cover"
            preload="metadata"
            onLoadedMetadata={handleLoadedMetadata}
            muted
            playsInline
          />
          <div 
            className={`absolute inset-0 bg-black/30 flex items-center justify-center transition-opacity duration-200 ${
              isHovered ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
              <FiPlay style={{ fontSize: '28px', color: '#1f2937' }} className="ml-1" />
            </div>
          </div>
          {duration && (
            <div className="absolute bottom-3 right-3 bg-black/80 text-white text-xs font-medium px-2 py-1 rounded">
              {duration}
            </div>
          )}
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              className="p-2 bg-black/50 rounded-full text-white hover:bg-black/70 mr-2"
              onClick={(e) => { e.stopPropagation(); }}
              title="Watch later"
            >
              <FiClock style={{ fontSize: '16px' }} />
            </button>
          </div>
        </div>
        <div className="p-3">
          <div className="flex items-start gap-3">
            {avatarUrl ? (
              <img 
                src={avatarUrl} 
                alt={video.userName}
                className="w-9 h-9 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-slate-500">
                  {video.userName?.charAt(0)?.toUpperCase() || '?'}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-slate-900 text-sm leading-snug line-clamp-2 mb-1">
                {video.title}
              </h3>
              <p className="text-xs text-slate-500">
                {video.userName}
                <span className="mx-1">•</span>
                {formatViews(video.views)} views
                <span className="mx-1">•</span>
                {formatDate(video.createdAt)}
              </p>
            </div>
            <button 
              className="text-slate-400 hover:text-slate-600 p-1 -mr-1"
              onClick={(e) => e.stopPropagation()}
            >
              <FiMoreHorizontal style={{ fontSize: '18px' }} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const SidebarVideoItem = ({ video }) => {
    const videoUrl = getVideoUrl(video);
    
    return (
      <div 
        className="flex gap-2 cursor-pointer hover:bg-slate-100 p-2 rounded-lg transition-colors"
        onClick={() => handleViewVideo(video)}
      >
        <div className="relative w-32 aspect-video bg-slate-200 rounded-lg overflow-hidden flex-shrink-0">
          <video 
            src={videoUrl}
            className="w-full h-full object-cover"
            preload="metadata"
            muted
          />
          <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] px-1 py-0.5 rounded">
            {formatDuration(video.duration)}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-medium text-slate-900 line-clamp-2 leading-snug">
            {video.title}
          </h4>
          <p className="text-[10px] text-slate-500 mt-1">
            {video.userName}
          </p>
        </div>
      </div>
    );
  };

  const Sidebar = () => (
    <aside className="w-72 flex-shrink-0 bg-white rounded-xl border border-slate-200 overflow-hidden h-fit sticky top-20">
      <div className="p-4">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Library</h3>
        <nav className="space-y-1">
          {[
            { id: 'home', icon: FiHome, label: 'Home Videos', active: true },
            { id: 'mine', icon: FiPlay, label: 'My Videos' },
            { id: 'saved', icon: FiBookmark, label: 'Saved Videos' },
            { id: 'later', icon: FiClock, label: 'Watch Later' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveFilter(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                activeFilter === item.id 
                  ? 'bg-blue-50 text-blue-600 font-medium' 
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <item.icon style={{ fontSize: '20px' }} />
              <span className="text-sm">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
      
      <div className="border-t border-slate-200 p-4">
        <h4 className="text-sm font-semibold text-slate-900 mb-3">Suggested Videos</h4>
        <div className="space-y-2">
          {filteredVideos.slice(0, 5).map(video => (
            <SidebarVideoItem key={video.id} video={video} />
          ))}
          {filteredVideos.length === 0 && (
            <p className="text-xs text-slate-500 text-center py-4">No videos yet</p>
          )}
        </div>
      </div>
    </aside>
  );

  const VideoModal = () => {
    if (!selectedVideo) return null;
    const videoUrl = getVideoUrl(selectedVideo);
    const avatarUrl = getAvatarUrl(selectedVideo);

    return (
      <div 
        className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
        onClick={() => { setSelectedVideo(null); setPlayingVideo(null); }}
      >
        <button 
          className="absolute top-4 right-4 p-2 text-white/80 hover:text-white transition-colors"
          onClick={() => { setSelectedVideo(null); setPlayingVideo(null); }}
        >
          <FiX style={{ fontSize: '28px' }} />
        </button>
        
        <div 
          className="w-full max-w-4xl mx-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-black rounded-xl overflow-hidden aspect-video">
            <video 
              ref={videoRef}
              src={videoUrl}
              className="w-full h-full"
              controls
              autoPlay
              playsInline
            />
          </div>
          
          <div className="bg-white rounded-b-xl p-6">
            <div className="flex items-start gap-4">
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt={selectedVideo.userName}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center">
                  <span className="text-lg font-bold text-slate-500">
                    {selectedVideo.userName?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                </div>
              )}
              <div className="flex-1">
                <h2 className="text-xl font-bold text-slate-900">{selectedVideo.title}</h2>
                <p className="text-sm text-slate-500 mt-1">
                  {selectedVideo.userName}
                  <span className="mx-2">•</span>
                  {formatViews(selectedVideo.views)} views
                  <span className="mx-2">•</span>
                  {formatDate(selectedVideo.createdAt)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={(e) => handleLikeVideo(selectedVideo.id, e)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${
                    selectedVideo.isLiked 
                      ? 'bg-red-50 text-red-500' 
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <FiHeart fill={selectedVideo.isLiked ? 'currentColor' : 'none'} style={{ fontSize: '18px' }} />
                  <span className="text-sm font-medium">{selectedVideo.likes || 0}</span>
                </button>
                <button className="p-2 bg-slate-100 rounded-full text-slate-700 hover:bg-slate-200 transition-colors">
                  <FiShare2 style={{ fontSize: '18px' }} />
                </button>
              </div>
            </div>
            
            {selectedVideo.description && (
              <div className="mt-4 p-4 bg-slate-50 rounded-xl">
                <p className="text-sm text-slate-700">{selectedVideo.description}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (!isDesktop) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-100">
        <div className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 p-4">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" style={{ fontSize: '18px' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search videos..."
                className="w-full h-10 pl-10 pr-4 rounded-full bg-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {isProvider && (
              <button
                onClick={() => setShowUploadModal(true)}
                className="flex items-center justify-center size-10 rounded-full bg-blue-600 text-white"
              >
                <FiPlus style={{ fontSize: '22px' }} />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 p-4 space-y-4">
          {filteredVideos.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 rounded-full bg-slate-200 flex items-center justify-center mx-auto">
                <FiVideo style={{ fontSize: '40px' }} className="text-slate-400" />
              </div>
              <p className="text-slate-500 mt-4 font-medium">No videos found</p>
              <p className="text-slate-400 text-sm mt-1">
                {searchQuery ? 'Try a different search' : 'Upload the first video!'}
              </p>
            </div>
          ) : (
            filteredVideos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))
          )}
        </div>

        {showUploadModal && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Upload Video</h3>
                <button onClick={() => setShowUploadModal(false)} className="text-slate-400">
                  <FiX style={{ fontSize: '24px' }} />
                </button>
              </div>
              <div
                onClick={() => videoInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-500 transition-colors"
              >
                {videoPreview ? (
                  <video src={videoPreview} className="w-full max-h-40 object-contain rounded" />
                ) : (
                  <>
                    <FiVideo style={{ fontSize: '40px' }} className="text-slate-400 mx-auto" />
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
                className="w-full mt-4 px-3 py-2 rounded-lg border border-slate-200"
              />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description (optional)"
                className="w-full mt-3 px-3 py-2 rounded-lg border border-slate-200 resize-none"
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
                  className="flex-1 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-50"
                >
                  {isUploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </div>
          </div>
        )}

        {selectedVideo && <VideoModal />}
      </div>
    );
  }

  return (
    <div className="flex gap-6 h-[calc(100vh-64px)] overflow-hidden p-6 bg-slate-50">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-slate-900">Videos</h1>
            <div className="flex items-center gap-3">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" style={{ fontSize: '16px' }} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search videos..."
                  className="w-64 h-10 pl-10 pr-4 rounded-full bg-white border border-slate-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              {isProvider && (
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                  <FiPlus style={{ fontSize: '18px' }} />
                  Upload
                </button>
              )}
            </div>
          </div>

          {filteredVideos.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
              <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center mx-auto">
                <FiVideo style={{ fontSize: '48px' }} className="text-slate-300" />
              </div>
              <p className="text-slate-500 mt-4 text-lg font-medium">No videos yet</p>
              <p className="text-slate-400 text-sm mt-2 max-w-md mx-auto">
                {isProvider 
                  ? 'Share service demos, before/after projects, or helpful tips for clients.'
                  : 'Service demonstration videos from providers will appear here.'
                }
              </p>
              {isProvider && (
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Upload First Video
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredVideos.map((video, index) => (
                  <VideoCard 
                    key={video.id} 
                    video={video}
                    featured={index === 0}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Upload Video</h3>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-slate-600">
                <FiX style={{ fontSize: '24px' }} />
              </button>
            </div>
            <div className="bg-blue-50 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-700 font-medium">Video ideas for providers:</p>
              <ul className="text-xs text-blue-600 mt-1 space-y-0.5">
                <li>• Service demonstrations</li>
                <li>• Before/after project showcases</li>
                <li>• Tips and how-to guides</li>
              </ul>
            </div>
            <div
              onClick={() => videoInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-500 transition-colors"
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
              className="w-full mt-4 px-4 py-3 rounded-lg border border-slate-200"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (optional)"
              className="w-full mt-3 px-4 py-3 rounded-lg border border-slate-200 resize-none"
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
                className="flex-1 py-3 rounded-lg bg-blue-600 text-white font-medium disabled:opacity-50"
              >
                {isUploading ? 'Uploading...' : 'Upload Video'}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedVideo && <VideoModal />}
    </div>
  );
}
