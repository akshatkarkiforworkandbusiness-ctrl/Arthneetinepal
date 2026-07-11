import React, { useState, useEffect } from 'react';
import { User, LogOut } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../contexts/AuthContext';

export function ProfileDropdown() {
  const { user, profile, logout } = useAuth();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const location = useLocation();

  // Close dropdown on route change
  useEffect(() => {
    setShowProfileDropdown(false);
  }, [location.pathname]);

  return (
    <div className="relative">
      <button 
        onClick={() => setShowProfileDropdown(!showProfileDropdown)}
        className="w-10 h-10 rounded-2xl bg-white border border-blush-mist flex items-center justify-center text-brandwood font-black text-sm uppercase cursor-pointer hover:bg-white hover:border-brand-emerald hover:text-brand-emerald transition-all shadow-card hover:-translate-y-0.5"
      >
        {profile?.name?.[0] || user?.displayName?.[0] || 'U'}
      </button>
      
      <AnimatePresence>
        {showProfileDropdown && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setShowProfileDropdown(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 mt-3 w-72 bg-white rounded-3xl shadow-elevated border border-blush-mist z-50 overflow-hidden"
            >
              {/* Header */}
              <div className="p-5 bg-white border-b border-blush-mist">
                <p className="text-sm font-bold font-sans text-brandwood tracking-tight mb-1">{profile?.name || user?.displayName}</p>
                <p className="text-xs text-text-muted font-medium">
                  {profile?.topics?.slice(0, 3).join(' · ') || 'Member'}
                </p>
              </div>

              {/* Menu Items */}
              <div className="p-2">
                <Link 
                  to="/profile" 
                  onClick={() => setShowProfileDropdown(false)}
                  className="flex items-center gap-3 px-4 py-3 text-sm font-bold uppercase tracking-widest text-brandwood hover:bg-brand-emerald-light/10 hover:text-brand-emerald-light rounded-2xl transition-colors"
                >
                  <div className="w-8 h-8 bg-brand-emerald-light/10 border border-brand-emerald-light/20 rounded-xl flex items-center justify-center shrink-0">
                    <User size={18} className="text-brand-emerald-light" />
                  </div>
                  My Profile
                </Link>
                <button 
                  onClick={() => {
                    logout();
                    setShowProfileDropdown(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold uppercase tracking-widest text-brand-emerald hover:bg-white rounded-2xl transition-colors cursor-pointer"
                >
                  <div className="w-8 h-8 bg-brand-emerald/10 border border-brand-emerald/20 rounded-xl flex items-center justify-center shrink-0">
                    <LogOut size={18} className="text-brand-emerald" />
                  </div>
                  Sign Out
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
