import { Link } from 'react-router-dom';

const cards = [
  {
    title: 'Fix it fast with PRUCOLY',
    desc: 'The easiest way to find trusted local professionals for all your home repair needs.',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBwEI6OL7rDmafbtsubWjtWwaV-6wPQ8AjlzsOgB7EsJuqgfuvvqSqrw23fVf6_34wHGSrbZYH-ecc84mfAz8sWSCi_hym4P_QqTd9tg2xEwL6H4o1ylIl2tw-KGFUbZON3DTpM6evFSEwpik8lJGgke7We-uhV3Q2OTkG-jEQOG-cTogCeJwn6clILcf-wH5eetWDHRFIjUuo0sZc46kuNr4OjMJt6doe09lffxNn21dPcFXA_tH4i8wP9ZFFby0SeQ0Qn9Du8N4s',
  },
  {
    title: 'Trusted Professionals',
    desc: 'Connect with qualified artisans and technicians in minutes, vetted for your peace of mind.',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDnbV0cbaNkWi0V1_hzW1C1mtI9Oi5aiMi9HMEP-ixOeosT63xv1BUg17h8iKUu2-eTeek6GwypJrxHAzPEDF0lKCX9okFXaKcnAgh-aHB5Y1hNwqWMsiuGgDIzB37SnYXgZ8t8utbT5BK3GK-ZsZxNoYQViHDd07gpDFlrNJSM90g-pdnvwmmMzwg3-EWMYeJ0lwS9rDztvqC3v7p4SUqQ2yXYUsBXcDfGuYGGrt_-EbjVgzTA5rLyfoensrvmS_fnTNFdVttLbOs',
  },
  {
    title: 'Transparent Pricing',
    desc: 'Get fair quotes upfront and enjoy quality service every single time.',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDfxd0lKOTghKVlGk-7ellPjF0wn-6d1NlvHlL_hpRKoVr1MKD3Sk2YXBlRd8RnA_PcbWNapfwClKLxDkzkL_RRswQ-KcHYa81GxNBTO-x13Tn1T4OzTy180t6gw8MvRGSVJsTeGqborEDFRiqpiTDTKtkrYlhayteWRL1_Fw91_kFxRqANqNdcQU10Uz4tmgouHP8sYsLA7712PvXwQnc71LcQzukhyKSiAX-7Y2iW3ydQW5_KfDQeyZDaKg1ilNNJjM95uKxjFF0',
  },
];

export default function WelcomeScreen() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-center bg-no-repeat bg-cover"
          style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCbV9dEDqLYOdI6Jk0hRbFk78ncefoCzMfkfpdqy1pDLh0dj6p4Mqmz6VP2sHtJaDTKIqChaWr1ThlvxxJmSk_s1r1AJgNxPMvsMvOpCn1UyObpjM-Ati60IWOIvhlvohbgc6r1cjVIKMB3zBsiQIGFYiyiyGYNxI1xKXsGOX0bAkRDMwer_lVeude_8u8LMHAXUYVhwKnsVoKKD8xtyDaqpAuc6KTi_eY4GMt4wGjHpgel97uLvhdQPTNjPGkrsmhl8qyjq9zKZjo')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent"></div>
        
        <div className="relative z-10 p-12 w-full max-w-lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-lg">
              <span className="material-symbols-outlined text-white text-3xl">construction</span>
            </div>
            <h1 className="text-4xl font-black tracking-tight text-white">PRUCOLY</h1>
          </div>
          
          <div className="space-y-6">
            {cards.map((card, idx) => (
              <div
                key={idx}
                className="flex gap-4 p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20"
              >
                <div
                  className="w-20 h-20 rounded-lg bg-cover bg-center shrink-0"
                  style={{ backgroundImage: `url("${card.img}")` }}
                />
                <div className="space-y-1">
                  <h2 className="text-lg font-bold text-white">{card.title}</h2>
                  <p className="text-sm text-white/80">{card.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center p-8">
        <div className="lg:hidden flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-lg">
            <span className="material-symbols-outlined text-white text-3xl">construction</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">PRUCOLY</h1>
        </div>

        <div className="w-full max-w-md">
          <h2 className="text-3xl font-bold text-slate-900 mb-3 text-center lg:text-left">
            Find trusted professionals for your home
          </h2>
          <p className="text-slate-500 text-lg mb-8 text-center lg:text-left">
            Connect with skilled artisans and technicians in minutes.
          </p>

          <div className="space-y-4">
            <Link
              to="/auth"
              className="group relative flex h-14 w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl bg-primary px-6 text-white shadow-lg shadow-primary/30 transition-all hover:bg-blue-600 active:scale-[0.98]"
            >
              <span className="absolute right-0 -mt-12 -mr-12 h-32 w-32 translate-x-12 rotate-45 bg-white opacity-10 transition-all duration-1000 group-hover:-translate-x-40"></span>
              <span className="text-base font-bold tracking-wide">Sign Up Free</span>
            </Link>
            <Link
              to="/auth?mode=login"
              className="flex h-14 w-full cursor-pointer items-center justify-center rounded-xl bg-slate-100 px-6 text-slate-900 transition-colors hover:bg-slate-200 active:scale-[0.98]"
            >
              <span className="text-base font-bold tracking-wide">Log In</span>
            </Link>
          </div>

          <div className="relative my-8 flex items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="mx-4 flex-shrink-0 text-xs font-medium text-slate-400 uppercase tracking-wider">Or continue with</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button className="flex h-12 w-full cursor-pointer items-center justify-center gap-3 rounded-xl border border-slate-200 bg-transparent px-4 transition-colors hover:bg-slate-50 active:scale-[0.98]">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="text-sm font-semibold text-slate-700">Google</span>
            </button>
            <button className="relative flex h-12 w-full cursor-pointer items-center justify-center gap-3 rounded-xl border border-slate-200 bg-transparent px-4 transition-colors hover:bg-slate-50 active:scale-[0.98]">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"></path>
              </svg>
              <span className="text-sm font-semibold text-slate-700">Apple</span>
            </button>
          </div>

          <p className="mt-8 text-center text-xs text-slate-400">
            By continuing, you agree to our <a className="underline hover:text-primary" href="#">Terms</a> & <a className="underline hover:text-primary" href="#">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
}
