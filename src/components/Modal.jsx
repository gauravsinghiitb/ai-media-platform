import React from 'react';

const Modal = ({ onClose, children }) => {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          padding: '20px',
          borderRadius: '8px',
          maxWidth: '500px',
          width: '90%',
          maxHeight: '80vh',
          overflowY: 'auto',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: 'none',
            border: 'none',
            fontSize: '16px',
            cursor: 'pointer',
          }}
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  );
};

export default Modal;