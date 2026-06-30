import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../contexts/AuthContext';

export function ProfileDropdown() {
  const { user, profile, logout } = useAuth();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  return (
    <div className="relative">
      <button 
        onClick={() => setShowProfileDropdown(!showProfileDropdown)}
        className="w-10 h-10 rounded-lg bg-electric-mint flex items-center justify-center text-slate-base font-black text-sm uppercase cursor-pointer hover:bg-electric-mint/80 transition-colors shadow-lg shadow-electric-mint/20"
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
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute right-0 mt-4 w-64 bg-white rounded-lg shadow-2xl border border-slate-raised/10 z-50 overflow-hidden"
            >
              <div className="p-6 bg-club-green text-white">
                <p className="text-xs font-black uppercase tracking-widest text-white mb-1">{profile?.name || user?.displayName}</p>
                <p className="text-[10px] text-white/60 uppercase tracking-widest font-medium">
                  {profile?.topics?.join(' | ') || 'Member'}
                </p>
              </div>
              <div className="p-2">
                <Link 
                  to="/profile" 
                  onClick={() => setShowProfileDropdown(false)}
                  className="flex items-center gap-3 px-4 py-3 text-xs font-bold text-slate-base hover:bg-slate-raised rounded-lg transition-colors"
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
  );
}
