import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../contexts/AuthContext';
import { ProfileDropdown } from './ProfileDropdown';
import { OnboardingModal } from './OnboardingModal';
import { AuthModal } from './AuthModal';

const navLinks = [
  { name: 'Discover', path: '/discover' },
  { name: 'News Feed', path: '/news-feed' },
  { name: 'Learn', path: '/learn' },
  { name: 'Trade', path: '/trade' },
  { name: 'Leaderboard', path: '/leaderboard' },
  { name: 'Community', path: '/community' },
  { name: 'Events', path: '/events' },
];

export function Navigation() {
  const location = useLocation();
  const { user, logout, handleJoinAction } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Top Header - White Frosted Nav */}
      <header className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-blush-mist transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          
          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`relative group px-4 py-2 text-sm font-sans font-bold uppercase tracking-widest rounded-xl transition-all duration-300 ${
                  location.pathname === link.path 
                    ? 'text-coral-flame bg-sunset-fade' 
                    : 'text-text-muted hover:text-brandwood'
                }`}
              >
                {link.name}
                <span className={`absolute bottom-1 left-4 right-4 h-0.5 rounded-full transition-all duration-300 ${
                  location.pathname === link.path ? 'bg-coral-flame opacity-100' : 'bg-brandwood opacity-0 invisible group-hover:opacity-30 group-hover:visible group-hover:bottom-1.5'
                }`} />
              </Link>
            ))}
          </nav>

          {/* Desktop Right Side (Auth/Profile) */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <ProfileDropdown />
            ) : (
              <button 
                onClick={handleJoinAction}
                className="px-6 py-2.5 bg-coral-flame text-white text-[10px] font-bold uppercase tracking-widest rounded-xl shadow-[0_4px_15px_rgba(247,59,32,0.3)] hover:opacity-90 transition-all flex items-center gap-2"
              >
                Sign up
              </button>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden text-brandwood p-2 rounded-xl hover:bg-sunset-fade transition-colors"
          >
            <span className="material-symbols-outlined text-2xl">
              {isMobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              className="md:hidden bg-white border-b border-blush-mist overflow-hidden"
            >
              <div className="flex flex-col p-4 gap-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`px-4 py-3 text-sm font-sans font-bold uppercase tracking-widest rounded-xl ${
                      location.pathname === link.path 
                        ? 'bg-sunset-fade text-coral-flame border border-blush-mist' 
                        : 'text-brandwood hover:bg-sunset-fade'
                    }`}
                  >
                    {link.name}
                  </Link>
                ))}
                
                <div className="pt-4 border-t border-blush-mist mt-2 flex flex-col gap-2">
                  {user ? (
                    <>
                      <Link 
                        to="/profile" 
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="px-4 py-3 text-sm font-sans font-bold uppercase tracking-widest text-mint-action hover:bg-mint-action/10 rounded-xl"
                      >
                        My Profile
                      </Link>
                      <button 
                        onClick={() => { logout(); setIsMobileMenuOpen(false); }}
                        className="text-left px-4 py-3 text-sm font-sans font-bold uppercase tracking-widest text-coral-flame hover:bg-sunset-fade rounded-xl"
                      >
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <button 
                      onClick={() => { handleJoinAction(); setIsMobileMenuOpen(false); }}
                      className="px-4 py-3 bg-coral-flame text-white text-[10px] font-bold uppercase tracking-widest rounded-xl text-center"
                    >
                      Sign up
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <OnboardingModal />
      <AuthModal />
    </>
  );
}
