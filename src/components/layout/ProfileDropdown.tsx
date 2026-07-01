import React, { useState, useEffect } from 'react';
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
        className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-teal-400 flex items-center justify-center text-white font-black text-sm uppercase cursor-pointer hover:from-purple-600 hover:to-teal-500 transition-all shadow-lg shadow-purple-200 hover:shadow-xl hover:shadow-purple-300 hover:-translate-y-0.5"
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
              className="absolute right-0 mt-4 w-72 bg-white rounded-3xl shadow-2xl border border-gray-100 z-50 overflow-hidden"
            >
              {/* Header */}
              <div className="p-5 bg-gradient-to-r from-purple-600 to-teal-500 text-white">
                <p className="text-sm font-bold font-sans tracking-tight mb-1">{profile?.name || user?.displayName}</p>
                <p className="text-xs text-white/70 font-medium">
                  {profile?.topics?.slice(0, 3).join(' · ') || 'Member'}
                </p>
              </div>

              {/* Menu Items */}
              <div className="p-2">
                <Link 
                  to="/profile" 
                  onClick={() => setShowProfileDropdown(false)}
                  className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-purple-50 hover:text-purple-700 rounded-2xl transition-colors"
                >
                  <div className="w-8 h-8 bg-purple-100 rounded-xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-purple-600 text-lg">person</span>
                  </div>
                  My Profile
                </Link>
                <button 
                  onClick={() => {
                    logout();
                    setShowProfileDropdown(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-red-500 hover:bg-red-50 rounded-2xl transition-colors cursor-pointer"
                >
                  <div className="w-8 h-8 bg-red-100 rounded-xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-red-500 text-lg">logout</span>
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
