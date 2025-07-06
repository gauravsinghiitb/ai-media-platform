import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { auth } from '../firebase/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import {
  FaHome,
  FaCompass,
  FaUpload,
  FaUser,
  FaSignOutAlt,
  FaTh,
  FaLightbulb,
  FaBookmark,
  FaChevronRight,
  FaChevronLeft
} from 'react-icons/fa';
import { motion } from 'framer-motion';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(window.innerWidth >= 769);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    const handleResize = () => setIsMenuOpen(window.innerWidth >= 769);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (err) {
      console.error('Logout failed:', err.message);
    }
  };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const navVariants = {
    expanded: { width: '200px' },
    collapsed: { width: '80px' },
  };

  const navLinks = [
    { to: '/', icon: <FaHome />, label: 'Home' },
    { to: '/explore', icon: <FaCompass />, label: 'Explore' },
    { to: '/upload', icon: <FaUpload />, label: 'Upload' },
    { to: `/profile/${user?.uid}/posts`, icon: <FaTh />, label: 'Posts' },
    { to: `/profile/${user?.uid}/contributions`, icon: <FaLightbulb />, label: 'Contributions' },
    { to: `/profile/${user?.uid}/saved`, icon: <FaBookmark />, label: 'Saved Posts' },
    { to: `/profile/${user?.uid}`, icon: <FaUser />, label: 'Profile' },
  ];

  return (
    <>
      <style>
        {`
          @keyframes rotateBorder {
            0% { border-color: #00ffff; }
            50% { border-color: #ff00ff; }
            100% { border-color: #00ffff; }
          }

          nav {
            border-right: 3px solid transparent;
            animation: rotateBorder 2s linear infinite;
          }

          .nav-item {
            transition: all 0.3s ease;
            width: 100%;
          }

          .nav-item:hover {
            background: rgba(255, 255, 255, 0.07);
            transform: scale(1.03);
            border-radius: 8px;
          }

          .active-icon {
            font-size: 1.5rem;
            position: relative;
          }

          .active-icon::after {
            content: '';
            position: absolute;
            bottom: -4px;
            left: 0;
            width: 100%;
            height: 3px;
            background: linear-gradient(90deg, #00ffff, #ff00ff);
            animation: rotateBorder 1.5s infinite linear;
            border-radius: 2px;
          }
        `}
      </style>
      <motion.nav
        variants={navVariants}
        initial={isMenuOpen ? 'expanded' : 'collapsed'}
        animate={isMenuOpen ? 'expanded' : 'collapsed'}
        transition={{ duration: 0.3 }}
        style={{
          background: '#000000',
          padding: '16px 0',
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100vh',
          zIndex: 1000,
          overflow: 'hidden',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          borderTopRightRadius: '16px',
          borderBottomRightRadius: '16px',
        }}
      >
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img src="/logo_white_new.png" alt="Logo" style={{ width: '30px', height: '30px' }} />
            {isMenuOpen && <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '18px' }}>Kryoon</div>}
          </div>
          <button
            onClick={toggleMenu}
            style={{
              color: '#ffffff',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              marginTop: '1rem',
            }}
          >
            {isMenuOpen ? <FaChevronLeft size={20} /> : <FaChevronRight size={20} />}
          </button>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            paddingLeft: '16px',
            paddingRight: '16px',
            gap: '16px',
            marginTop: '32px',
            width: '100%',
          }}
        >
          {navLinks.map(({ to, icon, label }) => {
            const isActive = location.pathname === to;
            return (
              <div key={label} className="nav-item">
                <Link
                  to={to}
                  title={!isMenuOpen ? label : undefined}
                  style={{
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    padding: '8px',
                    textDecoration: 'none',
                    width: '100%',
                    fontWeight: 500,
                  }}
                >
                  <span className={isActive ? 'active-icon' : ''} style={{ marginRight: isMenuOpen ? '8px' : 0 }}>{icon}</span>
                  {isMenuOpen && label}
                </Link>
              </div>
            );
          })}

          <div className="nav-item">
            <button
              onClick={handleLogout}
              title={!isMenuOpen ? 'Logout' : undefined}
              style={{
                color: '#ffffff',
                background: 'none',
                padding: '8px',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                width: '100%',
              }}
            >
              <FaSignOutAlt style={{ marginRight: isMenuOpen ? '8px' : 0 }} />
              {isMenuOpen && 'Logout'}
            </button>
          </div>
        </div>
      </motion.nav>
    </>
  );
};

export default Navbar;