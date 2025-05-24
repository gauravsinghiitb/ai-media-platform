import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, googleProvider } from '../firebase/firebase';
import { createUserWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import LoadingSpinner from '../components/LoadingSpinner';
const Signup = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleEmailSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      navigate('/login');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      navigate('/login');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      background: 'linear-gradient(to right, #0d0813, #1a1326)'
    }}>
      <div style={{
        backgroundColor: '#0d0813',
        padding: '32px',
        borderRadius: '12px',
        boxShadow: '0 0 15px #6a0dad',
        width: '100%',
        maxWidth: '480px',
        border: '1px solid #6a0dad'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '24px' }}>
          <img src="/logo.svg" alt="Nexlify Logo" style={{ width: '32px', height: '32px' }} />
          <h2 style={{
            fontSize: '32px',
            fontWeight: 'bold',
            color: '#b19cd9',
            textShadow: '0 0 5px #6a0dad'
          }}>
            Sign Up for Nexlify
          </h2>
        </div>
        {error && <p style={{ color: '#ff4040', marginBottom: '16px', textAlign: 'center' }}>{error}</p>}
        {loading ? (
          <LoadingSpinner />
        ) : (
          <>
            <form onSubmit={handleEmailSignup} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', color: '#b19cd9', marginBottom: '8px', fontWeight: '600' }}>
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '4px',
                    backgroundColor: '#1a1326',
                    color: '#e6e6fa',
                    border: '1px solid #6a0dad'
                  }}
                  onFocus={(e) => e.target.style.boxShadow = '0 0 5px #6a0dad'}
                  onBlur={(e) => e.target.style.boxShadow = 'none'}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', color: '#b19cd9', marginBottom: '8px', fontWeight: '600' }}>
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '4px',
                    backgroundColor: '#1a1326',
                    color: '#e6e6fa',
                    border: '1px solid #6a0dad'
                  }}
                  onFocus={(e) => e.target.style.boxShadow = '0 0 5px #6a0dad'}
                  onBlur={(e) => e.target.style.boxShadow = 'none'}
                  required
                />
              </div>
              <button
                type="submit"
                style={{
                  width: '100%',
                  background: 'linear-gradient(45deg, #6a0dad, #9b59b6)',
                  color: '#e6e6fa',
                  padding: '12px',
                  borderRadius: '8px',
                  transition: 'background 0.3s ease',
                  boxShadow: '0 0 5px #6a0dad'
                }}
                onMouseEnter={(e) => e.target.style.background = 'linear-gradient(45deg, #9b59b6, #6a0dad)'}
                onMouseLeave={(e) => e.target.style.background = 'linear-gradient(45deg, #6a0dad, #9b59b6)'}
              >
                Sign Up with Email
              </button>
            </form>
            <button
              onClick={handleGoogleSignup}
              style={{
                width: '100%',
                marginTop: '16px',
                background: 'linear-gradient(45deg, #ff4040, #ff6666)',
                color: '#e6e6fa',
                padding: '12px',
                borderRadius: '8px',
                transition: 'background 0.3s ease',
                boxShadow: '0 0 5px #ff4040'
              }}
              onMouseEnter={(e) => e.target.style.background = 'linear-gradient(45deg, #ff6666, #ff4040)'}
              onMouseLeave={(e) => e.target.style.background = 'linear-gradient(45deg, #ff4040, #ff6666)'}
            >
              Sign Up with Google
            </button>
            <p style={{ marginTop: '16px', textAlign: 'center', color: '#e6e6fa' }}>
              Already have an account?{' '}
              <a
                href="/login"
                style={{ color: '#b19cd9' }}
                onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
              >
                Log in
              </a>
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default Signup;