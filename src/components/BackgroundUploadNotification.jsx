import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUpload, FaCheck, FaTimes, FaInfoCircle } from 'react-icons/fa';

const BackgroundUploadNotification = ({ 
  isVisible, 
  onClose, 
  message = '', 
  type = 'info', // 'info', 'success', 'error'
  autoHide = true,
  duration = 5000 
}) => {
  const [isShown, setIsShown] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsShown(true);
      if (autoHide) {
        const timer = setTimeout(() => {
          setIsShown(false);
          setTimeout(onClose, 300); // Wait for exit animation
        }, duration);
        return () => clearTimeout(timer);
      }
    }
  }, [isVisible, autoHide, duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <FaCheck size={16} color="#00FF00" />;
      case 'error':
        return <FaTimes size={16} color="#FF4040" />;
      case 'info':
      default:
        return <FaInfoCircle size={16} color="#FFFFFF" />;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return '#1a3a1a';
      case 'error':
        return '#3a1a1a';
      case 'info':
      default:
        return '#1a1a1a';
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case 'success':
        return '#00FF00';
      case 'error':
        return '#FF4040';
      case 'info':
      default:
        return '#333333';
    }
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      {isShown && (
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.9 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            backgroundColor: getBackgroundColor(),
            border: `1px solid ${getBorderColor()}`,
            borderRadius: '12px',
            padding: '16px 20px',
            minWidth: '300px',
            maxWidth: '400px',
            zIndex: 1000,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flex: 1
            }}>
              {getIcon()}
              <span style={{
                color: '#FFFFFF',
                fontSize: '14px',
                fontWeight: '500',
                lineHeight: '1.4'
              }}>
                {message}
              </span>
            </div>
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

export default BackgroundUploadNotification; 