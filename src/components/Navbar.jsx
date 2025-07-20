import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { auth, db } from '../firebase/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import {
  FaCompass,
  FaUpload,
  FaSignOutAlt,
  FaTh,
  FaUser,
  FaLightbulb,
  FaBookmark,
  FaChevronRight,
  FaChevronLeft,
  FaFilm,
  FaFire
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
    const confirmed = window.confirm('Are you sure you want to logout?');
    if (confirmed) {
      try {
        await signOut(auth);
        navigate('/login');
      } catch (err) {
        console.error('Logout failed:', err.message);
      }
    }
  };

  const navLinks = [
    { to: '/explore', icon: <FaCompass />, label: 'Explore' },
    { to: '/trending', icon: <FaFire />, label: 'Trending' },
    { to: '/upload', icon: <FaUpload />, label: 'Upload' },
    { to: '/video', icon: <FaFilm />, label: 'Reels' },
    { to: `/profile/${user?.uid}`, icon: profilePic ? <img src={profilePic} alt="Profile" style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }} /> : <FaUser />, label: 'Profile' },
  ];

  return (
    <>
      <style>
        {`
          nav {
            border-right: 2px solid #333333;
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            background-color: rgba(0, 0, 0, 0.95);
          }

          .nav-item {
            transition: all 0.3s ease;
            padding: 0 8px;
            position: relative;
          }

          .nav-item:hover {
            transform: scale(1.05);
            background-color: rgba(255, 255, 255, 0.1);
            border-radius: 8px;
          }

          .nav-item:hover .icon-wrapper {
            box-shadow: none;
            border: none;
            border-radius: 0;
            width: 24px;
            height: 24px;
          }

          .active-icon {
            font-size: 1.2rem;
            position: relative;
            color: #FFFFFF;
          }

          .active-icon::after {
            content: '';
            position: absolute;
            bottom: -4px;
            left: 50%;
            transform: translateX(-50%);
            width: 4px;
            height: 4px;
            background: #FFFFFF;
            border-radius: 50%;
          }

          .hover-text {
            position: absolute;
            right: -120px;
            top: 50%;
            transform: translateY(-50%);
            background-color: rgba(0, 0, 0, 0.9);
            color: #FFFFFF;
            padding: 8px 12px;
            border: 1px solid #333333;
            border-radius: 6px;
            font-size: 14px;
            white-space: nowrap;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s ease;
            z-index: 1001;
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
            gap: 12px;
            width: 100%;
            padding: 8px 12px;
          }

          .expanded .icon-wrapper + .hover-text {
            position: static;
            opacity: 1;
            padding: 0;
            background: none;
            border: none;
            margin-left: 12px;
            font-size: 14px;
            color: #FFFFFF;
          }
        `}
      </style>
      <motion.nav
        initial={{ x: -200 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.95)',
          padding: '8px 0',
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
          transition: 'width 0.3s ease',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', marginTop: '20px', width: '100%' }}>
          <Link to="/explore" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: isExpanded ? '8px' : 0 }}>
            <img src="/logo_white_new.png" alt="Logo" style={{ width: '24px', height: '24px' }} />
            {isExpanded && <span style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: '16px' }}>Kryoon</span>}
          </Link>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              color: '#FFFFFF',
              background: 'none',
              border: '1px solid #333333',
              borderRadius: '4px',
              cursor: 'pointer',
              padding: '6px 8px',
              fontSize: '14px',
              alignSelf: 'flex-start',
              marginLeft: '8px',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
              e.target.style.borderColor = '#FFFFFF';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.borderColor = '#333333';
            }}
          >
            {isExpanded ? <FaChevronLeft /> : <FaChevronRight />}
          </button>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: isExpanded ? 'flex-start' : 'center', gap: '12px', marginTop: '40px', flexGrow: 1, width: '100%', paddingLeft: isExpanded ? '0' : 0 }}>
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
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: isExpanded ? 'flex-start' : 'center',
                      padding: '8px',
                      textDecoration: 'none',
                      width: '100%',
                      borderRadius: '6px',
                    }}
                  >
                    <div className="icon-wrapper">
                      <span className={isActive ? 'active-icon' : ''} style={{ fontSize: '20px' }}>{icon}</span>
                    </div>
                    {isExpanded && <span style={{ fontSize: '14px', fontWeight: '500' }}>{label}</span>}
                    {!isExpanded && hoverText === label && <div className="hover-text">{hoverText}</div>}
                  </Link>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: isExpanded ? 'flex-start' : 'center', gap: '12px', marginTop: 'auto', marginBottom: '20px', width: '100%', paddingLeft: isExpanded ? '0' : 0 }}>
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
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: isExpanded ? 'flex-start' : 'center',
                      padding: '8px',
                      textDecoration: 'none',
                      width: '100%',
                      borderRadius: '6px',
                    }}
                  >
                    <div className="icon-wrapper">
                      <span className={isActive ? 'active-icon' : ''} style={{ fontSize: '20px' }}>{icon}</span>
                    </div>
                    {isExpanded && <span style={{ fontSize: '14px', fontWeight: '500' }}>{label}</span>}
                    {!isExpanded && hoverText === label && <div className="hover-text">{hoverText}</div>}
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
                  color: '#FFFFFF',
                  background: 'none',
                  padding: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: isExpanded ? 'flex-start' : 'center',
                  width: '100%',
                  borderRadius: '6px',
                }}
              >
                <div className="icon-wrapper">
                  <FaSignOutAlt style={{ fontSize: '20px' }} />
                </div>
                {isExpanded && <span style={{ fontSize: '14px', fontWeight: '500', marginLeft: '12px' }}>Logout</span>}
                {!isExpanded && hoverText === 'Logout' && <div className="hover-text">{hoverText}</div>}
              </button>
            </div>
          </div>
        </div>
      </motion.nav>
    </>
  );
};

export default Navbar;