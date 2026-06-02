import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Navigation, Footer } from './components/Layout';
import LandingPage from './components/LandingPage';
import CommunityPage from './components/CommunityPage';
import ExplorePage from './components/ExplorePage';
import AboutUsPage from './components/MissionPage'; // Repurposing MissionPage as AboutUsPage
import LearnPage from './components/LearnPage';
import EventsPage from './components/EventsPage';
import ProfilePage from './components/ProfilePage';
import { AuthProvider } from './contexts/AuthContext';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-background text-text-primary relative flex flex-col overflow-x-hidden paper-texture">
          <Navigation />
          <div className="flex-grow relative z-10">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/community" element={<CommunityPage />} />
              <Route path="/discover" element={<ExplorePage />} />
              <Route path="/about-us" element={<AboutUsPage />} />
              <Route path="/learn" element={<LearnPage />} />
              <Route path="/events" element={<EventsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}
