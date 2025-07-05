import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase/firebase';
import { signOut } from 'firebase/auth';
import { IoSettingsSharp } from 'react-icons/io5';
import { FaUserEdit, FaTrashAlt, FaFileContract, FaSignOutAlt } from 'react-icons/fa';

const Settings = ({ onEditProfile, onClose }) => {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (err) {
      console.error('Settings - Error signing out:', err);
      alert('Failed to sign out');
    }
  };

  const buttonStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    width: '100%',
    padding: '12px 16px',
    backgroundColor: 'transparent',
    color: '#FFFFFF',
    border: 'none',
    textAlign: 'left',
    fontSize: '14px',
    cursor: 'pointer',
    borderBottom: '1px solid #333333',
  };

  return (
    <div
      style={{
        width: '100%',
        backgroundColor: '#1C1C1C',
        borderRadius: '10px',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '16px',
          borderBottom: '1px solid #333333',
        }}
      >
        <IoSettingsSharp size={22} color="#FFFFFF" />
        <h3 style={{ margin: 0, color: '#FFFFFF', fontSize: '18px' }}>Settings</h3>
      </div>

      {/* Menu Items */}
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        <li>
          <motion.button
            onClick={() => {
              onEditProfile();
              onClose();
            }}
            style={buttonStyle}
            whileHover={{ backgroundColor: '#2A2A2A' }}
          >
            <FaUserEdit size={16} /> Edit Profile
          </motion.button>
        </li>
        <li>
          <motion.button
            onClick={() => {
              navigate('/deleted-posts');
              onClose();
            }}
            style={buttonStyle}
            whileHover={{ backgroundColor: '#2A2A2A' }}
          >
            <FaTrashAlt size={16} /> Deleted Posts
          </motion.button>
        </li>
        <li>
          <motion.button
            onClick={() => {
              navigate('/terms-and-conditions');
              onClose();
            }}
            style={buttonStyle}
            whileHover={{ backgroundColor: '#2A2A2A' }}
          >
            <FaFileContract size={16} /> Terms and Conditions
          </motion.button>
        </li>
        <li>
          <motion.button
            onClick={() => {
              handleSignOut();
              onClose();
            }}
            style={{
              ...buttonStyle,
              borderBottom: 'none',
              color: '#FF5555',
            }}
            whileHover={{ backgroundColor: '#331111' }}
          >
            <FaSignOutAlt size={16} /> Log Out
          </motion.button>
        </li>
      </ul>
    </div>
  );
};

export default Settings;
