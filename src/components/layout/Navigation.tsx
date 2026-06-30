import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ArrowRight, Menu, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ProfileDropdown } from './ProfileDropdown';
import { OnboardingModal } from './OnboardingModal';
import { AuthModal } from './AuthModal';

const navLinks = [
  { name: 'Discover', path: '/discover' },
  { name: 'About Us', path: '/about-us' },
  { name: 'Community', path: '/community' },
  { name: 'Events', path: '/events' },
  { name: 'Learn', path: '/learn' },
];

export function Navigation() {
  const location = useLocation();
  const { user, logout, handleJoinAction, setShowAuthModal } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/85 backdrop-blur-md border-b border-border elevation-1">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 md:px-8 py-3.5">
          
          {/* Left Cluster */}
          <div className="flex items-center gap-10">
            {/* Logo Cluster */}
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-7 h-7 bg-foreground rounded flex items-center justify-center transition-transform group-hover:scale-105">
                <div className="w-3 h-3 border-2 border-background rounded-sm rotate-45" />
              </div>
              <span className="font-sans font-bold text-base tracking-tight text-foreground">
                Arthneeti
              </span>
            </Link>

            {/* Nav Links */}
            <div className="hidden md:flex items-center gap-7">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.name}
                    to={link.path}
                    className={`flex items-center gap-1 font-sans text-sm font-medium transition-colors ${
                      isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right Cluster */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <ProfileDropdown />
            ) : (
              <>
                <button 
                  onClick={() => setShowAuthModal(true)}
                  className="font-sans text-sm font-medium text-foreground hover:text-accent transition-colors"
                >
                  Sign in
                </button>
                <button 
                  onClick={handleJoinAction}
                  className="bg-foreground text-background rounded-lg px-4 py-2 text-sm font-semibold inline-flex items-center gap-2 hover:bg-foreground/90 transition-colors"
                >
                  Join <ArrowRight size={14} />
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden text-foreground p-1"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden border-t border-border bg-background overflow-hidden"
            >
              <div className="flex flex-col p-6 gap-6">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`text-sm font-medium transition-colors ${
                      location.pathname === link.path ? 'text-foreground font-semibold' : 'text-muted-foreground'
                    }`}
                  >
                    {link.name}
                  </Link>
                ))}
                
                <div className="border-t border-border pt-6 flex flex-col gap-4">
                  {!user ? (
                    <>
                      <button 
                        onClick={() => { setShowAuthModal(true); setIsMobileMenuOpen(false); }}
                        className="w-full text-left font-sans text-sm font-medium text-foreground hover:text-accent transition-colors"
                      >
                        Sign in
                      </button>
                      <button 
                        onClick={() => { handleJoinAction(); setIsMobileMenuOpen(false); }}
                        className="w-full bg-foreground text-background rounded-lg px-4 py-3 text-sm font-semibold inline-flex items-center justify-center gap-2"
                      >
                        Join <ArrowRight size={14} />
                      </button>
                    </>
                  ) : (
                    <>
                      <Link 
                        to="/profile" 
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="text-muted-foreground text-sm font-medium"
                      >
                        My Profile
                      </Link>
                      <button 
                        onClick={() => { logout(); setIsMobileMenuOpen(false); }}
                        className="text-danger text-left text-sm font-medium"
                      >
                        Sign Out
                      </button>
                    </>
                  )}
                </div>
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
