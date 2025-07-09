import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import Masonry from 'react-masonry-css';
import Card from '../components/Card';
import LoadingSpinner from '../components/LoadingSpinner';

const Home = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
    });

    const fetchPosts = async () => {
      try {
        const postsSnapshot = await getDocs(collection(db, 'posts'));
        const allPosts = [];
        postsSnapshot.forEach((postDoc) => {
          const postData = postDoc.data();
          if (postData.aiGeneratedUrl) {
            allPosts.push({
              id: postDoc.id,
              userId: postData.userId || postDoc.id,
              ...postData,
              type: 'post',
              createdAt: postData.createdAt || new Date().toISOString(),
              modelUsed: postData.modelUsed || 'Unknown',
              username: postData.username || 'Unknown',
              likedBy: postData.likedBy || [],
              caption: postData.caption || 'No caption'
            });
          }
        });
        setPosts(allPosts);
      } catch (err) {
        console.error('Failed to fetch posts:', err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();

    return () => unsubscribe();
  }, []);

  const handleCardClick = (userId, postId) => {
    if (isAuthenticated) {
      navigate(`/post/${userId}/${postId}`);
    } else {
      navigate('/login');
    }
  };

  const breakpointColumnsObj = {
    default: 5,
    1100: 2,
    700: 1
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#000000', padding: '2rem 1rem 2rem 250px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        style={{ width: '100%', maxWidth: '80rem' }}
      >
        <motion.h2
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          style={{
            fontSize: '2rem',
            fontWeight: '800',
            marginBottom: '1.5rem',
            textAlign: 'center',
            color: '#FFFFFF',
            padding: '5px',
            borderRadius: '8px'
          }}
        >
          All Posts
        </motion.h2>
        <Masonry
          breakpointCols={breakpointColumnsObj}
          className="my-masonry-grid"
          columnClassName="my-masonry-grid_column"
          style={{ margin: '0 auto', width: '100%', height: 'auto', display: 'flex', flexDirection: 'row', justifyContent: 'center' }}
          direction="rtl" // Horizontal flow from right to left
        >
          {posts.map((post) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              style={{ marginRight: '20px', marginBottom: '0' }} // Horizontal spacing
            >
              <Card
                post={post}
                userId={post.userId}
                aspectRatio="1:1" // Default aspect ratio, can be adjusted per post if needed
                onClick={() => handleCardClick(post.userId, post.id)}
              />
            </motion.div>
          ))}
        </Masonry>
      </motion.section>
    </div>
  );
};

export default Home;