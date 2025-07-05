import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaHeart, FaRegHeart, FaBookmark } from 'react-icons/fa';
import { db } from '../firebase/firebase';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { auth } from '../firebase/firebase';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';

const Card = ({ item, userId, aspectRatio = "1:1" }) => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [mediaError, setMediaError] = useState(false);
  const [likes, setLikes] = useState((item?.likedBy || []).length);
  const [user, setUser] = useState(null);

  // Robust isVideo check
  const isVideo = item && item.aiGeneratedUrl && (() => {
    const extension = item.aiGeneratedUrl.split('.').pop().split('?')[0].toLowerCase();
    const videoExtensions = ['mp4', 'webm', 'ogg'];
    const result = videoExtensions.includes(extension);
    console.log(`Card - Checking if URL is video: ${item.aiGeneratedUrl}, Extension: ${extension}, IsVideo: ${result}`);
    return result;
  })();

  // Check user authentication, like, and save status
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser && item) {
        // Check like status
        const likedBy = item.likedBy || [];
        if (likedBy.includes(currentUser.uid)) {
          setIsLiked(true);
        }
        // Check save status
        try {
          const savedPostDocRef = doc(db, 'posts', 'usersavedpost', currentUser.uid, item.id);
          const savedPostDoc = await getDoc(savedPostDocRef);
          if (savedPostDoc.exists()) {
            setIsSaved(true);
          }
        } catch (err) {
          console.error('Card - Error checking saved status:', err);
        }
      }
    });

    return () => unsubscribe();
  }, [item?.likedBy, item?.id]);

  // Log video URL and check accessibility
  useEffect(() => {
    if (!item || !item.aiGeneratedUrl) {
      console.log('Card - Item or aiGeneratedUrl is missing:', { item });
      setMediaError(true);
    } else if (item.aiGeneratedUrl.startsWith('gs://')) {
      console.error('Card - Invalid URL format: aiGeneratedUrl should be an HTTP URL, not a gs:// URI:', item.aiGeneratedUrl);
      setMediaError(true);
    } else if (isVideo) {
      console.log('Card - Video URL:', item.aiGeneratedUrl);
      fetch(item.aiGeneratedUrl, { method: 'HEAD' })
        .then(response => {
          if (response.ok) {
            console.log('Card - Video URL is accessible:', item.aiGeneratedUrl);
          } else {
            console.error('Card - Video URL is not accessible:', response.status, response.statusText);
            setMediaError(true);
          }
        })
        .catch(err => {
          console.error('Card - Error checking video URL accessibility:', err);
          setMediaError(true);
        });
    } else {
      console.log('Card - Not a video, treating as image:', item.aiGeneratedUrl);
    }
  }, [item?.aiGeneratedUrl, isVideo]);

  const handleClick = () => {
    navigate(`/post/${userId}/${item?.id}`);
  };

  const handleLike = async (e) => {
    e.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const postDocRef = doc(db, 'posts', item.id);
      let updatedLikedBy = item.likedBy || [];
      if (isLiked) {
        updatedLikedBy = updatedLikedBy.filter(uid => uid !== user.uid);
      } else {
        if (!updatedLikedBy.includes(user.uid)) {
          updatedLikedBy.push(user.uid);
        }
      }

      await updateDoc(postDocRef, { likedBy: updatedLikedBy });
      setLikes(updatedLikedBy.length);
      setIsLiked(!isLiked);
      console.log('Card - Like updated successfully, likedBy:', updatedLikedBy);
    } catch (err) {
      console.error('Card - Error updating likes:', err);
    }
  };

  const handleSave = async (e) => {
    e.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const savedPostDocRef = doc(db, 'posts', 'usersavedpost', user.uid, item.id);
      if (isSaved) {
        await setDoc(savedPostDocRef, {}, { merge: false });
        setIsSaved(false);
        console.log('Card - Post unsaved successfully');
      } else {
        const postToSave = {
          postId: item.id,
          originalUserId: userId,
          aiGeneratedUrl: item.aiGeneratedUrl,
          caption: item.caption,
          modelUsed: item.modelUsed,
          username: item.username,
          createdAt: item.createdAt,
        };
        await setDoc(savedPostDocRef, postToSave);
        setIsSaved(true);
        console.log('Card - Post saved successfully:', postToSave);
      }
    } catch (err) {
      console.error('Card - Error saving post:', err);
    }
  };

  // Calculate dimensions based on aspect ratio
  const aspectRatios = {
    "9:16": 9 / 16,
    "1:1": 1,
    "4:3": 4 / 3,
    "3:4": 3 / 4,
    "16:9": 16 / 9
  };

  const baseWidth = 250;
  const ratio = aspectRatios[aspectRatio] || aspectRatios["1:1"];
  const height = baseWidth / ratio;

  if (!item || !item.aiGeneratedUrl) {
    return (
      <div style={{
        width: `${baseWidth}px`,
        height: `${height}px`,
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#000000',
        color: '#FFFFFF',
        fontSize: '14px'
      }}>
        Post unavailable
      </div>
    );
  }

  return (
    <motion.div
      style={{
        position: 'relative',
        width: `${baseWidth}px`,
        height: `${height}px`,
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 0 10px rgba(255, 255, 255, 0.1)',
        cursor: 'pointer',
        backgroundColor: '#000000'
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      {mediaError ? (
        <div style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#000000',
          color: '#FFFFFF',
          fontSize: '14px',
          gap: '10px'
        }}>
          <span>Failed to load</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMediaError(false);
            }}
            style={{
              backgroundColor: '#FFFFFF',
              color: '#000000',
              padding: '5px 10px',
              borderRadius: '5px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Retry
          </button>
        </div>
      ) : isVideo ? (
        <video
          autoPlay
          loop
          muted
          playsInline
          crossOrigin="anonymous"
          preload="auto"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={(e) => {
            console.error('Card - Video error:', e.nativeEvent);
            console.error('Card - Error details:', e.nativeEvent.message, e.nativeEvent.code);
            setMediaError(true);
          }}
        >
          <source src={item.aiGeneratedUrl} type={`video/${item.aiGeneratedUrl.split('.').pop().split('?')[0]}`} />
          Your browser does not support the video tag.
        </video>
      ) : (
        <img
          src={item.aiGeneratedUrl}
          alt="Post"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={(e) => {
            console.error('Card - Image error:', e.nativeEvent);
            setMediaError(true);
          }}
        />
      )}

      {isHovered && !mediaError && (
        <motion.div
          style={{
            position: 'absolute',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '8px',
            transition: 'opacity 0.2s ease',
            opacity: '1'
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div style={{ 
            display: 'flex', 
            justifyContent: 'flex-end', 
            alignItems: 'center' 
          }}>
            <motion.button
              onClick={handleSave}
              style={{ 
                color: '#FFFFFF',
                fontSize: '18px', 
                background: 'none', 
                border: 'none',
                cursor: 'pointer'
              }}
              whileHover={{ scale: 1.2 }}
            >
              <FaBookmark />
            </motion.button>
          </div>

          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '4px' 
          }}>
            <p style={{ 
              color: '#FFFFFF',
              fontSize: '14px',
              height: '0px',
              fontWeight: '600' 
            }}>
              {item.modelUsed || 'Unknown'}
            </p>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <p style={{ 
                color: '#FFFFFF',
                fontSize: '12px',
                height: '5px'
              }}>
                @{item.username || 'user'}
              </p>
              <motion.button
                onClick={handleLike}
                style={{ 
                  color: '#FFFFFF',
                  fontSize: '14px', 
                  background: 'none', 
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
                whileHover={{ scale: 1.2 }}
              >
                {isLiked ? <FaHeart /> : <FaRegHeart />} {likes}
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default Card;