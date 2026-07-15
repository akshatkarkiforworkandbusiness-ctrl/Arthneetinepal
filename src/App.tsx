import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Navigation, Footer } from './components/Layout';
import LandingPage from './components/LandingPage';
import CommunityPage from './components/CommunityPage';
import ExplorePage from './components/ExplorePage';
import AboutUsPage from './components/MissionPage';
import LearnPage from './components/LearnPage';
import EventsPage from './components/EventsPage';
import ProfilePage from './components/ProfilePage';
import PostDetailPage from './components/PostDetailPage';
import NewsFeedPage from './components/NewsFeedPage';
import TradingPage from './components/TradingPage';
import TradingGamePage from './components/TradingGamePage';
import LeaderboardPage from './components/LeaderboardPage';
import PublicCertificatePage from './components/PublicCertificatePage';
import BookmarksPage from './components/BookmarksPage';
import NotificationsPage from './components/NotificationsPage';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from '@/components/ui/sonner';
import AmbientBackground from './components/AmbientBackground';

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
        className="w-full"
      >
        <Routes location={location}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/community" element={<CommunityPage />} />
          <Route path="/news-feed" element={<NewsFeedPage />} />
          <Route path="/post/:postId" element={<PostDetailPage />} />
          <Route path="/discover" element={<ExplorePage />} />
          <Route path="/about-us" element={<AboutUsPage />} />
          <Route path="/learn" element={<LearnPage />} />
          <Route path="/learn/:lessonId" element={<LearnPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/:userId" element={<ProfilePage />} />
          <Route path="/trade" element={<TradingPage />} />
          <Route path="/trade-game" element={<TradingGamePage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/bookmarks" element={<BookmarksPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/certificate/:uid/:moduleId" element={<PublicCertificatePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Toaster />
      <Router>
        <div className="min-h-screen bg-background text-text-primary relative flex flex-col overflow-x-hidden">
          {/* Global Light-Theme Ambient Background */}
          <AmbientBackground />

          <div className="relative z-10 w-full">
            <Navigation />
          </div>
          <div className="flex-grow relative z-10">
            <AnimatedRoutes />
          </div>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}
