import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FaHeart, FaRegHeart, FaBookmark } from 'react-icons/fa';
import { db } from '../firebase/firebase';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { auth } from '../firebase/firebase';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';

const Card = ({ post, userId, onClick }) => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [mediaError, setMediaError] = useState(false);
  const [likes, setLikes] = useState((post?.likedBy || []).length);
  const [user, setUser] = useState(null);
  const [aspectRatio, setAspectRatio] = useState(1); // Default to 1:1 until media loads
  const mediaRef = useRef(null);

  // Robust isVideo check
  const isVideo = post && post.aiGeneratedUrl && (() => {
    const extension = post.aiGeneratedUrl.split('.').pop().split('?')[0].toLowerCase();
    const videoExtensions = ['mp4', 'webm', 'ogg'];
    const result = videoExtensions.includes(extension);
    console.log(`Card - Checking if URL is video: ${post.aiGeneratedUrl}, Extension: ${extension}, IsVideo: ${result}`);
    return result;
  })();

  // Check user authentication, like, and save status
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser && post) {
        // Check like status
        const likedBy = post.likedBy || [];
        if (likedBy.includes(currentUser.uid)) {
          setIsLiked(true);
        }
        // Check save status
        try {
          const savedPostDocRef = doc(db, 'posts', 'usersavedpost', currentUser.uid, post.id);
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
  }, [post?.likedBy, post?.id]);

  // Log video URL and check accessibility, determine aspect ratio
  useEffect(() => {
    const img = new Image();
    img.src = post?.aiGeneratedUrl;

    const handleLoad = () => {
      const width = img.width;
      const height = img.height;
      const ratio = width / height;
      setAspectRatio(ratio);
      console.log(`Card - Loaded media dimensions: ${width}x${height}, Aspect Ratio: ${ratio}`);
    };

    const handleError = () => {
      console.error('Card - Error loading media dimensions:', post.aiGeneratedUrl);
      setMediaError(true);
    };

    img.addEventListener('load', handleLoad);
    img.addEventListener('error', handleError);

    return () => {
      img.removeEventListener('load', handleLoad);
      img.removeEventListener('error', handleError);
    };
  }, [post?.aiGeneratedUrl]);

  const handleClick = (e) => {
    e.stopPropagation();
    if (onClick) onClick();
  };

  const handleLike = async (e) => {
    e.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const postDocRef = doc(db, 'posts', post.id);
      let updatedLikedBy = post.likedBy || [];
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
      const savedPostDocRef = doc(db, 'posts', 'usersavedpost', user.uid, post.id);
      if (isSaved) {
        await setDoc(savedPostDocRef, {}, { merge: false });
        setIsSaved(false);
        console.log('Card - Post unsaved successfully');
      } else {
        const postToSave = {
          postId: post.id,
          originalUserId: userId,
          aiGeneratedUrl: post.aiGeneratedUrl,
          caption: post.caption,
          modelUsed: post.modelUsed,
          username: post.username,
          createdAt: post.createdAt,
        };
        await setDoc(savedPostDocRef, postToSave);
        setIsSaved(true);
        console.log('Card - Post saved successfully:', postToSave);
      }
    } catch (err) {
      console.error('Card - Error saving post:', err);
    }
  };

  const baseWidth = 250; // Match UserContributions card width
  const height = baseWidth / aspectRatio;

  if (!post || !post.aiGeneratedUrl) {
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
        backgroundColor: '#000000',
        breakInside: 'avoid' // Prevent column breaks within the card
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
          ref={mediaRef}
          autoPlay
          loop
          muted
          playsInline
          crossOrigin="anonymous"
          preload="auto"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onLoadedMetadata={(e) => {
            const video = e.target;
            const ratio = video.videoWidth / video.videoHeight;
            setAspectRatio(ratio);
            console.log(`Card - Video loaded, Aspect Ratio: ${ratio}`);
          }}
          onError={(e) => {
            console.error('Card - Video error:', e.nativeEvent);
            console.error('Card - Error details:', e.nativeEvent.message, e.nativeEvent.code);
            setMediaError(true);
          }}
        >
          <source src={post.aiGeneratedUrl} type={`video/${post.aiGeneratedUrl.split('.').pop().split('?')[0]}`} />
          Your browser does not support the video tag.
        </video>
      ) : (
        <img
          ref={mediaRef}
          src={post.aiGeneratedUrl}
          alt="Post"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onLoad={(e) => {
            const img = e.target;
            const ratio = img.naturalWidth / img.naturalHeight;
            setAspectRatio(ratio);
            console.log(`Card - Image loaded, Aspect Ratio: ${ratio}`);
          }}
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
              {post.modelUsed || 'Unknown'}
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
                @{post.username || 'user'}
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