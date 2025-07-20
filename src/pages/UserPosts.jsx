import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db, auth } from '../firebase/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import Card from '../components/Card';
import { FaTh, FaUser, FaArrowLeft } from 'react-icons/fa';

const UserPosts = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && userData) {
        // No follow logic needed
      }
    });

    const fetchUserData = async () => {
      try {
        const userDocRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userDocRef);
        if (!userDoc.exists()) {
          throw new Error('User not found');
        }

        const data = userDoc.data();
        const initialUserData = {
          ...data,
          posts: [],
          uid: userId,
          username: data.username?.username || 'Unknown User',
          profilePic: data.profilePic || 'https://via.placeholder.com/50',
        };

        let userPosts = [];
        try {
          const postsQuery = query(collection(db, 'posts'), where('userId', '==', userId));
          const postsSnapshot = await getDocs(postsQuery);
          userPosts = postsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (postsError) {
          console.error('UserPosts - Error fetching user posts:', postsError);
          setError('Failed to load user posts. Please try again later.');
        }

        setUserData({
          ...initialUserData,
          posts: userPosts,
          postsCount: userPosts.length,
        });
      } catch (err) {
        console.error('UserPosts - Error fetching user data:', err);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
    return () => unsubscribe();
  }, [userId]);

  const handleCardClick = (item) => {
    navigate(`/post/${userId}/${item.id}`);
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh', 
        backgroundColor: '#000000', 
        color: '#FFFFFF',
        paddingLeft: '80px'
      }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          style={{
            width: '60px',
            height: '60px',
            border: '3px solid #333',
            borderTopColor: '#FFF',
            borderRadius: '50%',
            marginBottom: '20px'
          }}
        />
        <p style={{ fontSize: '18px', color: '#FFF' }}>Loading posts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh', 
        backgroundColor: '#000000', 
        color: '#FFFFFF',
        paddingLeft: '80px'
      }}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          style={{
            background: '#FFF',
            color: '#000',
            borderRadius: '50%',
            width: '80px',
            height: '80px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px',
            fontSize: '32px'
          }}
        >
          ⚠️
        </motion.div>
        <p style={{ fontSize: '18px', color: '#FFF', textAlign: 'center', maxWidth: '400px' }}>{error}</p>
      </div>
    );
  }

  if (!userData) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh', 
        backgroundColor: '#000000', 
        color: '#FFFFFF',
        paddingLeft: '80px'
      }}>
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          style={{ textAlign: 'center' }}
        >
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>👤</div>
          <h2 style={{ fontSize: '24px', marginBottom: '10px', color: '#FFFFFF' }}>Profile Not Found</h2>
          <p style={{ fontSize: '16px', color: '#CCC' }}>The user profile you're looking for doesn't exist.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{ 
      backgroundColor: '#000000', 
      minHeight: '100vh', 
      color: '#FFFFFF', 
      padding: '30px 20px', 
      overflowX: 'hidden',
      paddingLeft: '100px'
    }}>
      {/* Header Section */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          marginBottom: '30px',
          padding: '20px',
          background: 'linear-gradient(135deg, #1a1a1a 0%, #333333 100%)',
          borderRadius: '16px',
          border: '1px solid #333333',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
        }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate(-1)}
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid #333333',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFF',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          <FaArrowLeft />
        </motion.button>

        <motion.img
          src={userData.profilePic}
          alt="Profile"
          style={{ 
            width: '60px', 
            height: '60px', 
            borderRadius: '50%', 
            objectFit: 'cover',
            border: '3px solid #333333'
          }}
          whileHover={{ scale: 1.1 }}
        />
        
        <motion.div style={{ flex: 1 }}>
          <h2 style={{ 
            fontSize: '28px', 
            fontWeight: '700', 
            margin: '0 0 8px 0',
            background: 'linear-gradient(45deg, #FFFFFF, #CCCCCC)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            {userData.username}
          </h2>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0.7 }}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              fontSize: '16px', 
              color: '#CCCCCC' 
            }}
          >
            <FaTh size={16} />
            <span>{userData.postsCount} Posts</span>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          style={{
            padding: '12px 20px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            border: '1px solid #333333',
            textAlign: 'center'
          }}
        >
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#FFFFFF' }}>
            {userData.postsCount}
          </div>
          <div style={{ fontSize: '12px', color: '#CCCCCC', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Total Posts
          </div>
        </motion.div>
      </motion.div>

      {/* Posts Grid */}
      <motion.div
        style={{
          columnCount: 5,
          columnGap: '20px',
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '0 10px',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {userData.posts.length > 0 ? (
          userData.posts.map((item, index) => (
            <motion.div
              key={`post-${item.id}-${index}`}
              style={{ 
                breakInside: 'avoid', 
                marginBottom: '20px', 
                cursor: 'pointer',
                borderRadius: '12px',
                overflow: 'hidden',
                background: '#1a1a1a',
                border: '1px solid #333333',
                transition: 'all 0.3s ease'
              }}
              whileHover={{ 
                scale: 1.02, 
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                borderColor: '#666666'
              }}
              onClick={() => handleCardClick(item)}
            >
              <Card
                post={item}
                userId={userId}
                style={{ 
                  height: 'auto', 
                  borderRadius: '12px', 
                  overflow: 'hidden',
                  background: 'transparent'
                }}
              />
            </motion.div>
          ))
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ 
              textAlign: 'center', 
              fontSize: '18px', 
              padding: '60px 20px', 
              color: '#CCCCCC',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '16px',
              border: '1px solid #333333',
              margin: '40px auto',
              maxWidth: '400px'
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>📷</div>
            <h3 style={{ fontSize: '20px', marginBottom: '10px', color: '#FFFFFF' }}>No Posts Yet</h3>
            <p style={{ fontSize: '14px', color: '#999999' }}>
              This user hasn't shared any posts yet. Check back later!
            </p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default UserPosts;