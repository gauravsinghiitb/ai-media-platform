import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, auth, storage } from '../firebase/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import Card from '../components/Card';

const Profile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [view, setView] = useState('myPosts');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ username: '', bio: '' });
  const [profilePicFile, setProfilePicFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [followersList, setFollowersList] = useState([]);
  const [followingList, setFollowingList] = useState([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });

    const fetchUserData = async () => {
      try {
        const userDocRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const data = userDoc.data();
          console.log('Profile - Fetched user data:', data);
          console.log('Profile - Fetched profilePic:', data.profilePic);
          setUserData({
            ...data,
            followers: data.followers || [],
            following: data.following || [],
          });
          setEditForm({
            username: data.username || '',
            bio: data.bio || '',
          });
        } else {
          setError('User not found');
        }
      } catch (err) {
        console.error('Profile - Error fetching user data:', err);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
    return () => unsubscribe();
  }, [userId]);

  const fetchFollowersList = async () => {
    if (!userData.followers || userData.followers.length === 0) {
      setFollowersList([]);
      return;
    }

    try {
      const followersData = await Promise.all(
        userData.followers.map(async (followerId) => {
          const followerDocRef = doc(db, 'users', followerId);
          const followerDoc = await getDoc(followerDocRef);
          return followerDoc.exists() ? followerDoc.data().username || 'Unknown' : 'Unknown';
        })
      );
      setFollowersList(followersData);
    } catch (err) {
      console.error('Profile - Error fetching followers:', err);
      setError('Failed to load followers');
    }
  };

  const fetchFollowingList = async () => {
    if (!userData.following || userData.following.length === 0) {
      setFollowingList([]);
      return;
    }

    try {
      const followingData = await Promise.all(
        userData.following.map(async (followingId) => {
          const followingDocRef = doc(db, 'users', followingId);
          const followingDoc = await getDoc(followingDocRef);
          return followingDoc.exists() ? followingDoc.data().username || 'Unknown' : 'Unknown';
        })
      );
      setFollowingList(followingData);
    } catch (err) {
      console.error('Profile - Error fetching following:', err);
      setError('Failed to load following');
    }
  };

  const handleShowFollowers = async () => {
    await fetchFollowersList();
    setShowFollowersModal(true);
  };

  const handleShowFollowing = async () => {
    await fetchFollowingList();
    setShowFollowingModal(true);
  };

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

  const handleEditProfile = async (e) => {
    e.preventDefault();
    if (!currentUser || currentUser.uid !== userId) {
      setError('You can only edit your own profile');
      return;
    }

    try {
      let profilePicUrl = userData.profilePic || '';
      if (profilePicFile) {
        const storageRef = ref(storage, `profilePictures/${userId}/${profilePicFile.name}`);
        await uploadBytes(storageRef, profilePicFile);
        profilePicUrl = await getDownloadURL(storageRef);
        console.log('Profile - Uploaded profile picture URL:', profilePicUrl);
      }

      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, {
        username: editForm.username,
        bio: editForm.bio,
        profilePic: profilePicUrl,
      });

      setUserData((prev) => ({
        ...prev,
        username: editForm.username,
        bio: editForm.bio,
        profilePic: profilePicUrl,
      }));
      setProfilePicFile(null);
      setIsEditModalOpen(false);
    } catch (err) {
      console.error('Profile - Error updating profile:', err);
      setError('Failed to update profile');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleContribute = (postId) => {
    navigate(`/contribute/${postId}/1`);
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

  if (!userData) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#000000', color: '#FFFFFF' }}>
        <p style={{ fontSize: '18px', fontWeight: '500' }}>Profile not found</p>
      </div>
    );
  }

  const postsToDisplay = view === 'myPosts' ? userData.posts || [] : userData.savedPosts || [];

  return (
    <div style={{ backgroundColor: '#000000', minHeight: '100vh', color: '#FFFFFF', padding: '30px 15px' }}>
      {/* Profile Header (Centered) */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '20px',
        marginBottom: '30px',
        padding: '20px 0',
        borderBottom: '1px solid #FFFFFF',
        textAlign: 'center',
      }}>
        <motion.img
          src={userData.profilePic || 'https://via.placeholder.com/100?text=Profile'}
          alt="Profile"
          style={{
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            objectFit: 'cover',
            border: '2px solid #FFFFFF',
          }}
          onError={(e) => {
            console.error('Profile - Failed to load profile picture:', userData.profilePic);
            e.target.src = 'https://via.placeholder.com/100?text=Profile';
          }}
          whileHover={{ scale: 1.05 }}
        />
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '600' }}>{userData.username || 'User'}</h2>
            {currentUser && currentUser.uid === userId && (
              <motion.button
                onClick={() => setIsEditModalOpen(true)}
                style={{
                  backgroundColor: '#FFFFFF',
                  color: '#000000',
                  padding: '6px 12px',
                  borderRadius: '5px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '500',
                }}
                whileHover={{ backgroundColor: '#e0e0e0', scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Edit Profile
              </motion.button>
            )}
          </div>
          <div style={{ display: 'flex', gap: '20px', marginBottom: '10px', justifyContent: 'center' }}>
            <p style={{ fontSize: '14px' }}><strong>{(userData.posts || []).length}</strong> Posts</p>
            <p
              style={{ fontSize: '14px', cursor: 'pointer' }}
              onClick={handleShowFollowers}
            >
              <strong>{userData.followers.length}</strong> Followers
            </p>
            <p
              style={{ fontSize: '14px', cursor: 'pointer' }}
              onClick={handleShowFollowing}
            >
              <strong>{userData.following.length}</strong> Following
            </p>
          </div>
          <p style={{ fontSize: '14px', fontWeight: '300' }}>{userData.bio || 'No bio available'}</p>
        </div>
      </div>

      {/* Slider for My Posts and Saved Posts */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid #FFFFFF', width: '200px', position: 'relative' }}>
          <motion.button
            onClick={() => setView('myPosts')}
            style={{
              flex: 1,
              padding: '8px 0',
              backgroundColor: 'transparent',
              color: '#FFFFFF',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
            }}
            whileHover={{ color: '#e0e0e0' }}
            whileTap={{ scale: 0.95 }}
          >
            My Posts
            {view === 'myPosts' && (
              <motion.div
                style={{
                  position: 'absolute',
                  bottom: '-1px',
                  left: '0',
                  width: '50%',
                  height: '2px',
                  backgroundColor: '#FFFFFF',
                }}
                layoutId="underline"
              />
            )}
          </motion.button>
          <motion.button
            onClick={() => setView('savedPosts')}
            style={{
              flex: 1,
              padding: '8px 0',
              backgroundColor: 'transparent',
              color: '#FFFFFF',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
            }}
            whileHover={{ color: '#e0e0e0' }}
            whileTap={{ scale: 0.95 }}
          >
            Saved Posts
            {view === 'savedPosts' && (
              <motion.div
                style={{
                  position: 'absolute',
                  bottom: '-1px',
                  right: '0',
                  width: '50%',
                  height: '2px',
                  backgroundColor: '#FFFFFF',
                }}
                layoutId="underline"
              />
            )}
          </motion.button>
        </div>
      </div>

      {/* Posts Grid with Contribute Button */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0px' }}>
        {postsToDisplay.length > 0 ? (
          postsToDisplay.map((post, index) => (
            <div key={index} style={{ position: 'relative' }}>
              <Card
                post={post}
                userId={view === 'myPosts' ? userId : post.originalUserId || userId}
                aspectRatio="1:1"
              />
              <motion.button
                onClick={() => handleContribute(post.id)}
                style={{
                  position: 'absolute',
                  bottom: '10px',
                  right: '10px',
                  backgroundColor: '#007bff',
                  color: '#FFFFFF',
                  padding: '5px 10px',
                  borderRadius: '5px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '500',
                }}
                whileHover={{ backgroundColor: '#0056b3', scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Contribute
              </motion.button>
            </div>
          ))
        ) : (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', fontSize: '16px', padding: '20px' }}>
            {view === 'myPosts' ? 'No posts yet' : 'No saved posts'}
          </div>
        )}
      </div>

      {/* Followers Modal */}
      {showFollowersModal && (
        <motion.div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            style={{
              backgroundColor: '#000000',
              padding: '25px',
              borderRadius: '10px',
              width: '300px',
              maxWidth: '90%',
              color: '#FFFFFF',
              border: '1px solid #FFFFFF',
              maxHeight: '70vh',
              overflowY: 'auto',
            }}
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
          >
            <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '20px', textAlign: 'center' }}>Followers</h3>
            {followersList.length > 0 ? (
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {followersList.map((username, index) => (
                  <li
                    key={index}
                    style={{
                      padding: '10px 0',
                      borderBottom: index < followersList.length - 1 ? '1px solid #FFFFFF' : 'none',
                      fontSize: '16px',
                    }}
                  >
                    {username}
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ textAlign: 'center', fontSize: '16px' }}>No followers yet</p>
            )}
            <motion.button
              onClick={() => setShowFollowersModal(false)}
              style={{
                display: 'block',
                margin: '20px auto 0',
                padding: '8px 16px',
                borderRadius: '5px',
                border: '1px solid #FFFFFF',
                backgroundColor: '#000000',
                color: '#FFFFFF',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
              }}
              whileHover={{ backgroundColor: '#1a1a1a', scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Close
            </motion.button>
          </motion.div>
        </motion.div>
      )}

      {/* Following Modal */}
      {showFollowingModal && (
        <motion.div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            style={{
              backgroundColor: '#000000',
              padding: '25px',
              borderRadius: '10px',
              width: '300px',
              maxWidth: '90%',
              color: '#FFFFFF',
              border: '1px solid #FFFFFF',
              maxHeight: '70vh',
              overflowY: 'auto',
            }}
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
          >
            <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '20px', textAlign: 'center' }}>Following</h3>
            {followingList.length > 0 ? (
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {followingList.map((username, index) => (
                  <li
                    key={index}
                    style={{
                      padding: '10px 0',
                      borderBottom: index < followingList.length - 1 ? '1px solid #FFFFFF' : 'none',
                      fontSize: '16px',
                    }}
                  >
                    {username}
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ textAlign: 'center', fontSize: '16px' }}>Not following anyone</p>
            )}
            <motion.button
              onClick={() => setShowFollowingModal(false)}
              style={{
                display: 'block',
                margin: '20px auto 0',
                padding: '8px 16px',
                borderRadius: '5px',
                border: '1px solid #FFFFFF',
                backgroundColor: '#000000',
                color: '#FFFFFF',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
              }}
              whileHover={{ backgroundColor: '#1a1a1a', scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Close
            </motion.button>
          </motion.div>
        </motion.div>
      )}

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <motion.div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            style={{
              backgroundColor: '#000000',
              padding: '25px',
              borderRadius: '10px',
              width: '400px',
              maxWidth: '90%',
              color: '#FFFFFF',
              border: '1px solid #FFFFFF',
            }}
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
          >
            <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '20px', textAlign: 'center' }}>Edit Profile</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ fontSize: '14px', fontWeight: '500', display: 'block', marginBottom: '5px' }}>Username</label>
                <input
                  type="text"
                  name="username"
                  value={editForm.username}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '5px',
                    border: '1px solid #FFFFFF',
                    backgroundColor: '#000000',
                    color: '#FFFFFF',
                    fontSize: '14px',
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: '14px', fontWeight: '500', display: 'block', marginBottom: '5px' }}>Bio</label>
                <textarea
                  name="bio"
                  value={editForm.bio}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '5px',
                    border: '1px solid #FFFFFF',
                    backgroundColor: '#000000',
                    color: '#FFFFFF',
                    resize: 'vertical',
                    minHeight: '80px',
                    fontSize: '14px',
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: '14px', fontWeight: '500', display: 'block', marginBottom: '5px' }}>Profile Picture</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '5px',
                    border: '1px solid #FFFFFF',
                    backgroundColor: '#000000',
                    color: '#FFFFFF',
                    fontSize: '14px',
                  }}
                />
                {profilePicFile && (
                  <p style={{ fontSize: '12px', marginTop: '5px' }}>
                    Selected: {profilePicFile.name}
                  </p>
                )}
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <motion.button
                  onClick={handleEditProfile}
                  style={{
                    flex: 1,
                    padding: '8px',
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
                <motion.button
                  onClick={() => setIsEditModalOpen(false)}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '5px',
                    border: '1px solid #FFFFFF',
                    backgroundColor: '#000000',
                    color: '#FFFFFF',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                  }}
                  whileHover={{ backgroundColor: '#1a1a1a', scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Cancel
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default Profile;