import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';

export default function ReviewScreen({ isDesktop }) {
  const { providerId } = useParams();
  const [provider, setProvider] = useState(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [punctuality, setPunctuality] = useState(5);
  const [professionalism, setProfessionalism] = useState(4);
  const [comment, setComment] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProvider = async () => {
      const data = await api.getProvider(providerId);
      setProvider(data);
    };
    fetchProvider();
  }, [providerId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.submitReview(providerId, rating, comment, punctuality, professionalism);
    navigate('/home');
  };

  if (!provider) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background-light dark:bg-background-dark">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const StarRating = ({ value, onChange, onHover, hoverVal, interactive = true }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => interactive && onChange(star)}
          onMouseEnter={() => interactive && onHover(star)}
          onMouseLeave={() => interactive && onHover(0)}
          className={`transition-transform ${interactive ? 'active:scale-95 focus:outline-none cursor-pointer' : 'cursor-default'}`}
        >
          <span
            className={`material-symbols-outlined ${(hoverVal || value) >= star ? 'text-primary' : 'text-slate-300 dark:text-slate-600'} ${interactive ? 'hover:text-primary/50' : ''}`}
            style={{ fontSize: '40px', fontVariationSettings: "'FILL' 1" }}
          >
            star
          </span>
        </button>
      ))}
    </div>
  );

  const SmallStarRating = ({ value, onChange }) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className="focus:outline-none"
        >
          <span
            className={`material-symbols-outlined ${value >= star ? 'text-primary' : 'text-slate-300 dark:text-slate-600'}`}
            style={{ fontSize: '20px', fontVariationSettings: "'FILL' 1" }}
          >
            star
          </span>
        </button>
      ))}
    </div>
  );

  if (!isDesktop) {
    return (
      <div className="relative flex h-full min-h-screen w-full flex-col overflow-x-hidden max-w-md mx-auto bg-white dark:bg-background-dark">
        <div className="flex items-center px-4 py-4 justify-between sticky top-0 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md z-10">
          <button onClick={() => navigate(-1)} className="flex size-10 items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <span className="material-symbols-outlined text-slate-900 dark:text-white" style={{ fontSize: '24px' }}>close</span>
          </button>
          <h2 className="text-slate-900 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] text-center">Write a Review</h2>
          <div className="w-10"></div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col items-center px-6 pb-24">
          <div className="flex w-full flex-col gap-4 items-center mt-4">
            <div className="flex gap-3 flex-col items-center">
              <div className="relative">
                {provider.avatar ? (
                  <div
                    className="bg-center bg-no-repeat aspect-square bg-cover rounded-full h-24 w-24 border-4 border-white dark:border-slate-800 shadow-lg"
                    style={{ backgroundImage: `url("${provider.avatar}")` }}
                  />
                ) : (
                  <div className="bg-slate-300 aspect-square rounded-full h-24 w-24 border-4 border-white dark:border-slate-800 shadow-lg flex items-center justify-center">
                    <span className="text-3xl font-bold text-slate-500">
                      {provider.name ? provider.name.charAt(0).toUpperCase() : '?'}
                    </span>
                  </div>
                )}
                <div className="absolute bottom-0 right-0 bg-green-500 border-2 border-background-dark w-6 h-6 rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-white" style={{ fontSize: '14px' }}>check</span>
                </div>
              </div>
              <div className="flex flex-col items-center justify-center">
                <p className="text-slate-900 dark:text-white text-xl font-bold leading-tight tracking-tight text-center">{provider.name}</p>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-normal mt-1">{provider.profession} • Job #{providerId}029</p>
              </div>
            </div>
          </div>

          <div className="w-full mt-8 mb-2">
            <h2 className="text-slate-900 dark:text-white tracking-tight text-2xl font-bold leading-tight text-center">How was your service?</h2>
            <p className="text-slate-500 dark:text-slate-400 text-center text-sm mt-2">Your feedback helps {provider.name.split(' ')[0]} improve.</p>
          </div>

          <div className="flex justify-center gap-2 py-4">
            <StarRating value={rating} onChange={setRating} onHover={setHoverRating} hoverVal={hoverRating} />
          </div>

          <div className="w-full bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Punctuality</span>
              <SmallStarRating value={punctuality} onChange={setPunctuality} />
            </div>
            <div className="h-px bg-slate-200 dark:bg-slate-700 w-full"></div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Professionalism</span>
              <SmallStarRating value={professionalism} onChange={setProfessionalism} />
            </div>
          </div>

          <div className="flex w-full flex-col gap-2 mt-6">
            <label className="text-slate-900 dark:text-white text-base font-semibold leading-normal pl-1">Additional Comments</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="form-input flex w-full min-w-0 resize-none overflow-hidden rounded-xl text-slate-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:border-primary min-h-[140px] placeholder:text-slate-400 dark:placeholder:text-slate-500 p-4 text-base"
              placeholder="Share your experience... Was the job done on time? Was the workspace left clean?"
              maxLength={500}
            />
            <div className="flex justify-between px-1">
              <p className="text-xs text-slate-400 dark:text-slate-500">Your review helps others find good pros.</p>
              <p className="text-xs text-slate-400 dark:text-slate-500">{comment.length}/500</p>
            </div>
          </div>

          <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-4 bg-white dark:bg-background-dark border-t border-slate-100 dark:border-slate-800">
            <button
              type="submit"
              className="flex w-full items-center justify-center rounded-xl bg-primary px-6 py-3.5 text-base font-bold leading-normal text-white shadow-lg shadow-primary/20 hover:bg-primary/90 active:scale-[0.98] transition-all"
            >
              Submit Review
            </button>
            <button
              type="button"
              onClick={() => navigate('/home')}
              className="mt-3 flex w-full items-center justify-center text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 py-2"
            >
              Skip feedback
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl border border-slate-200 p-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-slate-900">Write a Review</h2>
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <span className="material-symbols-outlined text-slate-600">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="flex items-center gap-4 mb-8 p-4 bg-slate-50 rounded-xl">
            <div className="relative">
              {provider.avatar ? (
                <div
                  className="bg-center bg-no-repeat bg-cover rounded-xl h-20 w-20 border-2 border-white shadow"
                  style={{ backgroundImage: `url("${provider.avatar}")` }}
                />
              ) : (
                <div className="bg-slate-300 rounded-xl h-20 w-20 border-2 border-white shadow flex items-center justify-center">
                  <span className="text-2xl font-bold text-slate-500">
                    {provider.name ? provider.name.charAt(0).toUpperCase() : '?'}
                  </span>
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1 border-2 border-white">
                <span className="material-symbols-outlined text-white text-xs">check</span>
              </div>
            </div>
            <div>
              <p className="text-lg font-bold text-slate-900">{provider.name}</p>
              <p className="text-slate-500">{provider.profession} • Job #{providerId}029</p>
            </div>
          </div>

          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-slate-900 mb-2">How was your service?</h3>
            <p className="text-slate-500 text-sm">Your feedback helps {provider.name.split(' ')[0]} improve.</p>
          </div>

          <div className="flex justify-center gap-2 py-4 mb-6">
            <StarRating value={rating} onChange={setRating} onHover={setHoverRating} hoverVal={hoverRating} />
          </div>

          <div className="bg-slate-50 rounded-xl p-5 space-y-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">Punctuality</span>
              <SmallStarRating value={punctuality} onChange={setPunctuality} />
            </div>
            <div className="h-px bg-slate-200 w-full"></div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">Professionalism</span>
              <SmallStarRating value={professionalism} onChange={setProfessionalism} />
            </div>
          </div>

          <div className="flex flex-col gap-2 mb-8">
            <label className="text-slate-900 text-base font-semibold">Additional Comments</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 focus:border-primary focus:ring-2 focus:ring-primary/50 p-4 text-base text-slate-900 placeholder:text-slate-400 min-h-[140px]"
              placeholder="Share your experience... Was the job done on time? Was the workspace left clean?"
              maxLength={500}
            />
            <div className="flex justify-between">
              <p className="text-xs text-slate-400">Your review helps others find good pros.</p>
              <p className="text-xs text-slate-400">{comment.length}/500</p>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate('/home')}
              className="flex-1 py-3 text-slate-600 font-medium hover:text-slate-900 transition-colors"
            >
              Skip feedback
            </button>
            <button
              type="submit"
              className="flex-1 flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-base font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
            >
              Submit Review
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
