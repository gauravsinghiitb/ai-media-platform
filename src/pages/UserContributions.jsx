import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db, auth } from '../firebase/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import ContributionCard from '../components/ContributionCard';
import ContributionDetail from '../components/ContributionDetail';
import { FaLightbulb, FaUser, FaArrowLeft, FaStar } from 'react-icons/fa';

const UserContributions = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [contributions, setContributions] = useState([]);
  const [postsMap, setPostsMap] = useState({});
  const [showLinksPopup, setShowLinksPopup] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [selectedContribution, setSelectedContribution] = useState(null);

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
          console.error('UserContributions - Error fetching user posts:', postsError);
          setError('Failed to load user posts. Please try again later.');
        }

        const postsMapData = {};
        userPosts.forEach(post => {
          postsMapData[post.id] = post;
        });

        let allContributions = [];
        try {
          const postIds = userPosts.map(post => post.id);
          if (postIds.length > 0) {
            for (const postId of postIds.slice(0, 10)) {
              const contributionsRef = collection(db, 'contributions', userId, postId);
              const contributionsSnapshot = await getDocs(contributionsRef);
              contributionsSnapshot.forEach(doc => {
                const contributionData = doc.data();
                if (Array.isArray(contributionData.nodes)) {
                  const userContributions = contributionData.nodes
                    .filter(node => node.userId === userId)
                    .map(node => {
                      const parentNode = node.parentId
                        ? contributionData.nodes.find(n => n.id === node.parentId) || null
                        : null;
                      return {
                        ...node,
                        postId,
                        username: data.username?.username,
                        profilePic: data.profilePic,
                        comments: node.comments || [],
                        likesCount: node.upvotesCount || 0,
                        hasLiked: node.userUpvotes?.includes(userId) || false,
                        parentNode,
                      };
                    });
                  allContributions = [...allContributions, ...userContributions];
                }
              });
            }
          }
        } catch (contribError) {
          console.error('UserContributions - Error fetching contributions:', contribError);
          setError('Failed to load contributions');
        }

        setUserData(initialUserData);
        setContributions(allContributions);
        setPostsMap(postsMapData);
      } catch (err) {
        console.error('UserContributions - Error fetching user data:', err);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
    return () => unsubscribe();
  }, [userId]);

  const handleCardClick = (contribution) => {
    setSelectedContribution(contribution);
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
        <p style={{ fontSize: '18px', color: '#FFF' }}>Loading contributions...</p>
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
            <FaLightbulb size={16} />
            <span>{contributions.length} Contributions</span>
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
            {contributions.length}
          </div>
          <div style={{ fontSize: '12px', color: '#CCCCCC', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Contributions
          </div>
        </motion.div>
      </motion.div>

      {/* Contributions Grid */}
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
        {contributions.length > 0 ? (
          contributions.map((contribution, index) => (
            <motion.div
              key={`contribution-${contribution.id}-${index}`}
              style={{ 
                breakInside: 'avoid', 
                marginBottom: '20px', 
                cursor: 'pointer',
                borderRadius: '12px',
                overflow: 'hidden',
                background: '#1a1a1a',
                border: '1px solid #333333',
                transition: 'all 0.3s ease',
                position: 'relative'
              }}
              whileHover={{ 
                scale: 1.02, 
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                borderColor: '#666666'
              }}
              onClick={() => handleCardClick(contribution)}
            >
              {/* Contribution Badge */}
              <motion.div
                style={{
                  position: 'absolute',
                  top: '10px',
                  left: '10px',
                  background: 'rgba(0, 0, 0, 0.8)',
                  color: '#FFF',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                  zIndex: 10,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <FaStar size={12} />
                Contribution
              </motion.div>

              <ContributionCard
                contribution={contribution}
                post={postsMap[contribution.postId]}
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
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>💡</div>
            <h3 style={{ fontSize: '20px', marginBottom: '10px', color: '#FFFFFF' }}>No Contributions Yet</h3>
            <p style={{ fontSize: '14px', color: '#999999' }}>
              This user hasn't made any contributions yet. Check back later!
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/explore')}
              style={{
                marginTop: '20px',
                padding: '12px 24px',
                background: '#FFF',
                color: '#000',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              Explore Posts
            </motion.button>
          </motion.div>
        )}
      </motion.div>

      {selectedContribution && (
        <ContributionDetail
          contribution={selectedContribution}
          post={postsMap[selectedContribution.postId]}
          onClose={() => setSelectedContribution(null)}
          userId={userId}
        />
      )}
    </div>
  );
};

export default UserContributions;