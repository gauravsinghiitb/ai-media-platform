import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUpload, FaCheck, FaTimes, FaClock } from 'react-icons/fa';

const UploadStatusBar = ({ 
  isVisible, 
  onClose, 
  message = '', 
  status = 'uploading', // 'uploading', 'completed', 'error'
  progress = 0,
  uploadTime = 0
}) => {
  const [isShown, setIsShown] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);

  useEffect(() => {
    if (isVisible) {
      setIsShown(true);
    }
  }, [isVisible]);

  useEffect(() => {
    if (isVisible && status === 'uploading') {
      const timer = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isVisible, status]);

  const formatTime = (seconds) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getStatusColor = () => {
    switch (status) {
      case 'completed':
        return '#00FF00';
      case 'error':
        return '#FF4040';
      case 'uploading':
      default:
        return '#FFFFFF';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return <FaCheck size={16} color="#00FF00" />;
      case 'error':
        return <FaTimes size={16} color="#FF4040" />;
      case 'uploading':
      default:
        return <FaUpload size={16} color="#FFFFFF" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'completed':
        return 'Uploaded';
      case 'error':
        return 'Upload Failed';
      case 'uploading':
      default:
        return 'Uploading...';
    }
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      {isShown && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          style={{
            position: 'fixed',
            top: 0,
            left: '250px',
            right: 0,
            backgroundColor: '#1a1a1a',
            borderBottom: `2px solid ${getStatusColor()}`,
            padding: '12px 20px',
            zIndex: 1001,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.3)'
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            {getStatusIcon()}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '2px'
            }}>
              <span style={{
                color: getStatusColor(),
                fontSize: '14px',
                fontWeight: '600'
              }}>
                {getStatusText()}
              </span>
              {message && (
                <span style={{
                  color: '#CCCCCC',
                  fontSize: '12px'
                }}>
                  {message}
                </span>
              )}
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            {status === 'uploading' && (
              <>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#CCCCCC',
                  fontSize: '12px'
                }}>
                  <FaClock size={12} />
                  {formatTime(timeElapsed)}
                </div>
                <div style={{
                  width: '100px',
                  height: '4px',
                  backgroundColor: '#333333',
                  borderRadius: '2px',
                  overflow: 'hidden'
                }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                    style={{
                      height: '100%',
                      backgroundColor: getStatusColor(),
                      borderRadius: '2px'
                    }}
                  />
                </div>
              </>
            )}
            
            <button
              onClick={() => {
                setIsShown(false);
                setTimeout(onClose, 300);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#666666',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <FaTimes size={14} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UploadStatusBar; 