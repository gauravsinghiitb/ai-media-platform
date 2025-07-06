import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebase/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import Card from '../components/Card';

const UserSavedPosts = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
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
          savedPosts: [],
          uid: userId,
          username: data.username?.username || 'Unknown User',
          profilePic: data.profilePic || 'https://via.placeholder.com/50',
        };

        let savedPosts = [];
        if (currentUser && currentUser.uid === userId) {
          const savedPostsCollection = collection(db, 'posts', 'usersavedpost', userId);
          const savedPostsSnapshot = await getDocs(savedPostsCollection);
          savedPosts = savedPostsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            userId: doc.data().originalUserId || userId,
          }));
        }

        setUserData({
          ...initialUserData,
          savedPosts,
        });
      } catch (err) {
        console.error('UserSavedPosts - Error fetching user data:', err);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
    return () => unsubscribe();
  }, [userId, currentUser]);

  const handleCardClick = (item) => {
    navigate(`/post/${item.userId}/${item.postId}`);
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

  if (!userData || !currentUser || currentUser.uid !== userId) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#000000', color: '#FFFFFF' }}>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ fontSize: '18px', fontWeight: '500' }}
        >
          Access denied or profile not found
        </motion.p>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#0a0a0a', minHeight: '100vh', color: '#FFFFFF', padding: '30px 15px', overflowX: 'hidden' }}>
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
            Saved Posts: {userData.savedPosts.length}
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
        {userData.savedPosts.length > 0 ? (
          userData.savedPosts.map((item, index) => (
            <motion.div
              key={`saved-${item.id}-${index}`}
              style={{ breakInside: 'avoid', marginBottom: '15px', cursor: 'pointer' }}
              whileHover={{ scale: 1.05, transition: { duration: 0.3 } }}
              onClick={() => handleCardClick(item)}
            >
              <Card
                post={item}
                userId={item.userId}
                style={{ height: 'auto', borderRadius: '8px', overflow: 'hidden' }}
              />
            </motion.div>
          ))
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ textAlign: 'center', fontSize: '18px', padding: '20px', color: '#a0a0a0' }}
          >
            No saved posts
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default UserSavedPosts;