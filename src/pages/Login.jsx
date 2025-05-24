import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { auth, googleProvider } from '../firebase/firebase';
import { signInWithPopup, signInWithEmailAndPassword } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import LoadingSpinner from '../components/LoadingSpinner';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        navigate('/feed');
      }
      setPageLoading(false);
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
      navigate('/feed');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/feed');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) return <LoadingSpinner />;

  const containerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        staggerChildren: 0.2,
      },
    },
  };

  const childVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#1f1f1f', padding: '4rem 1rem' }}>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={{
          maxWidth: '400px',
          margin: '0 auto',
          background: 'rgba(255, 255, 255, 0.02)',
          padding: '2rem',
          borderRadius: '1rem',
          boxShadow: '0 0 20px rgba(96, 165, 250, 0.1)',
          color: '#d1d5db'
        }}
      >
        <motion.h1
          variants={childVariants}
          style={{
            fontSize: '2.5rem',
            fontWeight: '800',
            marginBottom: '2rem',
            textAlign: 'center',
            background: 'linear-gradient(90deg, #60a5fa, #f472b6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 0 15px rgba(96, 165, 250, 0.5)'
          }}
        >
          Login
        </motion.h1>

        <motion.div variants={childVariants}>
          <motion.button
            onClick={handleGoogleSignIn}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              width: '100%',
              background: 'linear-gradient(90deg, #60a5fa, #f472b6)',
              color: '#ffffff',
              padding: '12px',
              borderRadius: '8px',
              border: 'none',
              boxShadow: '0 0 20px rgba(96, 165, 250, 0.7)',
              marginBottom: '1.5rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.5 : 1
            }}
            whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(244, 114, 182, 0.9)' }}
            whileTap={{ scale: 0.95 }}
          >
            <svg style={{ width: '24px', height: '24px' }} viewBox="0 0 24 24">
              <path
                fill="#ffffff"
                d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5.8 16.71 5.8 13.5c0-3.21 2.56-5.77 5.69-5.77 1.45 0 2.78.54 3.81 1.43l2.06-2.06C15.64 5.68 13.99 5 11.49 5 7.15 5 3.7 8.45 3.7 13.5c0 5.05 3.45 8.5 7.79 8.5 4.92 0 8.31-4.14 8.31-8.5 0-.58-.06-1.14-.15-1.9z"
              />
            </svg>
            Sign in with Google
          </motion.button>
        </motion.div>

        <motion.form onSubmit={handleEmailSignIn} variants={childVariants}>
          <div style={{ marginBottom: '1rem' }}>
            <label
              htmlFor="email"
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontSize: '1rem',
                color: '#d1d5db'
              }}
            >
              Username/Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                borderRadius: '8px',
                color: '#d1d5db',
                border: '1px solid #60a5fa',
                boxShadow: '0 0 10px rgba(96, 165, 250, 0.2)',
                transition: 'box-shadow 0.3s ease'
              }}
              onFocus={(e) => e.target.style.boxShadow = '0 0 15px rgba(96, 165, 250, 0.5)'}
              onBlur={(e) => e.target.style.boxShadow = '0 0 10px rgba(96, 165, 250, 0.2)'}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label
              htmlFor="password"
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontSize: '1rem',
                color: '#d1d5db'
              }}
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                borderRadius: '8px',
                color: '#d1d5db',
                border: '1px solid #60a5fa',
                boxShadow: '0 0 10px rgba(96, 165, 250, 0.2)',
                transition: 'box-shadow 0.3s ease'
              }}
              onFocus={(e) => e.target.style.boxShadow = '0 0 15px rgba(96, 165, 250, 0.5)'}
              onBlur={(e) => e.target.style.boxShadow = '0 0 10px rgba(96, 165, 250, 0.2)'}
            />
          </div>

          <motion.button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              background: 'linear-gradient(90deg, #60a5fa, #f472b6)',
              color: '#ffffff',
              padding: '12px',
              borderRadius: '8px',
              border: 'none',
              boxShadow: '0 0 20px rgba(96, 165, 250, 0.7)',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.5 : 1
            }}
            whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(244, 114, 182, 0.9)' }}
            whileTap={{ scale: 0.95 }}
          >
            Sign In
          </motion.button>
        </motion.form>

        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ color: '#ff4040', textAlign: 'center', marginTop: '1rem' }}
          >
            {error}
          </motion.p>
        )}

        <motion.div variants={childVariants} style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <p style={{ color: '#d1d5db' }}>
            New User?{' '}
            <Link
              to="/signup"
              style={{
                background: 'linear-gradient(90deg, #60a5fa, #f472b6)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0 0 15px rgba(96, 165, 250, 0.5)'
              }}
            >
              Sign Up
            </Link>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Login;