import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Navigation, Footer } from './components/Layout';
import LandingPage from './components/LandingPage';
import CommunityPage from './components/CommunityPage';
import ExplorePage from './components/ExplorePage';
import AboutUsPage from './components/MissionPage'; // Repurposing MissionPage as AboutUsPage
import LearnPage from './components/LearnPage';
import EventsPage from './components/EventsPage';
import ProfilePage from './components/ProfilePage';
import PostDetailPage from './components/PostDetailPage';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from '@/components/ui/sonner';
import Lightfall from './components/Lightfall';

export default function App() {
  return (
    <AuthProvider>
      <Toaster />
      <Router>
        <div className="min-h-screen bg-background text-text-primary relative flex flex-col overflow-x-hidden paper-texture">
          <div className="fixed inset-0 z-0 opacity-30 pointer-events-none">
            <Lightfall 
              colors={['#FF3366', '#06B6D4', '#7C3AED']} 
              backgroundColor="#0B0F19"
              mouseInteraction={false}
            />
          </div>
          <div className="relative z-10 w-full">
            <Navigation />
          </div>
          <div className="flex-grow relative z-10">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/community" element={<CommunityPage />} />
              <Route path="/post/:postId" element={<PostDetailPage />} />
              <Route path="/discover" element={<ExplorePage />} />
              <Route path="/about-us" element={<AboutUsPage />} />
              <Route path="/learn" element={<LearnPage />} />
              <Route path="/learn/:lessonId" element={<LearnPage />} />
              <Route path="/events" element={<EventsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/profile/:userId" element={<ProfilePage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}
