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
        setProfessions([...displayedProfessions, res.profession]);
        setProfessionId(res.profession.id);
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
    <div className="flex min-h-screen bg-slate-50">
      <div className="hidden lg:flex lg:w-1/2 relative">
        <div 
          className="absolute inset-0 bg-center bg-no-repeat bg-cover"
          style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCbV9dEDqLYOdI6Jk0hRbFk78ncefoCzMfkfpdqy1pDLh0dj6p4Mqmz6VP2sHtJaDTKIqChaWr1ThlvxxJmSk_s1r1AJgNxPMvsMvOpCn1UyObpjM-Ati60IWOIvhlvohbgc6r1cjVIKMB3zBsiQIGFYiyiyGYNxI1xKXsGOX0bAkRDMwer_lVeude_8u8LMHAXUYVhwKnsVoKKD8xtyDaqpAuc6KTi_eY4GMt4wGjHpgel97uLvhdQPTNjPGkrsmhl8qyjq9zKZjo')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent"></div>
        <div className="relative z-10 p-12 flex flex-col justify-end">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-lg">
              <span className="material-symbols-outlined text-white text-3xl">construction</span>
            </div>
            <h1 className="text-white text-4xl font-extrabold tracking-tight">PRUCOLY</h1>
          </div>
          <p className="text-white/90 text-lg font-medium max-w-md">Connect with trusted artisans and professionals for all your home needs.</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-[480px]">
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-lg">
              <span className="material-symbols-outlined text-white text-3xl">construction</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">PRUCOLY</h1>
          </div>

          <div className="mb-8">
            <h2 className="text-slate-900 tracking-tight text-[28px] font-bold leading-tight pb-1">
              {mode === 'login' ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-slate-500 text-base">
              {mode === 'login' ? 'Sign in to continue' : 'Join as a client or service provider'}
            </p>
          </div>

          <div className="flex mb-8">
            <div className="flex h-12 flex-1 items-center justify-center rounded-xl bg-slate-100 p-1">
              <label className={`flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-lg px-2 transition-all ${mode === 'login' ? 'bg-white shadow-sm text-primary' : 'text-slate-500'}`}>
                <span className="truncate text-sm font-semibold">Log In</span>
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
              <label className={`flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-lg px-2 transition-all ${mode === 'signup' ? 'bg-white shadow-sm text-primary' : 'text-slate-500'}`}>
                <span className="truncate text-sm font-semibold">Sign Up</span>
                <input
                  type="radio"
                  name="auth_mode"
                  checked={mode === 'signup'}
                  onChange={() => setMode('signup')}
                  className="invisible w-0 absolute"
                />
              </label>
            </div>
          </div>

          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            {mode === 'signup' && (
              <>
                <div className="mb-2">
                  <label className="text-sm font-semibold text-slate-700 mb-2 block">I want to join as:</label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setRole('client')}
                      className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                        role === 'client' 
                          ? 'border-primary bg-blue-50' 
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <span className="material-symbols-outlined text-2xl mb-1 block">person</span>
                      <span className="text-sm font-semibold">Client</span>
                      <p className="text-xs text-slate-500 mt-1">Find services</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('provider')}
                      className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                        role === 'provider' 
                          ? 'border-primary bg-blue-50' 
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <span className="material-symbols-outlined text-2xl mb-1 block">construction</span>
                      <span className="text-sm font-semibold">Provider</span>
                      <p className="text-xs text-slate-500 mt-1">Offer services</p>
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-slate-700 text-sm font-medium">Full Name</label>
                  <div className="relative group">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="flex w-full h-12 rounded-xl border border-slate-200 bg-slate-50 focus:border-primary focus:ring-2 focus:ring-primary/20 px-4 pl-11 text-base text-slate-900 placeholder:text-slate-400"
                      placeholder="John Doe"
                      required
                    />
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">person</span>
                  </div>
                </div>

                {role === 'provider' && (
                  <>
                    <div className="flex flex-col gap-2">
                      <label className="text-slate-700 text-sm font-medium">Select Your Specialization</label>
                      <p className="text-xs text-slate-500 mb-1">Choose the service you specialize in</p>
                      <div className="grid grid-cols-2 gap-3">
                        {professions.map((prof) => (
                          <button
                            key={prof._id}
                            type="button"
                            onClick={() => setProfessionId(prof._id)}
                            className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                              professionId === prof._id
                                ? 'border-primary bg-blue-50'
                                : 'border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div 
                              className="w-10 h-10 rounded-lg flex items-center justify-center"
                              style={{ backgroundColor: prof.color ? `${prof.color}20` : '#f1f5f9' }}
                            >
                              <span 
                                className="material-symbols-outlined text-xl"
                                style={{ color: prof.color || '#64748b' }}
                              >
                                {prof.icon}
                              </span>
                            </div>
                            <span className="text-sm font-semibold text-slate-700">{prof.name}</span>
                          </button>
                        ))}
                      </div>
                      
                      {!showAddProfession ? (
                        <button
                          type="button"
                          onClick={() => setShowAddProfession(true)}
                          className="flex items-center justify-center gap-2 w-full p-3 rounded-xl border-2 border-dashed border-slate-300 text-slate-500 hover:border-primary hover:text-primary transition-all"
                        >
                          <span className="material-symbols-outlined">add</span>
                          <span className="text-sm font-semibold">Add Specialization</span>
                        </button>
                      ) : (
                        <form onSubmit={handleAddProfession} className="p-4 rounded-xl border-2 border-primary bg-blue-50">
                          <div className="flex flex-col gap-2">
                            <label className="text-slate-700 text-sm font-medium">New Specialization Name</label>
                            <input
                              type="text"
                              value={newProfessionName}
                              onChange={(e) => setNewProfessionName(e.target.value)}
                              className="flex w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400"
                              placeholder="e.g., Tile Installer"
                              autoFocus
                            />
                            <div className="flex gap-2 mt-2">
                              <button
                                type="submit"
                                className="flex-1 h-9 bg-primary text-white rounded-lg text-sm font-semibold"
                              >
                                Add
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setShowAddProfession(false);
                                  setNewProfessionName('');
                                }}
                                className="flex-1 h-9 bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold"
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

                    <div className="flex flex-col gap-2">
                      <label className="text-slate-700 text-sm font-medium">Bio</label>
                      <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        className="flex w-full rounded-xl border border-slate-200 bg-slate-50 focus:border-primary focus:ring-2 focus:ring-primary/20 px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 resize-none min-h-[100px]"
                        placeholder="Describe your services and experience..."
                      />
                    </div>
                  </>
                )}
              </>
            )}
            
            <div className="flex flex-col gap-2">
              <label className="text-slate-700 text-sm font-medium">Email Address</label>
              <div className="relative group">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex w-full h-12 rounded-xl border border-slate-200 bg-slate-50 focus:border-primary focus:ring-2 focus:ring-primary/20 px-4 pl-11 text-base text-slate-900 placeholder:text-slate-400"
                  placeholder="name@example.com"
                  required
                />
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary">mail</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label className="text-slate-700 text-sm font-medium">Password</label>
                {mode === 'login' && (
                  <a className="text-sm font-semibold text-primary hover:text-primary/80" href="#">Forgot Password?</a>
                )}
              </div>
              <div className="relative group">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="flex w-full h-12 rounded-xl border border-slate-200 bg-slate-50 focus:border-primary focus:ring-2 focus:ring-primary/20 px-4 pl-11 pr-11 text-base text-slate-900 placeholder:text-slate-400"
                  placeholder="••••••••"
                  required
                />
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary">lock</span>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  <span className="material-symbols-outlined">{showPassword ? 'visibility' : 'visibility_off'}</span>
                </button>
              </div>
            </div>

            {mode === 'signup' && (
              <div className="flex flex-col gap-2">
                <label className="text-slate-700 text-sm font-medium">Phone Number</label>
                <div className="relative group">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="flex w-full h-12 rounded-xl border border-slate-200 bg-slate-50 focus:border-primary focus:ring-2 focus:ring-primary/20 px-4 pl-11 text-base text-slate-900 placeholder:text-slate-400"
                    placeholder="+1 234 567 8900"
                  />
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary">phone</span>
                </div>
              </div>
            )}

            {error && (
              <p className="text-red-500 text-sm text-center">{error}</p>
            )}

            <button
              type="submit"
              className="flex items-center justify-center w-full h-12 bg-primary hover:bg-blue-600 text-white rounded-xl text-base font-bold shadow-lg shadow-blue-500/30 transition-all mt-2 active:scale-[0.98]"
            >
              {mode === 'login' ? 'Log In' : 'Create Account'}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-4 text-slate-500 font-medium">Or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button className="flex items-center justify-center gap-2.5 h-12 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors bg-white">
              <img alt="Google" className="w-5 h-5" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBQhtrOCO0dxOJpOVqzERj6miFWrc2guGZ3ERQeBFuWkgTCc7HjQC1AMldm3IqvuD1tB5VBfRkk3cegJa9Pvw0dj8w-RplvuBSBUizaStuaiuuVXZYJgEaLxDVnwQlZcaz-5_0FDZ38f9OkgC4rNXyxoPL2hptwBMgBEjxxi3iTAK1ctVx289kb4sz9avig6RkmOCPiU7Yp7Ty6Cs49DQzrvU_M3hqkWrhfoWKxHP_o0edda3-MW0bcadcQcKAlkN30zE3MbUeLwwQ" />
              <span className="text-sm font-semibold text-slate-700">Google</span>
            </button>
            <button className="flex items-center justify-center gap-2.5 h-12 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors bg-white">
              <img alt="Facebook" className="w-5 h-5" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDMSb2nGupY7nFhLKswTrJsHwE_sBZL5GKeQ8Hp20lfmJfvCTvb6FKr9PoIoW5es9VLB2HpHNpnA1LJsCL9-vZXNRZ1XPiDzeyeIMiohrOf0IwS24c9isOr8A5Ffk1JKxqkQFX4tTDqp_Ym1_zgYPTsSp-K1FkOg9Q4GUBB5W8572QoJW3lJZ-bfQOI4K6IfkF29KZu-WtNnWsEUTHajMyvkDlX3FQFXdewICxsUEBiBfFfuqD7QTKQzzm7fCwYXlW9npWJ8Z3JZNk" />
              <span className="text-sm font-semibold text-slate-700">Facebook</span>
            </button>
          </div>

          <div className="mt-8 pt-4">
            <p className="text-xs text-center text-slate-400 leading-relaxed">
              By continuing, you agree to our <br />
              <a className="text-primary font-medium hover:underline" href="#">Terms of Service</a> and <a className="text-primary font-medium hover:underline" href="#">Privacy Policy</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
