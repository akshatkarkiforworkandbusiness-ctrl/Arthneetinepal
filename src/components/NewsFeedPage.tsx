import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  collection, query, orderBy, onSnapshot, addDoc, serverTimestamp,
  where, getDocs, updateDoc, increment, doc, deleteDoc, limit
} from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { Heart, MessageSquare, Share2, Clock, RefreshCw, TrendingUp, Newspaper, Zap, ChevronDown, FileText } from 'lucide-react';
import PostActions from './PostActions';
import {
  TRENDING_SECTORS,
  SECTOR_ICONS,
  SECTOR_DESCRIPTIONS,
  type Sector,
} from '../lib/newsService';
import type { Post } from '../types/post';

// Nepal Time is UTC+5:45
const NEPAL_OFFSET = 5.75;
const SECTORS = [...TRENDING_SECTORS];

function getNepalTime(): Date {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc + NEPAL_OFFSET * 3600000);
}

function getNepalHour(): number {
  return getNepalTime().getHours();
}

function getNepalDate(): string {
  return getNepalTime().toISOString().split('T')[0];
}

function isWithinPostingHours(): boolean {
  const hour = getNepalHour();
  return hour >= 9 && hour < 17; // 9AM to 5PM
}

function getTimeUntilNextPost(): number {
  const nepal = getNepalTime();
  const hour = nepal.getHours();
  const min = nepal.getMinutes();
  const sec = nepal.getSeconds();

  if (hour < 9) {
    // Before 9AM - time until 9AM
    return ((9 - hour - 1) * 60 + (60 - min)) * 60 - sec;
  } else if (hour >= 17) {
    // After 5PM - time until 9AM next day
    return ((24 - hour + 9 - 1) * 60 + (60 - min)) * 60 - sec;
  } else {
    // Between posts - time until next hour
    return ((60 - min) * 60 - sec) * 1000;
  }
}

interface SectorFeed {
  sector: Sector;
  latestArticle: Post | null;
  allTodayPosts: Post[];
  lastUpdated: string | null;
}

export default function NewsFeedPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [researching, setResearching] = useState(false);
  const [selectedSector, setSelectedSector] = useState<Sector | null>(null);
  const [lastCheck, setLastCheck] = useState<Date>(new Date());
  const [nextPostIn, setNextPostIn] = useState<string>('');
  const [isPostingHours, setIsPostingHours] = useState(true);
  const [dailyDigest, setDailyDigest] = useState<Post | null>(null);
  const [mostEngagedYesterday, setMostEngagedYesterday] = useState<Post | null>(null);
  const [expandedSectors, setExpandedSectors] = useState<Set<Sector>>(new Set());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Listen for all posts
  useEffect(() => {
    const qPosts = query(
      collection(db, 'posts'),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(qPosts,
      (snapshot) => {
        const allPosts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
        setPosts(allPosts);
        setLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'posts');
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Derive today's posts and sector feeds - show all posts from today
  const todayPosts = useMemo(() => {
    const today = getNepalDate();
    return posts.filter(p => p.newsDate === today);
  }, [posts]);

  const sectorFeeds = useMemo(() => {
    const feeds: SectorFeed[] = SECTORS.map(sector => {
      const sectorPosts = todayPosts.filter(p => p.sector === sector);
      const hourlyPosts = sectorPosts.filter(p => p.hourlyPost);
      const latestArticle = hourlyPosts.length > 0 ? hourlyPosts[0] : null;
      return {
        sector,
        latestArticle,
        allTodayPosts: sectorPosts,
        lastUpdated: latestArticle?.createdAt?.toDate?.()?.toISOString() || null,
      };
    });
    return feeds;
  }, [todayPosts]);

  // Get daily digest for today
  useEffect(() => {
    const today = getNepalDate();
    const digest = todayPosts.find(p => p.isDailyDigest && p.digestDate === today);
    setDailyDigest(digest || null);
  }, [todayPosts]);

  // Get most engaged from yesterday
  useEffect(() => {
    const fetchMostEngaged = async () => {
      const yesterday = new Date(getNepalTime());
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const q = query(
        collection(db, 'posts'),
        where('newsDate', '==', yesterdayStr),
        where('type', '==', 'news'),
        orderBy('engagementScore', 'desc'),
        limit(1)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        setMostEngagedYesterday(snap.docs[0].data() as Post);
      } else {
        setMostEngagedYesterday(null);
      }
    };
    fetchMostEngaged();
  }, [posts]);

  // Timer for next post countdown
  useEffect(() => {
    const updateCountdown = () => {
      const nepal = getNepalTime();
      const hour = nepal.getHours();
      const min = nepal.getMinutes();
      const sec = nepal.getSeconds();

      setIsPostingHours(isWithinPostingHours());

      if (hour < 9) {
        const mins = (9 - hour - 1) * 60 + (60 - min);
        setNextPostIn(`${mins}m until 9:00 AM`);
      } else if (hour >= 17) {
        const mins = (24 - hour + 9 - 1) * 60 + (60 - min);
        setNextPostIn(`${mins}m until 9:00 AM tomorrow`);
      } else {
        const mins = 60 - min - 1;
        const secs = 60 - sec;
        setNextPostIn(`${mins}m ${secs}s`);
      }
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-post research every hour during posting hours
  const researchAllSectors = useCallback(async () => {
    if (researching) return;
    setResearching(true);

    try {
      const response = await fetch('/api/ai-news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ allSectors: true })
      });

      if (!response.ok) throw new Error('Failed to fetch news');

      const data = await response.json();
      const articles = data.articles || [];
      const today = getNepalDate();
      const hour = getNepalHour();
      let posted = 0;

      for (const article of articles) {
        // Check if we already have an article for this sector this hour
        const existingQuery = query(
          collection(db, 'posts'),
          where('sector', '==', article.sector),
          where('newsDate', '==', today),
          where('hourPublished', '==', hour),
          where('hourlyPost', '==', true)
        );
        const existing = await getDocs(existingQuery);
        if (!existing.empty) continue;

        const postData = {
          type: 'news' as const,
          title: article.title,
          author: 'Arthneeti AI',
          authorId: 'system',
          category: 'Finance' as const,
          content: `<p>${article.summary}</p>`,
          sector: article.sector,
          newsDate: today,
          source: article.source || 'NVIDIA AI',
          views: 0,
          hourlyPost: true,
          hourPublished: hour,
          isDailyNews: true,
          likes: 0,
          commentCount: 0,
          engagementScore: 0,
          createdAt: serverTimestamp(),
        };

        await addDoc(collection(db, 'posts'), postData);
        posted++;
      }

      setLastCheck(new Date());
      if (posted > 0) {
        toast.success(`Posted ${posted} new article${posted > 1 ? 's' : ''}`);
      }
    } catch (error) {
      console.error('Research error:', error);
      toast.error('Failed to research news');
    } finally {
      setResearching(false);
    }
  }, [researching]);

  // Generate daily digest
  const generateDailyDigest = useCallback(async () => {
    const today = getNepalDate();

    // Check if digest already exists
    const existingDigest = todayPosts.find(p => p.isDailyDigest && p.digestDate === today);
    if (existingDigest) {
      toast.info('Daily digest already exists for today');
      return;
    }

    setResearching(true);
    try {
      const response = await fetch('/api/ai-digest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articles: todayPosts.filter(p => p.hourlyPost).map(p => ({
            title: p.title,
            summary: p.content?.replace(/<[^>]+>/g, '').substring(0, 300),
            sector: p.sector,
            source: p.source,
          })),
          date: today
        })
      });

      if (!response.ok) throw new Error('Failed to generate digest');

      const digest = await response.json();

      const postData = {
        type: 'news' as const,
        title: digest.title,
        author: 'Arthneeti AI',
        authorId: 'system',
        category: 'Finance' as const,
        content: digest.content,
        newsDate: today,
        source: 'Arthneeti Research Assistant',
        views: 0,
        isDailyDigest: true,
        digestDate: today,
        isDailyNews: true,
        likes: 0,
        commentCount: 0,
        engagementScore: 0,
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'posts'), postData);
      toast.success('Daily digest published!');
    } catch (error) {
      console.error('Digest error:', error);
      toast.error('Failed to generate digest');
    } finally {
      setResearching(false);
    }
  }, [todayPosts]);

  // Clean up old hourly posts - keep only most engaged from previous day
  const cleanupOldPosts = useCallback(async () => {
    try {
      // Get all hourly posts from 2 days ago (preserve yesterday's posts for reference)
      const twoDaysAgo = new Date(getNepalTime());
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      const twoDaysAgoStr = twoDaysAgo.toISOString().split('T')[0];

      const oldPostsQuery = query(
        collection(db, 'posts'),
        where('hourlyPost', '==', true),
        where('newsDate', '==', twoDaysAgoStr)
      );
      const oldSnap = await getDocs(oldPostsQuery);

      for (const postDoc of oldSnap.docs) {
        await deleteDoc(doc(db, 'posts', postDoc.id));
      }

      // Mark most engaged from yesterday
      if (mostEngagedYesterday?.id) {
        await updateDoc(doc(db, 'posts', mostEngagedYesterday.id), {
          isMostEngaged: true
        });
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }, [mostEngagedYesterday]);

  // Auto-trigger hourly research
  useEffect(() => {
    if (!isPostingHours) return;

    intervalRef.current = setInterval(() => {
      researchAllSectors();
    }, 60 * 60 * 1000); // Every hour

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPostingHours, researchAllSectors]);

  // Auto-trigger daily digest at 5:30 PM and cleanup at 9 AM
  useEffect(() => {
    const checkScheduledTasks = () => {
      const nepal = getNepalTime();
      const hour = nepal.getHours();
      const min = nepal.getMinutes();

      // Auto-generate digest at 5:30 PM (17:30)
      if (hour === 17 && min === 30 && !dailyDigest) {
        generateDailyDigest();
      }

      // Auto-cleanup at 9:00 AM
      if (hour === 9 && min === 0) {
        cleanupOldPosts();
      }
    };

    const taskInterval = setInterval(checkScheduledTasks, 60000); // Check every minute
    return () => clearInterval(taskInterval);
  }, [dailyDigest, generateDailyDigest, cleanupOldPosts]);

  const toggleSector = (sector: Sector) => {
    setExpandedSectors(prev => {
      const next = new Set(prev);
      if (next.has(sector)) next.delete(sector);
      else next.add(sector);
      return next;
    });
  };

  const filteredPosts = useMemo(() => {
    let filtered = posts;
    if (selectedSector) {
      filtered = filtered.filter(p => p.sector === selectedSector);
    }
    return filtered;
  }, [posts, selectedSector]);

  if (loading) {
    return (
      <motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto px-4 md:px-12 py-24 min-h-screen">
        <Skeleton className="h-8 w-64 mb-4 bg-[#2e2e2e]" />
        <Skeleton className="h-14 w-96 mb-12 bg-[#2e2e2e]" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6, 7].map(i => (
            <Skeleton key={i} className="h-64 rounded-2xl bg-[#090a0b]" />
          ))}
        </div>
      </motion.main>
    );
  }

  return (
    <motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto px-4 md:px-12 pt-32 pb-24 min-h-screen">

      {/* Header */}
      <header className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-[10px] font-bold text-brand-emerald-light uppercase tracking-[0.4em]">RESEARCH ASSISTANT</span>
          <span className={`flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider ${isPostingHours ? 'text-brand-emerald-light' : 'text-text-muted'}`}>
            <span className={`w-2 h-2 rounded-full ${isPostingHours ? 'bg-brand-emerald-light animate-pulse' : 'bg-text-muted'}`} />
            {isPostingHours ? 'Auto-Posting Active' : 'Posting Paused (9AM-5PM NPT)'}
          </span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="font-display font-medium tracking-[0.03em] leading-[0.90] text-5xl md:text-[64px] text-brandwood mb-2">
              Trending Sectors
            </h1>
            <p className="text-text-muted text-sm">
              Latest news for each sector, posted hourly from 9:00 AM to 5:00 PM Nepali time.
              {!isPostingHours && (
                <span className="ml-2 text-brand-emerald-light font-bold">
                  Articles persist until tomorrow's updates.
                </span>
              )}
              {nextPostIn && isPostingHours && (
                <span className="ml-2 text-brand-emerald-light font-bold">
                  Next update in {nextPostIn}
                </span>
              )}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={researchAllSectors}
              disabled={researching}
              className="flex items-center gap-2 px-6 py-3 bg-white border border-blush-mist text-brandwood rounded-2xl text-xs font-bold uppercase tracking-widest hover:border-brand-emerald/50 hover:bg-white transition-all shadow-sm disabled:opacity-50"
            >
              <RefreshCw size={16} className={researching ? 'animate-spin' : ''} />
              {researching ? 'Researching...' : 'Research Now'}
            </button>
            <button
              onClick={generateDailyDigest}
              disabled={researching || !!dailyDigest}
              className="flex items-center gap-2 px-6 py-3 bg-brand-emerald text-white rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-brand-emerald/90 transition-all shadow-elevated disabled:opacity-50"
            >
              <Newspaper size={16} />
              {dailyDigest ? 'Digest Published' : 'Generate Digest'}
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <span className="text-[10px] text-text-muted font-sans">
            Last checked: {lastCheck.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </span>
          <span className="text-[10px] text-text-muted font-sans">
            Nepal Time: {getNepalTime().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        </div>
      </header>

      {/* Most Engaged Yesterday */}
      {mostEngagedYesterday && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 bg-gradient-to-r from-white to-white border border-blush-mist rounded-3xl p-6 shadow-card"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-brand-emerald-light/10 flex items-center justify-center">
              <TrendingUp size={20} className="text-brand-emerald-light" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-brandwood uppercase tracking-widest">Most Engaged Yesterday</h3>
              <p className="text-[10px] text-text-muted">Kept for reference</p>
            </div>
          </div>
          <div
            className="bg-white rounded-2xl p-4 border border-blush-mist cursor-pointer hover:border-brand-emerald/30 transition-all"
            onClick={() => navigate(`/post/${mostEngagedYesterday.id}`)}
          >
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-[10px] font-black text-brand-emerald border-brand-emerald/30 uppercase tracking-widest bg-brand-emerald/10 px-3 py-1 rounded-lg">
                {mostEngagedYesterday.sector}
              </Badge>
              <span className="text-[9px] text-text-muted uppercase tracking-widest">
                {mostEngagedYesterday.newsDate}
              </span>
            </div>
            <h4 className="font-bold text-brandwood mb-2">{mostEngagedYesterday.title}</h4>
            <div className="flex items-center gap-4 text-[10px] text-text-muted">
              <span className="flex items-center gap-1"><Heart size={12} /> {mostEngagedYesterday.likes}</span>
              <span className="flex items-center gap-1"><MessageSquare size={12} /> {mostEngagedYesterday.commentCount}</span>
              <span className="flex items-center gap-1"><Zap size={12} /> {mostEngagedYesterday.engagementScore || 0} pts</span>
            </div>
          </div>
        </motion.section>
      )}

      {/* Daily Digest */}
      {dailyDigest && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 bg-white border-2 border-brand-emerald/30 rounded-3xl p-6 shadow-card"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-brand-emerald/10 flex items-center justify-center">
              <Newspaper size={20} className="text-brand-emerald" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-brandwood uppercase tracking-widest">Daily Digest</h3>
              <p className="text-[10px] text-text-muted">Comprehensive market summary for today</p>
            </div>
          </div>
          <div
            className="bg-white/30 rounded-2xl p-6 border border-blush-mist cursor-pointer hover:border-brand-emerald/30 transition-all"
            onClick={() => navigate(`/post/${dailyDigest.id}`)}
          >
            <h4 className="text-xl font-display font-medium text-brandwood mb-3">{dailyDigest.title}</h4>
            <div
              className="text-text-muted text-sm leading-relaxed line-clamp-4"
              dangerouslySetInnerHTML={{ __html: dailyDigest.content }}
            />
            <div className="flex items-center gap-4 mt-4 text-[10px] text-text-muted">
              <span className="flex items-center gap-1"><Clock size={12} /> {dailyDigest.newsDate}</span>
              <span className="flex items-center gap-1"><Heart size={12} /> {dailyDigest.likes}</span>
              <span className="flex items-center gap-1"><MessageSquare size={12} /> {dailyDigest.commentCount}</span>
            </div>
          </div>
        </motion.section>
      )}

      {/* Sector Filter */}
      <div className="flex flex-wrap gap-3 mb-8">
        <button
          onClick={() => setSelectedSector(null)}
          className={`px-5 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all ${
            !selectedSector
              ? 'bg-brandwood text-white'
              : 'bg-white border border-blush-mist text-brandwood hover:border-brand-emerald/50'
          }`}
        >
          All Sectors
        </button>
        {SECTORS.map(sector => (
          <button
            key={sector}
            onClick={() => setSelectedSector(selectedSector === sector ? null : sector)}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all ${
              selectedSector === sector
                ? 'bg-brandwood text-white'
                : 'bg-white border border-blush-mist text-brandwood hover:border-brand-emerald/50'
            }`}
          >
            {sector}
          </button>
        ))}
      </div>

      {/* Sector Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
        {sectorFeeds
          .filter(f => !selectedSector || f.sector === selectedSector)
          .map((feed, i) => (
          <motion.div
            key={feed.sector}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-20px" }}
            transition={{ delay: i * 0.05, type: 'spring', damping: 20 }}
            className="bg-white border border-blush-mist rounded-3xl overflow-hidden shadow-card hover:shadow-elevated transition-all"
          >
            {/* Sector Header */}
            <div className="p-6 border-b border-blush-mist">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white border border-blush-mist flex items-center justify-center text-brandwood shrink-0">
                  {(() => { const Icon = SECTOR_ICONS[feed.sector]; return <Icon size={24} />; })()}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-display font-bold text-xl text-brandwood leading-tight">{feed.sector}</h3>
                  <p className="text-[10px] text-text-muted mt-1 leading-relaxed">{SECTOR_DESCRIPTIONS[feed.sector]}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-4 text-[10px] text-text-muted">
                <span>{feed.allTodayPosts.length} articles today</span>
                {feed.lastUpdated && (
                  <span>Updated {new Date(feed.lastUpdated).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                )}
              </div>
            </div>

            {/* Latest Article */}
            {feed.latestArticle ? (
              <div
                className="p-6 cursor-pointer hover:bg-white/30 transition-colors"
                onClick={() => navigate(`/post/${feed.latestArticle!.id}`)}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="outline" className="text-[9px] font-black text-brand-emerald-light border-brand-emerald-light/30 uppercase tracking-widest bg-brand-emerald-light/10 px-2 py-0.5 rounded-md">
                    Latest
                  </Badge>
                  <span className="text-[9px] text-text-muted uppercase tracking-widest">
                    {feed.latestArticle.newsDate}
                  </span>
                </div>
                <h4 className="font-bold text-brandwood mb-2 line-clamp-2">{feed.latestArticle.title}</h4>
                <p className="text-xs text-text-muted line-clamp-3 leading-relaxed">
                  {feed.latestArticle.content?.replace(/<[^>]+>/g, '').substring(0, 150)}...
                </p>
                <div className="flex items-center gap-4 mt-3 text-[10px] text-text-muted">
                  <span className="flex items-center gap-1"><Heart size={12} /> {feed.latestArticle.likes}</span>
                  <span className="flex items-center gap-1"><MessageSquare size={12} /> {feed.latestArticle.commentCount}</span>
                  <span className="flex items-center gap-1"><Clock size={12} /> {feed.latestArticle.hourPublished}:00</span>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center">
                <FileText size={36} className="text-blush-mist block mb-2" />
                <p className="text-xs text-text-muted italic">No articles yet today. Next update at 9:00 AM.</p>
              </div>
            )}

            {/* View All */}
            {feed.allTodayPosts.length > 1 && (
              <button
                onClick={() => toggleSector(feed.sector)}
                className="w-full py-3 border-t border-blush-mist text-[10px] font-bold text-text-muted uppercase tracking-widest hover:bg-white/50 transition-colors flex items-center justify-center gap-1"
              >
                {expandedSectors.has(feed.sector) ? 'Show Less' : `View All ${feed.allTodayPosts.length} Articles`}
                <ChevronDown size={14} className={`transition-transform ${expandedSectors.has(feed.sector) ? 'rotate-180' : ''}`} />
              </button>
            )}

            {/* Expanded Articles */}
            <AnimatePresence>
              {expandedSectors.has(feed.sector) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden border-t border-blush-mist"
                >
                  <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
                    {feed.allTodayPosts.filter(p => p.id !== feed.latestArticle?.id).map(post => (
                      <div
                        key={post.id}
                        className="p-3 bg-white/30 rounded-xl border border-blush-mist cursor-pointer hover:border-brand-emerald/30 transition-all"
                        onClick={() => navigate(`/post/${post.id}`)}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[9px] text-brand-emerald-light font-bold">{post.hourPublished}:00</span>
                          <span className="text-[9px] text-text-muted">NPT</span>
                        </div>
                        <h5 className="text-sm font-bold text-brandwood line-clamp-1">{post.title}</h5>
                        <p className="text-[10px] text-text-muted line-clamp-2 mt-1">
                          {post.content?.replace(/<[^>]+>/g, '').substring(0, 100)}...
                        </p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {/* Recent Posts Feed */}
      <section className="border-t border-blush-mist pt-10">
        <h2 className="font-display font-medium text-3xl text-brandwood mb-6 tracking-[0.03em]">All Recent Posts</h2>
        <div className="space-y-4">
          {filteredPosts.slice(0, 20).map((post) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-blush-mist p-5 rounded-2xl shadow-sm hover:shadow-card transition-all cursor-pointer"
              onClick={() => navigate(`/post/${post.id}`)}
            >
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-white border border-blush-mist flex items-center justify-center text-brand-emerald font-black text-sm uppercase shrink-0">
                  {post.author?.[0] || 'A'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-brandwood text-sm">{post.author}</h4>
                    <span className="text-xs text-text-muted">
                      · {post.createdAt?.toDate ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(post.createdAt.toDate()) : 'Recent'}
                    </span>
                  </div>
                  {post.sector && (
                    <Badge variant="outline" className="text-[9px] font-black text-brand-emerald border-brand-emerald/30 uppercase tracking-widest bg-brand-emerald/10 px-2 py-0.5 rounded-lg mb-2">
                      {post.sector}
                    </Badge>
                  )}
                  <h3 className="font-bold text-brandwood mb-1 line-clamp-1">{post.title}</h3>
                  <p className="text-xs text-text-muted line-clamp-2">
                    {post.content?.replace(/<[^>]+>/g, '').substring(0, 120)}...
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-[10px] text-text-muted">
                    <PostActions
                      postId={post.id}
                      likes={post.likes}
                      commentCount={post.commentCount}
                      compact={true}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </motion.main>
  );
}
