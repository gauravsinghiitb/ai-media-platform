import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase/firebase';
import { collection, getDocs, query, limit, where, orderBy } from 'firebase/firestore';
import Masonry from 'react-masonry-css';
import Card from './Card';

const RecommendedPosts = ({ currentPost, currentUserId }) => {
  const navigate = useNavigate();
  const [recommendedPosts, setRecommendedPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendedPosts = async () => {
      if (!currentPost) return;

      setLoading(true);
      try {
        const postsCollection = collection(db, 'posts');
        let allPosts = [];
        
        // Fetch posts by same model (priority 1)
        if (currentPost.modelUsed) {
          try {
            const modelQuery = query(
              postsCollection,
              where('modelUsed', '==', currentPost.modelUsed),
              limit(10)
            );
            const modelSnapshot = await getDocs(modelQuery);
            modelSnapshot.forEach(doc => {
              if (doc.id !== currentPost.id) {
                allPosts.push({ id: doc.id, ...doc.data(), score: 10 });
              }
            });
          } catch (err) {
            console.log('Model query failed:', err);
          }
        }

        // Fetch posts by same creator (priority 2)
        if (currentPost.userId) {
          try {
            const creatorQuery = query(
              postsCollection,
              where('userId', '==', currentPost.userId),
              limit(8)
            );
            const creatorSnapshot = await getDocs(creatorQuery);
            creatorSnapshot.forEach(doc => {
              if (doc.id !== currentPost.id && !allPosts.some(p => p.id === doc.id)) {
                allPosts.push({ id: doc.id, ...doc.data(), score: 8 });
              }
            });
          } catch (err) {
            console.log('Creator query failed:', err);
          }
        }

        // Fetch recent posts for diversity (priority 3)
        try {
          const recentQuery = query(
            postsCollection,
            orderBy('createdAt', 'desc'),
            limit(15)
          );
          const recentSnapshot = await getDocs(recentQuery);
          recentSnapshot.forEach(doc => {
            if (doc.id !== currentPost.id && !allPosts.some(p => p.id === doc.id)) {
              allPosts.push({ id: doc.id, ...doc.data(), score: 5 });
            }
          });
        } catch (err) {
          console.log('Recent query failed:', err);
        }

        // Sort by score and take top 18 for 6-column grid
        allPosts.sort((a, b) => b.score - a.score);
        setRecommendedPosts(allPosts.slice(0, 18));
      } catch (error) {
        console.error('Error fetching recommended posts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendedPosts();
  }, [currentPost?.id, currentPost?.modelUsed, currentPost?.userId]);

  const handlePostClick = (post) => {
    navigate(`/post/${post.userId}/${post.id}`);
  };

  if (loading) {
    return (
      <div style={{ 
        padding: '2rem', 
        textAlign: 'center', 
        color: '#FFFFFF',
        backgroundColor: '#000000'
      }}>
        <div style={{ 
          width: '40px', 
          height: '40px', 
          border: '3px solid #333', 
          borderTop: '3px solid #fff', 
          borderRadius: '50%', 
          animation: 'spin 1s linear infinite',
          margin: '0 auto'
        }}></div>
      </div>
    );
  }

  if (recommendedPosts.length === 0) {
    return null;
  }

  return (
    <div style={{
      backgroundColor: '#000000',
      color: '#FFFFFF',
      padding: '2rem 1rem',
      borderTop: '1px solid #333333'
    }}>
      <Masonry
        breakpointCols={{
          default: 6,
          1600: 5,
          1400: 4,
          1100: 3,
          800: 2,
          500: 1
        }}
        className="my-masonry-grid"
        columnClassName="my-masonry-grid_column"
        style={{
          display: 'flex',
          marginLeft: '-20px',
          width: 'calc(100% + 20px)'
        }}
      >
        {recommendedPosts.map((post, index) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: 0.5, 
              delay: index * 0.1,
              ease: "easeOut"
            }}
            style={{ 
              marginLeft: '20px',
              marginBottom: '20px',
              breakInside: 'avoid',
              position: 'relative'
            }}
            className="card-container"
          >
            <Card
              post={post}
              userId={post.userId}
              aspectRatio="auto"
              onClick={() => handlePostClick(post)}
            />
          </motion.div>
        ))}
      </Masonry>

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          .my-masonry-grid {
            display: flex;
            margin-left: -20px;
            width: calc(100% + 20px);
          }
          .my-masonry-grid_column {
            padding-left: 20px;
            background-clip: padding-box;
          }
          .my-masonry-grid_column > div {
            margin-bottom: 20px;
          }
        `}
      </style>
    </div>
  );
};

export default RecommendedPosts; 