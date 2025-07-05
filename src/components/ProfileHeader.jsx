import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { doc, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { FaCog, FaLink, FaMapMarkerAlt, FaTwitter, FaLinkedin, FaInstagram, FaGithub, FaFacebook, FaCalendarAlt, FaTrophy } from 'react-icons/fa';
import Settings from '../components/Settings';

const ProfileHeader = ({
  userData,
  currentUser,
  isOwnProfile,
  setShowFollowersModal,
  setShowFollowingModal,
  renderBio,
}) => {
  const navigate = useNavigate();
  const [isProfilePicPopupOpen, setIsProfilePicPopupOpen] = useState(false);
  const [isSettingsPopupOpen, setIsSettingsPopupOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isFollowing, setIsFollowing] = useState(userData.followers.includes(currentUser?.uid));
  const [followersCount, setFollowersCount] = useState(userData.followers.length);

  const handleShareProfile = () => {
    const profileUrl = `${window.location.origin}/profile/${userData.uid}`;
    navigator.clipboard.writeText(profileUrl).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }).catch(err => {
      console.error('Failed to copy profile URL:', err);
    });
  };

  const handleFollow = async () => {
    if (!currentUser) {
      console.error('User not authenticated');
      return;
    }

    try {
      const currentUserRef = doc(db, 'users', currentUser.uid);
      const targetUserRef = doc(db, 'users', userData.uid);

      const currentUserDoc = await getDoc(currentUserRef);
      const targetUserDoc = await getDoc(targetUserRef);

      const currentUserData = currentUserDoc.data();
      const targetUserData = targetUserDoc.data();

      const currentUserFollowing = currentUserData.following || [];
      const targetUserFollowers = targetUserData.followers || [];

      if (isFollowing) {
        // Unfollow: Remove currentUser.uid from target user's followers and target user.uid from current user's following
        if (targetUserFollowers.includes(currentUser.uid)) {
          await updateDoc(targetUserRef, {
            followers: arrayRemove(currentUser.uid),
          });
          setFollowersCount(prev => prev - 1);
        }
        if (currentUserFollowing.includes(userData.uid)) {
          await updateDoc(currentUserRef, {
            following: arrayRemove(userData.uid),
          });
        }
        setIsFollowing(false);
      } else {
        // Follow: Add currentUser.uid to target user's followers and target user.uid to current user's following
        if (!targetUserFollowers.includes(currentUser.uid)) {
          await updateDoc(targetUserRef, {
            followers: arrayUnion(currentUser.uid),
          });
          setFollowersCount(prev => prev + 1);
        }
        if (!currentUserFollowing.includes(userData.uid)) {
          await updateDoc(currentUserRef, {
            following: arrayUnion(userData.uid),
          });
        }
        setIsFollowing(true);
      }
    } catch (err) {
      console.error('Error in follow/unfollow operation:', err);
    }
  };

  const joinedDate = userData.joinedDate || '31 May 2025';

  return (
    <>
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: '10px',
        marginBottom: '30px',
        padding: '20px 0',
        borderBottom: '1px solid #FFFFFF',
        width: '100%',
        maxWidth: '1200px',
        margin: '0 auto',
      }}>
        {/* Profile Picture */}
        <img
          src={userData.profilePic || 'https://dummyimage.com/200x200/000/fff?text=Profile'}
          alt="Profile"
          style={{
            width: '200px',
            height: '200px',
            borderRadius: '50%',
            objectFit: 'cover',
            border: '2px solid #FFFFFF',
            boxShadow: '0 0 10px #FFFFFF',
            cursor: 'pointer',
          }}
          onClick={() => setIsProfilePicPopupOpen(true)}
          onError={(e) => {
            e.target.src = 'https://dummyimage.com/200x200/000/fff?text=Profile';
          }}
        />

        {/* Middle Content (Username, Stats, Name, Bio) */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
            <p style={{ fontSize: '20px', fontWeight: '600', margin: '0' }}>
              {userData.username?.username || 'user'}
            </p>
            {!isOwnProfile && (
              <motion.button
                onClick={handleFollow}
                style={{
                  backgroundColor: isFollowing ? '#555555' : '#FFFFFF',
                  color: isFollowing ? '#FFFFFF' : '#000000',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                }}
                whileHover={{ backgroundColor: isFollowing ? '#666666' : '#e0e0e0', scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isFollowing ? 'Unfollow' : 'Follow'}
              </motion.button>
            )}
          </div>

          {/* Posts, Followers, and Following */}
          <div style={{ display: 'flex', gap: '18px', fontSize: '15px', width: '100%' }}>
            <p><strong>{userData.postsCount || 0}</strong> Posts</p>
            <p style={{ cursor: 'pointer' }} onClick={setShowFollowersModal}>
              <strong>{followersCount}</strong> Followers
            </p>
            <p style={{ cursor: 'pointer' }} onClick={setShowFollowingModal}>
              <strong>{userData.following.length}</strong> Following
            </p>
          </div>

          {/* Name */}
          <p style={{ fontSize: '15px', fontWeight: '500', margin: '0' }}>
            {userData.name || 'User'}
          </p>

          {/* Bio */}
          <div style={{
            fontSize: '15px',
            fontWeight: '400',
            lineHeight: '1.6',
            width: '100%',
            maxWidth: '350px',
            wordWrap: 'break-word',
            whiteSpace: 'pre-wrap',
          }}>
            {renderBio(userData.bio)}
          </div>
        </div>

        {/* Right Section (Split into Two Columns) */}
        <div style={{
          display: 'flex',
          flexDirection: 'row',
          gap: '20px',
          alignItems: 'flex-start',
          minWidth: '300px',
        }}>
          {/* First Column */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            alignItems: 'flex-start',
            flex: 1,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px' }}>
              <FaTrophy size={14} color="#FFFFFF" />
              <span><strong>{userData.contributionCount || 0}</strong> Contributions</span>
            </div>
            {userData.location && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px' }}>
                <FaMapMarkerAlt size={14} color="#FFFFFF" />
                <span>{userData.location}</span>
              </div>
            )}
            {joinedDate && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px' }}>
                <FaCalendarAlt size={14} color="#FFFFFF" />
                <span>Joined {joinedDate}</span>
              </div>
            )}
          </div>

          {/* Second Column */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            alignItems: 'flex-start',
            flex: 1,
          }}>
            {(userData.socialMedia?.twitter || userData.socialMedia?.linkedin || userData.socialMedia?.instagram || userData.socialMedia?.github || userData.socialMedia?.facebook) && (
              <div style={{ display: 'flex', gap: '12px' }}>
                {userData.socialMedia?.twitter && (
                  <a href={userData.socialMedia.twitter} target="_blank" rel="noopener noreferrer">
                    <FaTwitter size={18} color="#1DA1F2" />
                  </a>
                )}
                {userData.socialMedia?.linkedin && (
                  <a href={userData.socialMedia.linkedin} target="_blank" rel="noopener noreferrer">
                    <FaLinkedin size={18} color="#0A66C2" />
                  </a>
                )}
                {userData.socialMedia?.instagram && (
                  <a href={userData.socialMedia.instagram} target="_blank" rel="noopener noreferrer">
                    <FaInstagram size={18} color="#E1306C" />
                  </a>
                )}
                {userData.socialMedia?.github && (
                  <a href={userData.socialMedia.github} target="_blank" rel="noopener noreferrer">
                    <FaGithub size={18} color="#FFFFFF" />
                  </a>
                )}
                {userData.socialMedia?.facebook && (
                  <a href={userData.socialMedia.facebook} target="_blank" rel="noopener noreferrer">
                    <FaFacebook size={18} color="#1877F2" />
                  </a>
                )}
              </div>
            )}
            {userData.links?.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {userData.links.map((link, index) => (
                  <a
                    key={index}
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: '#1DA1F2',
                      textDecoration: 'none',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <FaLink size={14} />
                    {link.length > 30 ? `${link.substring(0, 27)}...` : link}
                  </a>
                ))}
              </div>
            )}
            <motion.button
              onClick={handleShareProfile}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid #FFFFFF',
                backgroundColor: '#000000',
                color: '#FFFFFF',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                position: 'relative',
              }}
              whileHover={{ backgroundColor: '#333333', scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Share Profile
              {isCopied && (
                <span style={{
                  position: 'absolute',
                  top: '-30px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  backgroundColor: '#FFFFFF',
                  color: '#000000',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  whiteSpace: 'nowrap',
                }}>
                  Copied!
                </span>
              )}
            </motion.button>
            {isOwnProfile && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <motion.button
                  onClick={() => navigate(`/edit-profile/${userData.uid}`)}
                  style={{
                    backgroundColor: '#FFFFFF',
                    color: '#000000',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                  }}
                  whileHover={{ backgroundColor: '#e0e0e0', scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Edit Profile
                </motion.button>
                <div
                  style={{ cursor: 'pointer' }}
                  onClick={() => setIsSettingsPopupOpen(true)}
                >
                  <FaCog size={20} color="#FFFFFF" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Profile Picture Popup */}
      {isProfilePicPopupOpen && (
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
          onClick={() => setIsProfilePicPopupOpen(false)}
        >
          <motion.div
            style={{
              width: '300px',
              height: '300px',
              borderRadius: '50%',
              overflow: 'hidden',
              border: '2px solid #fff',
              boxShadow: '0 0 20px #fff',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <motion.img
              src={userData.profilePic || 'https://dummyimage.com/400x400/000/fff?text=Profile'}
              alt="Profile"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => {
                e.target.src = 'https://dummyimage.com/400x400/000/fff?text=Profile';
              }}
            />
          </motion.div>
        </motion.div>
      )}

      {/* Settings Popup */}
      {isSettingsPopupOpen && (
        <motion.div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: '0',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsSettingsPopupOpen(false)}
        >
          <motion.div
            style={{
              backgroundColor: '#1C1C1C',
              padding: '25px',
              borderRadius: '10px',
              width: '400px',
              maxWidth: '90%',
              color: '#FFFFFF',
              border: '1px solid #FFFFFF',
              position: 'relative',
            }}
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
            onClick={(e) => e.stopPropagation()}
          >
            <Settings
              onEditProfile={() => {
                navigate(`/edit-profile/${userData.uid}`);
                setIsSettingsPopupOpen(false);
              }}
              onClose={() => setIsSettingsPopupOpen(false)}
            />
          </motion.div>
        </motion.div>
      )}
    </>
  );
};

export default ProfileHeader;