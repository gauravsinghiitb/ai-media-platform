import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { db, storage } from '../firebase/firebase';
import { collection, getDocs, query, where, limit, doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { auth } from '../firebase/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { ref, getDownloadURL } from 'firebase/storage';
import { FaHeart, FaRegHeart, FaComment, FaEdit, FaShare, FaPlay, FaBookmark, FaRegBookmark, FaPause, FaVolumeUp, FaVolumeMute, FaReply, FaTimes, FaPlus, FaMinus } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { LazyVideo } from '../components/LazyLoad';

const Video = () => {
  const navigate = useNavigate();
  const [videos, setVideos] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [showControls, setShowControls] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState('');
  const [userProfiles, setUserProfiles] = useState({});
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [expandedPrompts, setExpandedPrompts] = useState({});
  const [contributionCounts, setContributionCounts] = useState({});
  const videoRefs = useRef([]);
  const containerRef = useRef(null);
  const commentInputRef = useRef(null);

  // Profanity filter
  const profanityList = [
    'nigga', 'ass', 'bitch', 'shit', 'fuck', 'bastard', 'cunt', 'dick', 'piss'
  ];

  const filterProfanity = (text) => {
    let filteredText = text;
    profanityList.forEach((word) => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      filteredText = filteredText.replace(regex, '****');
    });
    return filteredText;
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const togglePromptExpansion = (videoId) => {
    setExpandedPrompts(prev => ({
      ...prev,
      [videoId]: !prev[videoId]
    }));
  };

  const truncateText = (text, maxWords = 40) => {
    if (!text) return '';
    const words = text.split(' ');
    if (words.length <= maxWords) return text;
    return words.slice(0, maxWords).join(' ') + '...';
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      fetchAllVideos();
    });
    return () => unsubscribe();
  }, []);

  const fetchUserProfile = async (userId) => {
    if (userProfiles[userId]) return userProfiles[userId];
    
    try {
      const userDocRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const profile = {
          username: userData.username?.username || 'Unknown',
          profilePic: userData.profilePic || 'https://via.placeholder.com/50?text=User'
        };
        setUserProfiles(prev => ({ ...prev, [userId]: profile }));
        return profile;
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
    }
    return { username: 'Unknown', profilePic: 'https://via.placeholder.com/50?text=User' };
  };

  const fetchContributionCount = async (postId) => {
    try {
      const contributionsRef = collection(db, 'contributions');
      const contributionsSnapshot = await getDocs(contributionsRef);
      let totalContributions = 0;
      
      contributionsSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.nodes && Array.isArray(data.nodes)) {
          totalContributions += data.nodes.length;
        }
      });
      
      setContributionCounts(prev => ({
        ...prev,
        [postId]: totalContributions
      }));
      
      return totalContributions;
    } catch (err) {
      console.error('Error fetching contribution count:', err);
      return 0;
    }
  };

  const fetchAllVideos = async () => {
    setLoading(true);
    setError(null);
    try {
      const postsQuery = query(
        collection(db, 'posts'),
        where('aiGeneratedUrl', '!=', ''),
        limit(50)
      );
      const querySnapshot = await getDocs(postsQuery);
      const videoList = await Promise.all(
        querySnapshot.docs.map(async (docSnap) => {
          const data = docSnap.data();
          let resolvedAiGeneratedUrl = data.aiGeneratedUrl;
          if (resolvedAiGeneratedUrl && !resolvedAiGeneratedUrl.startsWith('https://')) {
            try {
              resolvedAiGeneratedUrl = await getDownloadURL(ref(storage, resolvedAiGeneratedUrl));
            } catch (urlErr) {
              console.error('Error resolving URL:', urlErr);
              resolvedAiGeneratedUrl = 'https://via.placeholder.com/400?text=Media+Not+Found';
            }
          }
          
          // Fetch user profile
          const userProfile = await fetchUserProfile(data.userId);
          
          // Fetch contribution count
          const contributionCount = await fetchContributionCount(docSnap.id);
          
          return { 
            id: docSnap.id, 
            ...data, 
            aiGeneratedUrl: resolvedAiGeneratedUrl, 
            isSaved: false,
            username: userProfile.username,
            profilePic: userProfile.profilePic,
            contributionCount
          };
        })
      );
      const filteredVideos = videoList.filter(v => v.aiGeneratedUrl && ['mp4', 'webm', 'ogg'].includes(v.aiGeneratedUrl.split('.').pop().split('?')[0].toLowerCase()));
      setVideos(filteredVideos);
      if (filteredVideos.length === 0) setError('No videos found in the database.');
    } catch (err) {
      console.error('Error fetching videos:', err);
      setError('Failed to load videos. Check your internet connection or Firebase configuration.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const scrollPosition = containerRef.current.scrollTop;
      const containerHeight = containerRef.current.clientHeight;
      const newIndex = Math.round(scrollPosition / containerHeight);
      
      if (newIndex !== currentIndex && newIndex >= 0 && newIndex < videos.length) {
        setCurrentIndex(newIndex);
        setShowComments(false); // Close comments when changing video
        videoRefs.current.forEach((ref, idx) => {
          if (ref) {
            if (idx === newIndex) {
              ref.play().catch(console.error);
            } else {
              ref.pause();
            }
          }
        });
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [currentIndex, videos.length]);

  // Update video time
  useEffect(() => {
    const video = videoRefs.current[currentIndex];
    if (video) {
      const updateTime = () => {
        setCurrentTime(video.currentTime);
        setDuration(video.duration || 0);
      };
      
      video.addEventListener('timeupdate', updateTime);
      video.addEventListener('loadedmetadata', updateTime);
      
      return () => {
        video.removeEventListener('timeupdate', updateTime);
        video.removeEventListener('loadedmetadata', updateTime);
      };
    }
  }, [currentIndex]);

  const handleLike = async (postId) => {
    if (!user) return navigate('/login');
    try {
      const postDocRef = doc(db, 'posts', postId);
      const postDoc = await getDoc(postDocRef);
      const postData = postDoc.data();
      let updatedLikedBy = postData.likedBy || [];
      if (updatedLikedBy.includes(user.uid)) {
        updatedLikedBy = updatedLikedBy.filter(uid => uid !== user.uid);
      } else {
        updatedLikedBy.push(user.uid);
      }
      await updateDoc(postDocRef, { likedBy: updatedLikedBy });
      setVideos(videos.map(v => v.id === postId ? { ...v, likedBy: updatedLikedBy } : v));
    } catch (err) {
      console.error('Error updating like:', err);
      setError('Failed to update like.');
    }
  };

  const handleSave = async (postId) => {
    if (!user) return navigate('/login');
    try {
      const savedPostDocRef = doc(db, 'posts', 'usersavedpost', user.uid, postId);
      const savedPostDoc = await getDoc(savedPostDocRef);
      if (savedPostDoc.exists()) {
        await setDoc(savedPostDocRef, {}, { merge: false });
        setVideos(videos.map(v => v.id === postId ? { ...v, isSaved: false } : v));
      } else {
        const post = videos.find(v => v.id === postId);
        await setDoc(savedPostDocRef, { postId, originalUserId: post.userId, aiGeneratedUrl: post.aiGeneratedUrl, caption: post.caption });
        setVideos(videos.map(v => v.id === postId ? { ...v, isSaved: true } : v));
      }
    } catch (err) {
      console.error('Error saving post:', err);
      setError('Failed to save post.');
    }
  };

  const handleShare = (postId) => {
    const url = `${window.location.origin}/post/${videos.find(v => v.id === postId).userId}/${postId}`;
    navigator.clipboard.writeText(url).then(() => {
      const message = document.createElement('div');
      message.textContent = 'Link copied to clipboard!';
      message.style.cssText = `
        position: fixed; top: 20px; right: 20px; background: #FFFFFF;
        color: #000; padding: 12px 20px; border-radius: 8px; z-index: 10000;
        font-size: 14px; font-weight: 600; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      `;
      document.body.appendChild(message);
      setTimeout(() => document.body.removeChild(message), 3000);
    }).catch(err => {
      console.error('Error copying URL:', err);
      setError('Failed to copy link.');
    });
  };

  const handleContribute = (userId, postId) => {
    if (!user) navigate('/login');
    else navigate(`/contribute/${userId}/${postId}/1`);
  };

  const handleRemix = (chatLink) => {
    if (!user) navigate('/login');
    else if (chatLink) window.open(chatLink, '_blank');
  };

  const togglePlayPause = (index) => {
    const video = videoRefs.current[index];
    if (video) {
      if (video.paused) {
        video.play();
        setIsPlaying(true);
      } else {
        video.pause();
        setIsPlaying(false);
      }
    }
  };

  const toggleMute = (index) => {
    const video = videoRefs.current[index];
    if (video) {
      video.muted = !video.muted;
      setIsMuted(video.muted);
    }
  };

  const seekVideo = (percentage) => {
    const video = videoRefs.current[currentIndex];
    if (video && duration) {
      video.currentTime = (percentage / 100) * duration;
    }
  };

  const handleCommentSubmit = async (e, postId) => {
    e.preventDefault();
    if (!user) return navigate('/login');
    if (!comment.trim()) return;

    try {
      const postDocRef = doc(db, 'posts', postId);
      const commenterDocRef = doc(db, 'users', user.uid);
      const commenterDoc = await getDoc(commenterDocRef);
      const commenterData = commenterDoc.exists() ? commenterDoc.data() : {};
      
      const newComment = {
        username: commenterData.username?.username || 'Anonymous',
        userId: user.uid,
        profilePic: commenterData.profilePic || 'https://via.placeholder.com/30?text=User',
        comment: filterProfanity(comment.trim()),
        timestamp: new Date().toISOString(),
        likes: [],
        replies: [],
      };

      const postDoc = await getDoc(postDocRef);
      const postData = postDoc.data();
      const updatedComments = [...(postData.comments || []), newComment];

      await updateDoc(postDocRef, { comments: updatedComments });
      setVideos(videos.map(v => v.id === postId ? { ...v, comments: updatedComments } : v));
      setComment('');
    } catch (err) {
      console.error('Error adding comment:', err);
      setError('Failed to add comment.');
    }
  };

  const handleCommentLike = async (postId, commentIndex) => {
    if (!user) return navigate('/login');

    try {
      const postDocRef = doc(db, 'posts', postId);
      const postDoc = await getDoc(postDocRef);
      const postData = postDoc.data();
      
      const updatedComments = postData.comments.map((c, idx) => {
        if (idx === commentIndex) {
          let updatedLikes = c.likes || [];
          if (updatedLikes.includes(user.uid)) {
            updatedLikes = updatedLikes.filter(uid => uid !== user.uid);
          } else {
            updatedLikes.push(user.uid);
          }
          return { ...c, likes: updatedLikes };
        }
        return c;
      });

      await updateDoc(postDocRef, { comments: updatedComments });
      setVideos(videos.map(v => v.id === postId ? { ...v, comments: updatedComments } : v));
    } catch (err) {
      console.error('Error liking comment:', err);
      setError('Failed to like comment.');
    }
  };

  if (loading) {
    return (
      <div style={{
        backgroundColor: '#000',
        color: '#FFF',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        paddingLeft: '80px'
      }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          style={{
            width: '60px',
            height: '60px',
            border: '3px solid #333',
            borderTopColor: '#FFF',
            borderRadius: '50%',
            marginBottom: '20px'
          }}
        />
        <p style={{ fontSize: '18px', color: '#FFF' }}>Loading videos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        backgroundColor: '#000',
        color: '#FFF',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        paddingLeft: '80px'
      }}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          style={{
            background: '#FFF',
            color: '#000',
            borderRadius: '50%',
            width: '80px',
            height: '80px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px',
            fontSize: '32px'
          }}
        >
          ⚠️
        </motion.div>
        <p style={{ fontSize: '18px', color: '#FFF', textAlign: 'center', maxWidth: '400px' }}>{error}</p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={fetchAllVideos}
          style={{
            marginTop: '20px',
            padding: '12px 24px',
            background: '#FFF',
            color: '#000',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '600'
          }}
        >
          Try Again
        </motion.button>
      </div>
    );
  }

  if (!videos.length) {
    return (
      <div style={{
        backgroundColor: '#000',
        color: '#FFF',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        paddingLeft: '80px'
      }}>
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          style={{ textAlign: 'center' }}
        >
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>📹</div>
          <h2 style={{ fontSize: '24px', marginBottom: '10px', color: '#FFFFFF' }}>No Videos Available</h2>
          <p style={{ fontSize: '16px', color: '#FFF' }}>Check back later for new content!</p>
        </motion.div>
      </div>
    );
  }

  const currentVideo = videos[currentIndex];

  return (
    <div style={{
      backgroundColor: '#000',
      height: '100vh',
      paddingLeft: '80px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Video Container */}
      <div
        ref={containerRef}
        style={{
          height: '100vh',
          overflowY: 'auto',
          scrollSnapType: 'y mandatory',
          scrollBehavior: 'smooth'
        }}
      >
        {videos.map((video, index) => (
          <motion.div
            key={video.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              height: '100vh',
              position: 'relative',
              scrollSnapAlign: 'start',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#000'
            }}
            onMouseEnter={() => setShowControls(true)}
            onMouseLeave={() => setShowControls(false)}
          >
            {/* Main Content Area - 3 Column Layout */}
            <div style={{
              width: '100%',
              height: '100vh',
              display: 'grid',
              gridTemplateColumns: '320px 1fr 80px',
              gap: '20px',
              padding: '60px 20px 20px 20px' // Added top padding
            }}>
              
              {/* Left Panel - User Info */}
              <AnimatePresence>
                {index === currentIndex && (
                  <motion.div
                    initial={{ x: -100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -100, opacity: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    style={{
                      color: '#FFF',
                      background: '#333333',
                      borderRadius: '16px',
                      padding: '20px',
                      border: '1px solid #666666',
                      height: 'fit-content',
                      maxHeight: 'calc(100vh - 100px)',
                      overflowY: 'auto',
                      position: 'sticky',
                      top: '80px'
                    }}
                  >
                    {/* User Profile */}
                    <div 
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        marginBottom: '20px',
                        cursor: 'pointer',
                        padding: '12px',
                        borderRadius: '12px',
                        border: '1px solid #666666',
                        backgroundColor: '#000000'
                      }}
                      onClick={() => navigate(`/profile/${video.userId}`)}
                    >
                      <img
                        src={video.profilePic}
                        alt="User"
                        style={{
                          width: '50px',
                          height: '50px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: '2px solid #FFF'
                        }}
                      />
                      <div>
                        <h3 style={{
                          margin: 0,
                          fontSize: '16px',
                          fontWeight: '700',
                          color: '#FFF'
                        }}>
                          @{video.username}
                        </h3>
                        <p style={{ margin: 0, fontSize: '12px', color: '#CCC' }}>Creator</p>
                      </div>
                    </div>

                    {/* Video Details */}
                    <div style={{ marginBottom: '20px' }}>
                      <div style={{ marginBottom: '12px', padding: '10px', border: '1px solid #666666', borderRadius: '8px', backgroundColor: '#000000' }}>
                        <span style={{ fontSize: '11px', color: '#CCC', fontWeight: '600' }}>MODEL</span>
                        <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#FFF', fontWeight: '500' }}>
                          {video.modelUsed || 'Unknown'}
                        </p>
                      </div>
                      
                      {video.promptUsed && (
                        <div style={{ marginBottom: '12px', padding: '10px', border: '1px solid #666666', borderRadius: '8px', backgroundColor: '#000000' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <span style={{ fontSize: '11px', color: '#CCC', fontWeight: '600' }}>PROMPT</span>
                            {video.promptUsed.split(' ').length > 40 && (
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => togglePromptExpansion(video.id)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: '#FFF',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  width: '20px',
                                  height: '20px',
                                  borderRadius: '50%',
                                  border: '1px solid #666666'
                                }}
                              >
                                {expandedPrompts[video.id] ? <FaMinus /> : <FaPlus />}
                              </motion.button>
                            )}
                          </div>
                          <p style={{
                            margin: '4px 0 0 0',
                            fontSize: '13px',
                            color: '#FFF',
                            lineHeight: '1.4',
                            wordWrap: 'break-word'
                          }}>
                            {expandedPrompts[video.id] ? video.promptUsed : truncateText(video.promptUsed, 40)}
                          </p>
                        </div>
                      )}

                      {video.caption && (
                        <div style={{ padding: '10px', border: '1px solid #666666', borderRadius: '8px', backgroundColor: '#000000' }}>
                          <span style={{ fontSize: '11px', color: '#CCC', fontWeight: '600' }}>CAPTION</span>
                          <p style={{
                            margin: '4px 0 0 0',
                            fontSize: '13px',
                            color: '#FFF',
                            lineHeight: '1.4',
                            wordWrap: 'break-word'
                          }}>
                            {video.caption}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Stats */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr 1fr',
                      gap: '8px',
                      marginBottom: '20px'
                    }}>
                      <div style={{ textAlign: 'center', padding: '8px', border: '1px solid #666666', borderRadius: '8px', backgroundColor: '#000000' }}>
                        <div style={{ fontSize: '16px', fontWeight: '700', color: '#FFF' }}>
                          {video.likedBy?.length || 0}
                        </div>
                        <div style={{ fontSize: '10px', color: '#CCC' }}>Likes</div>
                      </div>
                      <div style={{ textAlign: 'center', padding: '8px', border: '1px solid #666666', borderRadius: '8px', backgroundColor: '#000000' }}>
                        <div style={{ fontSize: '16px', fontWeight: '700', color: '#FFF' }}>
                          {video.comments?.length || 0}
                        </div>
                        <div style={{ fontSize: '10px', color: '#CCC' }}>Comments</div>
                      </div>
                      <div style={{ textAlign: 'center', padding: '8px', border: '1px solid #666666', borderRadius: '8px', backgroundColor: '#000000' }}>
                        <div style={{ fontSize: '16px', fontWeight: '700', color: '#FFF' }}>
                          {video.contributionCount || 0}
                        </div>
                        <div style={{ fontSize: '10px', color: '#CCC' }}>Contributions</div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleContribute(video.userId, video.id)}
                        style={{
                          background: '#FFF',
                          color: '#000',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '12px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: '600',
                          width: '100%'
                        }}
                      >
                        Contribute
                      </motion.button>
                      
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleRemix(video.chatLink)}
                        style={{
                          background: 'transparent',
                          color: '#FFF',
                          border: '1px solid #FFF',
                          borderRadius: '8px',
                          padding: '12px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: '600',
                          width: '100%'
                        }}
                      >
                        Remix
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Center - Video Player */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative'
              }}>
                <div style={{
                  position: 'relative',
                  width: 'auto',
                  height: '80vh',
                  maxWidth: '45vh',
                  aspectRatio: '9/16',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#000',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  border: '1px solid #333'
                }}>
                  <LazyVideo
                    ref={el => videoRefs.current[index] = el}
                    src={video.aiGeneratedUrl}
                    loop={true}
                    muted={isMuted}
                    controls={false}
                    autoPlay={false}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      cursor: 'pointer',
                      backgroundColor: '#000'
                    }}
                    onLoad={() => {
                      if (index === currentIndex) {
                        videoRefs.current[index]?.play();
                      }
                    }}
                    onError={() => console.error(`Error loading video ${video.id}`)}
                  />

                  {/* Video Controls Overlay */}
                  <AnimatePresence>
                    {showControls && index === currentIndex && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                          position: 'absolute',
                          bottom: '20px',
                          left: '20px',
                          right: '20px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: 'rgba(0, 0, 0, 0.8)',
                          borderRadius: '12px',
                          padding: '12px 16px',
                          border: '1px solid #333'
                        }}
                      >
                        <button
                          onClick={() => togglePlayPause(index)}
                          style={{
                            background: 'rgba(255, 255, 255, 0.2)',
                            border: '1px solid #333',
                            borderRadius: '50%',
                            width: '40px',
                            height: '40px',
                            color: '#fff',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          {isPlaying ? <FaPause /> : <FaPlay />}
                        </button>
                        
                        <button
                          onClick={() => toggleMute(index)}
                          style={{
                            background: 'rgba(255, 255, 255, 0.2)',
                            border: '1px solid #333',
                            borderRadius: '50%',
                            width: '40px',
                            height: '40px',
                            color: '#fff',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          {isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Video Timeline */}
                {index === currentIndex && duration > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      width: '100%',
                      maxWidth: '45vh',
                      marginTop: '15px',
                      padding: '10px',
                      background: '#333333',
                      borderRadius: '8px',
                      border: '1px solid #666666'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '8px'
                    }}>
                      <span style={{ fontSize: '12px', color: '#FFF' }}>
                        {formatTime(currentTime)}
                      </span>
                      <span style={{ fontSize: '12px', color: '#CCC' }}>
                        {formatTime(duration)}
                      </span>
                    </div>
                    <div
                      style={{
                        width: '100%',
                        height: '6px',
                        background: '#666666',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        position: 'relative'
                      }}
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const percentage = ((e.clientX - rect.left) / rect.width) * 100;
                        seekVideo(percentage);
                      }}
                    >
                      <div
                        style={{
                          width: `${(currentTime / duration) * 100}%`,
                          height: '100%',
                          background: '#FFF',
                          borderRadius: '3px',
                          transition: 'width 0.1s ease'
                        }}
                      />
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Right Panel - Action Buttons */}
              <AnimatePresence>
                {index === currentIndex && (
                  <motion.div
                    initial={{ x: 100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 100, opacity: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '20px',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {/* Like Button */}
                    <motion.div style={{ textAlign: 'center' }}>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleLike(video.id)}
                        style={{
                          background: video.likedBy && video.likedBy.includes(user?.uid) 
                            ? '#FFF' 
                            : 'rgba(255, 255, 255, 0.1)',
                          color: video.likedBy && video.likedBy.includes(user?.uid) ? '#000' : '#FFF',
                          border: '1px solid #FFF',
                          borderRadius: '50%',
                          width: '56px',
                          height: '56px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '20px',
                          marginBottom: '8px'
                        }}
                      >
                        {video.likedBy && video.likedBy.includes(user?.uid) ? <FaHeart /> : <FaRegHeart />}
                      </motion.button>
                      <span style={{ fontSize: '12px', color: '#FFF', fontWeight: '600' }}>
                        {video.likedBy?.length || 0}
                      </span>
                    </motion.div>

                    {/* Comment Button */}
                    <motion.div style={{ textAlign: 'center' }}>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setShowComments(!showComments)}
                        style={{
                          background: showComments ? '#FFF' : 'rgba(255, 255, 255, 0.1)',
                          color: showComments ? '#000' : '#FFF',
                          border: '1px solid #FFF',
                          borderRadius: '50%',
                          width: '56px',
                          height: '56px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '20px',
                          marginBottom: '8px'
                        }}
                      >
                        <FaComment />
                      </motion.button>
                      <span style={{ fontSize: '12px', color: '#FFF', fontWeight: '600' }}>
                        {video.comments?.length || 0}
                      </span>
                    </motion.div>

                    {/* Remix Button */}
                    {video.chatLink && (
                      <motion.div style={{ textAlign: 'center' }}>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleRemix(video.chatLink)}
                          style={{
                            background: '#CCCCCC',
                            color: '#000',
                            border: '1px solid #FFF',
                            borderRadius: '50%',
                            width: '56px',
                            height: '56px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '20px',
                            marginBottom: '8px'
                          }}
                        >
                          <FaPlay />
                        </motion.button>
                        <span style={{ fontSize: '12px', color: '#FFF', fontWeight: '600' }}>
                          Remix
                        </span>
                      </motion.div>
                    )}

                    {/* Share Button */}
                    <motion.div style={{ textAlign: 'center' }}>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleShare(video.id)}
                        style={{
                          background: 'rgba(255, 255, 255, 0.1)',
                          color: '#FFF',
                          border: '1px solid #FFF',
                          borderRadius: '50%',
                          width: '56px',
                          height: '56px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '20px',
                          marginBottom: '8px'
                        }}
                      >
                        <FaShare />
                      </motion.button>
                      <span style={{ fontSize: '12px', color: '#FFF', fontWeight: '600' }}>
                        Share
                      </span>
                    </motion.div>

                    {/* Save Button */}
                    <motion.div style={{ textAlign: 'center' }}>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleSave(video.id)}
                        style={{
                          background: video.isSaved ? '#FFF' : 'rgba(255, 255, 255, 0.1)',
                          color: video.isSaved ? '#000' : '#FFF',
                          border: '1px solid #FFF',
                          borderRadius: '50%',
                          width: '56px',
                          height: '56px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '20px',
                          marginBottom: '8px'
                        }}
                      >
                        {video.isSaved ? <FaBookmark /> : <FaRegBookmark />}
                      </motion.button>
                      <span style={{ fontSize: '12px', color: '#FFF', fontWeight: '600' }}>
                        Save
                      </span>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Video Progress Indicator */}
            <div style={{
              position: 'absolute',
              right: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              alignItems: 'center',
              zIndex: 10
            }}>
              {videos.map((_, idx) => (
                <div
                  key={idx}
                  style={{
                    width: '3px',
                    height: currentIndex === idx ? '30px' : '15px',
                    backgroundColor: currentIndex === idx ? '#FFF' : 'rgba(255, 255, 255, 0.3)',
                    borderRadius: '2px',
                    transition: 'all 0.3s ease'
                  }}
                />
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Comments Modal */}
      <AnimatePresence>
        {showComments && currentVideo && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              width: '400px',
              height: '100vh',
              background: '#000',
              border: '1px solid #333',
              borderRight: 'none',
              zIndex: 1000,
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Comments Header */}
            <div style={{
              padding: '20px',
              borderBottom: '1px solid #333',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ color: '#FFF', margin: 0, fontSize: '18px', fontWeight: '600' }}>
                Comments ({currentVideo.comments?.length || 0})
              </h3>
              <button
                onClick={() => setShowComments(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#FFF',
                  cursor: 'pointer',
                  fontSize: '18px'
                }}
              >
                <FaTimes />
              </button>
            </div>

            {/* Comments List */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '20px'
            }}>
              {currentVideo.comments && currentVideo.comments.length > 0 ? (
                currentVideo.comments.map((c, index) => (
                  <div key={index} style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                      <img
                        src={c.profilePic}
                        alt="Commenter Profile"
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: '1px solid #333'
                        }}
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/32?text=User';
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <Link
                            to={`/profile/${c.userId}`}
                            style={{
                              fontSize: '14px',
                              fontWeight: '600',
                              color: '#FFF',
                              textDecoration: 'none'
                            }}
                            onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                            onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                          >
                            @{c.username}
                          </Link>
                          <p style={{ fontSize: '12px', color: '#CCC', margin: 0 }}>
                            {formatTimestamp(c.timestamp)}
                          </p>
                        </div>
                        <p style={{ fontSize: '14px', marginBottom: '8px', color: '#FFF', lineHeight: '1.4' }}>
                          {c.comment}
                        </p>
                        <div style={{ display: 'flex', gap: '16px' }}>
                          <motion.button
                            onClick={() => handleCommentLike(currentVideo.id, index)}
                            style={{
                              color: '#FFF',
                              background: 'none',
                              border: 'none',
                              fontSize: '12px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              cursor: 'pointer'
                            }}
                            whileHover={{ scale: 1.1 }}
                          >
                            {c.likes && c.likes.includes(user?.uid) ? <FaHeart size={14} /> : <FaRegHeart size={14} />}
                            {c.likes ? c.likes.length : 0}
                          </motion.button>
                          <motion.button
                            onClick={() => commentInputRef.current?.focus()}
                            style={{
                              color: '#FFF',
                              background: 'none',
                              border: 'none',
                              fontSize: '12px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              cursor: 'pointer'
                            }}
                            whileHover={{ scale: 1.1 }}
                          >
                            <FaReply size={14} /> Reply
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ fontSize: '14px', color: '#CCC', textAlign: 'center', marginTop: '40px' }}>
                  No comments yet. Be the first to comment!
                </p>
              )}
            </div>

            {/* Comment Input */}
            <div style={{
              padding: '20px',
              borderTop: '1px solid #333',
              display: 'flex',
              gap: '12px',
              alignItems: 'center'
            }}>
              <input
                ref={commentInputRef}
                type="text"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleCommentSubmit(e, currentVideo.id);
                  }
                }}
                placeholder="Add a comment..."
                style={{
                  flex: '1',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #333',
                  backgroundColor: '#000',
                  color: '#FFF',
                  outline: 'none',
                  fontSize: '14px'
                }}
              />
              <motion.button
                onClick={(e) => handleCommentSubmit(e, currentVideo.id)}
                style={{
                  backgroundColor: '#FFF',
                  color: '#000',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Post
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>
        {`
          /* Hide scrollbar */
          div::-webkit-scrollbar {
            display: none;
          }
          div {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}
      </style>
    </div>
  );
};

export default Video;