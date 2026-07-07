import { useState } from 'react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Shield, Check, Loader2 } from 'lucide-react';

export default function AdminSetup() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const makeAdmin = async () => {
    if (!user) {
      setError('You must be signed in first');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Check if already admin
      const adminDoc = await getDoc(doc(db, 'admins', user.uid));
      if (adminDoc.exists()) {
        setDone(true);
        setLoading(false);
        return;
      }

      // Add to admins collection
      await setDoc(doc(db, 'admins', user.uid), {
        uid: user.uid,
        email: user.email,
        createdAt: new Date(),
      });

      setDone(true);
      window.location.reload();
    } catch (err: any) {
      console.error('Error making admin:', err);
      setError(err.message || 'Failed to make admin. Check Firestore rules.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="fixed bottom-4 left-4 bg-amber-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg flex items-center gap-2">
        <Shield size={16} />
        Sign in first
      </div>
    );
  }

  if (done) {
    return (
      <div className="fixed bottom-4 left-4 bg-green-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg flex items-center gap-2">
        <Check size={16} />
        Admin access granted! Refreshing...
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 z-[90]">
      <button
        onClick={makeAdmin}
        disabled={loading}
        className="bg-purple-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg flex items-center gap-2 hover:bg-purple-700 transition-colors disabled:opacity-50"
      >
        {loading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Shield size={16} />
        )}
        {loading ? 'Setting up...' : 'Make Me Admin'}
      </button>
      {error && (
        <p className="text-red-400 text-[10px] mt-1">{error}</p>
      )}
    </div>
  );
}
