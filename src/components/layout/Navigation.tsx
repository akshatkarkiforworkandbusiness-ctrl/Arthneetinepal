import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../contexts/AuthContext';
import { ProfileDropdown } from './ProfileDropdown';
import { OnboardingModal } from './OnboardingModal';
import { AuthModal } from './AuthModal';

const navLinks = [
  { name: 'Home', path: '/' },
  { name: 'Discover', path: '/discover' },
  { name: 'About Us', path: '/about-us' },
  { name: 'Community', path: '/community' },
  { name: 'Events', path: '/events' },
  { name: 'Learn', path: '/learn' },
];

export function Navigation() {
  const location = useLocation();
  const { user, logout, handleJoinAction } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-slate-base sticky top-0 z-50 border-b border-white/10">
      <div className="max-w-7xl mx-auto flex justify-between items-center px-4 md:px-8 w-full h-20">
        <Link to="/" className="flex flex-col items-start leading-none group">
          <span className="text-xl md:text-2xl font-black text-white tracking-widest group-hover:text-electric-mint transition-colors">ARTHNEETI</span>
          <span className="text-[10px] md:text-sm font-medium text-electric-mint ml-0.5">अर्थनीति</span>
        </Link>
        
        <div className="hidden lg:flex items-center gap-10">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              className={`transition-all text-xs font-bold uppercase tracking-widest ${
                location.pathname === link.path ? 'text-electric-mint' : 'text-white/60 hover:text-white'
              }`}
            >
              {link.name}
            </Link>
          ))}
          
          {user ? <ProfileDropdown /> : (
            <button 
              onClick={handleJoinAction}
              className="px-8 py-3 bg-electric-mint text-slate-base text-xs font-black uppercase tracking-widest rounded-lg transition-all hover:bg-white hover:text-electric-mint shadow-lg"
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

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="lg:hidden border-t border-white/10 bg-slate-base overflow-hidden"
          >
            <div className="flex flex-col p-8 gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`text-sm font-bold uppercase tracking-widest ${
                    location.pathname === link.path ? 'text-electric-mint' : 'text-white/60 hover:text-white'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              
              {!user ? (
                <button 
                  onClick={() => { handleJoinAction(); setIsMobileMenuOpen(false); }}
                  className="w-full py-4 bg-electric-mint text-slate-base text-xs font-black uppercase tracking-widest rounded-lg shadow-xl"
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
                    onClick={() => { logout(); setIsMobileMenuOpen(false); }}
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

      <OnboardingModal />
      <AuthModal />
    </nav>
  );
}
