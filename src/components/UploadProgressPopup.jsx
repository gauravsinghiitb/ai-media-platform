import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUpload, FaCheck, FaTimes } from 'react-icons/fa';

const UploadProgressPopup = ({ isVisible, onClose, uploadProgress = 0, estimatedTime = 0 }) => {
  const [progress, setProgress] = useState(0);
  const [timeLeft, setTimeLeft] = useState(estimatedTime);

  useEffect(() => {
    if (isVisible) {
      setProgress(uploadProgress);
      setTimeLeft(estimatedTime);
    }
  }, [isVisible, uploadProgress, estimatedTime]);

  useEffect(() => {
    if (isVisible && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isVisible, timeLeft]);

  const formatTime = (seconds) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        style={{
          position: 'fixed',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#1a1a1a',
          border: '1px solid #333333',
          borderRadius: '12px',
          padding: '16px 20px',
          minWidth: '300px',
          maxWidth: '400px',
          zIndex: 1000,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <FaUpload size={16} color="#FFFFFF" />
            <span style={{
              color: '#FFFFFF',
              fontSize: '14px',
              fontWeight: '600'
            }}>
              Uploading Post...
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#666666',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            <FaTimes size={14} />
          </button>
        </div>

        {/* Progress Bar */}
        <div style={{
          width: '100%',
          height: '4px',
          backgroundColor: '#333333',
          borderRadius: '2px',
          marginBottom: '8px',
          overflow: 'hidden'
        }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
            style={{
              height: '100%',
              backgroundColor: '#FFFFFF',
              borderRadius: '2px'
            }}
          />
        </div>

        {/* Progress Text */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '12px',
          color: '#CCCCCC'
        }}>
          <span>{progress}% Complete</span>
          <span>Est. {formatTime(timeLeft)} remaining</span>
        </div>

        {/* Status Message */}
        {progress === 100 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginTop: '8px',
              color: '#00FF00',
              fontSize: '12px'
            }}
          >
            <FaCheck size={12} />
            Upload completed successfully!
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default UploadProgressPopup; 