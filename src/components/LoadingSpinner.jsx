import React from 'react';

const LoadingSpinner = () => {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh', // Changed to full viewport height for better centering
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(13, 8, 19, 0.9)', // Added a semi-transparent background
      zIndex: 1000 // Ensure it appears above other content
    }}>
      <img
        src="/logo_white_new.png"
        alt="Kryoon Logo"
        style={{
          width: '48px',
          height: '48px',
          animation: 'spin 2s linear infinite'
        }}
        onError={(e) => {
          e.target.style.display = 'none'; // Hide the image if it fails to load
          e.target.nextSibling.style.display = 'block'; // Show fallback text
        }}
      />
      <div style={{
        display: 'none', // Hidden by default, shown if image fails
        color: '#e6e6fa',
        fontSize: '16px',
        fontWeight: '600'
      }}>
        Loading...
      </div>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default LoadingSpinner;