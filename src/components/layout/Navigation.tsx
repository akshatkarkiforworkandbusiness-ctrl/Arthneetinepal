import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../contexts/AuthContext';
import { ProfileDropdown } from './ProfileDropdown';
import { OnboardingModal } from './OnboardingModal';
import { AuthModal } from './AuthModal';

const navLinks = [
  { name: 'Discover', path: '/discover' },
  { name: 'Learn', path: '/learn' },
  { name: 'Community', path: '/community' },
];

export function Navigation() {
  const location = useLocation();
  const { user, logout, handleJoinAction } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Top Header - Logo only */}
      <header className="fixed top-0 w-full z-40 bg-transparent py-6 px-8 flex justify-between items-center pointer-events-none">
        <Link to="/" className="flex flex-col items-start leading-none group pointer-events-auto">
          <span className="text-2xl font-black text-brandwood tracking-[0.03em] transition-colors">ARTHNEETI</span>
          <span className="text-sm font-medium text-coral-flame ml-0.5">अर्थनीति</span>
        </Link>
        <div className="pointer-events-auto hidden md:flex items-center gap-4">
           {/* Utility cluster top right */}
           <div className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-md rounded-2xl border border-blush-mist shadow-warm-lift">
              <span className="material-symbols-outlined text-sm text-brandwood">language</span>
              <span className="text-sm font-sans font-medium text-brandwood">EN</span>
           </div>
        </div>
      </header>

      {/* Floating Bottom Nav Pill */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-auto">
        <div className="flex items-center justify-between px-6 py-3 bg-white rounded-full border-[1.5px] border-coral-flame shadow-[0_8px_24px_rgba(247,59,32,0.1),_0_2px_8px_rgba(247,59,32,0.05)] h-16 gap-2 md:gap-6">
          
          <div className="flex items-center gap-1 md:gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`transition-all px-3 py-2 text-sm font-sans font-medium rounded-2xl flex items-center gap-1 ${
                  location.pathname === link.path ? 'text-coral-flame' : 'text-brandwood hover:text-coral-flame'
                }`}
              >
                {link.name === 'Home' && <span className="material-symbols-outlined text-xl">home</span>}
                <span className="hidden md:inline">{link.name}</span>
                {link.name !== 'Home' && <span className="text-[10px] hidden md:inline opacity-60">▼</span>}
              </Link>
            ))}
          </div>
          
          <div className="w-px h-6 bg-blush-mist hidden md:block mx-2"></div>

          <div className="flex items-center">
            {user ? (
              <ProfileDropdown />
            ) : (
              <button 
                onClick={handleJoinAction}
                className="px-6 py-2 bg-white border-[1.5px] border-coral-flame text-coral-flame text-sm font-sans font-medium rounded-[16px] transition-transform active:scale-95 hover:shadow-warm-float flex items-center gap-2 whitespace-nowrap"
              >
                Sign up
              </button>
            )}
          </div>
          
          {/* Mobile Menu Toggle */}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden text-brandwood p-2 ml-2"
          >
            <span className="material-symbols-outlined text-2xl">
              {isMobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>

        {/* Mobile Dropdown Menu (floats above pill) */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: -16, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="absolute bottom-full left-0 w-full mb-4 bg-white rounded-3xl border-[1.5px] border-blush-mist shadow-warm-lift overflow-hidden min-w-[200px]"
            >
              <div className="flex flex-col p-4 gap-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`px-4 py-3 text-sm font-sans font-medium rounded-xl ${
                      location.pathname === link.path ? 'bg-sunset-fade text-coral-flame' : 'text-brandwood hover:bg-sunset-fade'
                    }`}
                  >
                    {link.name}
                  </Link>
                ))}
                
                {user && (
                  <div className="flex flex-col gap-2 pt-2 border-t border-blush-mist mt-2">
                    <button 
                      onClick={() => { logout(); setIsMobileMenuOpen(false); }}
                      className="px-4 py-3 text-left text-sm font-sans font-medium text-coral-flame hover:bg-sunset-fade rounded-xl"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <OnboardingModal />
      <AuthModal />
    </>
  );
}
