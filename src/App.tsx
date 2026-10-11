import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Navigation, Footer } from './components/Layout';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from '@/components/ui/sonner';
import AmbientBackground from './components/AmbientBackground';

/* Route-level code splitting.
 * Keeps three.js (~1.3 MB) and the chart libraries (~1 MB) out of the
 * initial bundle — each is only fetched on the route that needs it. */
const LandingPage = lazy(() => import('./components/LandingPage'));
const CommunityPage = lazy(() => import('./components/CommunityPage'));
const ExplorePage = lazy(() => import('./components/ExplorePage'));
const AboutUsPage = lazy(() => import('./components/MissionPage'));
const LearnPage = lazy(() => import('./components/LearnPage'));
const EventsPage = lazy(() => import('./components/EventsPage'));
const ProfilePage = lazy(() => import('./components/ProfilePage'));
const PostDetailPage = lazy(() => import('./components/PostDetailPage'));
const NewsFeedPage = lazy(() => import('./components/NewsFeedPage'));
const TradingPage = lazy(() => import('./components/TradingPage'));
const TradingGamePage = lazy(() => import('./components/TradingGamePage'));
const LeaderboardPage = lazy(() => import('./components/LeaderboardPage'));
const PublicCertificatePage = lazy(() => import('./components/PublicCertificatePage'));
const BookmarksPage = lazy(() => import('./components/BookmarksPage'));
const NotificationsPage = lazy(() => import('./components/NotificationsPage'));
const PrivacyPolicyPage = lazy(() => import('./components/PrivacyPolicyPage'));
const TermsOfServicePage = lazy(() => import('./components/TermsOfServicePage'));

function PageFallback() {
  return (
    <div
      role="status"
      aria-label="Loading page"
      className="flex min-h-[50vh] w-full items-center justify-center"
    >
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-club-green" />
    </div>
  );
}

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
        <Suspense fallback={<PageFallback />}>
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
            <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
            <Route path="/terms-of-service" element={<TermsOfServicePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
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
