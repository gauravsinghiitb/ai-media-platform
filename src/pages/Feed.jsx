import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import LoadingSpinner from '../components/LoadingSpinner';
import Card from '../components/Card';
import Masonry from 'react-masonry-css';
import { motion } from 'framer-motion';
import { LazyImage } from '../components/LazyLoad';

const Feed = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  // Check authentication status
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
      } else {
        navigate('/login'); // Redirect to login if not authenticated
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  // Fetch all posts from all users
  useEffect(() => {
    const fetchPosts = async () => {
      if (!currentUser) return; // Wait for authentication check

      try {
        setLoading(true);
        setError(null);

        const usersSnapshot = await getDocs(collection(db, 'users'));
        const allPosts = [];

        usersSnapshot.forEach((userDoc) => {
          const userData = userDoc.data();
          const userId = userDoc.id;
          const userPosts = (userData.posts || [])
            .filter(post => post && post.aiGeneratedUrl) // Ensure post has required data
            .map(post => ({
              ...post,
              userId,
              username: userData.username || 'Anonymous'
            }));
          allPosts.push(...userPosts);
        });

        // Sort posts by creation date (newest first)
        allPosts.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setPosts(allPosts);
      } catch (err) {
        console.error('Failed to fetch posts:', err.message);
        setError('Failed to load posts. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [currentUser]);

  // Masonry layout breakpoints
  const breakpointColumnsObj = {
    default: 6,
    1800: 5,
    1600: 6,
    1400: 5,
    1200: 4,
    1000: 3,
    800: 2,
    600: 1
  };

  // Animation variants for cards
  const cardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.2,
        duration: 0.8,
        ease: 'easeOut'
      }
    })
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div style={{ color: '#e6e6fa', textAlign: 'center', padding: '24px' }}>{error}</div>;

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0d0813',
      padding: '24px'
    }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        <h1 style={{
          fontSize: '28px',
          fontWeight: '700',
          color: '#b19cd9',
          textShadow: '0 0 5px #6a0dad',
          marginBottom: '24px',
          textAlign: 'center'
        }}>
          Feed
        </h1>
        {posts.length === 0 ? (
          <p style={{ color: '#e6e6fa', textAlign: 'center', fontSize: '18px' }}>
            No posts available. Start creating!
          </p>
        ) : (
          <Masonry
            breakpointCols={breakpointColumnsObj}
            className="masonry-grid"
            columnClassName="masonry-grid-column"
          >
            {posts.map((post, index) => (
              <motion.div
                key={`${post.userId}-${post.createdAt || index}`}
                custom={index}
                initial="hidden"
                animate="visible"
                variants={cardVariants}
                style={{ marginBottom: '16px' }}
              >
                <Card post={post} userId={post.userId} />
              </motion.div>
            ))}
          </Masonry>
        )}
      </div>
      <style>{`
        .masonry-grid {
          display: flex;
          width: auto;
        }
        .masonry-grid-column {
          background-clip: padding-box;
        }
        .masonry-grid-column > div {
          margin-bottom: 16px;
        }
      `}</style>
    </div>
  );
};

export default Feed;