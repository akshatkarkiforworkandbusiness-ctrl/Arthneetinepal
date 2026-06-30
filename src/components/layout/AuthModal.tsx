import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../contexts/AuthContext';

const interestOptions = ['Finance', 'Economics', 'Business', 'Policy', 'Corporate Law', 'Entrepreneurship', 'Other'];

function getReadableAuthError(error: any) {
  const code = error?.code || '';
  switch (code) {
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/user-disabled':
      return 'This account has been disabled.';
    case 'auth/user-not-found':
      return 'No account found with this email.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    case 'auth/operation-not-allowed':
      return 'This sign-in method is not enabled.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a bit before trying again.';
    case 'auth/popup-closed-by-user':
      return 'Google sign-in was closed before completing.';
    default:
      return error?.message || 'An error occurred during authentication.';
  }
}

export function AuthModal() {
  const { showAuthModal, setShowAuthModal, signUpWithEmail, signInWithEmail, signIn, resetPassword } = useAuth();

  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '', interests: [] as string[] });
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSubmitting, setAuthSubmitting] = useState(false);

  const closeAuthModal = () => {
    setShowAuthModal(false);
    setIsResetMode(false);
    setResetSent(false);
    setAuthError(null);
  };

  return createPortal(
    <AnimatePresence>
      {showAuthModal && (
        <div className="fixed inset-0 z-[100] bg-slate-base/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="absolute inset-0" onClick={closeAuthModal} />
          
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white p-8 md:p-10 rounded-lg-2xl max-w-md w-full shadow-2xl relative text-white z-10 my-8 border border-slate-base/10"
          >
            <button 
              onClick={closeAuthModal}
              className="absolute top-6 right-6 text-text-muted hover:text-white transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <h2 className="font-sans tracking-tight font-semibold text-3xl italic mb-2 text-white">
              {isResetMode ? 'Reset Password' : isSignUpMode ? 'Create Account' : 'Welcome Back'}
            </h2>
            <p className="text-text-muted text-xs mb-6">
              {isResetMode 
                ? "Enter your email and we'll send a link to reset your password." 
                : isSignUpMode ? 'Join the Arthneeti student movement for finance.' : 'Log in to connect with the community.'}
            </p>

            {isResetMode ? (
              resetSent ? (
                <div className="space-y-4">
                  <div className="p-3 bg-emerald-600/10 border border-emerald-600/30 rounded-lg text-emerald-600 text-[10px] leading-relaxed font-semibold">
                    If an account exists for that email, a reset link is on its way. Check your inbox (and spam folder).
                  </div>
                  <button
                    type="button"
                    onClick={() => { setIsResetMode(false); setResetSent(false); setAuthError(null); }}
                    className="w-full bg-slate-raised border border-slate-base/10 hover:border-club-green text-white py-4 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer"
                  >
                    Back to Log In
                  </button>
                </div>
              ) : (
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  setAuthError(null);
                  setResetSubmitting(true);
                  try {
                    await resetPassword(resetEmail);
                  } catch (err: any) {
                    if (err?.code !== 'auth/user-not-found') {
                      setAuthError(getReadableAuthError(err));
                      setResetSubmitting(false);
                      return;
                    }
                  }
                  setResetSubmitting(false);
                  setResetSent(true);
                }} className="space-y-4">
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-text-muted mb-1.5 block">Email Address</label>
                    <input 
                      type="email"
                      required
                      placeholder="name@email.com"
                      value={resetEmail}
                      onChange={e => setResetEmail(e.target.value)}
                      className="w-full bg-[#0B0F19] border border-slate-base/5 rounded-lg p-3 text-xs outline-none focus:border-club-green text-white transition-all font-medium"
                    />
                  </div>

                  {authError && (
                    <div className="p-3 bg-electric-mint/10 border border-electric-mint/30 rounded-lg text-electric-mint text-[10px] leading-relaxed font-semibold">
                      {authError}
                    </div>
                  )}

                  <button 
                    type="submit"
                    disabled={resetSubmitting}
                    className="w-full bg-electric-mint hover:bg-white hover:text-electric-mint text-slate-base py-4 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {resetSubmitting && (
                      <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-lg animate-spin" />
                    )}
                    Send Reset Link
                  </button>

                  <button
                    type="button"
                    onClick={() => { setIsResetMode(false); setAuthError(null); }}
                    className="w-full text-text-muted hover:text-white text-[10px] font-bold text-center cursor-pointer"
                  >
                    ← Back to Log In
                  </button>
                </form>
              )
            ) : (
            <>
            <div className="flex bg-slate-raised p-1.5 rounded-lg border border-slate-base/10 mb-6">
              <button
                type="button"
                onClick={() => { setIsSignUpMode(false); setAuthError(null); }}
                className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all cursor-pointer ${
                  !isSignUpMode ? 'bg-club-green text-white shadow-md' : 'text-text-muted hover:text-white'
                }`}
              >
                Log In
              </button>
              <button
                type="button"
                onClick={() => { setIsSignUpMode(true); setAuthError(null); }}
                className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all cursor-pointer ${
                  isSignUpMode ? 'bg-club-green text-white shadow-md' : 'text-text-muted hover:text-white'
                }`}
              >
                Sign Up
              </button>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              setAuthError(null);
              setAuthSubmitting(true);
              try {
                if (isSignUpMode) {
                  if (!authForm.name.trim()) throw new Error('Please enter your full name.');
                  if (authForm.interests.length === 0) throw new Error('Please select at least one field of interest.');
                  await signUpWithEmail(authForm.email, authForm.password, authForm.name, authForm.interests);
                } else {
                  await signInWithEmail(authForm.email, authForm.password);
                }
                setAuthForm({ name: '', email: '', password: '', interests: [] });
              } catch (err: any) {
                setAuthError(getReadableAuthError(err));
              } finally {
                setAuthSubmitting(false);
              }
            }} className="space-y-4">
              
              {isSignUpMode && (
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-text-muted mb-1.5 block">Full Name</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. Aayush Shrestha"
                    value={authForm.name}
                    onChange={e => setAuthForm({...authForm, name: e.target.value})}
                    className="w-full bg-[#0B0F19] border border-slate-base/5 rounded-lg p-3 text-xs outline-none focus:border-club-green text-white transition-all font-medium"
                  />
                </div>
              )}

              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-text-muted mb-1.5 block">Email Address</label>
                <input 
                  type="email"
                  required
                  placeholder="name@email.com"
                  value={authForm.email}
                  onChange={e => setAuthForm({...authForm, email: e.target.value})}
                  className="w-full bg-[#0B0F19] border border-slate-base/5 rounded-lg p-3 text-xs outline-none focus:border-club-green text-white transition-all font-medium"
                />
              </div>

              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-text-muted mb-1.5 block">Password</label>
                <input 
                  type="password"
                  required
                  placeholder="••••••••"
                  value={authForm.password}
                  onChange={e => setAuthForm({...authForm, password: e.target.value})}
                  className="w-full bg-[#0B0F19] border border-slate-base/5 rounded-lg p-3 text-xs outline-none focus:border-club-green text-white transition-all font-medium"
                />
                {!isSignUpMode && (
                  <div className="text-right mt-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthError(null);
                        setResetEmail(authForm.email);
                        setResetSent(false);
                        setIsResetMode(true);
                      }}
                      className="text-[9px] font-black uppercase tracking-widest text-club-green hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}
              </div>

              {isSignUpMode && (
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-text-muted mb-2 block">Interests (Select all that apply)</label>
                  <div className="flex flex-wrap gap-2">
                    {interestOptions.map(option => {
                      const isSelected = authForm.interests.includes(option);
                      return (
                        <button
                          type="button"
                          key={option}
                          onClick={() => {
                            const next = isSelected 
                              ? authForm.interests.filter(i => i !== option) 
                              : [...authForm.interests, option];
                            setAuthForm({...authForm, interests: next});
                          }}
                          className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest border transition-all cursor-pointer ${
                            isSelected 
                              ? 'bg-electric-mint border-electric-mint text-slate-base' 
                              : 'border-slate-base/10 text-text-muted hover:border-club-green/50'
                          }`}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {authError && (
                <div className="p-3 bg-electric-mint/10 border border-electric-mint/30 rounded-lg text-electric-mint text-[10px] leading-relaxed font-semibold">
                  {authError}
                </div>
              )}

              <button 
                type="submit"
                disabled={authSubmitting}
                className="w-full bg-electric-mint hover:bg-white hover:text-electric-mint text-slate-base py-4 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {authSubmitting && (
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-lg animate-spin" />
                )}
                {isSignUpMode ? 'Create Account' : 'Log In'}
              </button>
            </form>

            <div className="relative my-6 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-base/10" />
              </div>
              <span className="relative px-3 bg-[#161F30] text-[9px] font-black uppercase tracking-widest text-text-muted">or continue with</span>
            </div>

            <button
              type="button"
              onClick={async () => {
                setAuthError(null);
                try {
                  await signIn();
                } catch (err: any) {
                  setAuthError(getReadableAuthError(err));
                }
              }}
              className="w-full bg-slate-raised border border-slate-base/10 hover:border-club-green text-white py-4 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Sign In with Google
            </button>
            </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
