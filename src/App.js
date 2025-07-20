import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import PostDetail from './pages/PostDetail';
import ContributePage from './pages/ContributePage';
import Upload from './pages/Upload';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Explore from './pages/Explore';
import SetUsername from './pages/SetUsername';
import TermsAndConditions from './pages/TermsAndConditions';
import EditProfile from './pages/EditProfile';
import UserPosts from './pages/UserPosts';
import UserContributions from './pages/UserContributions';
import UserSavedPosts from './pages/UserSavedPosts';
import Video from './pages/Video';
import Trending from './pages/Trending';
import ErrorBoundary from './components/ErrorBoundary';
import { SkipLink } from './utils/accessibility';
import { trackEvent, ANALYTICS_EVENTS } from './utils/analytics';
import { auth } from './firebase/firebase';
import { onAuthStateChanged } from 'firebase/auth';

const App = () => {
  // Initialize analytics and accessibility
  useEffect(() => {
    // Track page view
    trackEvent(ANALYTICS_EVENTS.PAGE_VIEW, {
      page: window.location.pathname,
      title: document.title
    });

    // Set up auth state listener for analytics
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        trackEvent(ANALYTICS_EVENTS.USER_LOGIN, { userId: user.uid });
      }
    });

    // Track route changes
    const handleRouteChange = () => {
      trackEvent(ANALYTICS_EVENTS.PAGE_VIEW, {
        page: window.location.pathname,
        title: document.title
      });
    };

    window.addEventListener('popstate', handleRouteChange);

    return () => {
      unsubscribe();
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);

  return (
    <ErrorBoundary>
      <Router>
        <div 
          style={{ 
            fontFamily: 'Arial, sans-serif', 
            backgroundColor: '#000000',
            minHeight: '100vh'
          }}
          role="application"
          aria-label="YC Social Media Platform"
        >
          {/* Skip link for accessibility */}
          <SkipLink targetId="main-content" />
          
          <Navbar />
          
          <main id="main-content" role="main">
            <Routes>
              <Route path="/" element={<Navigate to="/explore" replace />} />
              <Route path="/feed" element={<Navigate to="/explore" replace />} />
              <Route path="/home" element={<Navigate to="/explore" replace />} />
              <Route path="/explore" element={<Explore />} />
              <Route path="/trending" element={<Trending />} />
              <Route path="/post/:userId/:postId" element={<PostDetail />} />
              <Route path="/contribute/:userId/:postId/:nodeId?" element={<ContributePage />} />
              <Route path="/upload" element={<Upload />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/login" element={<Login />} />
              <Route path="/set-username" element={<SetUsername />} />
              <Route path="/profile/:userId" element={<Profile />} />
              <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
              <Route path="/edit-profile/:userId" element={<EditProfile />} />
              <Route path="/profile/:userId/posts" element={<UserPosts />} />
              <Route path="/profile/:userId/contributions" element={<UserContributions/>} />
              <Route path="/profile/:userId/saved" element={<UserSavedPosts />} />
              <Route path="/video" element={<Video />} />
            </Routes>
          </main>
        </div>
      </Router>
    </ErrorBoundary>
  );
};

export default App;