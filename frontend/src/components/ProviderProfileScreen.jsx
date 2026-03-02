import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';

export default function ProviderProfileScreen({ isDesktop }) {
  const { id } = useParams();
  const [provider, setProvider] = useState(null);
  const [error, setError] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [activeTab, setActiveTab] = useState('about');
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedService, setSelectedService] = useState('');
  const [requestDescription, setRequestDescription] = useState('');
  const [requestSent, setRequestSent] = useState(false);
  const [following, setFollowing] = useState(false);
  const [followingList, setFollowingList] = useState([]);
  const [followRequestSent, setFollowRequestSent] = useState(false);
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    const fetchData = async () => {
      setError(null);
      const [providerData, reviewsData, followingData] = await Promise.all([
        api.getProvider(id),
        api.getProviderReviews(id),
        api.getFollowing(),
      ]);
      if (providerData && !providerData.error) {
        setProvider(providerData);
        if (providerData.services?.length > 0) {
          setSelectedService(providerData.services[0].name);
        }
      } else {
        setError(providerData?.error || 'Provider not found');
      }
      setReviews(reviewsData || []);
      setFollowingList(followingData || []);
      setFollowing(followingData?.includes(parseInt(id)));
    };
    fetchData();
  }, [id]);

  const handleRequestService = async (e) => {
    e.preventDefault();
    const res = await api.createServiceRequest({
      providerId: id,
      serviceName: selectedService,
      description: requestDescription,
    });
    if (res.success) {
      setRequestSent(true);
      setTimeout(() => {
        setShowRequestModal(false);
        setRequestSent(false);
      }, 2000);
    }
  };

  const handleFollow = async () => {
    const res = await api.followProvider(id);
    if (res.success) {
      if (res.message === 'Follow request sent') {
        setFollowRequestSent(true);
      } else {
        setFollowing(res.following);
      }
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background-light dark:bg-background-dark p-4">
        <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">error</span>
        <p className="text-slate-500 text-lg">{error}</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 px-4 py-2 bg-primary text-white rounded-lg"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background-light dark:bg-background-dark">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const isOwnProfile = currentUser.id === provider.id;

  if (!isDesktop) {
    return (
      <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark pb-24">
        <div className="sticky top-0 z-50 flex items-center bg-card-light dark:bg-card-dark p-4 pb-2 justify-between border-b border-gray-100 dark:border-gray-800 shadow-sm">
          <button 
            onClick={() => navigate(-1)}
            className="flex size-12 shrink-0 items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full justify-center transition-colors"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>arrow_back_ios_new</span>
          </button>
          <h2 className="text-text-light dark:text-text-dark text-lg font-bold leading-tight tracking-[-0.015em] text-center flex-1">Provider Profile</h2>
          <div className="flex w-12 items-center justify-end">
            <button className="flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full size-12 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>ios_share</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col">
          <div className="flex p-4 pb-2 bg-card-light dark:bg-card-dark pt-6">
            <div className="flex w-full flex-col gap-4 items-center">
              <div className="relative">
                {provider.avatar ? (
                  <div
                    className="bg-center bg-no-repeat aspect-square bg-cover rounded-full h-32 w-32 border-4 border-background-light dark:border-background-dark shadow-md"
                    style={{ backgroundImage: `url("${provider.avatar}")` }}
                  />
                ) : (
                  <div className="bg-slate-300 aspect-square rounded-full h-32 w-32 border-4 border-background-light dark:border-background-dark shadow-md flex items-center justify-center">
                    <span className="text-3xl font-bold text-slate-500">
                      {provider.name ? provider.name.charAt(0).toUpperCase() : '?'}
                    </span>
                  </div>
                )}
                {provider.verified && (
                  <div className="absolute bottom-1 right-1 bg-green-500 rounded-full p-1.5 border-4 border-card-light dark:border-card-dark">
                    <span className="material-symbols-outlined text-white text-sm">verified</span>
                  </div>
                )}
              </div>
              <div className="flex flex-col items-center justify-center">
                <div className="flex items-center gap-1.5 mb-1">
                  <p className="text-text-light dark:text-text-dark text-[22px] font-bold leading-tight tracking-[-0.015em] text-center">{provider.name}</p>
                </div>
                <p className="text-secondary-text-light dark:text-secondary-text-dark text-base font-medium leading-normal text-center">{provider.profession}</p>
                <div className="flex items-center gap-1 mt-1">
                  <span className="material-symbols-outlined text-orange-400" style={{ fontSize: '16px' }}>star</span>
                  <span className="text-text-light dark:text-text-dark font-bold text-sm">{provider.rating || 0}</span>
                  <span className="text-secondary-text-light dark:text-secondary-text-dark text-sm">({provider.reviewCount || 0} reviews)</span>
                </div>
              </div>
            </div>
          </div>

          {!isOwnProfile && currentUser.role === 'client' && (
            <div className="px-4 pb-4">
              <button
                onClick={handleFollow}
                disabled={followRequestSent}
                className={`w-full py-2.5 rounded-xl font-medium transition-colors ${
                  following || followRequestSent
                    ? 'bg-slate-200 text-slate-700' 
                    : 'bg-primary text-white'
                }`}
              >
                {following ? 'Following' : followRequestSent ? 'Request Sent' : 'Follow'}
              </button>
            </div>
          )}

          <div className="flex justify-around py-4 bg-card-light dark:bg-card-dark border-b border-gray-100 dark:border-gray-800">
            <div className="flex flex-col items-center">
              <p className="text-lg font-bold text-text-light dark:text-text-dark">{provider.jobsDone || 0}</p>
              <p className="text-xs text-secondary-text-light dark:text-secondary-text-dark uppercase tracking-wide">Jobs Done</p>
            </div>
            <div className="w-px bg-gray-200 dark:bg-gray-700"></div>
            <div className="flex flex-col items-center">
              <p className="text-lg font-bold text-text-light dark:text-text-dark">{provider.rating || 0}</p>
              <p className="text-xs text-secondary-text-light dark:text-secondary-text-dark uppercase tracking-wide">Rating</p>
            </div>
            <div className="w-px bg-gray-200 dark:bg-gray-700"></div>
            <div className="flex flex-col items-center">
              <p className="text-lg font-bold text-text-light dark:text-text-dark">${provider.hourlyRate}</p>
              <p className="text-xs text-secondary-text-light dark:text-secondary-text-dark uppercase tracking-wide">Per Hour</p>
            </div>
          </div>

          <div className="sticky top-[72px] z-40 bg-background-light dark:bg-background-dark pt-6 px-4 pb-2">
            <div className="flex h-12 w-full items-center justify-center rounded-xl bg-gray-200 dark:bg-gray-800 p-1">
              {['About', 'Portfolio', 'Reviews'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab.toLowerCase())}
                  className={`flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-lg px-2 transition-all ${
                    activeTab === tab.toLowerCase()
                      ? 'bg-card-light dark:bg-card-dark shadow-sm text-primary'
                      : 'text-secondary-text-light dark:text-secondary-text-dark'
                  }`}
                >
                  <span className="truncate text-sm font-semibold">{tab}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="px-4 py-2 space-y-6">
            {activeTab === 'about' && (
              <>
                <div className="bg-card-light dark:bg-card-dark p-5 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
                  <h3 className="text-text-light dark:text-text-dark text-lg font-bold mb-3">About {provider.name.split(' ')[0]}</h3>
                  <p className="text-secondary-text-light dark:text-secondary-text-dark text-sm leading-relaxed">
                    {provider.bio || 'No bio available.'}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-4">
                    {provider.services?.map((service, idx) => (
                      <span key={idx} className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-text-light dark:text-text-dark text-xs font-medium rounded-full">{service.name}</span>
                    ))}
                  </div>
                </div>
              </>
            )}

            {activeTab === 'portfolio' && (
              <div className="grid grid-cols-2 gap-2">
                {provider.portfolio?.map((item) => (
                  <div key={item.id} className="aspect-square rounded-lg overflow-hidden bg-gray-200">
                    <img src={item.imageUrl} alt={item.caption} className="w-full h-full object-cover" />
                  </div>
                ))}
                {(!provider.portfolio || provider.portfolio.length === 0) && (
                  <p className="col-span-2 text-center text-slate-500 py-8">No portfolio items yet.</p>
                )}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="bg-card-light dark:bg-card-dark p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold">
                          {review.clientName?.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-text-light dark:text-text-dark">{review.clientName}</p>
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span key={star} className={`material-symbols-outlined ${star <= review.rating ? 'text-primary' : 'text-gray-300'}`} style={{ fontSize: '12px' }}>star</span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs text-secondary-text-light dark:text-secondary-text-dark">{review.createdAt?.split('T')[0]}</span>
                    </div>
                    <p className="text-sm text-secondary-text-light dark:text-secondary-text-dark">{review.comment}</p>
                  </div>
                ))}
                {reviews.length === 0 && (
                  <p className="text-center text-slate-500 py-8">No reviews yet.</p>
                )}
              </div>
            )}
          </div>
        </div>

        {!isOwnProfile && currentUser.role === 'client' && (
          <div className="fixed bottom-0 left-0 right-0 bg-card-light dark:bg-card-dark border-t border-gray-100 dark:border-gray-800 p-4 safe-area-bottom z-50">
            <div className="flex items-center gap-4 max-w-lg mx-auto">
              <button 
                onClick={() => setShowRequestModal(true)}
                className="flex-1 bg-primary hover:bg-blue-600 text-white font-bold h-12 rounded-xl shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">calendar_month</span>
                Request Service
              </button>
              <Link to={`/messages/${provider.id}`} className="flex items-center justify-center w-12 h-12 bg-white border border-primary text-primary rounded-xl">
                <span className="material-symbols-outlined">chat_bubble</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex gap-8">
      <div className="flex-1">
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="flex p-6 pb-4 bg-slate-50">
            <div className="flex w-full gap-6 items-center">
              <div className="relative">
                {provider.avatar ? (
                  <div
                    className="bg-center bg-no-repeat aspect-square bg-cover rounded-2xl h-32 w-32 border-4 border-white shadow-md"
                    style={{ backgroundImage: `url("${provider.avatar}")` }}
                  />
                ) : (
                  <div className="bg-slate-300 aspect-square rounded-2xl h-32 w-32 border-4 border-white shadow-md flex items-center justify-center">
                    <span className="text-3xl font-bold text-slate-500">
                      {provider.name ? provider.name.charAt(0).toUpperCase() : '?'}
                    </span>
                  </div>
                )}
                {provider.verified && (
                  <div className="absolute bottom-2 right-2 bg-green-500 rounded-full p-1.5 border-4 border-white">
                    <span className="material-symbols-outlined text-white text-sm">verified</span>
                  </div>
                )}
              </div>
              <div className="flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl font-bold text-slate-900">{provider.name}</h1>
                </div>
                <p className="text-slate-500 text-base">{provider.profession}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="material-symbols-outlined text-amber-400" style={{ fontSize: '20px' }}>star</span>
                  <span className="font-bold text-slate-900">{provider.rating || 0}</span>
                  <span className="text-slate-500">({provider.reviewCount || 0} reviews)</span>
                </div>
              </div>
            </div>
          </div>

          {!isOwnProfile && currentUser.role === 'client' && (
            <div className="px-6 pb-4 flex gap-3">
              <button
                onClick={handleFollow}
                disabled={followRequestSent}
                className={`px-6 py-2.5 rounded-xl font-medium transition-colors ${
                  following || followRequestSent
                    ? 'bg-slate-200 text-slate-700 hover:bg-slate-300' 
                    : 'bg-primary text-white hover:bg-blue-600'
                }`}
              >
                {following ? 'Following' : followRequestSent ? 'Request Sent' : 'Follow'}
              </button>
              <Link to={`/messages/${provider.id}`} className="flex items-center gap-2 px-6 py-2.5 border border-primary text-primary rounded-xl hover:bg-blue-50 transition-colors">
                <span className="material-symbols-outlined">chat_bubble</span>
                Message
              </Link>
            </div>
          )}

          <div className="flex justify-around py-6 border-b border-slate-200">
            <div className="flex flex-col items-center">
              <p className="text-xl font-bold text-slate-900">{provider.jobsDone || 0}</p>
              <p className="text-xs text-slate-500 uppercase tracking-wide">Jobs Done</p>
            </div>
            <div className="w-px bg-slate-200"></div>
            <div className="flex flex-col items-center">
              <p className="text-xl font-bold text-slate-900">{provider.rating || 0}</p>
              <p className="text-xs text-slate-500 uppercase tracking-wide">Rating</p>
            </div>
            <div className="w-px bg-slate-200"></div>
            <div className="flex flex-col items-center">
              <p className="text-xl font-bold text-slate-900">${provider.hourlyRate}</p>
              <p className="text-xs text-slate-500 uppercase tracking-wide">Per Hour</p>
            </div>
          </div>

          <div className="p-6">
            <div className="flex gap-4 mb-6">
              {['About', 'Portfolio', 'Reviews'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab.toLowerCase())}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === tab.toLowerCase()
                      ? 'bg-primary text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {activeTab === 'about' && (
              <>
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-3">About {provider.name.split(' ')[0]}</h3>
                  <p className="text-slate-600 leading-relaxed">
                    {provider.bio || 'No bio available.'}
                  </p>
                  <div className="flex items-center gap-2 mt-3 text-slate-500 text-sm">
                    <span className="material-symbols-outlined text-[18px]">location_on</span>
                    {provider.location || 'NYC Area'} • {provider.serviceArea || 'Available'}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 overflow-hidden">
                  <div className="p-4 border-b border-slate-200">
                    <h3 className="text-lg font-bold text-slate-900">Services Offered</h3>
                  </div>
                  <div className="divide-y divide-slate-200">
                    {provider.services?.map((service, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4">
                        <span className="text-slate-700">{service.name}</span>
                        <span className="text-primary font-semibold">${service.price}</span>
                      </div>
                    ))}
                    {(!provider.services || provider.services.length === 0) && (
                      <p className="p-4 text-slate-500">No services listed.</p>
                    )}
                  </div>
                </div>
              </>
            )}

            {activeTab === 'portfolio' && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {provider.portfolio?.map((item) => (
                  <div key={item.id} className="aspect-square rounded-xl overflow-hidden bg-gray-100">
                    <img src={item.imageUrl} alt={item.caption} className="w-full h-full object-cover hover:scale-105 transition-transform" />
                  </div>
                ))}
                {(!provider.portfolio || provider.portfolio.length === 0) && (
                  <p className="col-span-3 text-center text-slate-500 py-8">No portfolio items yet.</p>
                )}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-4">
                <div className="rounded-xl border border-slate-200 p-5">
                  <div className="flex justify-between items-end mb-4">
                    <h3 className="text-lg font-bold text-slate-900">Reviews</h3>
                  </div>
                  <div className="flex gap-8 items-center">
                    <div className="flex flex-col items-center justify-center min-w-[80px]">
                      <p className="text-5xl font-black text-slate-900">{provider.rating || 0}</p>
                      <div className="flex gap-0.5 my-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span key={star} className="material-symbols-outlined text-primary" style={{ fontSize: '16px' }}>star</span>
                        ))}
                      </div>
                      <p className="text-xs text-slate-500">Based on {provider.reviewCount || 0} reviews</p>
                    </div>
                  </div>
                </div>

                {reviews.map((review) => (
                  <div key={review.id} className="border-t border-slate-200 pt-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold">
                          {review.clientName?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{review.clientName}</p>
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span key={star} className={`material-symbols-outlined ${star <= review.rating ? 'text-primary' : 'text-slate-300'}`} style={{ fontSize: '14px' }}>star</span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs text-slate-500">{review.createdAt?.split('T')[0]}</span>
                    </div>
                    <p className="text-slate-600">{review.comment}</p>
                  </div>
                ))}
                {reviews.length === 0 && (
                  <p className="text-center text-slate-500 py-8">No reviews yet.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="w-80 shrink-0">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sticky top-24">
          <div className="mb-4">
            <span className="text-sm text-slate-500">Starting at</span>
            <p className="text-3xl font-bold text-slate-900">${provider.hourlyRate}<span className="text-base font-normal text-slate-500">/hr</span></p>
          </div>
          
          {!isOwnProfile && currentUser.role === 'client' && (
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => setShowRequestModal(true)}
                className="flex items-center justify-center gap-2 w-full h-12 bg-primary hover:bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all"
              >
                <span className="material-symbols-outlined">calendar_month</span>
                Request Service
              </button>
              <Link to={`/messages/${provider.id}`} className="flex items-center justify-center gap-2 w-full h-12 bg-white border border-primary text-primary font-bold rounded-xl hover:bg-blue-50 transition-colors">
                <span className="material-symbols-outlined">chat_bubble</span>
                Send Message
              </Link>
            </div>
          )}

          <div className="flex justify-center gap-4 mt-6 pt-6 border-t border-slate-200">
            <button className="flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors text-slate-600">
              <span className="material-symbols-outlined">call</span>
            </button>
            <button className="flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors text-slate-600">
              <span className="material-symbols-outlined">ios_share</span>
            </button>
            <button 
              onClick={handleFollow}
              disabled={followRequestSent}
              className={`flex items-center justify-center w-12 h-12 rounded-full transition-colors ${
                following || followRequestSent ? 'bg-primary text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              <span className="material-symbols-outlined">{following ? 'person_remove' : 'person_add'}</span>
            </button>
          </div>
        </div>
      </div>

      {showRequestModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            {requestSent ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="material-symbols-outlined text-green-600 text-3xl">check</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Request Sent!</h3>
                <p className="text-slate-500">The provider will respond to your request soon.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-slate-900">Request Service</h3>
                  <button onClick={() => setShowRequestModal(false)} className="p-2 hover:bg-slate-100 rounded-full">
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
                <form onSubmit={handleRequestService}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Select Service</label>
                    <select
                      value={selectedService}
                      onChange={(e) => setSelectedService(e.target.value)}
                      className="w-full p-3 border border-slate-200 rounded-xl"
                    >
                      {provider.services?.map((service) => (
                        <option key={service.id} value={service.name}>
                          {service.name} - ${service.price}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Describe Your Issue</label>
                    <textarea
                      value={requestDescription}
                      onChange={(e) => setRequestDescription(e.target.value)}
                      className="w-full p-3 border border-slate-200 rounded-xl resize-none min-h-[120px]"
                      placeholder="Describe what you need help with..."
                      required
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowRequestModal(false)}
                      className="flex-1 py-3 text-slate-600 font-medium hover:bg-slate-100 rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-3 bg-primary text-white font-bold rounded-xl hover:bg-blue-600"
                    >
                      Send Request
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
