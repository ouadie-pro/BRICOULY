import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { 
  FiHeart, FiMessageCircle, FiShare2, FiStar, FiMapPin, FiSearch, 
  FiMenu, FiBell, FiPlayCircle, FiImage, FiX, FiFilter, FiSettings,
  FiHome, FiUser, FiChevronDown, FiTrash2, FiChevronLeft, FiChevronRight
} from 'react-icons/fi';
import { GoTasklist } from 'react-icons/go';
import { getCategoryIcon, categoryIcons, defaultCategories } from '../utils/categoryIcons.jsx';

const ImageGrid = ({ images, compact = false, title = '', video = null }) => {
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const count = images.length;
  const [videoPlaying, setVideoPlaying] = useState(false);

  const openLightbox = (index) => {
    setLightboxIndex(index);
  };

  const closeLightbox = () => {
    setLightboxIndex(null);
  };

  const goNext = () => {
    setLightboxIndex((prev) => (prev + 1) % count);
  };

  const goPrev = () => {
    setLightboxIndex((prev) => (prev - 1 + count) % count);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (lightboxIndex === null) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, count]);

  if (count === 0 && !video) return null;

  const imgClass = "w-full h-full object-cover transition-all duration-300 hover:brightness-95 cursor-pointer";
  const imgStyle = {
    imageRendering: 'auto',
    WebkitImageRendering: 'auto',
    imageOrientation: 'from-image',
    objectFit: 'cover',
    width: '100%',
    maxWidth: '100%',
    maxHeight: '100%'
  };

  const renderVideo = () => (
    <div className="w-full rounded-xl overflow-hidden border border-gray-100">
      <video
        src={video}
        controls
        className="w-full max-h-[500px] object-cover"
        onPlay={() => setVideoPlaying(true)}
        onPause={() => setVideoPlaying(false)}
      />
    </div>
  );

  const renderSingle = () => (
    <div className="w-full rounded-xl overflow-hidden bg-slate-100">
      <img 
        src={images[0]} 
        alt={title || 'Post image'}
        className="w-full max-h-64 object-contain rounded-xl bg-slate-50"
        style={imgStyle}
        loading="lazy"
        onClick={() => openLightbox(0)}
        onError={(e) => {
          e.target.style.display = 'none';
          e.target.parentElement.innerHTML = `
            <div class="w-full h-[400px] flex items-center justify-center bg-slate-200 rounded-xl">
              <div class="text-center">
                <svg class="w-12 h-12 text-slate-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
                <p class="text-slate-500 text-sm">Image not available</p>
              </div>
            </div>
          `;
        }}
      />
    </div>
  );

  const renderTwo = () => (
    <div className="grid grid-cols-2 gap-2 h-[300px]">
      {images.map((img, idx) => (
        <div 
          key={idx} 
          className="relative overflow-hidden rounded-lg bg-slate-100"
        >
          <img 
            src={img} 
            alt={`Image ${idx + 1}`} 
            className="w-full h-full object-cover"
            style={imgStyle}
            loading="lazy"
            onClick={() => openLightbox(idx)}
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.parentElement.innerHTML = `
                <div class="w-full h-full flex items-center justify-center bg-slate-200 rounded-lg">
                  <div class="text-center">
                    <svg class="w-8 h-8 text-slate-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                    <p class="text-slate-500 text-xs">Image not available</p>
                  </div>
                </div>
              `;
            }}
          />
        </div>
      ))}
    </div>
  );

  const renderThree = () => (
    <div className="grid grid-cols-3 gap-2 h-[350px]">
      <div 
        className="col-span-2 row-span-2 overflow-hidden rounded-lg bg-slate-100"
        onClick={() => openLightbox(0)}
      >
        <img 
          src={images[0]} 
          alt="Image 1" 
          className="w-full h-full object-cover"
          style={imgStyle}
          loading="lazy"
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.parentElement.innerHTML = `
              <div class="w-full h-full flex items-center justify-center bg-slate-200 rounded-lg">
                <div class="text-center">
                  <svg class="w-8 h-8 text-slate-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
                  <p class="text-slate-500 text-xs">Image not available</p>
                </div>
              </div>
            `;
          }}
        />
      </div>
      <div className="flex flex-col gap-2">
        {[1, 2].map((idx) => (
          <div 
            key={idx} 
            className="relative overflow-hidden rounded-lg flex-1 bg-slate-100"
            onClick={() => openLightbox(idx)}
          >
            <img 
              src={images[idx]} 
              alt={`Image ${idx + 1}`} 
              className="w-full h-full object-cover"
              style={imgStyle}
              loading="lazy"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentElement.innerHTML = `
                  <div class="w-full h-full flex items-center justify-center bg-slate-200 rounded-lg">
                    <div class="text-center">
                      <svg class="w-6 h-6 text-slate-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                      </svg>
                      <p class="text-slate-500 text-xs">Image not available</p>
                    </div>
                  </div>
                `;
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );

  const renderFourPlus = () => {
    const visible = images.slice(0, 4);
    const remaining = images.length - 4;
    
    return (
      <div className="grid grid-cols-2 gap-2 h-[350px]">
        {visible.map((img, idx) => (
          <div 
            key={idx} 
            className="relative overflow-hidden rounded-lg bg-slate-100"
          >
            <img 
              src={img} 
              alt={`Image ${idx + 1}`} 
              className={`w-full h-full object-cover ${idx === 3 && remaining > 0 ? 'brightness-50' : ''}`}
              style={imgStyle}
              loading="lazy"
              onClick={() => openLightbox(idx)}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentElement.innerHTML = `
                  <div class="w-full h-full flex items-center justify-center bg-slate-200 rounded-lg">
                    <div class="text-center">
                      <svg class="w-8 h-8 text-slate-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                      </svg>
                      <p class="text-slate-500 text-xs">Image not available</p>
                    </div>
                  </div>
                `;
              }}
            />
            {idx === 3 && remaining > 0 && (
              <div 
                className="absolute inset-0 flex items-center justify-center cursor-pointer bg-black/40 rounded-lg"
                onClick={() => openLightbox(idx)}
              >
                <span className="text-white font-bold text-2xl drop-shadow-lg">+{remaining}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <div className={`mb-4 overflow-hidden rounded-xl border border-gray-100 ${compact ? '' : ''}`}>
        {video && !videoPlaying && renderVideo()}
        {count === 1 && !video && renderSingle()}
        {count === 2 && renderTwo()}
        {count === 3 && renderThree()}
        {count >= 4 && renderFourPlus()}
      </div>

      {lightboxIndex !== null && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
          onClick={closeLightbox}
        >
          <button 
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white transition-colors z-10 w-12 h-12 flex items-center justify-center rounded-full bg-black/30 hover:bg-black/50"
            onClick={closeLightbox}
          >
            <FiX style={{ fontSize: '24px' }} />
          </button>
          
          <button 
            className="absolute left-4 p-3 text-white/80 hover:text-white transition-colors z-10 bg-black/30 hover:bg-black/50 rounded-full"
            onClick={(e) => { e.stopPropagation(); goPrev(); }}
          >
            <FiChevronLeft style={{ fontSize: '32px' }} />
          </button>
          
          <div 
            className="max-w-4xl max-h-[90vh] w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={images[lightboxIndex]} 
              alt={`Image ${lightboxIndex + 1}`}
              className="w-full h-full max-h-[85vh] object-contain rounded-lg"
            />
            <div className="flex justify-center items-center gap-4 mt-4 text-white">
              <span className="text-sm opacity-70">
                {lightboxIndex + 1} / {count}
              </span>
              <div className="flex gap-1">
                {images.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setLightboxIndex(idx)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      idx === lightboxIndex ? 'bg-white' : 'bg-white/40'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
          
          <button 
            className="absolute right-4 p-3 text-white/80 hover:text-white transition-colors z-10 bg-black/30 hover:bg-black/50 rounded-full"
            onClick={(e) => { e.stopPropagation(); goNext(); }}
          >
            <FiChevronRight style={{ fontSize: '32px' }} />
          </button>
        </div>
      )}
    </>
  );
};

const rankFeedItems = (items, currentUser) => {
  const role = currentUser?.role;
  const specialization = (currentUser?.specialization || '').toLowerCase();

  return [...items].sort((a, b) => {
    let scoreA = 0;
    let scoreB = 0;

    const ageA = Date.now() - new Date(a.createdAt || 0).getTime();
    const ageB = Date.now() - new Date(b.createdAt || 0).getTime();
    const maxAge = 7 * 24 * 60 * 60 * 1000;
    scoreA += Math.max(0, 100 - (ageA / maxAge) * 100);
    scoreB += Math.max(0, 100 - (ageB / maxAge) * 100);

    const engagementA = (a.likesCount || 0) + (a.commentsCount || 0) * 2;
    const engagementB = (b.likesCount || 0) + (b.commentsCount || 0) * 2;
    scoreA += Math.min(50, engagementA * 5);
    scoreB += Math.min(50, engagementB * 5);

    if (role === 'client') {
      if (a.title) scoreA += 20;
      if (b.title) scoreB += 20;
    }

    if (role === 'provider' && specialization) {
      const aCategory = (a.serviceCategory || a.type || '').toLowerCase();
      const bCategory = (b.serviceCategory || b.type || '').toLowerCase();
      if (aCategory.includes(specialization) || specialization.includes(aCategory)) scoreA += 30;
      if (bCategory.includes(specialization) || specialization.includes(bCategory)) scoreB += 30;
    }

    if (a.images?.length > 0) scoreA += 15;
    if (b.images?.length > 0) scoreB += 15;

    return scoreB - scoreA;
  });
};

const banner = {
  badge: 'New Offer',
  title: '20% Off Home Cleaning',
  desc: 'Valid until this Friday. Book now!',
};

export default function HomeScreen({ isDesktop }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [categories, setCategories] = useState([]);
  const [providers, setProviders] = useState([]);
  const [feed, setFeed] = useState([]); // unified posts + articles
  const [likedItems, setLikedItems] = useState(new Set());
  const [itemComments, setItemComments] = useState({});
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [commentInputs, setCommentInputs] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [showPostForm, setShowPostForm] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [postImages, setPostImages] = useState([]);
  const [postImagePreviews, setPostImagePreviews] = useState([]);
  const [isPosting, setIsPosting] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(false);
  const postImageInputRef = useRef(null);
  const [postServiceCategory, setPostServiceCategory] = useState('');

  const isClient = user?.role === 'client' || user?.role === 'user';

  const POST_SERVICE_CATEGORIES = [
    { value: 'Plumber', label: 'Plumber' },
    { value: 'Electrician', label: 'Electrician' },
    { value: 'Painter', label: 'Painter' },
    { value: 'Carpenter', label: 'Carpenter' },
    { value: 'Home Cleaner', label: 'Home Cleaner' },
    { value: 'Mover', label: 'Mover' },
    { value: 'HVAC Technician', label: 'HVAC Technician' },
    { value: 'Landscaper', label: 'Landscaper' },
    { value: 'Roofer', label: 'Roofer' },
    { value: 'Appliance Repair', label: 'Appliance Repair' },
    { value: 'General', label: 'General' },
  ];

  const handlePostImageSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const newImages = [...postImages, ...files].slice(0, 10);
      setPostImages(newImages);
      const newPreviews = newImages.map(file => URL.createObjectURL(file));
      setPostImagePreviews(newPreviews);
    }
  };

  const removePostImage = (index) => {
    setPostImages(prev => prev.filter((_, i) => i !== index));
    setPostImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreatePost = async () => {
    if (!postContent.trim() && postImages.length === 0) return;
    if (postContent.trim().length < 10 && postImages.length === 0) {
      alert('Post must have at least 10 characters or an image');
      return;
    }
    if (isClient && !postServiceCategory) {
      alert('Please select a service category');
      return;
    }
    setIsPosting(true);
    try {
      const postData = { 
        content: postContent, 
        images: postImages,
        ...(isClient && postServiceCategory ? { serviceCategory: postServiceCategory } : {})
      };
      const result = await api.createPost(postData);
      if (result.success) {
        setFeed((prev) => [normalizePost(result.post), ...prev]);
        setShowPostForm(false);
        setPostContent('');
        setPostImages([]);
        setPostImagePreviews([]);
        setPostServiceCategory('');
      }
    } catch (err) {
      console.error('Error creating post:', err);
    } finally {
      setIsPosting(false);
    }
  };

  // Normalize a post into unified feed item shape
  const normalizePost = (p) => {
    let images = [];
    if (p.images && Array.isArray(p.images)) {
      images = p.images.map(img => 
        img.startsWith('http') ? img : `${window.location.origin}${img}`
      );
    } else if (p.image) {
      const img = p.image.startsWith('http') ? p.image : `${window.location.origin}${p.image}`;
      images = [img];
    }
    let video = null;
    if (p.video) {
      video = p.video.startsWith('http') ? p.video : `${window.location.origin}${p.video}`;
    }
    return {
      feedId: `post-${p.id}`,
      type: 'post',
      id: p.id,
      authorId: p.authorId,
      authorName: p.authorName,
      authorAvatar: p.authorAvatar,
      authorRole: p.authorRole,
      authorProfession: p.authorProfession,
      title: null,
      content: p.content,
      images,
      video,
      serviceCategory: p.serviceCategory || null,
      likesCount: p.likesCount || p.likes || 0,
      isLiked: p.isLiked || p.liked || false,
      commentsCount: p.commentsCount || 0,
      createdAt: p.createdAt,
    };
  };

  // Normalize an article into unified feed item shape
  const normalizeArticle = (a) => {
    let images = [];
    if (a.images && Array.isArray(a.images)) {
      images = a.images.map(img => 
        img.startsWith('http') ? img : `${window.location.origin}${img}`
      );
    } else if (a.imageUrl) {
      const img = a.imageUrl.startsWith('http') ? a.imageUrl : `${window.location.origin}${a.imageUrl}`;
      images = [img];
    }
    let video = null;
    if (a.video) {
      video = a.video.startsWith('http') ? a.video : `${window.location.origin}${a.video}`;
    }
    return {
      feedId: `article-${a.id || a._id}`,
      type: 'article',
      id: a.id || a._id,
      authorId: a.authorId || a.userId || a.author?._id || null,
      authorName: a.authorName || a.userName || a.author?.name || 'Unknown',
      authorAvatar: a.authorAvatar || a.userAvatar || a.author?.avatar || null,
      authorRole: a.authorRole || a.userRole || a.author?.role || null,
      authorProfession: a.authorProfession || a.author?.profession || null,
      title: a.title || null,
      content: a.content,
      images,
      video,
      likesCount: a.likesCount || 0,
      isLiked: a.isLiked || false,
      commentsCount: a.commentsCount || 0,
      createdAt: a.createdAt,
    };
  };

  const buildFeed = (posts, articles, currentUser) => {
    const normalized = [
      ...posts.map(normalizePost),
      ...articles.map(normalizeArticle),
    ];
    const ranked = rankFeedItems(normalized, currentUser);
    return ranked;
  };

  const fetchFeed = async () => {
    try {
      const [postsData, articlesData] = await Promise.all([
        api.getPosts(),
        api.getArticles(),
      ]);
      const posts = Array.isArray(postsData) ? postsData : [];
      const articles = Array.isArray(articlesData) ? articlesData : [];
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const unified = buildFeed(posts, articles, currentUser);
      setFeed(unified);

      const liked = new Set();
      unified.forEach((item) => {
        if (item.liked) liked.add(item.feedId);
      });
      setLikedItems(liked);
    } catch (err) {
      console.error('Error fetching feed:', err);
    }
  };

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(storedUser);

    const fetchData = async () => {
      try {
        const [professionsData, provs] = await Promise.all([
          api.getProfessions(),
          api.getProviders({ sort: 'rating' }),
        ]);
        let cats = Array.isArray(professionsData) ? professionsData : [];
        if (cats.length === 0) {
          cats = defaultCategories;
        } else {
          cats = cats.map(cat => {
            const defaults = defaultCategories.find(d => d.name.toLowerCase() === cat.name?.toLowerCase());
            return {
              ...cat,
              icon: cat.icon || defaults?.icon || 'more',
              color: cat.color || defaults?.color || 'bg-slate-100 text-slate-500',
            };
          });
        }
        setCategories(cats);
        // Backend returns { data: [...], pagination: {...} }
        const providersList = Array.isArray(provs) ? provs : (provs?.data || []);
        setProviders(providersList.slice(0, 6));
      } catch (error) {
        console.error('Error fetching home data:', error);
        setCategories(defaultCategories);
      }
    };

    fetchData();
    fetchFeed();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchFeed();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    const interval = setInterval(fetchFeed, 30000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setLocationError(false);
        },
        () => {
          setLocationError(true);
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
      );
    } else {
      setLocationError(true);
    }
  }, []);

  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const getSortedProviders = () => {
    let sorted = [...providers];
    if (userLocation && !locationError) {
      sorted = sorted.map(p => {
        if (p.location?.lat && p.location?.lng) {
          const distance = calculateDistance(
            userLocation.lat, userLocation.lng,
            p.location.lat, p.location.lng
          );
          return { ...p, calculatedDistance: Math.round(distance * 10) / 10 };
        }
        return { ...p, calculatedDistance: p.distance || 0 };
      });
      sorted.sort((a, b) => (a.calculatedDistance || 0) - (b.calculatedDistance || 0));
    } else {
      sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }
    return sorted;
  };

  const formatCurrency = (amount) => {
    return `${amount} MAD`;
  };

  const formatDistance = (distance) => {
    if (userLocation && !locationError) {
      return `${distance} km`;
    }
    return `${Math.round(distance * 10) / 10} km`;
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleLikeItem = async (item) => {
    const { feedId, type, id } = item;
    const isLiked = item.isLiked || likedItems.has(feedId);
    const newLikesCount = isLiked
      ? Math.max(0, (item.likesCount || 0) - 1)
      : (item.likesCount || 0) + 1;

    // Optimistic update
    setLikedItems((prev) => {
      const next = new Set(prev);
      if (isLiked) next.delete(feedId);
      else next.add(feedId);
      return next;
    });
    setFeed((prev) =>
      prev.map((f) =>
        f.feedId === feedId
          ? { ...f, likesCount: newLikesCount, isLiked: !isLiked }
          : f
      )
    );

    const res =
      type === 'article'
        ? await api.likeArticle(id)
        : await api.likePost(id);

    if (res.success) {
      setFeed((prev) =>
        prev.map((f) =>
          f.feedId === feedId
            ? { ...f, likesCount: res.likesCount, isLiked: res.isLiked ?? !isLiked }
            : f
        )
      );
      setLikedItems((prev) => {
        const next = new Set(prev);
        if (res.isLiked ?? !isLiked) next.add(feedId);
        else next.delete(feedId);
        return next;
      });
    } else {
      // Revert on failure
      setLikedItems((prev) => {
        const next = new Set(prev);
        if (isLiked) next.add(feedId);
        else next.delete(feedId);
        return next;
      });
      setFeed((prev) =>
        prev.map((f) =>
          f.feedId === feedId
            ? { ...f, likesCount: item.likesCount, isLiked }
            : f
        )
      );
    }
  };

  const handleLoadComments = async (item) => {
    const { feedId, type, id } = item;
    if (!itemComments[feedId]) {
      const comments =
        type === 'post'
          ? await api.getComments(id)
          : await api.getArticleComments(id).catch(() => []);
      if (Array.isArray(comments)) {
        setItemComments((prev) => ({ ...prev, [feedId]: comments }));
      }
    }
  };

  const handleToggleComments = async (item) => {
    const { feedId } = item;
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(feedId)) {
      newExpanded.delete(feedId);
    } else {
      newExpanded.add(feedId);
      handleLoadComments(item);
    }
    setExpandedItems(newExpanded);
  };

  const handleSubmitComment = async (item) => {
    const { feedId, type, id } = item;
    const content = commentInputs[feedId];
    if (!content?.trim()) return;

    const res = type === 'post' 
      ? await api.addComment(id, content)
      : await api.addArticleComment(id, content);
    
    if (res.success) {
      setItemComments((prev) => ({
        ...prev,
        [feedId]: [...(prev[feedId] || []), res.comment],
      }));
      setCommentInputs((prev) => ({ ...prev, [feedId]: '' }));
      setFeed((prev) =>
        prev.map((f) =>
          f.feedId === feedId
            ? { ...f, commentsCount: (f.commentsCount || 0) + 1 }
            : f
        )
      );
    }
  };

  const handleDeletePost = async (feedId, type) => {
    const confirmMsg = type === 'article' 
      ? 'Are you sure you want to delete this article?' 
      : 'Are you sure you want to delete this post?';
    if (!window.confirm(confirmMsg)) return;
    try {
      if (type === 'article') {
        const articleId = feedId.replace('article-', '');
        const result = await api.deleteArticle?.(articleId);
        if (result?.success) {
          setFeed((prev) => prev.filter((f) => f.feedId !== feedId));
        }
      } else {
        const postId = feedId.replace('post-', '');
        const result = await api.deletePost?.(postId);
        if (result?.success || result?.message === 'Post deleted') {
          setFeed((prev) => prev.filter((f) => f.feedId !== feedId));
        }
      }
    } catch (err) {
      console.error('Error deleting item:', err);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return 'À l\'instant';
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} sem.`;
    return date.toLocaleDateString('fr-FR');
  };

  // Shared FeedCard component used by both mobile and desktop
  const FeedCard = ({ item, compact = false }) => {
    const { feedId, type, id, authorName, authorId } = item;
    const isLiked = item.isLiked || likedItems.has(feedId);
    const isExpanded = expandedItems.has(feedId);
    const comments = itemComments[feedId] || [];
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    const isOwnPost = storedUser?.name === authorName || storedUser?.id === authorId;
    const hasImage = item.images && item.images.length > 0;

    return (
      <div className={`bg-white rounded-3xl shadow-md border border-slate-100 p-6 w-full`}>
        {/* Header */}
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-full bg-slate-100 bg-cover bg-center flex items-center justify-center flex-shrink-0"
            style={{ backgroundImage: item.authorAvatar ? `url("${item.authorAvatar}")` : undefined }}
          >
            {!item.authorAvatar && (
              <span className="font-bold text-slate-500 text-sm">
                {item.authorName?.charAt(0) || '?'}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-base text-slate-800 truncate">{item.authorName}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-sm text-slate-400">{formatDate(item.createdAt)}</span>
              {item.authorProfession && (
                <span className="text-xs font-medium px-3 py-1 rounded-full bg-blue-50 text-blue-600 ml-2">{item.authorProfession}</span>
              )}
              {item.serviceCategory && (
                <>
                  <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                  <span className="text-xs text-orange-600 font-medium">Needs: {item.serviceCategory}</span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {type === 'article' && item.isVerified && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                Verified Pro
              </span>
            )}
            {isOwnPost && (
              <button
                onClick={() => handleDeletePost(feedId, type)}
                className="p-1.5 hover:bg-red-50 rounded-full transition-colors text-slate-400 hover:text-red-500"
                title={`Delete ${type}`}
              >
                <FiTrash2 style={{ fontSize: '16px' }} />
              </button>
            )}
          </div>
        </div>

        {/* Body */}
        {hasImage ? (
          <div className="flex flex-col sm:flex-row gap-6 mt-4 items-start">
            <div className="flex-1 min-w-0">
              {item.title && (
                <h4 className="text-xl font-bold text-slate-800 mt-4 mb-2 leading-snug">{item.title}</h4>
              )}
              <p className="text-sm text-slate-500 leading-relaxed line-clamp-4">{item.content}</p>
            </div>
            <img
              src={item.images[0]}
              alt={item.title || 'Post image'}
              className="w-80 h-60 rounded-2xl object-cover flex-shrink-0 sm:mt-0"
              loading="lazy"
            />
          </div>
        ) : (
          <div className="bg-slate-50 rounded-2xl px-4 py-3 mt-4">
            {item.title && (
              <h4 className="text-xl font-bold text-slate-800 mt-2 mb-2 leading-snug">{item.title}</h4>
            )}
            <p className="text-sm text-slate-700 leading-relaxed">{item.content}</p>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center gap-5 border-t border-slate-100 mt-5 pt-4">
          <button
            onClick={() => handleLikeItem(item)}
            className={`flex items-center gap-1.5 transition-all ${
              isLiked
                ? 'text-red-500'
                : 'text-slate-600 hover:text-red-500'
            }`}
          >
            <FiHeart style={{ fontSize: '18px', fill: isLiked ? 'currentColor' : 'none' }} />
            <span className="text-sm font-medium text-slate-600">{item.likesCount || 0}</span>
          </button>
          <button
            onClick={() => handleToggleComments(item)}
            className="flex items-center gap-1.5 text-slate-500 hover:text-primary transition-all"
          >
            <FiMessageCircle style={{ fontSize: '18px' }} />
            <span className="text-sm text-slate-500">{item.commentsCount || 0}</span>
          </button>
          <button className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 transition-all ml-auto">
            <FiShare2 style={{ fontSize: '18px' }} />
          </button>
        </div>

        {/* Contextual action buttons — only for provider authors */}
        {item.authorRole === 'provider' && (
          <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
            <button
              onClick={() => navigate(`/provider/${item.authorId}`)}
              className="text-xs font-medium px-3 py-1.5 rounded-full border border-slate-200 text-slate-600 hover:border-primary hover:text-primary transition-colors"
            >
              View Profile
            </button>
            {storedUser?.role === 'client' && (
              <button
                onClick={() => navigate(`/book/${item.authorId}`)}
                className="text-xs font-medium px-3 py-1.5 rounded-full border border-slate-200 text-slate-600 hover:border-primary hover:text-primary transition-colors"
              >
                Book Now
              </button>
            )}
            <button
              onClick={() => navigate(`/messages/${item.authorId}`)}
              className="text-xs font-medium px-3 py-1.5 rounded-full border border-slate-200 text-slate-600 hover:border-primary hover:text-primary transition-colors"
            >
              Message
            </button>
          </div>
        )}

        {/* Comments section */}
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-slate-100">
            {comments.length > 0 ? (
              <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
                {(compact ? comments.slice(-2) : comments).map((c) => (
                  <div key={c.id} className="flex gap-2">
                    <div
                      className="w-8 h-8 rounded-full bg-slate-100 bg-cover bg-center flex items-center justify-center flex-shrink-0"
                      style={{ backgroundImage: c.authorAvatar ? `url("${c.authorAvatar}")` : undefined }}
                    >
                      {!c.authorAvatar && (
                        <span className="font-bold text-slate-500 text-xs">
                          {c.authorName?.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 bg-slate-50 rounded-lg px-3 py-1.5">
                      <p className="font-medium text-sm text-slate-900">{c.authorName}</p>
                      <p className="text-sm text-slate-600">{c.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 mb-3">No comments yet</p>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={commentInputs[feedId] || ''}
                onChange={(e) =>
                  setCommentInputs((prev) => ({ ...prev, [feedId]: e.target.value }))
                }
                placeholder="Add a comment..."
                className="flex-1 px-3 py-1.5 bg-slate-50 rounded-full border-none focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm text-slate-900"
                onKeyDown={(e) => e.key === 'Enter' && handleSubmitComment(item)}
              />
              <button
                onClick={() => handleSubmitComment(item)}
                className="text-primary text-sm font-medium hover:underline"
              >
                Post
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ── MOBILE ──────────────────────────────────────────────────────────────────
  if (!isDesktop) {
    return (
      <div className="relative flex h-full min-h-screen w-full flex-col overflow-x-hidden pb-24 max-w-md mx-auto bg-background-light dark:bg-background-dark">
        <header className="flex flex-col gap-4 p-5 pt-8 bg-background-light dark:bg-background-dark sticky top-0 z-20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="bg-center bg-no-repeat bg-cover rounded-full size-12 border-2 border-white dark:border-slate-700 shadow-sm"
                style={{
                  backgroundImage: user?.avatar
                    ? `url("${user.avatar}")`
                    : undefined,
                }}
              >
                {!user?.avatar && (
                  <div className="w-full h-full rounded-full bg-slate-300 flex items-center justify-center">
                    <span className="text-sm font-bold text-slate-500">
                      {user?.name ? user.name.charAt(0).toUpperCase() : '?'}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-slate-500 dark:text-slate-400 text-xs font-medium">
                  Good Morning 👋
                </span>
                <h2 className="text-slate-900 dark:text-white text-lg font-bold leading-tight">
                  {user?.name || 'Guest'}
                </h2>
              </div>
            </div>
            <button className="relative flex items-center justify-center size-10 rounded-full bg-white dark:bg-surface-dark shadow-card border border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-200">
              <FiBell style={{ fontSize: '24px' }} />
              <span className="absolute top-2 right-2 size-2 bg-red-500 rounded-full border border-white dark:border-surface-dark"></span>
            </button>
          </div>

          <div className="flex items-center">
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors">
              <FiMapPin className="text-primary" style={{ fontSize: '18px' }} />
              <span className="text-primary text-sm font-semibold">
                Downtown, NY
              </span>
              <FiChevronDown className="text-primary" style={{ fontSize: '18px' }} />
            </button>
          </div>

          <form onSubmit={handleSearch} className="mt-1">
            <div className="flex w-full items-stretch gap-3 h-12">
              <div className="relative flex-1 group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none">
                  <FiSearch style={{ fontSize: '24px' }} />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-full pl-12 pr-4 rounded-xl bg-white dark:bg-surface-dark border-none shadow-card text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-primary/50 text-base"
                  placeholder="What service do you need?"
                />
              </div>
              <button
                type="submit"
                className="flex items-center justify-center aspect-square h-full bg-primary text-white rounded-xl shadow-lg shadow-primary/30 active:scale-95 transition-transform"
              >
                <FiSettings style={{ fontSize: '24px' }} />
              </button>
            </div>
          </form>
        </header>

        <main className="flex flex-col gap-6 px-5 pb-4">
          {/* Banner */}
          <div className="w-full rounded-2xl bg-gradient-to-r from-primary to-blue-400 p-5 shadow-lg relative overflow-hidden text-white mt-2">
            <div className="absolute -right-10 -top-10 size-40 rounded-full bg-white/10 blur-2xl"></div>
            <div className="absolute -left-10 -bottom-10 size-32 rounded-full bg-white/10 blur-xl"></div>
            <div className="relative z-10 flex flex-col items-start gap-3">
              <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                {banner.badge}
              </span>
              <div className="space-y-1">
                <h3 className="text-xl font-bold">{banner.title}</h3>
                <p className="text-blue-50 text-sm opacity-90">{banner.desc}</p>
              </div>
              <button className="mt-1 px-4 py-2 bg-white text-primary text-xs font-bold rounded-lg shadow-sm">
                Claim Offer
              </button>
            </div>
          </div>

          {/* Categories */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-slate-900 dark:text-white text-lg font-bold">
                Explore Categories
              </h2>
              <a className="text-primary text-sm font-medium" href="#">
                See All
              </a>
            </div>
            <div className="grid grid-cols-4 gap-x-4 gap-y-6">
              {categories.map((cat) => (
                <button
                  key={cat._id || cat.id}
                  className="flex flex-col items-center gap-2 group"
onClick={() => navigate(`/search?category=${encodeURIComponent(cat.name)}`)}
                >
                  <div
                    className={`size-14 rounded-2xl flex items-center justify-center shadow-sm transition-colors ${cat.color} group-hover:bg-primary group-hover:text-white`}
                  >
                    {getCategoryIcon(cat.icon, 28)}
                  </div>
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300 text-center">
                    {cat.name}
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* Feed */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-slate-900 dark:text-white text-lg font-bold">
                Latest Updates
              </h2>
            </div>

            {/* Create Post Box */}
            <div className="bg-white dark:bg-surface-dark rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full bg-cover bg-center bg-slate-200"
                  style={{
                    backgroundImage: user?.avatar
                      ? `url("${user.avatar}")`
                      : undefined,
                  }}
                >
                  {!user?.avatar && (
                    <div className="w-full h-full rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-slate-500">
                        {user?.name?.charAt(0) || '?'}
                      </span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setShowPostForm(true)}
                  className="flex-1 text-left px-4 py-2.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-sm"
                >
                  Share an update or tip...
                </button>
              </div>
            </div>

            {/* Create Post Modal */}
            {showPostForm && (
              <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-surface-dark rounded-2xl w-full max-w-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold">Create Post</h3>
                    <button
                      onClick={() => setShowPostForm(false)}
                      className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full"
                    >
                      <FiX />
                    </button>
                  </div>
                  {isClient && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        What service do you need? *
                      </label>
                      <select
                        value={postServiceCategory}
                        onChange={(e) => setPostServiceCategory(e.target.value)}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                      >
                        <option value="">Select a service category...</option>
                        {POST_SERVICE_CATEGORIES.map(cat => (
                          <option key={cat.value} value={cat.value}>
                            {cat.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <textarea
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                    placeholder="Share an update or tip..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent resize-none focus:outline-none focus:border-primary"
                    rows={4}
                  />
                  {postImagePreviews.length > 0 && (
                    <div className="mt-4 grid grid-cols-3 gap-2">
                      {postImagePreviews.map((preview, idx) => (
                        <div key={idx} className="relative aspect-square">
                          <img
                            src={preview}
                            alt={`Preview ${idx + 1}`}
                            className="w-full h-full object-cover rounded-lg"
                          />
                          <button
                            onClick={() => removePostImage(idx)}
                            className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full"
                          >
                            <FiX className="text-[14px]" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={() => postImageInputRef.current?.click()}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                    >
                      <FiImage className="text-primary" />
                      Photo {postImages.length > 0 && `(${postImages.length})`}
                    </button>
                    <input
                      type="file"
                      ref={postImageInputRef}
                      onChange={handlePostImageSelect}
                      accept="image/*"
                      multiple
                      className="hidden"
                    />
                    <div className="flex-1"></div>
                    <button
                      onClick={handleCreatePost}
                      disabled={(!postContent.trim() && postImages.length === 0) || (isClient && !postServiceCategory) || isPosting}
                      className="px-6 py-2 rounded-lg bg-primary text-white font-medium disabled:opacity-50"
                    >
                      {isPosting ? 'Posting...' : 'Post'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {feed.slice(0, 3).map((item) => (
                <FeedCard key={item.feedId} item={item} compact />
              ))}
            </div>
            {feed.length > 3 && (
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Recommended for you
                </span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {feed.slice(3).map((item) => (
                <FeedCard key={item.feedId} item={item} compact />
              ))}
            </div>
          </section>

          {/* Popular Near You */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-slate-900 dark:text-white text-lg font-bold">
                Popular Near You
              </h2>
              <button className="text-slate-400 dark:text-slate-500 hover:text-primary transition-colors">
                <FiFilter style={{ fontSize: '24px' }} />
              </button>
            </div>
            {locationError && (
              <div className="mb-4 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-amber-700 dark:text-amber-400 text-sm">
                Location unavailable. Showing top-rated providers.
              </div>
            )}
            <div className="flex flex-col gap-4">
              {getSortedProviders().slice(0, 3).map((provider) => (
                <Link
                  key={provider._id || provider.id}
                  to={`/provider/${provider._id || provider.id}`}
                  className="flex gap-4 p-4 rounded-2xl bg-white dark:bg-surface-dark shadow-card border border-transparent dark:border-slate-800"
                >
                  <div
                    className="shrink-0 size-20 rounded-xl bg-center bg-cover bg-no-repeat"
                    style={{
                      backgroundImage: provider.avatar
                        ? `url("${provider.avatar}")`
                        : undefined,
                    }}
                  >
                    {!provider.avatar && (
                      <div className="w-full h-full rounded-xl bg-slate-300 flex items-center justify-center">
                        <span className="text-xl font-bold text-slate-500">
                          {provider.name
                            ? provider.name.charAt(0).toUpperCase()
                            : '?'}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-slate-900 dark:text-white">
                          {provider.name}
                        </h3>
                        <div className="flex items-center gap-1 bg-yellow-100 dark:bg-yellow-900/30 px-1.5 py-0.5 rounded text-xs font-bold text-yellow-700 dark:text-yellow-500">
                          <FiStar style={{ fontSize: '14px' }} />
                          {provider.rating}
                        </div>
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 text-sm">
                        {provider.profession}
                      </p>
                    </div>
                    <div className="flex items-end justify-between mt-2">
                        <div className="flex items-center gap-1 text-slate-400 dark:text-slate-500 text-xs">
                          <FiMapPin style={{ fontSize: '14px' }} />
                          {provider.calculatedDistance !== undefined 
                            ? `${provider.calculatedDistance} km`
                            : `${Math.round((provider.distance || 0) * 10) / 10} km`}
                        </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-primary">
                          {formatCurrency(provider.hourlyRate || 0)}
                          <span className="text-xs font-normal text-slate-400 dark:text-slate-500">
                            /hr
                          </span>
                        </span>
                        <button className="bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">
                          Book
                        </button>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </main>

        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 dark:bg-surface-dark/80 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 pb-safe pt-2 max-w-md mx-auto">
          <div className="flex items-center justify-around h-16">
            <button
              className="flex flex-col items-center gap-1 text-primary w-16"
              onClick={() => navigate('/home')}
            >
              <FiHome />
              <span className="text-[10px] font-bold">Home</span>
            </button>
            <button
              className="flex flex-col items-center gap-1 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 w-16"
              onClick={() => navigate('/search')}
            >
              <FiSearch />
              <span className="text-[10px] font-medium">Search</span>
            </button>
            <button
              className="flex flex-col items-center gap-1 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 w-16"
              onClick={() => navigate('/videos')}
            >
              <FiPlayCircle />
              <span className="text-[10px] font-medium">Videos</span>
            </button>
            <button
              className="flex flex-col items-center gap-1 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 w-16"
              onClick={() => navigate('/messages/1')}
            >
              <FiMessageCircle />
              <span className="text-[10px] font-medium">Messages</span>
            </button>
            <button
              className="flex flex-col items-center gap-1 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 w-16"
              onClick={() => navigate('/profile')}
            >
              <FiUser />
              <span className="text-[10px] font-medium">Profile</span>
            </button>
          </div>
          <div className="h-5 w-full"></div>
        </nav>
      </div>
    );
  }

  // ── DESKTOP ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6">
      {/* Banner */}
      <div className="w-full rounded-2xl bg-gradient-to-r from-primary to-blue-400 p-6 shadow-lg relative overflow-hidden text-white">
        <div className="absolute -right-10 -top-10 size-40 rounded-full bg-white/10 blur-2xl"></div>
        <div className="absolute -left-10 -bottom-10 size-32 rounded-full bg-white/10 blur-xl"></div>
        <div className="relative z-10 flex flex-col items-start gap-3">
          <span className="bg-white/20 px-3 py-1 rounded text-xs font-bold uppercase tracking-wider">
            {banner.badge}
          </span>
          <div className="space-y-1">
            <h3 className="text-2xl font-bold">{banner.title}</h3>
            <p className="text-blue-50 text-sm opacity-90">{banner.desc}</p>
          </div>
          <button className="mt-2 px-5 py-2.5 bg-white text-primary text-sm font-bold rounded-lg shadow-sm hover:bg-blue-50 transition-colors">
            Claim Offer
          </button>
        </div>
      </div>

      {/* Categories */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-slate-900 text-xl font-bold">Explore Categories</h2>
          <button className="text-primary text-sm font-medium hover:underline">
            See All
          </button>
        </div>
        <div className="grid grid-cols-4 xl:grid-cols-8 gap-4">
          {categories.map((cat) => (
            <button
              key={cat._id || cat.id}
              className="flex flex-col items-center gap-3 group p-4 rounded-xl hover:bg-slate-50 transition-colors"
              onClick={() => navigate(`/search?category=${encodeURIComponent(cat.name)}`)}
            >
                  <div
                    className={`size-16 rounded-2xl flex items-center justify-center shadow-sm transition-colors ${cat.color} group-hover:bg-primary group-hover:text-white`}
                  >
                    {getCategoryIcon(cat.icon, 32)}
                  </div>
              <span className="text-sm font-medium text-slate-700 text-center">
                {cat.name}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Feed */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-slate-900 text-xl font-bold">Latest Updates</h2>
          <button className="text-primary text-sm font-medium hover:underline">
            View All
          </button>
        </div>

        {/* Create Post Box */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 mb-6">
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-full bg-cover bg-center bg-slate-200"
              style={{
                backgroundImage: user?.avatar
                  ? `url("${user.avatar}")`
                  : undefined,
              }}
            >
              {!user?.avatar && (
                <div className="w-full h-full rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-slate-500">
                    {user?.name?.charAt(0) || '?'}
                  </span>
                </div>
              )}
            </div>
              <button
                onClick={() => setShowPostForm(true)}
                className="flex-1 text-left px-5 py-3 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors text-slate-500 font-medium"
              >
                Share an update or tip...
              </button>
          </div>
        </div>

        {/* Create Post Modal */}
        {showPostForm && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-surface-dark rounded-2xl w-full max-w-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">Create Post</h3>
                <button
                  onClick={() => setShowPostForm(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full"
                >
                  <FiX />
                </button>
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-10 h-10 rounded-full bg-cover bg-center bg-slate-200"
                  style={{
                    backgroundImage: user?.avatar
                      ? `url("${user.avatar}")`
                      : undefined,
                  }}
                >
                  {!user?.avatar && (
                    <div className="w-full h-full rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-slate-500">
                        {user?.name?.charAt(0) || '?'}
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {user?.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {user?.role === 'provider' ? user?.profession : 'Client'}
                  </p>
                </div>
              </div>
              {isClient && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    What service do you need? *
                  </label>
                  <select
                    value={postServiceCategory}
                    onChange={(e) => setPostServiceCategory(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  >
                    <option value="">Select a service category...</option>
                    {POST_SERVICE_CATEGORIES.map(cat => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <textarea
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                placeholder="What's on your mind?"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent resize-none focus:outline-none focus:border-primary"
                rows={4}
              />
              {postImagePreviews.length > 0 && (
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {postImagePreviews.map((preview, idx) => (
                    <div key={idx} className="relative aspect-square">
                      <img
                        src={preview}
                        alt={`Preview ${idx + 1}`}
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <button
                        onClick={() => removePostImage(idx)}
                        className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full"
                      >
                        <FiX className="text-[14px]" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => postImageInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                  >
                  <FiImage className="text-primary" />
                  Photo {postImages.length > 0 && `(${postImages.length})`}
                </button>
                <input
                  type="file"
                  ref={postImageInputRef}
                  onChange={handlePostImageSelect}
                  accept="image/*"
                  multiple
                  className="hidden"
                />
                <div className="flex-1"></div>
                <button
                  onClick={handleCreatePost}
                  disabled={(!postContent.trim() && postImages.length === 0) || (isClient && !postServiceCategory) || isPosting}
                  className="px-6 py-2 rounded-lg bg-primary text-white font-medium disabled:opacity-50"
                >
                  {isPosting ? 'Posting...' : 'Post'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-4">
          {feed.length > 0
            ? feed.slice(0, 3).map((item) => (
                <FeedCard key={item.feedId} item={item} compact={false} />
              ))
            : null}
        </div>
        {feed.length > 3 && (
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Recommended for you
            </span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>
        )}
        <div className="flex flex-col gap-4">
          {feed.length > 3
            ? feed.slice(3).map((item) => (
                <FeedCard key={item.feedId} item={item} compact={false} />
              ))
            : null}
        </div>
      </section>

      {/* Popular Near You */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-slate-900 text-xl font-bold">Popular Near You</h2>
          <button className="text-slate-400 hover:text-primary transition-colors">
            <FiFilter style={{ fontSize: '24px' }} />
          </button>
        </div>
        {locationError && (
          <div className="mb-4 px-4 py-2 bg-amber-50 rounded-lg text-amber-700 text-sm">
            Location unavailable. Showing top-rated providers.
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {getSortedProviders().slice(0, 6).map((provider) => (
            <Link
              key={provider.id || provider._id}
              to={`/provider/${provider.id || provider._id}`}
              className="flex gap-4 p-5 rounded-2xl bg-white shadow-sm border border-slate-200 hover:shadow-md hover:border-primary/30 transition-all"
            >
              <div
                className="shrink-0 size-20 rounded-xl bg-center bg-cover bg-no-repeat"
                style={{
                  backgroundImage: provider.avatar
                    ? `url("${provider.avatar}")`
                    : undefined,
                }}
              >
                {!provider.avatar && (
                  <div className="w-full h-full rounded-xl bg-slate-300 flex items-center justify-center">
                    <span className="text-xl font-bold text-slate-500">
                      {provider.name ? provider.name.charAt(0).toUpperCase() : '?'}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-slate-900">{provider.name}</h3>
                    <div className="flex items-center gap-1 bg-yellow-100 px-1.5 py-0.5 rounded text-xs font-bold text-yellow-700">
                      <FiStar style={{ fontSize: '14px' }} />
                      {provider.rating}
                    </div>
                  </div>
                  <p className="text-slate-500 text-sm mt-1">
                    {provider.profession}
                  </p>
                </div>
                <div className="flex items-end justify-between mt-3">
                  <div className="flex items-center gap-1 text-slate-400 text-xs">
                    <FiMapPin style={{ fontSize: '14px' }} />
                    {provider.calculatedDistance !== undefined 
                      ? `${provider.calculatedDistance} km`
                      : `${Math.round((provider.distance || 0) * 10) / 10} km`}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-primary">
                      {formatCurrency(provider.hourlyRate || 0)}
                      <span className="text-xs font-normal text-slate-400">
                        /hr
                      </span>
                    </span>
                    <button className="bg-primary hover:bg-primary/90 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors">
                      Book
                    </button>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
