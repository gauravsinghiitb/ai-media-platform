import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { doc, getDoc, updateDoc, collection, getDocs, query, where, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, auth, storage } from '../firebase/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { FaUpload, FaArrowLeft, FaTwitter, FaLinkedin, FaInstagram, FaGithub, FaFacebook, FaLink, FaPlus, FaTrash } from 'react-icons/fa';

const EditProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [editForm, setEditForm] = useState({
    username: '',
    name: '',
    bio: '',
    location: '',
    twitter: '',
    linkedin: '',
    instagram: '',
    github: '',
    facebook: '',
    links: [],
  });
  const [profilePicFile, setProfilePicFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [usernameSuggestions, setUsernameSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const bioRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (!user || user.uid !== userId) {
        setError('You can only edit your own profile');
        setLoading(false);
      }
    });

    const fetchUserData = async () => {
      try {
        const userDocRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userDocRef);
        if (!userDoc.exists()) {
          throw new Error('User not found');
        }

        const data = userDoc.data();
        setUserData(data);
        setEditForm({
          username: data.username?.username || '',
          name: data.name || '',
          bio: data.bio || '',
          location: data.location || '',
          twitter: data.socialMedia?.twitter || '',
          linkedin: data.socialMedia?.linkedin || '',
          instagram: data.socialMedia?.instagram || '',
          github: data.socialMedia?.github || '',
          facebook: data.socialMedia?.facebook || '',
          links: data.links || [],
        });
      } catch (err) {
        console.error('EditProfile - Error fetching user data:', err);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
    return () => unsubscribe();
  }, [userId]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }
      setProfilePicFile(file);
      setError(null);
    }
  };

  const fetchUsernameSuggestions = async (queryText) => {
    if (!queryText) {
      setUsernameSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const usernamesRef = collection(db, 'usernames');
      const q = query(
        usernamesRef,
        where('username', '>=', queryText.toLowerCase()),
        where('username', '<=', queryText.toLowerCase() + '\uf8ff')
      );
      const querySnapshot = await getDocs(q);
      const suggestions = querySnapshot.docs
        .map(doc => doc.data().username)
        .filter(username => username && username.toLowerCase().startsWith(queryText.toLowerCase()))
        .slice(0, 5);
      setUsernameSuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0);
    } catch (err) {
      console.error('EditProfile - Error fetching username suggestions:', err);
      setUsernameSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleBioChange = (e) => {
    const value = e.target.value;
    setEditForm(prev => ({ ...prev, bio: value }));

    const lastWord = value.split(' ').pop();
    if (lastWord.startsWith('@') && lastWord.length > 1) {
      const queryText = lastWord.substring(1);
      fetchUsernameSuggestions(queryText);
    } else {
      setShowSuggestions(false);
      setUsernameSuggestions([]);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    const words = editForm.bio.split(' ').slice(0, -1);
    setEditForm(prev => ({ ...prev, bio: [...words, `@${suggestion}`].join(' ') + ' ' }));
    setShowSuggestions(false);
    setUsernameSuggestions([]);
    bioRef.current.focus();
  };

  const countWordsExcludingMentionsAndUrls = (text) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    let cleanText = text.replace(urlRegex, '');
    const mentionRegex = /@[a-zA-Z0-9_]+/g;
    cleanText = cleanText.replace(mentionRegex, '');
    const words = cleanText.split(/\s+/).filter(word => word.length > 0);
    return words.length;
  };

  const handleAddLink = () => {
    if (editForm.links.length >= 3) {
      setError('You can add up to 3 links only.');
      return;
    }
    setEditForm(prev => ({ ...prev, links: [...prev.links, ''] }));
  };

  const handleRemoveLink = (index) => {
    setEditForm(prev => ({
      ...prev,
      links: prev.links.filter((_, i) => i !== index),
    }));
  };

  const handleLinkChange = (index, value) => {
    const updatedLinks = [...editForm.links];
    updatedLinks[index] = value;
    setEditForm(prev => ({ ...prev, links: updatedLinks }));
  };

  const handleEditProfile = async (e) => {
    e.preventDefault();
    if (!currentUser || currentUser.uid !== userId) {
      setError('You can only edit your own profile');
      return;
    }

    const wordCount = countWordsExcludingMentionsAndUrls(editForm.bio);
    if (wordCount > 25) {
      setError('Bio must be 25 words or less (excluding mentions and URLs).');
      return;
    }

    try {
      let profilePicUrl = userData.profilePic || '';
      if (profilePicFile) {
        const storageRef = ref(storage, `users/${userId}/profile-pic/${profilePicFile.name}`);
        await uploadBytes(storageRef, profilePicFile);
        profilePicUrl = await getDownloadURL(storageRef);
      }

      const currentUsername = userData.username?.username;
      const newUsername = editForm.username.trim();
      let newUsernameChangeCount = userData.usernameChangeCount || 0;

      if (newUsername !== currentUsername) {
        if (!newUsername || !/^[a-zA-Z0-9_]+$/.test(newUsername)) {
          setError('Username must be non-empty and contain only letters, numbers, and underscores.');
          return;
        }

        if (newUsernameChangeCount >= 3) {
          setError('You have reached the maximum limit of 3 username changes.');
          return;
        }

        const usernameDocRef = doc(db, 'usernames', newUsername);
        const usernameDoc = await getDoc(usernameDocRef);
        if (usernameDoc.exists()) {
          setError('Username is already taken. Please choose a different username.');
          return;
        }

        if (currentUsername) {
          const oldUsernameDocRef = doc(db, 'usernames', currentUsername);
          const oldUsernameDoc = await getDoc(oldUsernameDocRef);
          if (oldUsernameDoc.exists()) {
            await updateDoc(oldUsernameDocRef, { uid: null });
          }
        }

        await setDoc(usernameDocRef, { uid: userId });
        newUsernameChangeCount += 1;
      }

      const socialMedia = {
        twitter: editForm.twitter.trim(),
        linkedin: editForm.linkedin.trim(),
        instagram: editForm.instagram.trim(),
        github: editForm.github.trim(),
        facebook: editForm.facebook.trim(),
      };

      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, {
        username: { username: newUsername, uid: userId },
        name: editForm.name,
        bio: editForm.bio,
        profilePic: profilePicUrl,
        usernameChangeCount: newUsernameChangeCount,
        location: editForm.location.trim(),
        socialMedia,
        links: editForm.links.filter(link => link.trim() !== ''),
      });

      navigate(`/profile/${userId}`);
    } catch (err) {
      console.error('EditProfile - Error updating profile:', err);
      setError('Failed to update profile: ' + err.message);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#000000', color: '#FFFFFF' }}>
        <p style={{ fontSize: '18px', fontWeight: '500' }}>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#000000', color: '#FFFFFF' }}>
        <p style={{ fontSize: '18px', fontWeight: '500' }}>{error}</p>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#000000', minHeight: '100vh', color: '#FFFFFF', padding: '40px 20px' }}>
      {/* Header Section */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '40px',
        maxWidth: '1200px',
        margin: '0 auto',
      }}>
        <motion.button
          onClick={() => navigate(`/profile/${userId}`)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'transparent',
            color: '#FFFFFF',
            border: 'none',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '500',
          }}
          whileHover={{ color: '#e0e0e0', scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <FaArrowLeft size={16} />
          Back to Profile
        </motion.button>
        <h1 style={{ fontSize: '28px', fontWeight: '700', margin: 0 }}>Edit Profile</h1>
        <div style={{ width: '100px' }}></div>
      </div>

      {/* Main Content */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        gap: '40px',
        flexDirection: 'row',
      }}>
        {/* Sidebar (Profile Picture) */}
        <div style={{
          flex: '0 0 300px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '10px' }}>Profile Picture</h2>
          <div style={{
            border: '1px solid #FFFFFF',
            borderRadius: '5px',
            padding: '15px',
            backgroundColor: '#1C1C1C',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            position: 'relative',
            width: '100%',
            maxWidth: '250px',
          }}>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{
                opacity: 0,
                position: 'absolute',
                width: '100%',
                height: '100%',
                cursor: 'pointer',
              }}
            />
            <FaUpload size={20} style={{ color: '#FFFFFF', marginRight: '10px' }} />
            <span style={{ color: '#FFFFFF', fontSize: '14px', textAlign: 'center' }}>
              {profilePicFile ? profilePicFile.name : 'Upload Profile Picture'}
            </span>
          </div>
        </div>

        {/* Main Form Sections */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '40px' }}>
          {/* Basic Information */}
          <div style={{ borderBottom: '1px solid #FFFFFF', paddingBottom: '20px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '20px' }}>Basic Information</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '300px' }}>
                  <label style={{ fontSize: '14px', fontWeight: '500', display: 'block', marginBottom: '8px' }}>Name</label>
                  <input
                    type="text"
                    name="name"
                    value={editForm.name}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '5px',
                      border: '1px solid #FFFFFF',
                      backgroundColor: '#1C1C1C',
                      color: '#FFFFFF',
                      fontSize: '14px',
                    }}
                  />
                </div>
                <div style={{ flex: 1, minWidth: '300px' }}>
                  <label style={{ fontSize: '14px', fontWeight: '500', display: 'block', marginBottom: '8px' }}>
                    Username (Changes left: {3 - (userData.usernameChangeCount || 0)})
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={editForm.username}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '5px',
                      border: '1px solid #FFFFFF',
                      backgroundColor: '#1C1C1C',
                      color: '#FFFFFF',
                      fontSize: '14px',
                    }}
                    disabled={(userData.usernameChangeCount || 0) >= 3}
                  />
                </div>
              </div>
              <div style={{ position: 'relative' }}>
                <label style={{ fontSize: '14px', fontWeight: '500', display: 'block', marginBottom: '8px' }}>
                  Bio (25 words max, excluding mentions and URLs)
                </label>
                <textarea
                  ref={bioRef}
                  name="bio"
                  value={editForm.bio}
                  onChange={handleBioChange}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '5px',
                    border: '1px solid #FFFFFF',
                    backgroundColor: '#1C1C1C',
                    color: '#FFFFFF',
                    resize: 'vertical',
                    minHeight: '100px',
                    fontSize: '14px',
                  }}
                />
                {showSuggestions && (
                  <ul style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    backgroundColor: '#1C1C1C',
                    border: '1px solid #FFFFFF',
                    borderRadius: '5px',
                    listStyle: 'none',
                    padding: 0,
                    margin: 0,
                    zIndex: 1001,
                    maxHeight: '150px',
                    overflowY: 'auto',
                  }}>
                    {usernameSuggestions.map((suggestion, index) => (
                      <li
                        key={index}
                        onClick={() => handleSuggestionClick(suggestion)}
                        style={{
                          padding: '8px',
                          cursor: 'pointer',
                          color: '#FFFFFF',
                          fontSize: '14px',
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#333333'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                      >
                        @{suggestion}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div style={{ maxWidth: '500px' }}>
                <label style={{ fontSize: '14px', fontWeight: '500', display: 'block', marginBottom: '8px' }}>Location (Optional)</label>
                <input
                  type="text"
                  name="location"
                  value={editForm.location}
                  onChange={handleInputChange}
                  placeholder="e.g., Mumbai, India"
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '5px',
                    border: '1px solid #FFFFFF',
                    backgroundColor: '#1C1C1C',
                    color: '#FFFFFF',
                    fontSize: '14px',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Social Media */}
          <div style={{ borderBottom: '1px solid #FFFFFF', paddingBottom: '20px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '20px' }}>Social Media Links (Optional)</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '300px' }}>
                  <label style={{ fontSize: '14px', fontWeight: '500', display: 'block', marginBottom: '8px' }}>
                    <FaTwitter style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Twitter URL
                  </label>
                  <input
                    type="url"
                    name="twitter"
                    value={editForm.twitter}
                    onChange={handleInputChange}
                    placeholder="https://twitter.com/username"
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '5px',
                      border: '1px solid #FFFFFF',
                      backgroundColor: '#1C1C1C',
                      color: '#FFFFFF',
                      fontSize: '14px',
                    }}
                  />
                </div>
                <div style={{ flex: 1, minWidth: '300px' }}>
                  <label style={{ fontSize: '14px', fontWeight: '500', display: 'block', marginBottom: '8px' }}>
                    <FaLinkedin style={{ marginRight: '8px', verticalAlign: 'middle' }} /> LinkedIn URL
                  </label>
                  <input
                    type="url"
                    name="linkedin"
                    value={editForm.linkedin}
                    onChange={handleInputChange}
                    placeholder="https://linkedin.com/in/username"
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '5px',
                      border: '1px solid #FFFFFF',
                      backgroundColor: '#1C1C1C',
                      color: '#FFFFFF',
                      fontSize: '14px',
                    }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '300px' }}>
                  <label style={{ fontSize: '14px', fontWeight: '500', display: 'block', marginBottom: '8px' }}>
                    <FaInstagram style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Instagram URL
                  </label>
                  <input
                    type="url"
                    name="instagram"
                    value={editForm.instagram}
                    onChange={handleInputChange}
                    placeholder="https://instagram.com/username"
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '5px',
                      border: '1px solid #FFFFFF',
                      backgroundColor: '#1C1C1C',
                      color: '#FFFFFF',
                      fontSize: '14px',
                    }}
                  />
                </div>
                <div style={{ flex: 1, minWidth: '300px' }}>
                  <label style={{ fontSize: '14px', fontWeight: '500', display: 'block', marginBottom: '8px' }}>
                    <FaGithub style={{ marginRight: '8px', verticalAlign: 'middle' }} /> GitHub URL
                  </label>
                  <input
                    type="url"
                    name="github"
                    value={editForm.github}
                    onChange={handleInputChange}
                    placeholder="https://github.com/username"
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '5px',
                      border: '1px solid #FFFFFF',
                      backgroundColor: '#1C1C1C',
                      color: '#FFFFFF',
                      fontSize: '14px',
                    }}
                  />
                </div>
              </div>
              <div style={{ maxWidth: '500px' }}>
                <label style={{ fontSize: '14px', fontWeight: '500', display: 'block', marginBottom: '8px' }}>
                  <FaFacebook style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Facebook URL
                </label>
                <input
                  type="url"
                  name="facebook"
                  value={editForm.facebook}
                  onChange={handleInputChange}
                  placeholder="https://facebook.com/username"
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '5px',
                    border: '1px solid #FFFFFF',
                    backgroundColor: '#1C1C1C',
                    color: '#FFFFFF',
                    fontSize: '14px',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Links Section */}
          <div style={{ borderBottom: '1px solid #FFFFFF', paddingBottom: '20px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '20px' }}>Other Links (Optional, Max 3)</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {editForm.links.map((link, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '10px', maxWidth: '500px' }}>
                  <FaLink style={{ marginRight: '8px', color: '#FFFFFF' }} />
                  <input
                    type="url"
                    value={link}
                    onChange={(e) => handleLinkChange(index, e.target.value)}
                    placeholder="e.g., https://companywebsite.com"
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '5px',
                      border: '1px solid #FFFFFF',
                      backgroundColor: '#1C1C1C',
                      color: '#FFFFFF',
                      fontSize: '14px',
                    }}
                  />
                  <motion.button
                    onClick={() => handleRemoveLink(index)}
                    style={{
                      padding: '8px',
                      borderRadius: '5px',
                      border: '1px solid #FFFFFF',
                      backgroundColor: '#1C1C1C',
                      color: '#FFFFFF',
                      cursor: 'pointer',
                    }}
                    whileHover={{ backgroundColor: '#333333', scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FaTrash size={14} />
                  </motion.button>
                </div>
              ))}
              {editForm.links.length < 3 && (
                <motion.button
                  onClick={handleAddLink}
                  style={{
                    maxWidth: '150px',
                    padding: '8px 15px',
                    borderRadius: '5px',
                    border: '1px solid #FFFFFF',
                    backgroundColor: '#1C1C1C',
                    color: '#FFFFFF',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                  whileHover={{ backgroundColor: '#333333', scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FaPlus size={14} /> Add Link
                </motion.button>
              )}
            </div>
          </div>

          {/* Save and Cancel Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px', paddingTop: '20px' }}>
            <motion.button
              onClick={() => navigate(`/profile/${userId}`)}
              style={{
                padding: '10px 20px',
                borderRadius: '5px',
                border: '1px solid #FFFFFF',
                backgroundColor: '#000000',
                color: '#FFFFFF',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
              }}
              whileHover={{ backgroundColor: '#333333', scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Cancel
            </motion.button>
            <motion.button
              onClick={handleEditProfile}
              style={{
                padding: '10px 20px',
                borderRadius: '5px',
                border: 'none',
                backgroundColor: '#FFFFFF',
                color: '#000000',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
              }}
              whileHover={{ backgroundColor: '#e0e0e0', scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Save
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;