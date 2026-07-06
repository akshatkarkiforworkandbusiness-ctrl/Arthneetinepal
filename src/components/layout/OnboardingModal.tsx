import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../contexts/AuthContext';

const interestOptions = ['Finance', 'Economics', 'Business', 'Policy', 'Corporate Law', 'Entrepreneurship', 'Other'];

const schoolOptions = [
  { id: 'st-lawrence', name: 'St. Lawrence School' },
  { id: 'kathmandu-valley', name: 'Kathmandu Valley Public School' },
  { id: 'sos-disability', name: 'SOS Disability Center' },
  { id: 'other', name: 'Other School' },
  { id: 'none', name: 'Not a Student / None' }
];

export function OnboardingModal() {
  const { user, profile, showOnboarding, updateProfile } = useAuth();
  const [setupForm, setSetupForm] = useState({ name: '', email: '', interests: [] as string[], schoolId: '' });

  useEffect(() => {
    if (profile) {
      setSetupForm({ 
        name: profile.name, 
        email: profile.email || user?.email || '', 
        interests: profile.topics || [],
        schoolId: profile.schoolId || ''
      });
    } else if (user) {
      setSetupForm({ name: user.displayName || '', email: user.email || '', interests: [], schoolId: '' });
    }
  }, [profile, user]);

  return (
    <AnimatePresence>
      {showOnboarding && (
        <div className="fixed inset-0 z-[100] bg-slate-base/80 backdrop-blur-md flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white p-8 md:p-12 rounded-lg-2xl max-w-xl w-full shadow-2xl relative"
          >
            <h2 className="font-sans tracking-tight font-semibold text-4xl text-slate-base italic mb-4">Complete Your Profile</h2>
            <p className="text-text-muted mb-8 text-sm">Tell us a bit more about yourself to join the community.</p>
            
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-base/40 mb-2 block">Full Name</label>
                <input 
                  type="text"
                  placeholder="Enter your full name"
                  value={setupForm.name}
                  onChange={e => setSetupForm({...setupForm, name: e.target.value})}
                  className="w-full bg-slate-raised border-2 border-slate-base/5 rounded-lg p-4 outline-none focus:border-electric-mint transition-all font-bold text-slate-base"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-base/40 mb-2 block">Email Address</label>
                <input 
                  type="email"
                  placeholder="Enter your email"
                  value={setupForm.email}
                  readOnly
                  className="w-full bg-slate-raised border-2 border-slate-base/5 rounded-lg p-4 outline-none focus:border-electric-mint transition-all font-bold text-slate-base opacity-60 cursor-not-allowed"
                />
                <p className="text-[8px] text-slate-base/40 mt-1 uppercase tracking-widest">Verified via Google</p>
              </div>
              
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-base/40 mb-2 block">Your Institution / School</label>
                <select
                  value={setupForm.schoolId}
                  onChange={e => setSetupForm({...setupForm, schoolId: e.target.value})}
                  className="w-full bg-slate-raised border-2 border-slate-base/5 rounded-lg p-4 outline-none focus:border-electric-mint transition-all font-bold text-slate-base"
                >
                  <option value="">Select your school (Optional)</option>
                  {schoolOptions.map(school => (
                    <option key={school.id} value={school.id}>{school.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-base/40 mb-4 block">Fields of Interest</label>
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
                      className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest border-2 transition-all ${
                        setupForm.interests.includes(option)
                          ? 'bg-electric-mint border-electric-mint text-slate-base'
                          : 'border-slate-base/10 text-slate-base/40 hover:border-electric-mint/50'
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
                    schoolId: setupForm.schoolId || undefined,
                    publicPortfolio: false
                  });
                }}
                disabled={!setupForm.name || setupForm.interests.length === 0}
                className="w-full bg-electric-mint text-slate-base py-5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-electric-mint transition-all disabled:opacity-30 mt-4 shadow-xl"
              >
                JOIN ARTHNEETI
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
