import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get('token');
      const userId = searchParams.get('userId');
      const name = searchParams.get('name');
      const email = searchParams.get('email');
      const role = searchParams.get('role');
      const avatar = searchParams.get('avatar');
      const urlError = searchParams.get('error');

      if (urlError) {
        setError('OAuth authentication failed. Please try again.');
        setLoading(false);
        setTimeout(() => {
          navigate('/auth?mode=login');
        }, 3000);
        return;
      }

      if (token && userId) {
        localStorage.setItem('token', token);
        
        const user = {
          id: userId,
          name: decodeURIComponent(name || ''),
          email: decodeURIComponent(email || ''),
          role: role || 'user',
          avatar: decodeURIComponent(avatar || ''),
        };
        
        localStorage.setItem('user', JSON.stringify(user));
        
        setLoading(false);
        navigate('/home');
      } else {
        setError('Invalid OAuth callback. Please try again.');
        setLoading(false);
        setTimeout(() => {
          navigate('/auth?mode=login');
        }, 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Completing sign in...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
        <div className="text-center p-8 bg-white rounded-2xl shadow-xl max-w-md mx-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Authentication Failed</h2>
          <p className="text-slate-500 mb-4">{error}</p>
          <p className="text-sm text-slate-400">Redirecting you back...</p>
        </div>
      </div>
    );
  }

  return null;
}
