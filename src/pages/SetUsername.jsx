import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { motion } from 'framer-motion';

function SetUsername() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkUsername = async () => {
      if (!auth.currentUser) {
        console.log('No authenticated user found. Redirecting to /login.');
        navigate('/login');
        return;
      }

      console.log('Authenticated user:', auth.currentUser.uid);
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists() && userDoc.data().username) {
        console.log('Username already set:', userDoc.data().username);
        navigate(`/profile/${auth.currentUser.uid}`);
      }
    };

    checkUsername();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!auth.currentUser) {
        throw new Error('No authenticated user found. Please log in again.');
      }

      if (!username) {
        throw new Error('Username is required.');
      }

      const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
      if (!usernameRegex.test(username)) {
        throw new Error('Username must be 3-20 characters and contain only letters, numbers, or underscores.');
      }

      const usernameDocRef = doc(db, 'usernames', username);
      const usernameDoc = await getDoc(usernameDocRef);
      if (usernameDoc.exists()) {
        throw new Error('Username is already taken.');
      }

      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      if (!userDoc.exists()) {
        console.log(`User document does not exist for UID: ${auth.currentUser.uid}. Creating...`);
        await setDoc(userDocRef, {
          username: username,
          name: '',
          profilePic: '',
          bio: '',
          followers: [],
          following: [],
          posts: [],
          createdAt: new Date().toISOString(),
        });
        console.log('Successfully created user document with username.');
      } else {
        console.log('Updating username in users collection for UID:', auth.currentUser.uid);
        await updateDoc(userDocRef, { username });
        console.log('Successfully updated username in users collection.');
      }

      console.log('Creating username document in usernames collection:', username);
      await setDoc(usernameDocRef, { uid: auth.currentUser.uid });
      console.log('Successfully created username document.');

      navigate(`/profile/${auth.currentUser.uid}`);
    } catch (err) {
      console.error('Error setting username:', err);
      setError(err.message || 'Failed to set username. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>
        {`
          .set-username-container {
            background: linear-gradient(180deg, #0a0a23 0%, #1a1a40 100%);
            color: #ffffff;
            min-height: 100vh;
            padding: 3rem 1rem;
            display: flex;
            justify-content: center;
            align-items: center;
          }

          .set-username-form {
            max-width: 400px;
            width: 100%;
            background: rgba(255, 255, 255, 0.05);
            padding: 2rem;
            border-radius: 1rem;
            box-shadow: 0 0 20px rgba(96, 165, 250, 0.1);
            text-align: center;
          }

          .set-username-form h2 {
            font-size: 2rem;
            font-weight: 700;
            background: linear-gradient(90deg, #60a5fa, #f472b6);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 1.5rem;
          }

          .form-group {
            margin-bottom: 1.5rem;
            text-align: left;
          }

          .form-group label {
            display: block;
            font-size: 1rem;
            margin-bottom: 0.5rem;
            color: #d1d5db;
          }

          .form-group input {
            width: 100%;
            padding: 0.75rem;
            border-radius: 0.5rem;
            border: none;
            background: rgba(255, 255, 255, 0.1);
            color: #ffffff;
            font-size: 1rem;
            outline: none;
            box-shadow: 0 0 5px rgba(96, 165, 250, 0.3);
          }

          .submit-button {
            background: linear-gradient(90deg, #60a5fa, #f472b6);
            color: #ffffff;
            padding: 0.75rem 2rem;
            border-radius: 2rem;
            border: none;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            box-shadow: 0 0 15px rgba(96, 165, 250, 0.7);
            transition: box-shadow 0.3s ease;
          }

          .submit-button:hover {
            box-shadow: 0 0 25px rgba(244, 114, 182, 0.9);
          }

          .submit-button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          .error {
            color: #ef4444;
            text-align: center;
            margin-bottom: 1rem;
          }

          .loading {
            text-align: center;
            color: #9ca3af;
            margin-bottom: 1rem;
          }
        `}
      </style>

      <div className="set-username-container">
        <motion.div
          className="set-username-form"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h2>Set Your Username</h2>
          {error && <p className="error">{error}</p>}
          {loading && <p className="loading">Saving...</p>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g., john_doe"
                required
              />
            </div>
            <motion.button
              type="submit"
              className="submit-button"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.05 }}
              whileTap={{ scale: loading ? 1 : 0.95 }}
            >
              {loading ? 'Saving...' : 'Set Username'}
            </motion.button>
          </form>
        </motion.div>
      </div>
    </>
  );
}

export default SetUsername;