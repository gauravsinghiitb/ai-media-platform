import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db, auth } from '../firebase/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import ContributionCard from '../components/ContributionCard';
import { FaLink } from 'react-icons/fa';

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

  const handleCardClick = (item) => {
    setSelectedContribution(item);
  };

  const closePopup = () => {
    setSelectedContribution(null);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#000000', color: '#FFFFFF' }}>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ fontSize: '18px', fontWeight: '500' }}
        >
          Loading...
        </motion.p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#000000', color: '#FFFFFF' }}>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ fontSize: '18px', fontWeight: '500' }}
        >
          {error}
        </motion.p>
      </div>
    );
  }

  if (!userData) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#000000', color: '#FFFFFF' }}>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ fontSize: '18px', fontWeight: '500' }}
        >
          Profile not found
        </motion.p>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#0a0a0a', minHeight: '100vh', color: '#FFFFFF', padding: '30px 15px', overflowX: 'hidden', position: 'relative' }}>
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        style={{
          display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px', padding: '10px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '10px',
        }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
      >
        <motion.img
          src={userData.profilePic}
          alt="Profile"
          style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover' }}
          whileHover={{ scale: 1.1 }}
        />
        <motion.div>
          <h2 style={{ fontSize: '24px', fontWeight: '700', margin: 0 }}>{userData.username}</h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0 }}
            style={{ fontSize: '16px', color: '#a0a0a0' }}
          >
            Contributions: {contributions.length}
          </motion.p>
        </motion.div>
      </motion.div>
      <motion.div
        style={{
          columnCount: 5,
          columnGap: '15px',
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '0 10px',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {contributions.length > 0 ? (
          contributions.map((item, index) => (
            <motion.div
              key={`contribution-${item.id}-${index}`}
              style={{ breakInside: 'avoid', marginBottom: '15px', cursor: 'pointer' }}
              whileHover={{ scale: 1.05, transition: { duration: 0.3 } }}
              onClick={() => handleCardClick(item)}
            >
              {postsMap[item.postId] ? (
                <ContributionCard
                  contribution={item}
                  postMedia={postsMap[item.postId]?.aiGeneratedUrl || 'https://dummyimage.com/400x400/000/fff?text=Media+Unavailable'}
                  userId={userId}
                  postId={item.postId}
                  style={{ height: 'auto', borderRadius: '8px', overflow: 'hidden' }}
                />
              ) : (
                <div
                  style={{
                    position: 'relative',
                    backgroundColor: '#1C1C1C',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#AAAAAA',
                    fontSize: '12px',
                    textAlign: 'center',
                    height: '200px',
                    borderRadius: '8px',
                  }}
                >
                  <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                    Post Unavailable
                  </span>
                </div>
              )}
            </motion.div>
          ))
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ textAlign: 'center', fontSize: '18px', padding: '20px', color: '#a0a0a0' }}
          >
            No contributions yet
          </motion.div>
        )}
      </motion.div>
      <AnimatePresence>
        {selectedContribution && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: '#1C1C1C', padding: '20px', borderRadius: '10px', border: '1px solid #FFFFFF', zIndex: 1000, maxHeight: '80vh', overflowY: 'auto', width: '90%', maxWidth: '500px',
            }}
          >
            <iframe
              src={`/ContributionDetail?userId=${userId}&postId=${selectedContribution.postId}&contributionId=${selectedContribution.id}`}
              style={{ width: '100%', height: '400px', border: 'none', borderRadius: '8px' }}
              title="Contribution Detail"
            />
            <motion.button
              onClick={closePopup}
              style={{ marginTop: '10px', padding: '8px 16px', background: '#FFFFFF', color: '#000000', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              Close
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserContributions;