import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Feed from './pages/Feed';
import PostDetail from './pages/PostDetail';
import ContributePage from './pages/ContributePage';
import Upload from './pages/Upload';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Explore from './pages/Explore';
import Home from './pages/Home';

const App = () => {
  return (
    <Router>
      <div style={{ fontFamily: 'Arial, sans-serif', backgroundColor: '#0d0813' }}>
        <Navbar />
        <Routes>
  <Route path="/" element={<Home />} />
  <Route path="/feed" element={<Feed />} />
  <Route path="/post/:userId/:postId" element={<PostDetail />} />
  <Route path="/contribute/:userId/:postId/:nodeId" element={<ContributePage />} />
  <Route path="/upload" element={<Upload />} />
  <Route path="/profile/:userId" element={<Profile />} />
  <Route path="/login" element={<Login />} />
  <Route path="/signup" element={<Signup />} />
  <Route path="/explore" element={<Explore />} />
</Routes>
      </div>
    </Router>
  );
};

export default App;