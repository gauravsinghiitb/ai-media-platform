import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { doc, getDoc, updateDoc, collection, getDocs, query, where, writeBatch, getDocs as getDocsFirestore } from 'firebase/firestore';
import { db, auth } from '../firebase/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import Card from '../components/Card';
import ContributionCard from '../components/ContributionCard';
import ContributionDetail from '../components/ContributionDetail';
import ProfileHeader from '../components/ProfileHeader';
import { FaLink, FaTh, FaLightbulb, FaBookmark } from 'react-icons/fa';

const Profile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [view, setView] = useState('myPosts');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [followersList, setFollowersList] = useState([]);
  const [followingList, setFollowingList] = useState([]);
  const [followerSearch, setFollowerSearch] = useState('');
  const [followingSearch, setFollowingSearch] = useState('');
  const [isFollowing, setIsFollowing] = useState(false);
  const [contributions, setContributions] = useState([]);
  const [contributionCount, setContributionCount] = useState(0);
  const [postsMap, setPostsMap] = useState({});
  const [selectedContribution, setSelectedContribution] = useState(null);
  const [showLinksPopup, setShowLinksPopup] = useState(false);
  const bioRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user && userData) {
        setIsFollowing(userData.followers.includes(user.uid));
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
        const initialUserData = {
          ...data,
          followers: data.followers || [],
          following: data.following || [],
          posts: [],
          savedPosts: [],
          contributionCount: 0,
          location: data.location || '',
          socialMedia: data.socialMedia || { twitter: '', linkedin: '', instagram: '', github: '', facebook: '' },
          joinedDate: data.joinedDate || '',
          uid: userId,
        };

        let userPosts = [];
        try {
          const postsQuery = query(collection(db, 'posts'), where('userId', '==', userId));
          const postsSnapshot = await getDocs(postsQuery);
          userPosts = postsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (postsError) {
          console.error('Profile - Error fetching user posts:', postsError);
          setError('Failed to load user posts. Please try again later.');
        }

        const postsMapData = {};
        userPosts.forEach(post => {
          postsMapData[post.id] = post;
        });

        let savedPosts = [];
        if (currentUser && currentUser.uid === userId) {
          const savedPostsCollection = collection(db, 'posts', 'usersavedpost', userId);
          const savedPostsSnapshot = await getDocs(savedPostsCollection);
          savedPosts = savedPostsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            userId: doc.data().originalUserId || userId,
          }));
        }

        let allContributions = [];
        let totalContributionCount = 0;
        try {
          const postIds = userPosts.map(post => post.id);
          if (postIds.length > 0) {
            for (const postId of postIds.slice(0, 10)) {
              const contributionsRef = collection(db, 'contributions', userId, postId);
              const contributionsSnapshot = await getDocs(contributionsRef);
              contributionsSnapshot.forEach(doc => {
                const contributionData = doc.data();
                if (Array.isArray(contributionData.nodes)) {
                  const userContributions = contributionData.nodes
                    .filter(node => node.userId === userId)
                    .map(node => {
                      const parentNode = node.parentId
                        ? contributionData.nodes.find(n => n.id === node.parentId) || null
                        : null;
                      return {
                        ...node,
                        postId,
                        username: data.username?.username,
                        profilePic: data.profilePic,
                        comments: node.comments || [],
                        likesCount: node.upvotesCount || 0,
                        hasLiked: node.userUpvotes?.includes(userId) || false,
                        parentNode,
                      };
                    });
                  allContributions = [...allContributions, ...userContributions];
                  totalContributionCount += userContributions.length;
                }
              });
            }
          }
        } catch (contribError) {
          console.error('Profile - Error fetching contributions:', contribError);
          setError('Failed to load contributions');
        }

        setUserData({
          ...initialUserData,
          posts: userPosts,
          postsCount: userPosts.length,
          savedPosts,
          contributionCount: totalContributionCount,
        });
        setContributions(allContributions);
        setContributionCount(totalContributionCount);
        setPostsMap(postsMapData);

        if (currentUser) {
          setIsFollowing(initialUserData.followers.includes(currentUser.uid));
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
  }, [userId, currentUser]);

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
          if (followerDoc.exists()) {
            const data = followerDoc.data();
            return {
              id: followerId,
              username: data.username?.username || 'Unknown',
              profilePic: data.profilePic || 'https://dummyimage.com/40x40/000/fff?text=User',
            };
          }
          return { id: followerId, username: 'Unknown', profilePic: 'https://dummyimage.com/40x40/000/fff?text=User' };
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
          if (followingDoc.exists()) {
            const data = followingDoc.data();
            return {
              id: followingId,
              username: data.username?.username || 'Unknown',
              profilePic: data.profilePic || 'https://dummyimage.com/40x40/000/fff?text=User',
            };
          }
          return { id: followingId, username: 'Unknown', profilePic: 'https://dummyimage.com/40x40/000/fff?text=User' };
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
    setFollowerSearch('');
  };

  const handleShowFollowing = async () => {
    await fetchFollowingList();
    setShowFollowingModal(true);
    setFollowingSearch('');
  };

  const handleFollow = async () => {
    if (!currentUser || currentUser.uid === userId) return;

    try {
      const userDocRef = doc(db, 'users', userId);
      const currentUserDocRef = doc(db, 'users', currentUser.uid);

      const batch = writeBatch(db);

      if (isFollowing) {
        batch.update(userDocRef, {
          followers: userData.followers.filter(id => id !== currentUser.uid),
        });
        const currentUserDoc = await getDoc(currentUserDocRef);
        const currentUserData = currentUserDoc.data();
        batch.update(currentUserDocRef, {
          following: (currentUserData.following || []).filter(id => id !== userId),
        });
        setUserData(prev => ({
          ...prev,
          followers: prev.followers.filter(id => id !== currentUser.uid),
        }));
        setIsFollowing(false);
      } else {
        batch.update(userDocRef, {
          followers: [...userData.followers, currentUser.uid],
        });
        const currentUserDoc = await getDoc(currentUserDocRef);
        const currentUserData = currentUserDoc.data();
        batch.update(currentUserDocRef, {
          following: [...(currentUserData.following || []), userId],
        });
        setUserData(prev => ({
          ...prev,
          followers: [...prev.followers, currentUser.uid],
        }));
        setIsFollowing(true);
      }

      await batch.commit();
    } catch (err) {
      console.error('Profile - Error updating follow status:', err);
      setError('Failed to update follow status: ' + err.message);
    }
  };

  const handleCardClick = (item) => {
    if (view === 'myPosts') {
      navigate(`/post/${userId}/${item.id}`);
    } else if (view === 'contributions') {
      setSelectedContribution(item);
    } else if (view === 'savedPosts') {
      navigate(`/post/${item.userId}/${item.postId}`);
    }
  };

  const renderBio = (bio) => {
    if (!bio) return 'No bio available';

    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const mentionRegex = /@[a-zA-Z0-9_]+/g;

    const urls = bio.match(urlRegex) || [];
    let bioWithoutUrls = bio.replace(urlRegex, '').trim();
    const parts = bioWithoutUrls.split(mentionRegex);
    const mentions = bioWithoutUrls.match(mentionRegex) || [];
    const finalParts = [];

    let mentionIndex = 0;
    parts.forEach((part, index) => {
      finalParts.push(<span key={`part-${index}`}>{part}</span>);
      if (mentionIndex < mentions.length) {
        const mention = mentions[mentionIndex];
        const username = mention.substring(1);
        finalParts.push(
          <span
            key={`mention-${index}`}
            style={{ color: '#1DA1F2', textDecoration: 'none', cursor: 'pointer' }}
            onClick={async (e) => {
              e.preventDefault();
              try {
                const usernameDocRef = doc(db, 'usernames', username);
                const usernameDoc = await getDoc(usernameDocRef);
                if (usernameDoc.exists()) {
                  const userId = usernameDoc.data().uid;
                  navigate(`/profile/${userId}`);
                } else {
                  console.error('User not found for username:', username);
                }
              } catch (err) {
                console.error('Error navigating to user profile:', err);
              }
            }}
          >
            {mention}
          </span>
        );
        mentionIndex++;
      }
    });

    const bioContent = finalParts.length > 1 || finalParts[0].props.children !== 'No bio available' ? finalParts : 'No bio available';

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
        <span>{bioContent}</span>
        {urls.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <FaLink
              size={14}
              style={{ color: '#1DA1F2', cursor: 'pointer' }}
              onClick={() => setShowLinksPopup(true)}
            />
            <span style={{ fontSize: '12px', color: '#1DA1F2' }}>
              {urls.length === 1 ? (
                urls[0].length > 30 ? `${urls[0].substring(0, 27)}...` : urls[0]
              ) : (
                <span
                  style={{ cursor: 'pointer', textDecoration: 'underline' }}
                  onClick={() => setShowLinksPopup(true)}
                >
                  {urls.length - 1} more
                </span>
              )}
            </span>
          </div>
        )}
        {showLinksPopup && urls.length > 0 && (
          <motion.div
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: '#1C1C1C',
              padding: '20px',
              borderRadius: '10px',
              border: '1px solid #FFFFFF',
              zIndex: 1001,
              maxHeight: '50vh',
              overflowY: 'auto',
              width: '300px',
              maxWidth: '90%',
            }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <h4 style={{ fontSize: '16px', fontWeight: '500', marginBottom: '15px', textAlign: 'center' }}>
              Links
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {urls.map((url, index) => (
                <a
                  key={`url-${index}`}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: '#1DA1F2',
                    textDecoration: 'underline',
                    fontSize: '14px',
                    wordBreak: 'break-all',
                  }}
                >
                  {url}
                </a>
              ))}
            </div>
            <motion.button
              onClick={() => setShowLinksPopup(false)}
              style={{
                display: 'block',
                margin: '15px auto 0',
                padding: '6px 12px',
                borderRadius: '5px',
                border: '1px solid #FFFFFF',
                backgroundColor: '#FFFFFF',
                color: '#000000',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '500',
              }}
              whileHover={{ backgroundColor: '#e0e0e0', scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Close
            </motion.button>
          </motion.div>
        )}
      </div>
    );
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

  const isOwnProfile = currentUser && currentUser.uid === userId;
  const itemsToDisplay = view === 'myPosts' ? userData.posts : view === 'contributions' ? contributions : userData.savedPosts;
  const filteredFollowers = followersList.filter(user =>
    user.username.toLowerCase().includes(followerSearch.toLowerCase())
  );
  const filteredFollowing = followingList.filter(user =>
    user.username.toLowerCase().includes(followingSearch.toLowerCase())
  );

  return (
    <div style={{ backgroundColor: '#000000', minHeight: '100vh', color: '#FFFFFF', padding: '30px 15px' }}>
      <ProfileHeader
        userData={{ ...userData, contributionCount }}
        currentUser={currentUser}
        isOwnProfile={isOwnProfile}
        isFollowing={isFollowing}
        handleFollow={handleFollow}
        setShowFollowersModal={handleShowFollowers}
        setShowFollowingModal={handleShowFollowing}
        renderBio={renderBio}
      />

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #FFFFFF',
          width: isOwnProfile ? '300px' : '200px',
          position: 'relative',
          gap: '15px',
        }}>
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
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px',
            }}
            whileHover={{ color: '#e0e0e0' }}
            whileTap={{ scale: 0.95 }}
          >
            <FaTh size={14} />
            Posts
            {view === 'myPosts' && (
              <motion.div
                style={{
                  position: 'absolute',
                  bottom: '-1px',
                  left: isOwnProfile ? '0' : '0',
                  width: isOwnProfile ? '33.33%' : '50%',
                  height: '2px',
                  backgroundColor: '#FFFFFF',
                }}
                layoutId="underline"
              />
            )}
          </motion.button>
          <motion.button
            onClick={() => setView('contributions')}
            style={{
              flex: 1,
              padding: '8px 0',
              backgroundColor: 'transparent',
              color: '#FFFFFF',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px',
            }}
            whileHover={{ color: '#e0e0e0' }}
            whileTap={{ scale: 0.95 }}
          >
            <FaLightbulb size={14} />
            Contributions
            {view === 'contributions' && (
              <motion.div
                style={{
                  position: 'absolute',
                  bottom: '-1px',
                  left: isOwnProfile ? '33.33%' : '50%',
                  width: isOwnProfile ? '33.33%' : '50%',
                  height: '2px',
                  backgroundColor: '#FFFFFF',
                }}
                layoutId="underline"
              />
            )}
          </motion.button>
          {isOwnProfile && (
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
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
              }}
              whileHover={{ color: '#e0e0e0' }}
              whileTap={{ scale: 0.95 }}
            >
              <FaBookmark size={14} />
              Saved
              {view === 'savedPosts' && (
                <motion.div
                  style={{
                    position: 'absolute',
                    bottom: '-1px',
                    right: '0',
                    width: '33.33%',
                    height: '2px',
                    backgroundColor: '#FFFFFF',
                  }}
                  layoutId="underline"
                />
              )}
            </motion.button>
          )}
        </div>
      </div>

      <div style={{
        columnCount: 5,
        columnGap: '10px',
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '0 10px',
      }}>
        {itemsToDisplay.length > 0 ? (
          itemsToDisplay.map((item, index) => {
            if (view === 'contributions') {
              console.log(`Contribution ${index}:`, {
                item,
                postId: item.postId,
                postMedia: postsMap[item.postId]?.aiGeneratedUrl,
              });
            } else {
              console.log(`Post ${index} (${view}):`, {
                item,
                aiGeneratedUrl: item.aiGeneratedUrl,
              });
            }

            return (
              <div
                key={`${view}-${item.id}-${index}`}
                style={{
                  breakInside: 'avoid',
                  marginBottom: '10px',
                }}
              >
                {view === 'contributions' ? (
                  postsMap[item.postId] ? (
                    <ContributionCard
                      contribution={item}
                      postMedia={postsMap[item.postId]?.aiGeneratedUrl || 'https://dummyimage.com/400x400/000/fff?text=Media+Unavailable'}
                      userId={userId}
                      postId={item.postId}
                      onClick={() => handleCardClick(item)}
                      style={{ height: 'auto' }}
                    />
                  ) : (
                    <div
                      style={{
                        position: 'relative',
                        backgroundColor: '#1C1C1C',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#AAAAAA',
                        fontSize: '12px',
                        textAlign: 'center',
                        height: '200px',
                      }}
                    >
                      <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                        Post Unavailable
                      </span>
                    </div>
                  )
                ) : (
                  <Card
                    post={item}
                    userId={
                      view === 'myPosts'
                        ? userId
                        : view === 'contributions'
                        ? item.userId
                        : item.originalUserId || userId
                    }
                    onClick={() => handleCardClick(item)}
                    style={{ height: 'auto' }}
                  />
                )}
              </div>
            );
          })
        ) : (
          <div style={{ textAlign: 'center', fontSize: '16px', padding: '20px' }}>
            {view === 'myPosts' ? 'No posts yet' : view === 'contributions' ? 'No contributions yet' : 'No saved posts'}
          </div>
        )}
      </div>

      {selectedContribution && (
        <ContributionDetail
          contribution={selectedContribution}
          post={postsMap[selectedContribution.postId]}
          onClose={() => setSelectedContribution(null)}
          userId={userId}
        />
      )}

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
              backgroundColor: '#1C1C1C',
              padding: '25px',
              borderRadius: '10px',
              width: '300px',
              maxWidth: '90%',
              color: 'white',
              border: '1px solid #FFFFFF',
              maxHeight: '70vh',
              overflowY: 'auto',
              boxShadow: '0 0 15px #FFFFFF',
            }}
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
          >
            <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '20px', textAlign: 'center' }}>Followers</h3>
            <input
              type="text"
              placeholder="Search followers..."
              value={followerSearch}
              onChange={(e) => setFollowerSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                marginBottom: '15px',
                borderRadius: '5px',
                border: '1px solid #FFFFFF',
                backgroundColor: '#333333',
                color: '#FFFFFF',
                fontSize: '14px',
              }}
            />
            {filteredFollowers.length > 0 ? (
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {filteredFollowers.map((user) => (
                  <li
                    key={user.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '10px 0',
                      borderBottom: '1px solid #FFFFFF',
                      fontSize: '16px',
                      cursor: 'pointer',
                    }}
                    onClick={() => {
                      navigate(`/profile/${user.id}`);
                      setShowFollowersModal(false);
                    }}
                  >
                    <img
                      src={user.profilePic}
                      alt={user.username}
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        marginRight: '10px',
                        objectFit: 'cover',
                        border: '1px solid #FFFFFF',
                      }}
                      onError={(e) => {
                        e.target.src = 'https://dummyimage.com/40x40/000/fff?text=User';
                      }}
                    />
                    <span>{user.username}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ textAlign: 'center', fontSize: '16px' }}>
                {followerSearch ? 'No matching followers' : 'No followers yet'}
              </p>
            )}
            <motion.button
              onClick={() => setShowFollowersModal(false)}
              style={{
                display: 'block',
                margin: '20px auto 0',
                padding: '8px 16px',
                borderRadius: '5px',
                border: '1px solid #FFFFFF',
                backgroundColor: '#FFFFFF',
                color: '#000000',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                boxShadow: '0 0 5px #FFFFFF',
              }}
              whileHover={{ backgroundColor: '#e0e0e0', scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Close
            </motion.button>
          </motion.div>
        </motion.div>
      )}

      {showFollowingModal && (
        <motion.div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: '0',
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
        >
          <motion.div
            style={{
              backgroundColor: '#1C1C1C',
              padding: '25px',
              borderRadius: '10px',
              width: '300px',
              maxWidth: '90%',
              color: '#FFFFFF',
              border: '1px solid #FFFFFF',
              maxHeight: '70vh',
              overflowY: 'auto',
              boxShadow: '0 0 15px #FFFFFF',
            }}
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
          >
            <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '20px', textAlign: 'center' }}>Following</h3>
            <input
              type="text"
              placeholder="Search following..."
              value={followingSearch}
              onChange={(e) => setFollowingSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                marginBottom: '15px',
                borderRadius: '5px',
                border: '1px solid #FFFFFF',
                backgroundColor: '#333333',
                color: '#FFFFFF',
                fontSize: '14px',
              }}
            />
            {filteredFollowing.length > 0 ? (
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {filteredFollowing.map((user) => (
                  <li
                    key={user.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '10px 0',
                      borderBottom: '1px solid #FFFFFF',
                      fontSize: '16px',
                      cursor: 'pointer',
                    }}
                    onClick={() => {
                      navigate(`/profile/${user.id}`);
                      setShowFollowingModal(false);
                    }}
                  >
                    <img
                      src={user.profilePic}
                      alt={user.username}
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        marginRight: '10px',
                        objectFit: 'cover',
                        border: '1px solid #FFFFFF',
                      }}
                      onError={(e) => {
                        e.target.src = 'https://dummyimage.com/40x40/000/fff?text=User';
                      }}
                    />
                    <span>{user.username}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ textAlign: 'center', fontSize: '16px' }}>
                {followingSearch ? 'No matching users' : 'Not following anyone'}
              </p>
            )}
            <motion.button
              onClick={() => setShowFollowingModal(false)}
              style={{
                display: 'block',
                margin: '20px auto 0',
                padding: '8px 16px',
                borderRadius: '5px',
                border: '1px solid #FFFFFF',
                backgroundColor: '#FFFFFF',
                color: '#000000',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                boxShadow: '0 0 5px #FFFFFF',
              }}
              whileHover={{ backgroundColor: '#e0e0e0', scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Close
            </motion.button>
          </motion.div>
        </motion.div>
      )}

      {showLinksPopup && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1000,
          }}
          onClick={() => setShowLinksPopup(false)}
        />
      )}
    </div>
  );
};

export default Profile;