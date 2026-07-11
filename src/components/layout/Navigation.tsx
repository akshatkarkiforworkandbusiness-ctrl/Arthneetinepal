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
  { name: 'Game', path: '/trade-game' },
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
      <header className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          
          {/* Logo / Brand */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-emerald-500/20">
              A
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-sm font-bold tracking-widest text-slate-900 font-display uppercase">Arthneeti</span>
              <span className="text-[9px] text-slate-400 font-medium mt-0.5" style={{ fontFamily: '"Noto Sans Devanagari", sans-serif' }}>अर्थनीति</span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`relative group px-4 py-2 text-sm font-sans font-bold uppercase tracking-widest rounded-xl transition-all duration-300 ${
                  location.pathname === link.path 
                    ? 'text-emerald-600 bg-emerald-50' 
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {link.name}
                <span className={`absolute bottom-1 left-4 right-4 h-0.5 rounded-full transition-all duration-300 ${
                  location.pathname === link.path ? 'bg-emerald-600 opacity-100' : 'bg-slate-900 opacity-0 invisible group-hover:opacity-20 group-hover:visible group-hover:bottom-1.5'
                }`} />
              </Link>
            ))}
          </nav>

          {/* Desktop Right Side (Auth/Profile) */}
          <div className="hidden lg:flex items-center gap-4">
            {user ? (
              <ProfileDropdown />
            ) : (
              <button 
                onClick={handleJoinAction}
                className="px-6 py-2.5 bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl shadow-[0_4px_15px_rgba(5,150,105,0.3)] hover:bg-emerald-700 transition-all flex items-center gap-2"
              >
                Sign up
              </button>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden text-slate-900 p-2 rounded-xl hover:bg-slate-100 transition-colors"
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
              className="lg:hidden bg-white border-b border-slate-200 overflow-hidden"
            >
              <div className="flex flex-col p-4 gap-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`px-4 py-3 text-sm font-sans font-bold uppercase tracking-widest rounded-xl transition-colors ${
                      location.pathname === link.path 
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' 
                        : 'text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    {link.name}
                  </Link>
                ))}
                
                <div className="pt-4 border-t border-slate-200 mt-2 flex flex-col gap-2">
                  {user ? (
                    <>
                      <Link 
                        to="/profile" 
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="px-4 py-3 text-sm font-sans font-bold uppercase tracking-widest text-emerald-600 hover:bg-emerald-50 rounded-xl"
                      >
                        My Profile
                      </Link>
                      <button 
                        onClick={() => { logout(); setIsMobileMenuOpen(false); }}
                        className="text-left px-4 py-3 text-sm font-sans font-bold uppercase tracking-widest text-red-500 hover:bg-red-50 rounded-xl"
                      >
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <button 
                      onClick={() => { handleJoinAction(); setIsMobileMenuOpen(false); }}
                      className="px-4 py-3 bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl text-center hover:bg-emerald-700 transition-colors"
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
