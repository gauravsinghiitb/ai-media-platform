import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FaShareAlt, FaArrowCircleDown, FaMapMarkerAlt } from 'react-icons/fa';
import { auth, db } from '../firebase/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { LazyImage, LazyVideo } from './LazyLoad';

const ContributionCard = ({ contribution, userId, postId, onClick, postMedia, onLocateInTimeline }) => {
  const navigate = useNavigate();
  const mediaUrl = contribution.imageUrl || postMedia || 'https://dummyimage.com/400x400/000/fff?text=Media+Unavailable';
  console.log(`ContributionCard - contributionId: ${contribution.id}, imageUrl: ${contribution.imageUrl}, postMedia: ${postMedia}, final mediaUrl: ${mediaUrl}`);
  const [mediaLoaded, setMediaLoaded] = useState(false);
  const mediaRef = useRef(null);

  useEffect(() => {
    if (mediaRef.current) {
      const handleLoad = () => setMediaLoaded(true);
      const mediaElement = mediaRef.current;

      if (mediaElement.complete) {
        setMediaLoaded(true);
      } else {
        mediaElement.addEventListener('loadeddata', handleLoad); // For video
        mediaElement.addEventListener('load', handleLoad); // For image
      }

      return () => {
        mediaElement.removeEventListener('loadeddata', handleLoad);
        mediaElement.removeEventListener('load', handleLoad);
      };
    }
  }, [mediaUrl]);

  const handleShare = async () => {
    if (userId && postId && contribution.id) {
      const url = `${window.location.origin}/contribute/${userId}/${postId}?nodeId=${contribution.id}`;
      try {
        await navigator.clipboard.writeText(url);
        alert('Link copied to clipboard!');
      } catch (error) {
        console.error('Failed to copy URL:', error);
        alert('Failed to copy link. Please copy this URL manually: ' + url);
      }
    } else {
      alert('Cannot share: Missing parameters.');
    }
  };

  const handleDownload = (url, filename) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUsernameClick = (e) => {
    e.stopPropagation(); // Prevent card click from firing
    if (userId) {
      navigate(`/profile/${userId}`);
    }
  };

  const handleCardClick = (e) => {
    if (onClick) {
      onClick();
    } else if (userId && postId && contribution.id) {
      navigate(`/contribute/${userId}/${postId}?nodeId=${contribution.id}`);
    }
  };

  return (
    <motion.div
      style={{
        backgroundColor: '#1C1C1C',
        borderRadius: '10px',
        overflow: 'hidden',
        cursor: 'pointer',
        position: 'relative',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleCardClick}
    >
      {/* Media */}
      <div style={{ position: 'relative', width: '100%' }}>
        {mediaUrl.includes('.mp4') || mediaUrl.includes('.webm') || mediaUrl.includes('.mov') ? (
          <LazyVideo
            src={mediaUrl}
            autoPlay={true}
            loop={true}
            muted={true}
            controls={true}
            style={{
              width: '100%',
              height: 'auto',
              objectFit: 'cover'
            }}
            onError={() => {
              console.error('Video playback error');
            }}
          />
        ) : (
          <LazyImage
            src={mediaUrl}
            alt="Contribution Media"
            style={{
              width: '100%',
              height: 'auto',
              objectFit: 'cover'
            }}
            onError={() => {
              console.error('Image loading error');
            }}
          />
        )}
      </div>

      {/* Hover Overlay */}
      <motion.div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.23)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '10px',
          opacity: 0,
        }}
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        {/* Top Section: Username and Model */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <motion.span
            style={{
              color: '#FFFFFF',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
            onClick={handleUsernameClick}
            whileHover={{ color: '#e0e0e0' }}
            whileTap={{ scale: 0.95 }}
          >
            @{contribution.username || 'user'}
          </motion.span>
          {contribution.model && contribution.model !== 'Unknown' && (
            <span style={{ color: '#CCCCCC', fontSize: '12px' }}>{contribution.model}</span>
          )}
        </div>

        {/* Bottom Section: Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <motion.div
              onClick={(e) => { e.stopPropagation(); handleShare(); }}
              style={{ cursor: 'pointer', color: '#FFFFFF' }}
              whileHover={{ scale: 1.3 }}
              whileTap={{ scale: 0.9 }}
            >
              <FaShareAlt size={18} style={{ fill: 'none', stroke: '#FFFFFF', strokeWidth: 30 }} />
            </motion.div>
            <motion.div
              onClick={(e) => { e.stopPropagation(); handleDownload(contribution.imageUrl || mediaUrl, `contribution-${contribution.id}`); }}
              style={{ cursor: 'pointer', color: '#FFFFFF' }}
              whileHover={{ scale: 1.3 }}
              whileTap={{ scale: 0.9 }}
            >
              <FaArrowCircleDown size={18} style={{ fill: 'none', stroke: '#FFFFFF', strokeWidth: 30 }} />
            </motion.div>
            {onLocateInTimeline && (
              <motion.div
                onClick={(e) => { 
                  e.stopPropagation(); 
                  if (userId && postId) {
                    navigate(`/contribute/${userId}/${postId}?nodeId=${contribution.id}`);
                  }
                }}
                style={{ cursor: 'pointer', color: '#FFFFFF' }}
                whileHover={{ scale: 1.3 }}
                whileTap={{ scale: 0.9 }}
                title="Go to Contribution Page"
              >
                <FaMapMarkerAlt size={18} style={{ fill: 'none', stroke: '#FFFFFF', strokeWidth: 30 }} />
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ContributionCard;