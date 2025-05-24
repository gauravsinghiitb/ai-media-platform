import { motion } from 'framer-motion';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase/firebase';
import { doc, setDoc } from 'firebase/firestore';

function ProfileSetup() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No user is signed in.');

      console.log('Attempting to save username:', username);
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        username: username.trim(),
        name: '',
        bio: '',
        profilePic: user.photoURL || 'https://via.placeholder.com/150',
        posts: [],
        followers: [],
        following: [],
        feedData: [],
      });

      console.log('Username saved successfully');
      navigate(`/profile/${user.uid}`);
    } catch (err) {
      console.error('Error saving username:', err);
      setError('Failed to save username. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>
        {`
          .profile-setup-container {
            color: #ffffff;
            background: linear-gradient(180deg, #0a0a23 0%, #1a1a40 100%);
            padding: 3rem 1rem;
            min-height: 100vh;
            position: relative;
            overflow: hidden;
            display: flex;
            justify-content: center;
            align-items: center;
          }

          .profile-setup-form {
            max-width: 400px;
            width: 100%;
            background: rgba(255, 255, 255, 0.05);
            padding: 2rem;
            border-radius: 1rem;
            box-shadow: 0 0 20px rgba(96, 165, 250, 0.1);
            text-align: center;
          }

          .profile-setup-form h2 {
            font-size: 1.8rem;
            font-weight: 700;
            background: linear-gradient(90deg, #60a5fa, #f472b6);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 1.5rem;
          }

          .form-group {
            margin-bottom: 1.5rem;
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

      <div className="profile-setup-container">
        <motion.div
          className="profile-setup-form"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h2>Choose a Username</h2>
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
                required
              />
            </div>
            <motion.button
              type="submit"
              className="submit-button"
              disabled={loading}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Save Username
            </motion.button>
          </form>
        </motion.div>
      </div>
    </>
  );
}

export default ProfileSetup;