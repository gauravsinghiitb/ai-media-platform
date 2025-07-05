import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { auth, googleProvider, db } from '../firebase/firebase';
import { signInWithPopup } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, writeBatch } from 'firebase/firestore';
import LoadingSpinner from '../components/LoadingSpinner';

const Login = () => {
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [buttonHovered, setButtonHovered] = useState(false);

  const generateUniqueUsername = async (baseUsername) => {
    let username = baseUsername;
    let counter = 0;
    while (true) {
      const usernameDocRef = doc(db, 'usernames', username);
      const usernameDoc = await getDoc(usernameDocRef);
      if (!usernameDoc.exists()) {
        return username;
      }
      counter++;
      username = `${baseUsername}${counter}`;
    }
  };

  const initializeUserDoc = async (user) => {
    console.log('User UID in initializeUserDoc:', user.uid);
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      let derivedUsername = user.displayName
        ? user.displayName.toLowerCase().replace(/\s+/g, '')
        : user.email && user.email.includes('@')
        ? user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '')
        : `user${user.uid.slice(0, 8)}`;
      derivedUsername = await generateUniqueUsername(derivedUsername);

      const profilePic = user.photoURL || 'https://dummyimage.com/30x30/000/fff?text=User';
      const name = user.displayName || (user.email && user.email.includes('@') ? user.email.split('@')[0] : 'User');

      const batch = writeBatch(db);

      batch.set(userDocRef, {
        bio: '',
        followers: [],
        following: [],
        name: name,
        profilePic: profilePic,
        username: {
          username: derivedUsername,
          uid: user.uid,
        },
        postsCount: 0,
        savedPostsCount: 0,
        usernameChangeCount: 0,
      });

      const usernameDocRef = doc(db, 'usernames', derivedUsername);
      console.log('Setting usernames doc with UID:', user.uid);
      batch.set(usernameDocRef, { uid: user.uid });

      try {
        console.log('Committing batch write for user:', user.uid);
        await batch.commit();
      } catch (err) {
        console.error('Error during batch write:', err);
        throw err;
      }
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await initializeUserDoc(user);
        navigate(`/profile/${user.uid}`);
      }
      setPageLoading(false);
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      await initializeUserDoc(user);
      navigate(`/profile/${user.uid}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) return <LoadingSpinner />;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.8,
        staggerChildren: 0.2,
      },
    },
  };

  const childVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#000000', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="login-container luminous-border" // Added luminous-border class
        style={{
          maxWidth: '1100px',
          width: '100%',
          backgroundColor: '#000000',
          padding: '3rem',
          color: '#FFFFFF',
          display: 'flex',
          flexDirection: 'row',
          gap: '4rem',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: '-5rem', // Kept the upward shift
        }}
      >
        {/* Left Side: Logo + Name, Company Info */}
        <motion.div
          variants={childVariants}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'center',
            borderRight: '1px solid #FFFFFF',
            paddingRight: '2rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <img
              src="/logo_white_new.png"
              alt="Kryoon Logo"
              style={{ width: '80px', height: '80px' }}
              onError={(e) => {
                console.error('Failed to load logo');
                e.target.src = 'https://dummyimage.com/80x80/FFF/000?text=Kryoon';
              }}
            />
            <h1
              style={{
                fontSize: '3rem',
                fontWeight: '700',
                color: '#FFFFFF',
              }}
            >
              Kryoon
            </h1>
          </div>
          <p
            style={{
              fontSize: '1.1rem',
              color: '#FFFFFF',
              fontWeight: '400',
              maxWidth: '500px',
              lineHeight: '1.6',
            }}
          >
            Kryoon is a community for sharing, remixing, and contributing to AI creations. Join creators from around the world to explore amazing AI-generated photos and videos, collaborate on creative projects, and inspire new ideas. Build your profile, follow others, save your favorite posts, and be part of a vibrant space where AI and creativity come together.
          </p>
        </motion.div>

        {/* Right Side: Button, Error, Link */}
        <motion.div
          variants={childVariants}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: '1.5rem',
          }}
        >
          <motion.button
            onClick={handleGoogleSignIn}
            disabled={loading}
            onMouseEnter={() => setButtonHovered(true)}
            onMouseLeave={() => setButtonHovered(false)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              width: '100%',
              maxWidth: '350px',
              backgroundColor: buttonHovered ? '#000000' : '#FFFFFF',
              color: buttonHovered ? '#FFFFFF' : '#000000',
              border: buttonHovered ? '1px solid #FFFFFF' : 'none',
              padding: '16px',
              borderRadius: '4px',
              fontSize: '1.2rem',
              fontWeight: '500',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.5 : 1,
            }}
          >
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/768px-Google_%22G%22_logo.svg.png"
              alt="Google Logo"
              style={{ width: '24px', height: '24px' }}
              onError={(e) => {
                console.error('Failed to load Google logo');
                e.target.src = 'https://dummyimage.com/24x24/FFF/000?text=G';
              }}
            />
            Sign in with Google
          </motion.button>

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ color: '#FFFFFF', textAlign: 'right', fontSize: '1.1rem', maxWidth: '350px' }}
            >
              {error}
            </motion.p>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
            <p style={{ color: '#FFFFFF', fontSize: '1.1rem', textAlign: 'right' }}>
              New to Kryoon?{' '}
              <Link
                to="/signup"
                style={{
                  color: '#FFFFFF',
                  textDecoration: 'none',
                  borderBottom: '1px solid #FFFFFF',
                }}
              >
                Sign Up
              </Link>
            </p>
            <p style={{ color: '#FFFFFF', fontSize: '0.9rem', textAlign: 'right' }}>
              By signing in, you agree to our{' '}
              <Link
                to="/terms-and-conditions"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: '#FFFFFF',
                  textDecoration: 'none',
                  borderBottom: '1px solid #FFFFFF',
                }}
              >
                Terms and Conditions
              </Link>
            </p>
          </div>
        </motion.div>
      </motion.div>

      {/* Responsive Styling and Luminous Border Animation */}
      <style>
        {`
          @keyframes rotateBorder {
            0% {
              border-image: linear-gradient(0deg, #ff0000, #0000ff, #ff00ff, #00ff00) 1;
              box-shadow: 0 0 10px rgba(255, 0, 0, 0.5), 0 0 20px rgba(255, 0, 0, 0.3);
            }
            25% {
              border-image: linear-gradient(90deg, #ff0000, #0000ff, #ff00ff, #00ff00) 1;
              box-shadow: 0 0 10px rgba(0, 0, 255, 0.5), 0 0 20px rgba(0, 0, 255, 0.3);
            }
            50% {
              border-image: linear-gradient(180deg, #ff0000, #0000ff, #ff00ff, #00ff00) 1;
              box-shadow: 0 0 10px rgba(255, 0, 255, 0.5), 0 0 20px rgba(255, 0, 255, 0.3);
            }
            75% {
              border-image: linear-gradient(270deg, #ff0000, #0000ff, #ff00ff, #00ff00) 1;
              box-shadow: 0 0 10px rgba(0, 255, 0, 0.5), 0 0 20px rgba(0, 255, 0, 0.3);
            }
            100% {
              border-image: linear-gradient(360deg, #ff0000, #0000ff, #ff00ff, #00ff00) 1;
              box-shadow: 0 0 10px rgba(255, 0, 0, 0.5), 0 0 20px rgba(255, 0, 0, 0.3);
            }
          }

          .luminous-border {
            border: 2px solid transparent;
            border-radius: 8px;
            animation: rotateBorder 4s linear infinite;
          }

          @media (max-width: 768px) {
            .login-container {
              flex-direction: column !important;
              align-items: center !important;
              padding: 1rem !important;
              margin-top: -2rem !important;
            }
            .login-container > div:first-child {
              align-items: center !important;
              text-align: center !important;
              margin-bottom: 2rem;
              border-right: none !important;
              padding-right: 0 !important;
            }
            .login-container > div:first-child > div {
              flex-direction: column !important;
              align-items: center !important;
            }
            .login-container > div:last-child {
              align-items: center !important;
              text-align: center !important;
            }
            .login-container button {
              max-width: 100% !important;
            }
            .login-container p {
              text-align: center !important;
            }
            .login-container > div:last-child > div {
              align-items: center !important;
            }
          }
        `}
      </style>
    </div>
  );
};

export default Login;