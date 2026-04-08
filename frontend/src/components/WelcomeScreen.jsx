import { Link } from 'react-router-dom';
import { FiSearch, FiShield, FiDollarSign, FiHeadphones, FiStar, FiTool, FiMapPin, FiCheckCircle } from 'react-icons/fi';

const features = [
  {
    icon: FiSearch,
    title: 'Find Professionals',
    desc: 'Search from hundreds of verified service providers in your area.',
  },
  {
    icon: FiShield,
    title: 'Vetted Experts',
    desc: 'All providers are background-checked and verified.',
  },
  {
    icon: FiDollarSign,
    title: 'Transparent Pricing',
    desc: 'Get upfront quotes with no hidden fees.',
  },
  {
    icon: FiHeadphones,
    title: '24/7 Support',
    desc: 'Round-the-clock assistance for all your needs.',
  },
];

const howItWorks = [
  {
    step: '1',
    title: 'Search',
    desc: 'Find the right professional for your needs',
  },
  {
    step: '2',
    title: 'Book',
    desc: 'Schedule a service at your convenience',
  },
  {
    step: '3',
    title: 'Done',
    desc: 'Relax while experts get the job done',
  },
];

export default function WelcomeScreen() {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-center bg-no-repeat bg-cover"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1200&q=80')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-slate-800/50 to-blue-900/30"></div>
        
        <div className="absolute top-8 left-8 flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30">
            <FiTool className="text-white text-3xl" />
          </div>
          <h1 className="text-white text-3xl font-black tracking-tight">PRUCOLY</h1>
        </div>
        
        <div className="relative z-10 p-12 flex flex-col justify-center h-full">
          <div className="space-y-8 max-w-lg">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 w-fit">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              <span className="text-white/90 text-sm font-medium">Now serving all major cities</span>
            </div>
            
            <h2 className="text-white text-4xl lg:text-5xl font-bold leading-tight">
              Your home services,<br/>
              <span className="text-primary-light">simplified.</span>
            </h2>
            
            <p className="text-white/70 text-lg">
              Connect with trusted professionals for plumbing, electrical, cleaning, and more. Book in minutes, relax for the rest.
            </p>
            
            <div className="flex items-center gap-8 pt-4">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 border-2 border-white flex items-center justify-center">
                    <span className="text-xs font-bold text-slate-600">{['J', 'M', 'S', 'A'][i-1]}</span>
                  </div>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <FiStar key={i} className="text-yellow-400 text-lg" />
                  ))}
                </div>
                <p className="text-white/70 text-sm">Trusted by 500+ customers</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 lg:p-12">
        <div className="lg:hidden mb-8">
          <div className="flex items-center gap-3 mb-4 justify-center">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
              <FiTool className="text-white text-2xl" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">PRUCOLY</h1>
          </div>
        </div>

        <div className="w-full max-w-md lg:max-w-xl">
          <div className="hidden lg:block mb-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">
              Find trusted professionals<br/>
              <span className="text-primary">for your home</span>
            </h2>
            <p className="text-slate-500 text-lg">
              Connect with skilled artisans in minutes.
            </p>
          </div>
          
          <div className="lg:hidden mb-8 text-center">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">
              Get started with<br/>
              <span className="text-primary">PRUCOLY</span>
            </h2>
            <p className="text-slate-500">
              The easiest way to find home service professionals.
            </p>
          </div>

          <div className="space-y-4 mb-8">
            <Link
              to="/auth"
              className="group relative flex h-14 w-full cursor-pointer items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-primary-dark px-6 text-white shadow-lg shadow-primary/30 transition-all hover:shadow-xl hover:shadow-primary/40 hover:-translate-y-0.5"
            >
              <span className="absolute right-0 -mt-12 -mr-12 h-32 w-32 translate-x-12 rotate-45 bg-white opacity-10 transition-all duration-1000 group-hover:-translate-x-40"></span>
              <span className="text-base font-bold tracking-wide">Get Started Free</span>
            </Link>
            <Link
              to="/auth?mode=login"
              className="flex h-14 w-full cursor-pointer items-center justify-center rounded-2xl bg-white px-6 text-slate-900 border border-slate-200 shadow-sm transition-all hover:bg-slate-50 hover:border-slate-300 hover:shadow-md"
            >
              <span className="text-base font-semibold tracking-wide">Sign In</span>
            </Link>
          </div>

          <div className="hidden lg:grid grid-cols-2 gap-4 mb-8">
            {features.map((feature, idx) => (
              <div key={idx} className="flex items-start gap-3 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-white/50">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <feature.icon className="text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm">{feature.title}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden lg:block mb-8">
            <h3 className="text-lg font-bold text-slate-900 mb-4">How it works</h3>
            <div className="grid grid-cols-3 gap-4">
              {howItWorks.map((item, idx) => (
                <div key={idx} className="text-center">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                    <span className="text-xl font-bold text-primary">{item.step}</span>
                  </div>
                  <h4 className="font-semibold text-slate-900 text-sm">{item.title}</h4>
                  <p className="text-xs text-slate-500 mt-1">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative my-6 flex items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="mx-4 flex-shrink-0 text-xs font-medium text-slate-400 uppercase tracking-wider">Or continue with</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button className="flex h-12 w-full cursor-pointer items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 transition-all hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="text-sm font-semibold text-slate-700">Google</span>
            </button>
            <button className="relative flex h-12 w-full cursor-pointer items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 transition-all hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm">
              <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <span className="text-sm font-semibold text-slate-700">Facebook</span>
            </button>
          </div>

          <p className="mt-6 text-center text-xs text-slate-400">
            By continuing, you agree to our{' '}
            <a className="underline hover:text-primary" href="#">Terms</a>{' '}
            &{' '}
            <a className="underline hover:text-primary" href="#">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
}
