import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { 
  FiHeart, FiMessageCircle, FiShare2, FiStar, FiMapPin, FiSearch, 
  FiMenu, FiBell, FiPlayCircle, FiImage, FiX, FiFilter, FiSettings,
  FiHome, FiUser, FiChevronDown, FiTrash2
} from 'react-icons/fi';
import { GoTasklist } from 'react-icons/go';
import { getCategoryIcon, categoryIcons, defaultCategories } from '../utils/categoryIcons.jsx';

const banner = {
  badge: 'New Offer',
  title: '20% Off Home Cleaning',
  desc: 'Valid until this Friday. Book now!',
};

export default function HomeScreen({ isDesktop }) {
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
  const [postImage, setPostImage] = useState(null);
  const [postImagePreview, setPostImagePreview] = useState(null);
  const [isPosting, setIsPosting] = useState(false);
  const postImageInputRef = useRef(null);
  const navigate = useNavigate();

  // Normalize a post into unified feed item shape
  const normalizePost = (p) => ({
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
    image: p.image || null,
    likes: p.likes || 0,
    liked: p.liked || false,
    commentsCount: p.commentsCount || 0,
    createdAt: p.createdAt,
  });

  // Normalize an article into unified feed item shape
  const normalizeArticle = (a) => ({
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
    image: a.imageUrl
      ? a.imageUrl.startsWith('http')
        ? a.imageUrl
        : `${window.location.origin}${a.imageUrl}`
      : null,
    likes: a.likes || 0,
    liked: a.liked || false,
    commentsCount: a.commentsCount || 0,
    createdAt: a.createdAt,
  });

  const buildFeed = (posts, articles) => {
    const normalized = [
      ...posts.map(normalizePost),
      ...articles.map(normalizeArticle),
    ];
    // Sort newest first
    normalized.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return normalized;
  };

  const fetchFeed = async () => {
    try {
      const [postsData, articlesData] = await Promise.all([
        api.getPosts(),
        api.getArticles(),
      ]);
      const posts = Array.isArray(postsData) ? postsData : [];
      const articles = Array.isArray(articlesData) ? articlesData : [];
      const unified = buildFeed(posts, articles);
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
        setProviders(Array.isArray(provs) ? provs.slice(0, 6) : []);
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

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleLikeItem = async (item) => {
    const { feedId, type, id } = item;
    const isLiked = likedItems.has(feedId);
    const newLikes = isLiked
      ? Math.max(0, (item.likes || 0) - 1)
      : (item.likes || 0) + 1;

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
          ? { ...f, likes: newLikes, liked: !isLiked }
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
            ? { ...f, likes: res.likes, liked: res.liked ?? !isLiked }
            : f
        )
      );
      setLikedItems((prev) => {
        const next = new Set(prev);
        if (res.liked ?? !isLiked) next.add(feedId);
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
            ? { ...f, likes: item.likes, liked: isLiked }
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

  const handlePostImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPostImage(file);
      setPostImagePreview(URL.createObjectURL(file));
    }
  };

  const handleCreatePost = async () => {
    if (!postContent.trim() && !postImage) return;
    if (postContent.trim().length < 10) {
      alert('Post must be at least 10 characters long');
      return;
    }
    setIsPosting(true);
    try {
      let imageUrl = null;
      if (postImage) {
        const uploadRes = await api.uploadMedia(postImage);
        if (uploadRes.success) {
          imageUrl = uploadRes.filePath;
        }
      }
      const result = await api.createPost({ content: postContent, image: imageUrl });
      if (result.success) {
        setFeed((prev) => [normalizePost(result.post), ...prev]);
        setShowPostForm(false);
        setPostContent('');
        setPostImage(null);
        setPostImagePreview(null);
      }
    } catch (err) {
      console.error('Error creating post:', err);
    } finally {
      setIsPosting(false);
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

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Shared FeedCard component used by both mobile and desktop
  const FeedCard = ({ item, compact = false }) => {
    const { feedId, type, id, authorName, authorId } = item;
    const isLiked = likedItems.has(feedId);
    const isExpanded = expandedItems.has(feedId);
    const comments = itemComments[feedId] || [];
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    const isOwnPost = storedUser?.name === authorName || storedUser?.id === authorId;

    return (
      <div
        className={`bg-white rounded-xl border border-slate-200 shadow-soft transition-all hover:shadow-medium ${
          compact ? 'p-4' : 'p-5'
        }`}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-3">
          <div
            className={`rounded-xl bg-cover bg-center bg-slate-100 shrink-0 ${
              compact ? 'w-10 h-10' : 'w-12 h-12'
            }`}
            style={{
              backgroundImage: item.authorAvatar
                ? `url("${item.authorAvatar}")`
                : undefined,
            }}
          >
            {!item.authorAvatar && (
              <div className="w-full h-full rounded-xl flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                <span
                  className={`font-bold text-slate-500 ${
                    compact ? 'text-sm' : 'text-sm'
                  }`}
                >
                  {item.authorName?.charAt(0) || '?'}
                </span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p
              className={`font-semibold text-slate-900 truncate ${
                compact ? 'text-sm' : 'text-[15px]'
              }`}
            >
              {item.authorName}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-xs text-slate-500">{formatDate(item.createdAt)}</p>
              {item.authorRole === 'provider' && (
                <>
                  <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                  <span className="text-xs text-primary font-medium">{item.authorProfession}</span>
                </>
              )}
            </div>
          </div>
          {/* Badge: article vs post */}
          <div className="flex items-center gap-1.5 shrink-0">
            {type === 'article' && (
              <span className="hidden px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                Article
              </span>
            )}
            {item.authorRole === 'provider' && (
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                Verified Pro
              </span>
            )}
            {type === 'post' && isOwnPost && (
              <button
                onClick={() => handleDeletePost(feedId, type)}
                className="p-1.5 hover:bg-red-50 rounded-full transition-colors text-slate-400 hover:text-red-500"
                title="Delete post"
              >
                <FiTrash2 style={{ fontSize: '16px' }} />
              </button>
            )}
            {type === 'article' && isOwnPost && (
              <button
                onClick={() => handleDeletePost(feedId, type)}
                className="p-1.5 hover:bg-red-50 rounded-full transition-colors text-slate-400 hover:text-red-500"
                title="Delete article"
              >
                <FiTrash2 style={{ fontSize: '16px' }} />
              </button>
            )}
          </div>
        </div>

        {/* Article title */}
        {item.title && (
          <h4
            className={`font-bold text-slate-900 mb-2 ${
              compact ? 'text-sm' : 'text-lg'
            }`}
          >
            {item.title}
          </h4>
        )}

        {/* Content */}
        <p
          className={`text-slate-600 mb-3 ${
            compact ? 'text-sm line-clamp-3' : 'text-[15px] leading-relaxed'
          }`}
        >
          {item.content}
        </p>

        {/* Article Image - Professional Design */}
        {item.image && (
          <div className={`relative overflow-hidden rounded-xl mb-4 group ${compact ? 'h-40' : 'h-64'}`}>
            <img 
              src={item.image} 
              alt={item.title || 'Article image'}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            {type === 'article' && (
              <div className="absolute top-3 left-3">
                <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white/95 backdrop-blur-sm text-purple-700 shadow-lg">
                  Article
                </span>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div
          className={`flex items-center gap-1 ${
            compact ? '' : 'pt-3 border-t border-slate-100'
          }`}
        >
          <button
            onClick={() => handleLikeItem(item)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              isLiked
                ? 'text-red-500 bg-red-50'
                : 'text-slate-500 hover:text-red-500 hover:bg-red-50'
            }`}
          >
            <FiHeart 
              style={{ 
                fontSize: compact ? '18px' : '20px',
                fill: isLiked ? 'currentColor' : 'none'
              }} 
            />
            <span className="text-sm font-medium">{item.likes}</span>
          </button>
          <button
            onClick={() => handleToggleComments(item)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-500 hover:text-primary hover:bg-blue-50 transition-all"
          >
            <FiMessageCircle style={{ fontSize: compact ? '18px' : '20px' }} />
            <span className="text-sm font-medium">{item.commentsCount || 0}</span>
          </button>
          {!compact && (
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-500 hover:text-primary hover:bg-blue-50 transition-all ml-auto">
              <FiShare2 style={{ fontSize: '20px' }} />
            </button>
          )}
        </div>

        {/* Comments section */}
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            {comments.length > 0 ? (
              <div
                className={`space-y-2 mb-3 ${
                  !compact ? 'max-h-48 overflow-y-auto space-y-3' : ''
                }`}
              >
                {(compact ? comments.slice(-2) : comments).map((c) => (
                  <div key={c.id} className="flex gap-2">
                    <div
                      className={`rounded-full bg-slate-200 bg-cover bg-center shrink-0 ${
                        compact ? 'w-6 h-6' : 'w-8 h-8'
                      }`}
                      style={{
                        backgroundImage: c.authorAvatar
                          ? `url("${c.authorAvatar}")`
                          : undefined,
                      }}
                    >
                      {!c.authorAvatar && (
                        <div className="w-full h-full rounded-full flex items-center justify-center">
                          <span
                            className={`font-bold text-slate-500 ${
                              compact ? 'text-[10px]' : 'text-xs'
                            }`}
                          >
                            {c.authorName?.charAt(0)}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-lg px-3 py-1.5">
                      <p
                        className={`font-medium text-slate-900 dark:text-white ${
                          compact ? 'text-xs' : 'text-sm'
                        }`}
                      >
                        {c.authorName}
                      </p>
                      <p
                        className={`text-slate-600 dark:text-slate-300 ${
                          compact ? 'text-xs' : 'text-sm'
                        }`}
                      >
                        {c.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p
                className={`text-slate-400 mb-3 ${compact ? 'text-xs' : 'text-sm'}`}
              >
                No comments yet
              </p>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={commentInputs[feedId] || ''}
                onChange={(e) =>
                  setCommentInputs((prev) => ({
                    ...prev,
                    [feedId]: e.target.value,
                  }))
                }
                placeholder="Add a comment..."
                className={`flex-1 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 rounded-full border-none focus:outline-none focus:ring-2 focus:ring-primary/30 text-slate-900 dark:text-white ${
                  compact ? 'text-sm' : 'text-sm px-4 py-2'
                }`}
                onKeyDown={(e) =>
                  e.key === 'Enter' && handleSubmitComment(item)
                }
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
                  onClick={() => navigate(`/search?q=${cat.name}`)}
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
                  <textarea
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                    placeholder="Share an update or tip..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent resize-none focus:outline-none focus:border-primary"
                    rows={4}
                  />
                  {postImagePreview && (
                    <div className="relative mt-4">
                      <img
                        src={postImagePreview}
                        alt="Preview"
                        className="w-full max-h-48 object-contain rounded-lg"
                      />
                      <button
                        onClick={() => {
                          setPostImage(null);
                          setPostImagePreview(null);
                        }}
                        className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full"
                      >
                        <FiX className="text-[18px]" />
                      </button>
                    </div>
                  )}
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={() => postImageInputRef.current?.click()}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                    >
                      <FiImage className="text-primary" />
                      Photo
                    </button>
                    <input
                      type="file"
                      ref={postImageInputRef}
                      onChange={handlePostImageSelect}
                      accept="image/*"
                      className="hidden"
                    />
                    <div className="flex-1"></div>
                    <button
                      onClick={handleCreatePost}
                      disabled={(!postContent.trim() && !postImage) || isPosting}
                      className="px-6 py-2 rounded-lg bg-primary text-white font-medium disabled:opacity-50"
                    >
                      {isPosting ? 'Posting...' : 'Post'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {feed.slice(0, 5).map((item) => (
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
            <div className="flex flex-col gap-4">
              {providers.slice(0, 3).map((provider) => (
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
                          {provider.distance} km
                        </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-primary">
                          ${provider.hourlyRate}
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
              onClick={() => navigate(`/search?q=${cat.name}`)}
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
              <textarea
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                placeholder="What's on your mind?"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent resize-none focus:outline-none focus:border-primary"
                rows={4}
              />
              {postImagePreview && (
                <div className="relative mt-4">
                  <img
                    src={postImagePreview}
                    alt="Preview"
                    className="w-full max-h-48 object-contain rounded-lg"
                  />
                  <button
                    onClick={() => {
                      setPostImage(null);
                      setPostImagePreview(null);
                    }}
                    className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full"
                    >
                      <FiX className="text-[18px]" />
                    </button>
                </div>
              )}
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => postImageInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                  >
                    <FiImage className="text-primary" />
                    Photo
                  </button>
                <input
                  type="file"
                  ref={postImageInputRef}
                  onChange={handlePostImageSelect}
                  accept="image/*"
                  className="hidden"
                />
                <div className="flex-1"></div>
                <button
                  onClick={handleCreatePost}
                  disabled={(!postContent.trim() && !postImage) || isPosting}
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
            ? feed.map((item) => (
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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {providers.slice(0, 6).map((provider) => (
            <Link
              key={provider.id}
              to={`/provider/${provider.id}`}
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
                    {provider.distance} km
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-primary">
                      ${provider.hourlyRate}
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
