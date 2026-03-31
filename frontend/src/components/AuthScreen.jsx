import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { api } from '../services/api';

export default function AuthScreen({ onAuth }) {
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') === 'login' ? 'login' : 'signup';
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('client');
  const [professionId, setProfessionId] = useState('');
  const [professions, setProfessions] = useState(null);
  const [bio, setBio] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [showAddProfession, setShowAddProfession] = useState(false);
  const [newProfessionName, setNewProfessionName] = useState('');
  const navigate = useNavigate();

  const defaultProfessions = [
    { id: 1, name: 'Plumber', icon: 'plumbing', color: '#3b82f6' },
    { id: 2, name: 'Electrician', icon: 'bolt', color: '#eab308' },
    { id: 3, name: 'Painter', icon: 'format_paint', color: '#ec4899' },
    { id: 4, name: 'Carpenter', icon: 'carpenter', color: '#f59e0b' },
    { id: 5, name: 'Home Cleaner', icon: 'cleaning_services', color: '#8b5cf6' },
    { id: 6, name: 'Mover', icon: 'local_shipping', color: '#22c55e' },
    { id: 7, name: 'HVAC Technician', icon: 'ac_unit', color: '#06b6d4' },
    { id: 8, name: 'Landscaper', icon: 'grass', color: '#84cc16' },
    { id: 9, name: 'Roofer', icon: 'roofing', color: '#dc2626' },
    { id: 10, name: 'Appliance Repair', icon: 'kitchen', color: '#6366f1' },
  ];

  useEffect(() => {
    const loadProfessions = async () => {
      try {
        const data = await api.getProfessions();
        if (Array.isArray(data) && data.length > 0) {
          setProfessions(data);
        } else {
          setProfessions(defaultProfessions);
        }
      } catch (err) {
        console.error('Failed to load professions:', err);
        setProfessions(defaultProfessions);
      }
    };
    loadProfessions();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (mode === 'signup' && role === 'provider' && !professionId) {
      setError('Please select your specialization');
      return;
    }
    
    try {
      if (mode === 'login') {
        const res = await api.login(email, password);
        if (res.success) {
          localStorage.setItem('user', JSON.stringify(res.user));
          if (onAuth) onAuth(res.user);
          navigate('/home');
        } else {
          setError(res.error || 'Login failed');
        }
      } else {
        const res = await api.signup({ 
          name, 
          email, 
          password, 
          role,
          phone,
          professionId: role === 'provider' ? professionId : null,
          bio: role === 'provider' ? bio : '',
        });
        if (res.success) {
          localStorage.setItem('user', JSON.stringify(res.user));
          if (onAuth) onAuth(res.user);
          navigate('/home');
        } else {
          setError(res.error || 'Signup failed');
        }
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    }
  };

  const handleAddProfession = async (e) => {
    e.preventDefault();
    if (!newProfessionName.trim()) return;
    
    try {
      const res = await api.addProfession({ name: newProfessionName.trim() });
      if (res.success) {
        setProfessions([...(professions || []), res.profession]);
        setProfessionId(res.profession._id || res.profession.id);
        setNewProfessionName('');
        setShowAddProfession(false);
      } else {
        setError(res.error || 'Failed to add specialization');
      }
    } catch (err) {
      setError('Failed to add specialization');
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-center bg-no-repeat bg-cover"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1200&q=80')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-slate-800/60 to-blue-900/40"></div>
        
        <div className="absolute top-8 left-8 flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30">
            <span className="material-symbols-outlined text-white text-3xl">handyman</span>
          </div>
          <h1 className="text-white text-3xl font-black tracking-tight">PRUCOLY</h1>
        </div>
        
        <div className="relative z-10 p-12 flex flex-col justify-end h-full pb-16">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 w-fit">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              <span className="text-white/90 text-sm font-medium">Trusted by 10,000+ customers</span>
            </div>
            <h2 className="text-white text-4xl font-bold leading-tight max-w-lg">
              Connect with skilled professionals for your home
            </h2>
            <p className="text-white/70 text-lg max-w-md">
              Get instant access to vetted artisans, transparent pricing, and guaranteed satisfaction.
            </p>
          </div>
          
          <div className="flex items-center gap-8 mt-12">
            <div className="text-center">
              <div className="text-3xl font-bold text-white">500+</div>
              <div className="text-white/60 text-sm">Verified Pros</div>
            </div>
            <div className="w-px h-12 bg-white/20"></div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white">4.9</div>
              <div className="text-white/60 text-sm">Avg Rating</div>
            </div>
            <div className="w-px h-12 bg-white/20"></div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white">24h</div>
              <div className="text-white/60 text-sm">Response Time</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-[440px]">
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
              <span className="material-symbols-outlined text-white text-2xl">handyman</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">PRUCOLY</h1>
          </div>

          <div className="mb-8">
            <h2 className="text-slate-900 text-2xl font-bold leading-tight pb-1">
              {mode === 'login' ? 'Welcome back' : 'Create your account'}
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              {mode === 'login' ? 'Sign in to continue to your dashboard' : 'Join thousands of satisfied customers and providers'}
            </p>
          </div>

          <div className="flex mb-6 p-1 bg-slate-100 rounded-xl">
            <label className={`flex-1 cursor-pointer h-11 flex items-center justify-center rounded-lg transition-all ${mode === 'login' ? 'bg-white text-primary shadow-sm font-semibold text-sm' : 'text-slate-500 text-sm font-medium'}`}>
              Log In
              <input
                type="radio"
                name="auth_mode"
                checked={mode === 'login'}
                onChange={() => {
                  setMode('login');
                  setRole('client');
                  setProfessionId('');
                }}
                className="invisible w-0 absolute"
              />
            </label>
            <label className={`flex-1 cursor-pointer h-11 flex items-center justify-center rounded-lg transition-all ${mode === 'signup' ? 'bg-white text-primary shadow-sm font-semibold text-sm' : 'text-slate-500 text-sm font-medium'}`}>
              Sign Up
              <input
                type="radio"
                name="auth_mode"
                checked={mode === 'signup'}
                onChange={() => setMode('signup')}
                className="invisible w-0 absolute"
              />
            </label>
          </div>

          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            {mode === 'signup' && (
              <>
                <div className="mb-5">
                  <label className="text-sm font-semibold text-slate-700 mb-3 block">I want to join as:</label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setRole('client')}
                      className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                        role === 'client' 
                          ? 'border-primary bg-blue-50/50' 
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <span className="material-symbols-outlined text-2xl mb-2 block text-slate-600">person</span>
                      <span className="text-sm font-semibold text-slate-700">Client</span>
                      <p className="text-xs text-slate-500 mt-1">Find & book services</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('provider')}
                      className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                        role === 'provider' 
                          ? 'border-primary bg-blue-50/50' 
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <span className="material-symbols-outlined text-2xl mb-2 block text-slate-600">construction</span>
                      <span className="text-sm font-semibold text-slate-700">Provider</span>
                      <p className="text-xs text-slate-500 mt-1">Offer your services</p>
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-700 text-sm font-medium">Full Name</label>
                  <div className="relative group">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="input-field pl-10"
                      placeholder="John Doe"
                      required
                    />
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary">person</span>
                  </div>
                </div>

                {role === 'provider' && (
                  <>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-slate-700 text-sm font-medium">Select Your Specialization</label>
                      <p className="text-xs text-slate-500 mb-2">Choose the service you specialize in</p>
                      <div className="grid grid-cols-2 gap-2.5">
                        {professions.map((prof) => (
                          <button
                            key={prof._id}
                            type="button"
                            onClick={() => setProfessionId(prof._id)}
                            className={`flex items-center gap-2.5 p-2.5 rounded-xl border-2 transition-all ${
                              professionId === prof._id
                                ? 'border-primary bg-blue-50/50'
                                : 'border-slate-200 hover:border-slate-300 bg-white'
                            }`}
                          >
                            <div 
                              className="w-9 h-9 rounded-lg flex items-center justify-center"
                              style={{ backgroundColor: prof.color ? `${prof.color}20` : '#f1f5f9' }}
                            >
                              <span 
                                className="material-symbols-outlined text-lg"
                                style={{ color: prof.color || '#64748b' }}
                              >
                                {prof.icon}
                              </span>
                            </div>
                            <span className="text-xs font-semibold text-slate-700">{prof.name}</span>
                          </button>
                        ))}
                      </div>
                      
                      {!showAddProfession ? (
                        <button
                          type="button"
                          onClick={() => setShowAddProfession(true)}
                          className="flex items-center justify-center gap-2 w-full p-3 rounded-xl border-2 border-dashed border-slate-300 text-slate-500 hover:border-primary hover:text-primary hover:bg-blue-50/30 transition-all text-sm font-medium mt-1"
                        >
                          <span className="material-symbols-outlined text-lg">add</span>
                          Add New Specialization
                        </button>
                      ) : (
                        <form onSubmit={handleAddProfession} className="p-4 rounded-xl border-2 border-primary/30 bg-blue-50/30 mt-2">
                          <div className="flex flex-col gap-2">
                            <label className="text-slate-700 text-sm font-medium">New Specialization Name</label>
                            <input
                              type="text"
                              value={newProfessionName}
                              onChange={(e) => setNewProfessionName(e.target.value)}
                              className="input-field"
                              placeholder="e.g., Tile Installer"
                              autoFocus
                            />
                            <div className="flex gap-2 mt-1.5">
                              <button
                                type="submit"
                                className="flex-1 h-9 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary-dark transition-colors"
                              >
                                Add
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setShowAddProfession(false);
                                  setNewProfessionName('');
                                }}
                                className="flex-1 h-9 bg-slate-200 text-slate-600 rounded-lg text-sm font-semibold hover:bg-slate-300 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </form>
                      )}
                      
                      {mode === 'signup' && role === 'provider' && !professionId && (
                        <p className="text-xs text-red-500 mt-1">Please select your specialization</p>
                      )}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-slate-700 text-sm font-medium">Bio</label>
                      <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        className="input-field resize-none min-h-[90px]"
                        placeholder="Describe your services, experience, and what makes you unique..."
                      />
                    </div>
                  </>
                )}
              </>
            )}
            
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-700 text-sm font-medium">Email Address</label>
              <div className="relative group">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-10"
                  placeholder="name@company.com"
                  required
                />
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary">mail</span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label className="text-slate-700 text-sm font-medium">Password</label>
                {mode === 'login' && (
                  <a className="text-xs font-semibold text-primary hover:text-primary-dark transition-colors" href="#">Forgot?</a>
                )}
              </div>
              <div className="relative group">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-10 pr-10"
                  placeholder="Enter your password"
                  required
                />
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary">lock</span>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  <span className="material-symbols-outlined text-lg">{showPassword ? 'visibility' : 'visibility_off'}</span>
                </button>
              </div>
            </div>

            {mode === 'signup' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-slate-700 text-sm font-medium">Phone Number <span className="text-slate-400 font-normal">(optional)</span></label>
                <div className="relative group">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="input-field pl-10"
                    placeholder="+1 (555) 000-0000"
                  />
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary">phone</span>
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                <span className="material-symbols-outlined text-red-500 text-lg">error</span>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              className="btn-primary w-full h-11 text-base mt-1"
            >
              {mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-3 text-slate-400 font-medium">Or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button className="flex items-center justify-center gap-2.5 h-11 rounded-xl border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all bg-white">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="text-sm font-medium text-slate-700">Google</span>
            </button>
            <button className="flex items-center justify-center gap-2.5 h-11 rounded-xl border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all bg-white">
              <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <span className="text-sm font-medium text-slate-700">Facebook</span>
            </button>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <p className="text-xs text-center text-slate-500 leading-relaxed">
              By continuing, you agree to our{' '}
              <a className="text-primary font-medium hover:underline" href="#">Terms of Service</a>{' '}
              and{' '}
              <a className="text-primary font-medium hover:underline" href="#">Privacy Policy</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
