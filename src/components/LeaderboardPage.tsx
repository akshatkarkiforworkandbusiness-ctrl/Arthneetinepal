import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { 
  Trophy, Medal, Users, Globe, RefreshCw, ChevronRight, 
  ArrowUpRight, ArrowDownRight, Award, HelpCircle
} from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, limit, onSnapshot, getDocs } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

interface LeaderboardEntry {
  uid: string;
  displayName: string;
  portfolioValue: number;
  returnPercent: number;
  rank: number;
  schoolName?: string;
}

interface LeaderboardSnapshot {
  id: string;
  period: 'daily' | 'weekly' | 'season';
  computedAt: any;
  scope: string; // 'national' or schoolId
  entries: LeaderboardEntry[];
}

const SCHOOL_NAMES: Record<string, string> = {
  'st-lawrence': 'St. Lawrence School',
  'kathmandu-valley': 'Kathmandu Valley Public School',
  'sos-disability': 'SOS Disability Center',
};

export default function LeaderboardPage({ isEmbedded = false }: { isEmbedded?: boolean }) {
  const { user, profile, isAdmin } = useAuth();
  const [activeScope, setActiveScope] = useState<'national' | 'school'>('national');
  const [activePeriod, setActivePeriod] = useState<'season' | 'daily'>('season');
  const [snapshot, setSnapshot] = useState<LeaderboardSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [triggeringSnapshot, setTriggeringSnapshot] = useState(false);

  useEffect(() => {
    setLoading(true);
    const scopeVal = activeScope === 'school' ? (profile?.schoolId || 'none') : 'national';
    
    // Query the latest leaderboard snapshot matching scope & period
    const q = query(
      collection(db, 'leaderboards'),
      where('scope', '==', scopeVal),
      where('period', '==', activePeriod),
      orderBy('computedAt', 'desc'),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        const doc = snap.docs[0];
        setSnapshot({ id: doc.id, ...doc.data() } as LeaderboardSnapshot);
      } else {
        setSnapshot(null);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error loading leaderboard:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [activeScope, activePeriod, profile?.schoolId]);

  const forceSnapshot = async () => {
    setTriggeringSnapshot(true);
    try {
      const userToken = await user?.getIdToken();
      const res = await fetch('/api/leaderboard/snapshot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        }
      });
      if (res.ok) {
        toast.success("Leaderboard rankings successfully re-calculated!");
      } else {
        const data = await res.json() as any;
        throw new Error(data.error || "Failed to calculate.");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to trigger rankings calculations.");
    } finally {
      setTriggeringSnapshot(false);
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Medal className="text-yellow-500 fill-yellow-500/10" size={24} />;
    if (rank === 2) return <Medal className="text-slate-300 fill-slate-300/10" size={24} />;
    if (rank === 3) return <Medal className="text-amber-600 fill-amber-600/10" size={24} />;
    return <span className="text-sm font-mono font-bold text-[#9f9fa0] w-6 text-center">{rank}</span>;
  };

  return (
    <div className={isEmbedded ? "w-full space-y-6 text-white" : "min-h-screen bg-[#090a0b] py-24 px-6 md:px-12 text-white"}>
      <div className={isEmbedded ? "space-y-6" : "max-w-4xl mx-auto space-y-8"}>
        
        {/* Header */}
        {!isEmbedded && (
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h1 className="text-4xl font-display font-medium text-white tracking-tight flex items-center gap-3">
                <Trophy className="text-yellow-500" size={32} />
                Leaderboard Rankings
              </h1>
              <p className="text-[#9f9fa0] text-sm mt-1">See how you measure up against the best traders in Nepal.</p>
            </div>

            {/* Admin Force Calculator */}
            {isAdmin && (
              <button
                onClick={forceSnapshot}
                disabled={triggeringSnapshot}
                className="flex items-center gap-2 px-5 py-3 bg-[#003893] hover:bg-[#002f80] text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-colors disabled:opacity-50"
              >
                <RefreshCw className={triggeringSnapshot ? "animate-spin" : ""} size={14} />
                Recalculate Ranks
              </button>
            )}
          </div>
        )}

        {/* Adjust flex layout slightly for embedded/non-embedded recalculate button */}
        {isEmbedded && isAdmin && (
          <div className="flex justify-end">
            <button
              onClick={forceSnapshot}
              disabled={triggeringSnapshot}
              className="flex items-center gap-2 px-5 py-3 bg-[#003893] hover:bg-[#002f80] text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-colors disabled:opacity-50"
            >
              <RefreshCw className={triggeringSnapshot ? "animate-spin" : ""} size={14} />
              Recalculate Ranks
            </button>
          </div>
        )}

        {/* Filters Panel */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-3xl p-6 flex flex-col md:flex-row gap-6 justify-between items-center">
          {/* Scope selection: National vs School */}
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 w-full md:w-auto">
            <button
              onClick={() => setActiveScope('national')}
              className={`flex-1 md:flex-initial px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-2 ${
                activeScope === 'national' ? 'bg-[#3b82f6] text-white' : 'text-[#9f9fa0] hover:text-white'
              }`}
            >
              <Globe size={14} /> National
            </button>
            <button
              onClick={() => {
                if (!profile?.schoolId) {
                  toast.error("Please add your school in Onboarding or Settings first.");
                  return;
                }
                setActiveScope('school');
              }}
              className={`flex-1 md:flex-initial px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-2 ${
                activeScope === 'school' ? 'bg-[#3b82f6] text-white' : 'text-[#9f9fa0] hover:text-white'
              }`}
            >
              <Users size={14} /> School League
            </button>
          </div>

          {/* Period Selection: Season vs Daily */}
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 w-full md:w-auto">
            <button
              onClick={() => setActivePeriod('season')}
              className={`flex-1 md:flex-initial px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-colors ${
                activePeriod === 'season' ? 'bg-[#dc143c] text-white' : 'text-[#9f9fa0] hover:text-white'
              }`}
            >
              Season (Total Returns)
            </button>
            <button
              onClick={() => setActivePeriod('daily')}
              className={`flex-1 md:flex-initial px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-colors ${
                activePeriod === 'daily' ? 'bg-[#dc143c] text-white' : 'text-[#9f9fa0] hover:text-white'
              }`}
            >
              Daily
            </button>
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-3xl overflow-hidden shadow-xl">
          {loading ? (
            <div className="p-24 text-center text-[#9f9fa0] flex items-center justify-center gap-3">
              <RefreshCw className="animate-spin text-[#dc143c]" size={24} />
              <span className="font-bold text-xs uppercase tracking-widest">Loading Ranks...</span>
            </div>
          ) : !snapshot || snapshot.entries.length === 0 ? (
            <div className="p-24 text-center text-[#9f9fa0] space-y-4">
              <Trophy className="mx-auto text-[#9f9fa0]/20 animate-bounce" size={48} />
              <p className="text-sm">No rankings calculated for this category yet.</p>
              <p className="text-xs text-[#9f9fa0]/60 max-w-xs mx-auto">
                Rankings calculate daily at NEPSE market close (3:00 PM NPT). Be sure to trade and join a school to start competing!
              </p>
            </div>
          ) : (
            <div>
              {/* Snapshot Timestamp */}
              <div className="px-8 py-4 bg-white/[0.01] border-b border-white/[0.04] flex justify-between items-center text-xs text-[#9f9fa0]">
                <span>Snapshot computed: {snapshot.computedAt?.toDate ? snapshot.computedAt.toDate().toLocaleString() : new Date(snapshot.computedAt).toLocaleString()}</span>
                {activeScope === 'school' && (
                  <span className="font-bold uppercase tracking-wider text-[#3b82f6]">
                    School: {SCHOOL_NAMES[profile?.schoolId || ''] || 'Local League'}
                  </span>
                )}
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/[0.06] text-[10px] font-black uppercase tracking-widest text-[#9f9fa0]/60">
                      <th className="py-4 px-8 w-24">Rank</th>
                      <th className="py-4 px-6">Name</th>
                      <th className="py-4 px-6 text-right">Portfolio Value</th>
                      <th className="py-4 px-6 text-right">Returns</th>
                    </tr>
                  </thead>
                  <tbody>
                    {snapshot.entries.map((entry, index) => {
                      const isCurrentUser = entry.uid === user?.uid;
                      return (
                        <tr 
                          key={entry.uid} 
                          className={`border-b border-white/[0.04] transition-colors font-mono ${
                            isCurrentUser ? 'bg-[#3b82f6]/10 hover:bg-[#3b82f6]/15' : 'hover:bg-white/[0.01]'
                          }`}
                        >
                          <td className="py-5 px-8 flex items-center justify-start gap-4">
                            {getRankBadge(entry.rank)}
                          </td>
                          <td className="py-5 px-6 font-sans">
                            <span className={`font-bold text-sm block ${isCurrentUser ? 'text-[#3b82f6]' : 'text-white'}`}>
                              {entry.displayName} {isCurrentUser && "(You)"}
                            </span>
                            {entry.schoolName && (
                              <span className="text-[10px] text-[#9f9fa0] block mt-0.5">{entry.schoolName}</span>
                            )}
                          </td>
                          <td className="py-5 px-6 text-right font-bold text-white text-sm">
                            Rs. {entry.portfolioValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </td>
                          <td className={`py-5 px-6 text-right font-bold text-sm ${entry.returnPercent >= 0 ? 'text-green-500' : 'text-[#dc143c]'}`}>
                            <span className="inline-flex items-center gap-1">
                              {entry.returnPercent >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                              {entry.returnPercent >= 0 ? '+' : ''}{entry.returnPercent.toFixed(2)}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
}
