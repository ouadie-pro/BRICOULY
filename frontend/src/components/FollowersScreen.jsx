import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';

export default function FollowersScreen({ isDesktop }) {
  const { userId } = useParams();
  const [followers, setFollowers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFollowers = async () => {
      setLoading(true);
      const data = await api.getFollowers(userId);
      setFollowers(data);
      setLoading(false);
    };
    fetchFollowers();
  }, [userId]);

  if (!isDesktop) {
    return (
      <div className="relative flex h-full min-h-screen w-full flex-col overflow-hidden max-w-md mx-auto bg-background-light">
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200 pb-2">
          <div className="flex items-center gap-3 p-4">
            <button 
              onClick={() => navigate(-1)}
              className="flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-slate-100 transition-colors"
            >
              <span className="material-symbols-outlined text-[24px]">arrow_back</span>
            </button>
            <div className="flex flex-col">
              <h1 className="text-lg font-bold text-slate-900">Followers</h1>
              <p className="text-xs text-slate-500">{followers.length} followers</p>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <span className="material-symbols-outlined text-4xl text-slate-300 animate-spin">sync</span>
            </div>
          ) : followers.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <span className="material-symbols-outlined text-5xl text-slate-300 mb-3">people_outline</span>
              <p className="text-slate-500 font-medium">No followers yet</p>
              <p className="text-xs text-slate-400">When someone follows you, they'll appear here</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {followers.map((user) => (
                <Link
                  key={user.id}
                  to={user.role === 'provider' ? `/provider/${user.id}` : `/user/${user.id}`}
                  className="flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors"
                >
                  <div
                    className="w-12 h-12 rounded-full bg-cover bg-center bg-slate-200 shrink-0"
                    style={{ backgroundImage: user.avatar ? `url("${user.avatar.startsWith('http') ? user.avatar : window.location.origin + user.avatar}")` : undefined }}
                  >
                    {!user.avatar && (
                      <div className="w-full h-full rounded-full flex items-center justify-center">
                        <span className="text-lg font-bold text-slate-500">
                          {user.name?.charAt(0).toUpperCase() || '?'}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 truncate">{user.name}</p>
                    <p className="text-xs text-slate-500 truncate">
                      {user.role === 'provider' ? user.profession || 'Service Provider' : 'Client'}
                      {user.location && ` • ${user.location}`}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    user.role === 'provider' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {user.role === 'provider' ? 'Provider' : 'Client'}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-slate-200">
      <div className="flex items-center gap-3 p-4 border-b border-slate-200">
        <button 
          onClick={() => navigate(-1)}
          className="flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-slate-100 transition-colors"
        >
          <span className="material-symbols-outlined text-[24px]">arrow_back</span>
        </button>
        <div className="flex flex-col">
          <h1 className="text-xl font-bold text-slate-900">Followers</h1>
          <p className="text-sm text-slate-500">{followers.length} followers</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <span className="material-symbols-outlined text-4xl text-slate-300 animate-spin">sync</span>
          </div>
        ) : followers.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <span className="material-symbols-outlined text-6xl text-slate-300 mb-3">people_outline</span>
            <p className="text-slate-500 font-medium text-lg">No followers yet</p>
            <p className="text-sm text-slate-400">When someone follows you, they'll appear here</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {followers.map((user) => (
              <Link
                key={user.id}
                to={user.role === 'provider' ? `/provider/${user.id}` : `/user/${user.id}`}
                className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors"
              >
                <div
                  className="w-14 h-14 rounded-full bg-cover bg-center bg-slate-200 shrink-0"
                  style={{ backgroundImage: user.avatar ? `url("${user.avatar.startsWith('http') ? user.avatar : window.location.origin + user.avatar}")` : undefined }}
                >
                  {!user.avatar && (
                    <div className="w-full h-full rounded-full flex items-center justify-center">
                      <span className="text-xl font-bold text-slate-500">
                        {user.name?.charAt(0).toUpperCase() || '?'}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 truncate text-lg">{user.name}</p>
                  <p className="text-sm text-slate-500 truncate">
                    {user.role === 'provider' ? user.profession || 'Service Provider' : 'Client'}
                    {user.location && ` • ${user.location}`}
                  </p>
                </div>
                <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                  user.role === 'provider' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {user.role === 'provider' ? 'Provider' : 'Client'}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
