import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, googleProvider, db } from '../firebase/firebase';
import { signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import LoadingSpinner from '../components/LoadingSpinner';

const Signup = () => {
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

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
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      let derivedUsername = user.displayName
        ? user.displayName.toLowerCase().replace(/\s+/g, '')
        : user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
      derivedUsername = await generateUniqueUsername(derivedUsername);

      const profilePic = user.photoURL || 'https://dummyimage.com/30x30/000/fff?text=User';
      const name = user.displayName || user.email.split('@')[0];

      await setDoc(userDocRef, {
        bio: '', // Bio is empty by default
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
      });

      // Register the username in the usernames collection
      const usernameDocRef = doc(db, 'usernames', derivedUsername);
      await setDoc(usernameDocRef, { uid: user.uid });
    }
  };

  const handleGoogleSignup = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      await initializeUserDoc(user);
      navigate(`/profile/${user.uid}`); // Navigate directly to profile
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        backgroundColor: '#000000',
      }}
    >
      <div
        style={{
          backgroundColor: '#1C1C1C',
          padding: '32px',
          borderRadius: '12px',
          boxShadow: '0 0 15px #FFFFFF',
          width: '100%',
          maxWidth: '480px',
          border: '1px solid #FFFFFF',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            marginBottom: '24px',
          }}
        >
          <img
            src="https://dummyimage.com/32x32/FFF/000?text=Nexlify"
            alt="Nexlify Logo"
            style={{ width: '32px', height: '32px' }}
          />
          <h2
            style={{
              fontSize: '32px',
              fontWeight: 'bold',
              color: '#FFFFFF',
            }}
          >
            Sign Up for Nexlify
          </h2>
        </div>
        {error && (
          <p style={{ color: '#FFFFFF', marginBottom: '16px', textAlign: 'center' }}>{error}</p>
        )}
        {loading ? (
          <LoadingSpinner />
        ) : (
          <>
            <button
              onClick={handleGoogleSignup}
              style={{
                width: '100%',
                marginTop: '16px',
                backgroundColor: '#FFFFFF',
                color: '#000000',
                padding: '12px',
                borderRadius: '8px',
                transition: 'background 0.3s ease',
                boxShadow: '0 0 5px #FFFFFF',
              }}
              onMouseEnter={(e) => (e.target.style.backgroundColor = '#E0E0E0')}
              onMouseLeave={(e) => (e.target.style.backgroundColor = '#FFFFFF')}
            >
              Sign Up with Google
            </button>
            <p style={{ marginTop: '16px', textAlign: 'center', color: '#FFFFFF' }}>
              Already have an account?{' '}
              <a
                href="/login"
                style={{ color: '#FFFFFF' }}
                onMouseEnter={(e) => (e.target.style.textDecoration = 'underline')}
                onMouseLeave={(e) => (e.target.style.textDecoration = 'none')}
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