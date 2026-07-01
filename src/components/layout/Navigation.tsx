import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../contexts/AuthContext';
import { ProfileDropdown } from './ProfileDropdown';
import { OnboardingModal } from './OnboardingModal';
import { AuthModal } from './AuthModal';

const navLinks = [
  { name: 'Discover', path: '/discover' },
  { name: 'Community', path: '/community' },
  { name: 'Learn', path: '/learn' },
  { name: 'Events', path: '/events' },
];

export function Navigation() {
  const location = useLocation();
  const { user, logout, handleJoinAction } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-[#0f1011]/90 backdrop-blur-xl sticky top-0 z-50 border-b border-white/[0.06]">
      <div className="max-w-[1200px] mx-auto flex justify-between items-center px-6 md:px-8 w-full h-16">
        {/* Logo */}
        <Link to="/" className="flex flex-col items-start leading-none group">
          <span className="text-base font-bold text-white tracking-[0.15em] group-hover:text-white transition-colors">ARTHNEETI</span>
          <span className="text-[9px] font-medium text-[#9f9fa0] ml-0.5 mt-0.5">अर्थनीति</span>
        </Link>
        
        {/* Center Nav Links */}
        <div className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              className={`tracked-label transition-all duration-300 ${
                location.pathname === link.path ? 'text-white' : 'text-[#9f9fa0] hover:text-white'
              }`}
            >
              {link.name}
            </Link>
          ))}
        </div>

        {/* Right Side Actions */}
        <div className="hidden lg:flex items-center gap-3">
          {user ? (
            <ProfileDropdown />
          ) : (
            <>
              <button 
                onClick={handleJoinAction}
                className="btn-ghost text-[11px]"
              >
                Log In
              </button>
              <button 
                onClick={handleJoinAction}
                className="btn-primary-pill text-[11px] py-2.5 px-5"
              >
                Join
                <span className="text-sm">→</span>
              </button>
            </>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="lg:hidden text-white p-2"
        >
          <span className="material-symbols-outlined text-2xl">
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
            transition={{ duration: 0.3 }}
            className="lg:hidden border-t border-white/[0.06] bg-[#0f1011] overflow-hidden"
          >
            <div className="flex flex-col p-8 gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`tracked-label transition-all duration-300 ${
                    location.pathname === link.path ? 'text-white' : 'text-[#9f9fa0] hover:text-white'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              
              {!user ? (
                <div className="flex flex-col gap-3 pt-4 border-t border-white/[0.06]">
                  <button 
                    onClick={() => { handleJoinAction(); setIsMobileMenuOpen(false); }}
                    className="btn-ghost justify-center text-[11px]"
                  >
                    Log In
                  </button>
                  <button 
                    onClick={() => { handleJoinAction(); setIsMobileMenuOpen(false); }}
                    className="btn-primary-pill justify-center text-[11px]"
                  >
                    Join
                    <span className="text-sm">→</span>
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-4 pt-4 border-t border-white/[0.06]">
                   <Link 
                    to="/profile" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="tracked-label text-white/60 hover:text-white transition-colors"
                  >
                    My Profile
                  </Link>
                  <button 
                    onClick={() => { logout(); setIsMobileMenuOpen(false); }}
                    className="tracked-label text-left text-[#ef4444] hover:text-[#ef4444]/80 transition-colors"
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
