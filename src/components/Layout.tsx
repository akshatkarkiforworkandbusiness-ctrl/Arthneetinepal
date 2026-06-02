import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';

export function Navigation() {
  const location = useLocation();
  const { user, profile, loading, logout, updateProfile, showOnboarding, setShowOnboarding, handleJoinAction } = useAuth();
  
  // Local state for profile setup modal if needed
  const [setupForm, setSetupForm] = useState({ name: '', email: '', interests: [] as string[] });
  const interestOptions = ['Finance', 'Economics', 'Business', 'Policy', 'Corporate Law', 'Entrepreneurship', 'Other'];

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Discover', path: '/discover' },
    { name: 'About Us', path: '/about-us' },
    { name: 'Community', path: '/community' },
    { name: 'Events', path: '/events' },
    { name: 'Learn', path: '/learn' },
  ];

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  useEffect(() => {
    if (profile) {
      setSetupForm({ name: profile.name, email: profile.email || user?.email || '', interests: profile.topics || [] });
    } else if (user) {
      setSetupForm({ name: user.displayName || '', email: user.email || '', interests: [] });
    }
  }, [profile, user]);

  return (
    <nav className="bg-green-deep sticky top-0 z-50 border-b border-white/10">
      <div className="max-w-7xl mx-auto flex justify-between items-center px-4 md:px-8 w-full h-20">
        <Link to="/" className="flex flex-col items-start leading-none group">
          <span className="text-xl md:text-2xl font-black text-white tracking-widest group-hover:text-crimson transition-colors">ARTHNEETI</span>
          <span className="text-[10px] md:text-sm font-medium text-crimson ml-0.5">अर्थनीति</span>
        </Link>
        
        <div className="hidden lg:flex items-center gap-10">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              className={`transition-all text-xs font-bold uppercase tracking-widest ${
                location.pathname === link.path 
                  ? 'text-crimson' 
                  : 'text-white/60 hover:text-white'
              }`}
            >
              {link.name}
            </Link>
          ))}
          
          {user ? (
            <div className="relative">
              <button 
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="w-10 h-10 rounded-full bg-crimson flex items-center justify-center text-white font-black text-sm uppercase cursor-pointer hover:bg-crimson/80 transition-colors shadow-lg shadow-crimson/20"
              >
                {profile?.name?.[0] || user.displayName?.[0] || 'U'}
              </button>
              
              <AnimatePresence>
                {showProfileDropdown && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowProfileDropdown(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-4 w-64 bg-white rounded-xl shadow-2xl border border-navy/10 z-50 overflow-hidden"
                    >
                      <div className="p-6 bg-royal text-white">
                        <p className="text-xs font-black uppercase tracking-widest text-white mb-1">{profile?.name || user.displayName}</p>
                        <p className="text-[10px] text-white/60 uppercase tracking-widest font-medium">
                          {profile?.topics?.join(' | ') || 'Member'}
                        </p>
                      </div>
                      <div className="p-2">
                        <Link 
                          to="/profile" 
                          onClick={() => setShowProfileDropdown(false)}
                          className="flex items-center gap-3 px-4 py-3 text-xs font-bold text-green-deep hover:bg-cream rounded-lg transition-colors"
                        >
                          <span className="material-symbols-outlined text-lg">person</span>
                          My Profile
                        </Link>
                        <button 
                          onClick={() => {
                            logout();
                            setShowProfileDropdown(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <span className="material-symbols-outlined text-lg">logout</span>
                          Sign Out
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <button 
              onClick={handleJoinAction}
              className="px-8 py-3 bg-crimson text-white text-xs font-black uppercase tracking-widest rounded transition-all hover:bg-white hover:text-crimson shadow-lg"
            >
              Join
            </button>
          )}
        </div>

        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="lg:hidden text-white p-2"
        >
          <span className="material-symbols-outlined text-3xl">
            {isMobileMenuOpen ? 'close' : 'menu'}
          </span>
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="lg:hidden border-t border-white/10 bg-green-deep overflow-hidden"
          >
            <div className="flex flex-col p-8 gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`text-sm font-bold uppercase tracking-widest ${
                    location.pathname === link.path 
                      ? 'text-crimson' 
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              
              {!user ? (
                <button 
                  onClick={() => {
                    handleJoinAction();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full py-4 bg-crimson text-white text-xs font-black uppercase tracking-widest rounded shadow-xl"
                >
                  Join
                </button>
              ) : (
                <div className="flex flex-col gap-6 pt-6 border-t border-white/10">
                   <Link 
                    to="/profile" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-white/60 text-sm font-bold uppercase tracking-widest"
                  >
                    My Profile
                  </Link>
                  <button 
                    onClick={() => {
                      logout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="text-red-400 text-left text-sm font-bold uppercase tracking-widest"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile Setup Modal (Step 2) */}
      <AnimatePresence>
        {showOnboarding && (
          <div className="fixed inset-0 z-[100] bg-green-deep/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white p-8 md:p-12 rounded-2xl max-w-xl w-full shadow-2xl relative"
            >
              <h2 className="font-display text-4xl text-green-deep italic mb-4">Complete Your Profile</h2>
              <p className="text-text-muted mb-8 text-sm">Tell us a bit more about yourself to join the community.</p>
              
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-green-deep/40 mb-2 block">Full Name</label>
                  <input 
                    type="text"
                    placeholder="Enter your full name"
                    value={setupForm.name}
                    onChange={e => setSetupForm({...setupForm, name: e.target.value})}
                    className="w-full bg-cream border-2 border-green-deep/5 rounded p-4 outline-none focus:border-crimson transition-all font-bold text-green-deep"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-green-deep/40 mb-2 block">Email Address</label>
                  <input 
                    type="email"
                    placeholder="Enter your email"
                    value={setupForm.email}
                    readOnly
                    className="w-full bg-cream border-2 border-green-deep/5 rounded p-4 outline-none focus:border-crimson transition-all font-bold text-green-deep opacity-60 cursor-not-allowed"
                  />
                  <p className="text-[8px] text-green-deep/40 mt-1 uppercase tracking-widest">Verified via Google</p>
                </div>
                
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-green-deep/40 mb-4 block">Fields of Interest</label>
                  <div className="flex flex-wrap gap-3">
                    {interestOptions.map(option => (
                      <button
                        key={option}
                        onClick={() => {
                          const newInterests = setupForm.interests.includes(option)
                            ? setupForm.interests.filter(i => i !== option)
                            : [...setupForm.interests, option];
                          setSetupForm({...setupForm, interests: newInterests});
                        }}
                        className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border-2 transition-all ${
                          setupForm.interests.includes(option)
                            ? 'bg-crimson border-crimson text-white'
                            : 'border-green-deep/10 text-green-deep/40 hover:border-crimson/50'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>

                <button 
                  onClick={() => {
                    updateProfile({ 
                      name: setupForm.name, 
                      email: setupForm.email,
                      topics: setupForm.interests,
                    });
                  }}
                  disabled={!setupForm.name || setupForm.interests.length === 0}
                  className="w-full bg-crimson text-white py-5 rounded text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-crimson transition-all disabled:opacity-30 mt-4 shadow-xl"
                >
                  JOIN ARTHNEETI
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </nav>
  );
}

export function Footer() {
  return (
    <footer className="bg-green-deep text-white py-20 px-6 md:px-24">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12">
        <div className="max-w-xs">
          <Link to="/" className="flex flex-col items-start font-display leading-none mb-8">
            <span className="text-2xl font-black text-white tracking-widest">ARTHNEETI</span>
            <span className="text-sm font-medium text-crimson ml-0.5">अर्थनीति</span>
          </Link>
          <p className="text-white/40 text-[10px] font-black uppercase tracking-widest leading-loose">
            Nepal's student-led movement for financial intelligence. <br />
            Think Big. Invest Smart. Lead Nepal.
          </p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-crimson mb-6">Explore</h4>
            <div className="flex flex-col gap-4">
              <Link to="/discover" className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all">Discover</Link>
              <Link to="/about-us" className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all">About Us</Link>
              <Link to="/community" className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all">Community</Link>
              <Link to="/events" className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all">Events</Link>
              <Link to="/learn" className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all">Learn</Link>
            </div>
          </div>
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-royal mb-6">Inquiries</h4>
            <div className="flex flex-col gap-4 text-[10px] font-black uppercase tracking-widest text-white/40">
              <p>learnarthneeti@gmail.com</p>
              <p>9866898759</p>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-20 pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-[10px] font-black uppercase tracking-widest text-white/20">© 2025 Arthneeti. All rights reserved.</p>
        <div className="flex gap-8">
          <a href="#" className="text-[10px] font-black uppercase tracking-widest text-white/20 hover:text-crimson">Privacy Policy</a>
          <a href="#" className="text-[10px] font-black uppercase tracking-widest text-white/20 hover:text-royal">Terms of Service</a>
        </div>
      </div>
    </footer>
  );
}
