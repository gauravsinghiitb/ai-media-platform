import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { auth, db } from '../firebase/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import {
  FaHome,
  FaCompass,
  FaUpload,
  FaSignOutAlt,
  FaTh,
  FaUser,
  FaLightbulb,
  FaBookmark,
  FaChevronRight,
  FaChevronLeft,
  FaFilm
} from 'react-icons/fa';
import { motion } from 'framer-motion';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [profilePic, setProfilePic] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hoverText, setHoverText] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setProfilePic(userDoc.data().profilePic || null);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (err) {
      console.error('Logout failed:', err.message);
    }
  };

  const navLinks = [
    { to: '/', icon: <FaHome />, label: 'Home' },
    { to: '/explore', icon: <FaCompass />, label: 'Explore' },
    { to: '/upload', icon: <FaUpload />, label: 'Upload' },
    { to: `/profile/${user?.uid}/posts`, icon: <FaTh />, label: 'Posts' },
    { to: `/profile/${user?.uid}/contributions`, icon: <FaLightbulb />, label: 'Contributions' },
    { to: `/profile/${user?.uid}/saved`, icon: <FaBookmark />, label: 'Saved Posts' },
    { to: '/video', icon: <FaFilm />, label: 'Reels' },
    { to: `/profile/${user?.uid}`, icon: profilePic ? <img src={profilePic} alt="Profile" style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }} /> : <FaUser />, label: 'Profile' },
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
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            background-color: rgba(0, 0, 0, 0.8);
          }

          .nav-item {
            transition: all 0.3s ease;
            padding: 0 8px;
            position: relative;
          }

          .nav-item:hover {
            transform: scale(1.15);
          }

          .nav-item:hover .icon-wrapper {
            box-shadow: 0 0 15px rgba(128, 128, 128, 0.5);
            border: 1px solid #808080;
            border-radius: 50%;
            width: 30px;
            height: 30px;
          }

          .active-icon {
            font-size: 1.2rem;
            position: relative;
          }

          .active-icon::after {
            content: '';
            position: absolute;
            bottom: -4px;
            left: 50%;
            transform: translateX(-50%);
            width: 3px;
            height: 3px;
            background: #ffffff;
            border-radius: 50%;
          }

          .hover-text {
            position: absolute;
            right: -100px;
            top: 50%;
            transform: translateY(-50%);
            background-color: rgba(0, 0, 0, 0.9);
            color: #fff;
            padding: 6px 10px;
            border: 1px solid #808080;
            border-radius: 4px;
            font-size: 12px;
            white-space: nowrap;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.2s ease;
          }

          .nav-item:hover .hover-text {
            opacity: 1;
          }

          .icon-wrapper {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 24px;
            height: 24px;
          }

          .expanded {
            align-items: flex-start;
          }

          .expanded .nav-item {
            display: flex;
            align-items: center;
            gap: 8px;
            width: 100%;
          }

          .expanded .icon-wrapper + .hover-text {
            position: static;
            opacity: 1;
            padding: 0;
            background: none;
            border: none;
            margin-left: 8px;
          }
        `}
      </style>
      <motion.nav
        initial={{ x: -200 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: '4px 0',
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100vh',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          borderTopRightRadius: '0',
          borderBottomRightRadius: '0',
          width: isExpanded ? '200px' : '60px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', marginTop: '20px', width: '100%' }}>
          <Link to="/explore" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: isExpanded ? '8px' : 0 }}>
            <img src="/logo_white_new.png" alt="Logo" style={{ width: '20px', height: '20px' }} />
            {isExpanded && <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '16px' }}>Kryoon</span>}
          </Link>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              color: '#ffffff',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              fontSize: '1.2rem',
              alignSelf: 'flex-start',
              marginLeft: '8px',
            }}
          >
            {isExpanded ? <FaChevronLeft /> : <FaChevronRight />}
          </button>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: isExpanded ? 'flex-start' : 'center', gap: '12px', marginTop: '40px', flexGrow: 1, width: '100%', paddingLeft: isExpanded ? '8px' : 0 }}>
            {navLinks.slice(0, -2).map(({ to, icon, label }) => {
              const isActive = location.pathname === to;
              return (
                <div
                  key={to}
                  className={`nav-item ${isExpanded ? 'expanded' : ''}`}
                  onMouseEnter={() => !isExpanded && setHoverText(label)}
                  onMouseLeave={() => !isExpanded && setHoverText('')}
                >
                  <Link
                    to={to}
                    style={{
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: isExpanded ? 'flex-start' : 'center',
                      padding: '3px',
                      textDecoration: 'none',
                      width: '100%',
                    }}
                  >
                    <div className="icon-wrapper">
                      <span className={isActive ? 'active-icon' : ''} style={{ fontSize: '1.2rem' }}>{icon}</span>
                    </div>
                    {isExpanded && <span className="hover-text">{label}</span>}
                    {!isExpanded && <div className="hover-text">{hoverText}</div>}
                  </Link>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: isExpanded ? 'flex-start' : 'center', gap: '12px', marginTop: 'auto', width: '100%', paddingLeft: isExpanded ? '8px' : 0 }}>
            {navLinks.slice(-2).map(({ to, icon, label }) => {
              const isActive = location.pathname === to;
              return (
                <div
                  key={to}
                  className={`nav-item ${isExpanded ? 'expanded' : ''}`}
                  onMouseEnter={() => !isExpanded && setHoverText(label)}
                  onMouseLeave={() => !isExpanded && setHoverText('')}
                >
                  <Link
                    to={to}
                    style={{
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: isExpanded ? 'flex-start' : 'center',
                      padding: '3px',
                      textDecoration: 'none',
                      width: '100%',
                    }}
                  >
                    <div className="icon-wrapper">
                      <span className={isActive ? 'active-icon' : ''} style={{ fontSize: '1.2rem' }}>{icon}</span>
                    </div>
                    {isExpanded && <span className="hover-text">{label}</span>}
                    {!isExpanded && <div className="hover-text">{hoverText}</div>}
                  </Link>
                </div>
              );
            })}

            <div
              className={`nav-item ${isExpanded ? 'expanded' : ''}`}
              onMouseEnter={() => !isExpanded && setHoverText('Logout')}
              onMouseLeave={() => !isExpanded && setHoverText('')}
            >
              <button
                onClick={handleLogout}
                style={{
                  color: '#ffffff',
                  background: 'none',
                  padding: '3px',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: isExpanded ? 'flex-start' : 'center',
                  width: '100%',
                }}
              >
                <div className="icon-wrapper">
                  <FaSignOutAlt style={{ fontSize: '1.2rem' }} />
                </div>
                {isExpanded && <span className="hover-text">Logout</span>}
                {!isExpanded && <div className="hover-text">{hoverText}</div>}
              </button>
            </div>
          </div>
        </div>
      </motion.nav>
    </>
  );
};

export default Navbar;