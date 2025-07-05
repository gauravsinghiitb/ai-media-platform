import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../firebase/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

const Navbar = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
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

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav style={{
      backgroundColor: '#000000',
      padding: '16px',
      boxShadow: '0 0 10px #333',
      borderBottom: '1px solid #fff',
      position: 'sticky',
      top: 0,
      zIndex: 50
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        {/* Brand Logo and Name */}
        {/* Brand Logo and Name */}
          {/* Brand Logo and Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img src="/logo_white_new.png" alt="Nexlify Logo" style={{ width: '30px', height: '30px' }} />
          <div style={{
            fontSize: '24px',
            fontWeight: 'bold',
            letterSpacing: '1px',
            textShadow: '0 0 5px #333'
          }}>
            <Link to="/" style={{
              color: '#ffffff',
              textDecoration: 'none',
              '&:hover': {
                color: '#ffffff',
                textDecoration: 'none'
              }
            }}>
              Kryoon
            </Link>
          </div>
        </div>
        {/* Hamburger Menu for Mobile */}
        <div style={{ display: 'none', '@media (max-width: 768px)': { display: 'block' } }}>
          <button onClick={toggleMenu} style={{ color: '#ffffff', outline: 'none' }}>
            <svg style={{ width: '24px', height: '24px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d={isMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16m-7 6h7'}
              />
            </svg>
          </button>
        </div>

        {/* Links - Desktop */}
        <div style={{
          display: 'flex',
          gap: '24px',
          alignItems: 'center',
          '@media (max-width: 768px)': { display: 'none' }
        }}>
          <Link to="/" style={{
            color: '#ffffff',
            position: 'relative',
            transition: 'color 0.3s ease',
            textShadow: '0 0 3px #333'
          }}
          onMouseEnter={(e) => e.target.style.color = '#cccccc'}
          onMouseLeave={(e) => e.target.style.color = '#ffffff'}
          >
            Home
            <span style={{
              position: 'absolute',
              left: 0,
              bottom: 0,
              width: 0,
              height: '2px',
              backgroundColor: '#ffffff',
              transition: 'width 0.3s ease'
            }}
            onMouseEnter={(e) => e.target.style.width = '100%'}
            onMouseLeave={(e) => e.target.style.width = '0'}
            />
          </Link>
          <Link to="/feed" style={{
            color: '#ffffff',
            position: 'relative',
            transition: 'color 0.3s ease',
            textShadow: '0 0 3px #333'
          }}
          onMouseEnter={(e) => e.target.style.color = '#cccccc'}
          onMouseLeave={(e) => e.target.style.color = '#ffffff'}
          >
            Feed
            <span style={{
              position: 'absolute',
              left: 0,
              bottom: 0,
              width: 0,
              height: '2px',
              backgroundColor: '#ffffff',
              transition: 'width 0.3s ease'
            }}
            onMouseEnter={(e) => e.target.style.width = '100%'}
            onMouseLeave={(e) => e.target.style.width = '0'}
            />
          </Link>
          <Link to="/explore" style={{
            color: '#ffffff',
            position: 'relative',
            transition: 'color 0.3s ease',
            textShadow: '0 0 3px #333'
          }}
          onMouseEnter={(e) => e.target.style.color = '#cccccc'}
          onMouseLeave={(e) => e.target.style.color = '#ffffff'}
          >
            Explore
            <span style={{
              position: 'absolute',
              left: 0,
              bottom: 0,
              width: 0,
              height: '2px',
              backgroundColor: '#ffffff',
              transition: 'width 0.3s ease'
            }}
            onMouseEnter={(e) => e.target.style.width = '100%'}
            onMouseLeave={(e) => e.target.style.width = '0'}
            />
          </Link>
          <Link to="/upload" style={{
            color: '#ffffff',
            position: 'relative',
            transition: 'color 0.3s ease',
            textShadow: '0 0 3px #333'
          }}
          onMouseEnter={(e) => e.target.style.color = '#cccccc'}
          onMouseLeave={(e) => e.target.style.color = '#ffffff'}
          >
            Upload
            <span style={{
              position: 'absolute',
              left: 0,
              bottom: '0',
              width: 0,
              height: '2px',
              backgroundColor: '#ffffff',
              transition: 'width 0.3s ease'
            }}
            onMouseEnter={(e) => e.target.style.width = '100%'}
            onMouseLeave={(e) => e.target.style.width = '0'}
            />
          </Link>
          {user ? (
            <>
              <Link to={`/profile/${user.uid}`} style={{
                color: '#ffffff',
                position: 'relative',
                transition: 'color 0.3s ease',
                textShadow: '0 0 3px #333'
              }}
              onMouseEnter={(e) => e.target.style.color = '#cccccc'}
              onMouseLeave={(e) => e.target.style.color = '#ffffff'}
              >
                Profile
                <span style={{
                  position: 'absolute',
                  left: 0,
                  bottom: 0,
                  width: 0,
                  height: '2px',
                  backgroundColor: '#ffffff',
                  transition: 'width 0.3s ease'
                }}
                onMouseEnter={(e) => e.target.style.width = '100%'}
                onMouseLeave={(e) => e.target.style.width = '0'}
                />
              </Link>
              <button
                onClick={handleLogout}
                style={{
                  color: '#000000',
                  background: '#ffffff',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  transition: 'background 0.3s ease',
                  boxShadow: '0 0 5px #333'
                }}
                onMouseEnter={(e) => e.target.style.background = '#cccccc'}
                onMouseLeave={(e) => e.target.style.background = '#ffffff'}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" style={{
                color: '#ffffff',
                position: 'relative',
                transition: 'color 0.3s ease',
                textShadow: '0 0 3px #333'
              }}
              onMouseEnter={(e) => e.target.style.color = '#cccccc'}
              onMouseLeave={(e) => e.target.style.color = '#ffffff'}
              >
                Login
                <span style={{
                  position: 'absolute',
                  left: 0,
                  bottom: 0,
                  width: 0,
                  height: '2px',
                  backgroundColor: '#ffffff',
                  transition: 'width 0.3s ease'
                }}
                onMouseEnter={(e) => e.target.style.width = '100%'}
                onMouseLeave={(e) => e.target.style.width = '0'}
                />
              </Link>
              <Link to="/signup" style={{
                color: '#000000',
                background: '#ffffff',
                padding: '8px 16px',
                borderRadius: '8px',
                transition: 'background 0.3s ease',
                boxShadow: '0 0 5px #333'
              }}
              onMouseEnter={(e) => e.target.style.background = '#cccccc'}
              onMouseLeave={(e) => e.target.style.background = '#ffffff'}
              >
                Signup
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div style={{
          marginTop: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          backgroundColor: '#000000',
          padding: '16px',
          borderRadius: '8px',
          boxShadow: '0 0 10px #333',
          '@media (min-width: 769px)': { display: 'none' }
        }}>
          <Link
            to="/"
            onClick={toggleMenu}
            style={{ color: '#ffffff', transition: 'color 0.3s ease', textShadow: '0 0 3px #333' }}
            onMouseEnter={(e) => e.target.style.color = '#cccccc'}
            onMouseLeave={(e) => e.target.style.color = '#ffffff'}
          >
            Home
          </Link>
          <Link
            to="/feed"
            onClick={toggleMenu}
            style={{ color: '#ffffff', transition: 'color 0.3s ease', textShadow: '0 0 3px #333' }}
            onMouseEnter={(e) => e.target.style.color = '#cccccc'}
            onMouseLeave={(e) => e.target.style.color = '#ffffff'}
          >
            Feed
          </Link>
          <Link
            to="/explore"
            onClick={toggleMenu}
            style={{ color: '#ffffff', transition: 'color 0.3s ease', textShadow: '0 0 3px #333' }}
            onMouseEnter={(e) => e.target.style.color = '#cccccc'}
            onMouseLeave={(e) => e.target.style.color = '#ffffff'}
          >
            Explore
          </Link>
          <Link
            to="/upload"
            onClick={toggleMenu}
            style={{ color: '#ffffff', transition: 'color 0.3s ease', textShadow: '0 0 3px #333' }}
            onMouseEnter={(e) => e.target.style.color = '#cccccc'}
            onMouseLeave={(e) => e.target.style.color = '#ffffff'}
          >
            Upload
          </Link>
          {user ? (
            <>
              <Link
                to={`/profile/${user.uid}`}
                onClick={toggleMenu}
                style={{ color: '#ffffff', transition: 'color 0.3s ease', textShadow: '0 0 3px #333' }}
                onMouseEnter={(e) => e.target.style.color = '#cccccc'}
                onMouseLeave={(e) => e.target.style.color = '#ffffff'}
              >
                Profile
              </Link>
              <button
                onClick={() => {
                  handleLogout();
                  toggleMenu();
                }}
                style={{
                  color: '#000000',
                  background: '#ffffff',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  transition: 'background 0.3s ease',
                  boxShadow: '0 0 5px #333'
                }}
                onMouseEnter={(e) => e.target.style.background = '#cccccc'}
                onMouseLeave={(e) => e.target.style.background = '#ffffff'}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                onClick={toggleMenu}
                style={{ color: '#ffffff', transition: 'color 0.3s ease', textShadow: '0 0 3px #333' }}
                onMouseEnter={(e) => e.target.style.color = '#cccccc'}
                onMouseLeave={(e) => e.target.style.color = '#ffffff'}
              >
                Login
              </Link>
              <Link
                to="/signup"
                onClick={toggleMenu}
                style={{
                  color: '#000000',
                  background: '#ffffff',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  transition: 'background 0.3s ease',
                  boxShadow: '0 0 5px #333'
                }}
                onMouseEnter={(e) => e.target.style.background = '#cccccc'}
                onMouseLeave={(e) => e.target.style.background = '#ffffff'}
              >
                Signup
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;