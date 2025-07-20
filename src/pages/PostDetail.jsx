import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { db, storage } from '../firebase/firebase';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { auth } from '../firebase/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { ref, getDownloadURL } from 'firebase/storage';
import { FaHeart, FaRegHeart, FaPlay, FaBookmark, FaRegBookmark, FaShareAlt, FaRegComment, FaReply, FaCopy, FaUser, FaClock, FaEye, FaTags } from 'react-icons/fa';
import { motion } from 'framer-motion';
import RecommendedPosts from '../components/RecommendedPosts';

const PostDetail = () => {
  const { userId, postId } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [comment, setComment] = useState('');
  const [replyComment, setReplyComment] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [mediaError, setMediaError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [userProfilePic, setUserProfilePic] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showOriginalModal, setShowOriginalModal] = useState(false);
  const [showComments, setShowComments] = useState(true);
  const [showFullPrompt, setShowFullPrompt] = useState(false);
  const videoRef = useRef(null);
  const commentInputRef = useRef(null);
  const replyInputRef = useRef(null);

  console.log('PostDetail - userId from URL:', userId);
  console.log('PostDetail - postId from URL:', postId);

  const profanityList = [
    'nigga', 'ass', 'bitch', 'shit', 'fuck', 'bastard', 'cunt', 'dick', 'piss'
  ];

  const isVideo = useMemo(() => {
    if (!post || !post.aiGeneratedUrl) return false;
    const extension = post.aiGeneratedUrl.split('.').pop().split('?')[0].toLowerCase();
    const videoExtensions = ['mp4', 'webm', 'ogg'];
    const result = videoExtensions.includes(extension);
    console.log(`PostDetail - Checking if URL is video: ${post.aiGeneratedUrl}, Extension: ${extension}, IsVideo: ${result}`);
    return result;
  }, [post?.aiGeneratedUrl]);

  useEffect(() => {
    const fetchPostAndUser = async () => {
      setLoading(true);
      try {
        if (!userId || !postId) {
          throw new Error('Missing userId or postId');
        }

        console.log(`Fetching post document for postId: ${postId}`);

        const postDocRef = doc(db, 'posts', postId);
        const postDoc = await getDoc(postDocRef);
        if (!postDoc.exists()) {
          throw new Error('Post not found');
        }

        let postData = postDoc.data();
        console.log('PostDetail - Fetched post data:', postData);

        if (postData.userId !== userId) {
          throw new Error('Post does not belong to this user');
        }

        // Resolve URLs
        let resolvedAiGeneratedUrl = postData.aiGeneratedUrl;
        if (resolvedAiGeneratedUrl && !resolvedAiGeneratedUrl.startsWith('https://')) {
          try {
            const storageRef = ref(storage, resolvedAiGeneratedUrl);
            resolvedAiGeneratedUrl = await getDownloadURL(storageRef);
            console.log('PostDetail - Resolved aiGeneratedUrl:', resolvedAiGeneratedUrl);
          } catch (err) {
            console.error('PostDetail - Failed to resolve aiGeneratedUrl:', err);
            resolvedAiGeneratedUrl = 'https://via.placeholder.com/400?text=Media+Not+Found';
          }
        }
        postData = { ...postData, aiGeneratedUrl: resolvedAiGeneratedUrl };

        let resolvedOriginalUrl = postData.originalUrl;
        if (resolvedOriginalUrl && !resolvedOriginalUrl.startsWith('https://')) {
          try {
            const storageRef = ref(storage, resolvedOriginalUrl);
            resolvedOriginalUrl = await getDownloadURL(storageRef);
            console.log('PostDetail - Resolved originalUrl:', resolvedOriginalUrl);
          } catch (err) {
            console.error('PostDetail - Failed to resolve originalUrl:', err);
            resolvedOriginalUrl = 'https://via.placeholder.com/120?text=Original';
          }
        }
        postData = { ...postData, originalUrl: resolvedOriginalUrl };

        // Fetch user data
        console.log(`Fetching user document for userId: ${userId}`);
        const userDocRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userDocRef);
        if (!userDoc.exists()) {
          throw new Error('User not found');
        }

        const userData = userDoc.data();
        console.log('PostDetail - Fetched user data:', {
          username: userData.username,
          profilePic: userData.profilePic,
          bio: userData.bio,
        });

        setUserProfilePic(userData.profilePic || 'https://via.placeholder.com/30?text=User');
        setPost({ ...postData, username: userData.username?.username || 'user', id: postId });

        if (user && postData.likedBy && postData.likedBy.includes(user.uid)) {
          setIsLiked(true);
        }
      } catch (err) {
        console.error('PostDetail - Error fetching post:', err);
        if (err.code === 'permission-denied') {
          setError('You do not have permission to view this post.');
          setTimeout(() => navigate('/'), 3000);
        } else if (err.message === 'Post not found' || err.message === 'Post does not belong to this user') {
          setError('The post you are trying to access does not exist.');
          setTimeout(() => navigate(`/profile/${userId}`), 3000);
        } else if (err.message === 'User not found') {
          setError('The user does not exist.');
          setTimeout(() => navigate('/'), 3000);
        } else {
          setError(`Failed to load post: ${err.message}`);
        }
      } finally {
        setLoading(false);
      }
    };

    const checkSavedStatus = async (currentUser) => {
      if (currentUser) {
        try {
          const savedPostDocRef = doc(db, 'posts', 'usersavedpost', currentUser.uid, postId);
          const savedPostDoc = await getDoc(savedPostDocRef);
          if (savedPostDoc.exists()) {
            setIsSaved(true);
          }
        } catch (err) {
          console.error('PostDetail - Error checking saved status:', err);
        }
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log('PostDetail - Current user:', currentUser ? currentUser.uid : 'Not logged in');
      setUser(currentUser);
      if (currentUser) {
        checkSavedStatus(currentUser);
      }
      if (currentUser && post && post.likedBy && post.likedBy.includes(currentUser.uid)) {
        setIsLiked(true);
      }
    });

    fetchPostAndUser();
    return () => {
      console.log('PostDetail - Cleaning up auth listener');
      unsubscribe();
    };
  }, [userId, postId, user, navigate]);

  useEffect(() => {
    if (isVideo && post?.aiGeneratedUrl) {
      console.log('PostDetail - Video URL:', post.aiGeneratedUrl);
      fetch(post.aiGeneratedUrl, { method: 'HEAD' })
        .then(response => {
          if (response.ok) {
            console.log('PostDetail - Video URL is accessible:', post.aiGeneratedUrl);
          } else {
            console.error('PostDetail - Video URL is not accessible:', response.status, response.statusText);
            setMediaError(true);
          }
        })
        .catch(err => {
          console.error('PostDetail - Error checking video URL accessibility:', err);
          setMediaError(true);
        });
    }
  }, [post?.aiGeneratedUrl, isVideo]);

  useEffect(() => {
    const playVideo = async () => {
      if (videoRef.current && isVideo && !mediaError) {
        try {
          await videoRef.current.play();
          setIsPlaying(true);
          console.log('PostDetail - Video playback started successfully');
        } catch (err) {
          console.error('PostDetail - Video playback failed:', err);
          setMediaError(true);
          setIsPlaying(false);
        }
      }
    };

    playVideo();
  }, [isVideo, mediaError]);

  const handleManualPlay = async () => {
    if (videoRef.current && isVideo && !mediaError) {
      try {
        await videoRef.current.play();
        setIsPlaying(true);
        console.log('PostDetail - Manual video playback started successfully');
      } catch (err) {
        console.error('PostDetail - Manual video playback failed:', err);
        setMediaError(true);
      }
    }
  };

  const handleLike = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const postDocRef = doc(db, 'posts', postId);
      let updatedLikedBy = post.likedBy || [];
      if (isLiked) {
        updatedLikedBy = updatedLikedBy.filter(uid => uid !== user.uid);
      } else {
        if (!updatedLikedBy.includes(user.uid)) {
          updatedLikedBy.push(user.uid);
        }
      }

      await updateDoc(postDocRef, { likedBy: updatedLikedBy });
      setPost((prev) => ({
        ...prev,
        likedBy: updatedLikedBy,
      }));
      setIsLiked(!isLiked);
      console.log('PostDetail - Like updated successfully, likedBy:', updatedLikedBy);
    } catch (err) {
      console.error('PostDetail - Error updating likes:', err);
      if (err.code === 'permission-denied') {
        setError('You do not have permission to like this post.');
      } else {
        setError(`Failed to like post: ${err.message}`);
      }
    }
  };

  const handleDoubleClickLike = () => {
    if (!isLiked) {
      handleLike();
    }
  };

  const filterProfanity = (text) => {
    let filteredText = text;
    profanityList.forEach((word) => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      filteredText = filteredText.replace(regex, '****');
    });
    return filteredText;
  };

  const handleCommentSubmit = async (e, parentCommentId = null) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }

    const commentText = parentCommentId !== null ? replyComment : comment;
    if (!commentText.trim()) {
      return;
    }

    try {
      const postDocRef = doc(db, 'posts', postId);
      const commenterDocRef = doc(db, 'users', user.uid);
      const commenterDoc = await getDoc(commenterDocRef);
      const commenterData = commenterDoc.exists() ? commenterDoc.data() : {};
      const newComment = {
        username: commenterData.username?.username || 'Anonymous',
        userId: user.uid,
        profilePic: commenterData.profilePic || 'https://via.placeholder.com/30?text=User',
        comment: filterProfanity(commentText.trim()),
        timestamp: new Date().toISOString(),
        likes: [],
        replies: [],
      };

      let updatedComments = post.comments || [];
      if (parentCommentId !== null) {
        updatedComments = updatedComments.map((c, index) => {
          if (index === parseInt(parentCommentId)) {
            const updatedReplies = c.replies ? [...c.replies, newComment] : [newComment];
            return { ...c, replies: updatedReplies };
          }
          return c;
        });
        setReplyComment('');
        setReplyingTo(null);
      } else {
        updatedComments = [...updatedComments, newComment];
        setComment('');
      }

      await updateDoc(postDocRef, { comments: updatedComments });
      setPost((prev) => ({
        ...prev,
        comments: updatedComments,
      }));
    } catch (err) {
      console.error('PostDetail - Error adding comment:', err);
      if (err.code === 'permission-denied') {
        setError('You do not have permission to comment on this post.');
      } else {
        setError(`Failed to add comment: ${err.message}`);
      }
    }
  };

  const handleCommentLike = async (commentIndex) => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const postDocRef = doc(db, 'posts', postId);
      const updatedComments = post.comments.map((c, idx) => {
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
      setPost((prev) => ({
        ...prev,
        comments: updatedComments,
      }));
    } catch (err) {
      console.error('PostDetail - Error liking comment:', err);
      if (err.code === 'permission-denied') {
        setError('You do not have permission to like this comment.');
      } else {
        setError(`Failed to like comment: ${err.message}`);
      }
    }
  };

  const handleCommentReplyLike = async (commentIndex, replyIndex) => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const postDocRef = doc(db, 'posts', postId);
      const updatedComments = post.comments.map((c, idx) => {
        if (idx === commentIndex) {
          const updatedReplies = c.replies.map((r, rIdx) => {
            if (rIdx === replyIndex) {
              let updatedLikes = r.likes || [];
              if (updatedLikes.includes(user.uid)) {
                updatedLikes = updatedLikes.filter(uid => uid !== user.uid);
              } else {
                updatedLikes.push(user.uid);
              }
              return { ...r, likes: updatedLikes };
            }
            return r;
          });
          return { ...c, replies: updatedReplies };
        }
        return c;
      });

      await updateDoc(postDocRef, { comments: updatedComments });
      setPost((prev) => ({
        ...prev,
        comments: updatedComments,
      }));
    } catch (err) {
      console.error('PostDetail - Error liking reply:', err);
      if (err.code === 'permission-denied') {
        setError('You do not have permission to like this reply.');
      } else {
        setError(`Failed to like reply: ${err.message}`);
      }
    }
  };

  const handleRemix = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (post.chatLink) {
      window.open(post.chatLink, '_blank');
    }
  };

  const handleContribute = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    navigate(`/contribute/${userId}/${postId}/1`);
  };

  const handleSave = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const savedPostDocRef = doc(db, 'posts', 'usersavedpost', user.uid, postId);
      if (isSaved) {
        await setDoc(savedPostDocRef, {}, { merge: false });
        setIsSaved(false);
        console.log('PostDetail - Post unsaved successfully');
      } else {
        const postToSave = {
          postId: postId,
          originalUserId: userId,
          aiGeneratedUrl: post.aiGeneratedUrl,
          caption: post.caption,
          modelUsed: post.modelUsed,
          username: post.username,
          createdAt: post.createdAt,
        };
        await setDoc(savedPostDocRef, postToSave);
        setIsSaved(true);
        console.log('PostDetail - Post saved successfully');
      }
    } catch (err) {
      console.error('PostDetail - Error saving post:', err);
      if (err.code === 'permission-denied') {
        setError('You do not have permission to save this post.');
      } else {
        setError(`Failed to save post: ${err.message}`);
      }
    }
  };

  const handleShare = () => {
    setShowShareModal(true);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('Link copied to clipboard!');
    }).catch(err => {
      console.error('PostDetail - Error copying URL:', err);
      setError('Failed to copy link to clipboard');
    });
  };

  const renderTextWithMentionsAndHashtags = (text) => {
    const parts = text.split(/([@#]\w+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('@') || part.startsWith('#')) {
        return (
          <span key={index} style={{ fontWeight: '600', color: '#BBBBBB' }}>
            {part}
          </span>
        );
      }
      return part;
    });
  };

  const getSmallAspectRatioStyle = () => {
    return {
      aspectRatio: '1 / 1',
      width: '120px',
      height: '120px'
    };
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const formatFullTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const truncatePrompt = (prompt) => {
    const words = prompt.split(/\s+/);
    if (words.length <= 70) return { truncated: prompt, needsTruncation: false };
    return {
      truncated: words.slice(0, 70).join(' ') + '...',
      needsTruncation: true
    };
  };

  const handleReplyClick = (commentIndex) => {
    setReplyingTo(commentIndex);
    setTimeout(() => {
      if (replyInputRef.current) {
        replyInputRef.current.focus();
      }
    }, 100);
  };

  if (loading) {
    return (
      <div style={{ 
        color: '#FFFFFF', 
        backgroundColor: '#000000', 
        padding: '2rem',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        paddingLeft: '80px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: '1rem' }}>Loading...</div>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            border: '3px solid #333', 
            borderTop: '3px solid #fff', 
            borderRadius: '50%', 
            animation: 'spin 1s linear infinite',
            margin: '0 auto'
          }}></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        color: '#FFFFFF', 
        backgroundColor: '#000000', 
        padding: '2rem',
        textAlign: 'center',
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        paddingLeft: '80px'
      }}>
        {error}
      </div>
    );
  }

  if (!post || !post.aiGeneratedUrl) {
    return (
      <div style={{ 
        color: '#FFFFFF', 
        backgroundColor: '#000000', 
        padding: '2rem',
        textAlign: 'center',
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        paddingLeft: '80px'
      }}>
        Post not found
      </div>
    );
  }

  const promptData = post.promptUsed ? truncatePrompt(post.promptUsed) : { truncated: '', needsTruncation: false };

  return (
    <div style={{
      backgroundColor: '#000000',
      color: '#FFFFFF',
      minHeight: '100vh',
      width: '100%',
      paddingLeft: '80px',
      transition: 'padding-left 0.3s ease'
    }}>
      {/* Main Post Content */}
      <div style={{
        padding: '1.5rem',
        display: 'flex',
        gap: '2rem',
        width: '100%',
        boxSizing: 'border-box',
        minHeight: 'calc(100vh - 3rem)',
        '@media (max-width: 1024px)': {
          flexDirection: 'column',
          gap: '1rem',
          padding: '1rem'
        }
      }}>
        {/* Left Side: Media */}
        <div style={{
          flex: '1.2',
          minHeight: '600px',
          display: 'flex',
          alignItems: 'center',
          '@media (max-width: 1024px)': {
            minHeight: '400px'
          }
        }}>
          <motion.div
            style={{
              borderRadius: '16px',
              overflow: 'hidden',
              backgroundColor: '#111111',
              border: '2px solid #333333',
              position: 'relative',
              width: '100%',
              height: 'fit-content',
              maxHeight: '80vh'
            }}
            whileHover={{ borderColor: '#FFFFFF' }}
          >
            {mediaError ? (
              <div style={{
                width: '100%',
                height: '400px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#222222',
                color: '#FFFFFF',
                fontSize: '16px',
                borderRadius: '16px'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <FaEye size={40} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                  <div>Media failed to load</div>
                </div>
              </div>
            ) : isVideo ? (
              <>
                <video
                  ref={videoRef}
                  controls
                  autoPlay
                  loop
                  muted
                  playsInline
                  crossOrigin="anonymous"
                  style={{
                    width: '100%',
                    height: 'auto',
                    maxHeight: '80vh',
                    objectFit: 'contain',
                    backgroundColor: '#000000',
                    borderRadius: '16px'
                  }}
                  onError={(e) => {
                    console.error('PostDetail - Video error:', e.nativeEvent);
                    setMediaError(true);
                    setIsPlaying(false);
                  }}
                  onCanPlay={() => console.log('PostDetail - Video can play')}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onDoubleClick={handleDoubleClickLike}
                >
                  <source src={post.aiGeneratedUrl} type={`video/${post.aiGeneratedUrl.split('.').pop().split('?')[0]}`} />
                  Your browser does not support the video tag.
                </video>
                {!isPlaying && (
                  <motion.button
                    onClick={handleManualPlay}
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      backgroundColor: 'rgba(0, 0, 0, 0.8)',
                      color: '#FFFFFF',
                      border: '2px solid #FFFFFF',
                      borderRadius: '50%',
                      width: '60px',
                      height: '60px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                    whileHover={{ scale: 1.1, backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FaPlay size={24} />
                  </motion.button>
                )}
              </>
            ) : (
              <img
                src={post.aiGeneratedUrl}
                alt="Post"
                style={{
                  width: '100%',
                  height: 'auto',
                  maxHeight: '80vh',
                  objectFit: 'contain',
                  backgroundColor: '#000000',
                  borderRadius: '16px'
                }}
                onError={(e) => {
                  console.error('PostDetail - Image error:', e.nativeEvent);
                  setMediaError(true);
                }}
                onDoubleClick={handleDoubleClickLike}
              />
            )}
          </motion.div>
        </div>

        {/* Right Side: Post Details */}
        <div style={{
          flex: '0.8',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          maxHeight: '80vh',
          overflowY: 'auto',
          paddingRight: '0.5rem',
          '@media (max-width: 1024px)': {
            maxHeight: 'none',
            paddingRight: 0
          }
        }}>
          {/* Author Section */}
          <motion.div
            style={{
              backgroundColor: '#111111',
              borderRadius: '16px',
              padding: '1.5rem',
              border: '1px solid #333333'
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              marginBottom: '1rem'
            }}>
              <img
                src={userProfilePic}
                alt="User Profile"
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid #FFFFFF'
                }}
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/50?text=User';
                }}
              />
              <div style={{ flex: 1 }}>
                <Link
                  to={`/profile/${userId}`}
                  style={{
                    fontSize: '1.2rem',
                    fontWeight: '600',
                    color: '#FFFFFF',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                  onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                  onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                >
                  <FaUser size={16} />
                  @{post.username || 'user'}
                </Link>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.9rem',
                  color: '#CCCCCC',
                  marginTop: '0.25rem'
                }}>
                  <FaClock size={14} />
                  {post.createdAt?.toDate ? 
                    formatFullTimestamp(post.createdAt.toDate()) : 
                    formatFullTimestamp(new Date(post.createdAt))
                  }
                </div>
              </div>
            </div>

            {post.caption && (
              <div style={{ marginBottom: '1rem' }}>
                <h3 style={{ 
                  fontSize: '1rem', 
                  fontWeight: '600', 
                  marginBottom: '0.5rem',
                  color: '#FFFFFF'
                }}>
                  Caption
                </h3>
                <p style={{
                  fontSize: '0.95rem',
                  lineHeight: '1.5',
                  color: '#EEEEEE'
                }}>
                  {renderTextWithMentionsAndHashtags(post.caption)}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              gap: '1rem',
              alignItems: 'center',
              flexWrap: 'wrap'
            }}>
              <motion.button
                onClick={handleLike}
                style={{
                  color: '#FFFFFF',
                  background: 'none',
                  border: 'none',
                  fontSize: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer'
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                {isLiked ? <FaHeart size={20} /> : <FaRegHeart size={20} />} 
                {post.likedBy ? post.likedBy.length : 0}
              </motion.button>
              
              <motion.button
                onClick={handleShare}
                style={{
                  color: '#FFFFFF',
                  background: 'none',
                  border: 'none',
                  fontSize: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer'
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <FaShareAlt size={20} />
                Share
              </motion.button>
              
              <motion.button
                onClick={handleSave}
                style={{
                  color: '#FFFFFF',
                  background: 'none',
                  border: 'none',
                  fontSize: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer'
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                {isSaved ? <FaBookmark size={20} /> : <FaRegBookmark size={20} />}
                Save
              </motion.button>
            </div>
          </motion.div>

          {/* Model and Actions Section */}
          <motion.div
            style={{
              backgroundColor: '#111111',
              borderRadius: '16px',
              padding: '1.5rem',
              border: '1px solid #333333'
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div style={{
              display: 'grid',
              gap: '1rem'
            }}>
              {/* Model Used */}
              <div>
                <p style={{ 
                  fontSize: '0.9rem', 
                  color: '#CCCCCC', 
                  marginBottom: '0.25rem' 
                }}>
                  AI Model
                </p>
                <div style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  background: 'linear-gradient(45deg, #333333, #444444)',
                  color: '#FFFFFF',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  border: '1px solid #555555'
                }}>
                  {post.modelUsed || 'Unknown'}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{
                display: 'flex',
                gap: '0.5rem',
                flexWrap: 'wrap'
              }}>
                <motion.button
                  onClick={handleRemix}
                  disabled={!post.chatLink}
                  style={{
                    padding: '10px 16px',
                    background: post.chatLink
                      ? 'linear-gradient(45deg, #555555, #666666)'
                      : 'linear-gradient(45deg, #333333, #444444)',
                    color: '#FFFFFF',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: post.chatLink ? 'pointer' : 'not-allowed',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    opacity: post.chatLink ? 1 : 0.6
                  }}
                  whileHover={post.chatLink ? { scale: 1.05 } : {}}
                  whileTap={post.chatLink ? { scale: 0.95 } : {}}
                >
                  Remix
                </motion.button>
                
                <motion.button
                  onClick={handleContribute}
                  style={{
                    padding: '10px 16px',
                    background: 'linear-gradient(45deg, #666666, #777777)',
                    color: '#FFFFFF',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: '500'
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Contribute
                </motion.button>
              </div>

              {/* Original Image and Prompt */}
              {(post.originalUrl || post.promptUsed) && (
                <div style={{
                  display: 'flex',
                  gap: '1rem',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap'
                }}>
                  {post.originalUrl && (
                    <div style={{ flex: '0 0 auto' }}>
                      <p style={{ 
                        fontSize: '0.9rem', 
                        color: '#CCCCCC', 
                        marginBottom: '0.5rem' 
                      }}>
                        Original Reference
                      </p>
                      <motion.div
                        style={{
                          ...getSmallAspectRatioStyle(),
                          backgroundColor: '#222222',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden',
                          border: '1px solid #444444',
                          cursor: 'pointer'
                        }}
                        onClick={() => setShowOriginalModal(true)}
                        whileHover={{ scale: 1.02, borderColor: '#FFFFFF' }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {post.originalUrl.includes('video') ? (
                          <video
                            src={post.originalUrl}
                            autoPlay
                            loop
                            muted
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                          />
                        ) : (
                          <img
                            src={post.originalUrl}
                            alt="Original Media"
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              borderRadius: '8px'
                            }}
                            onError={(e) => {
                              console.error('PostDetail - Original image error:', e.nativeEvent);
                              e.target.src = 'https://via.placeholder.com/120?text=Original';
                            }}
                          />
                        )}
                      </motion.div>
                    </div>
                  )}
                  
                  {post.promptUsed && (
                    <div style={{
                      flex: '1',
                      minWidth: '200px'
                    }}>
                      <p style={{ 
                        fontSize: '0.9rem', 
                        color: '#CCCCCC', 
                        marginBottom: '0.5rem' 
                      }}>
                        AI Prompt
                      </p>
                      <div style={{
                        backgroundColor: '#222222',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        border: '1px solid #444444'
                      }}>
                        <p style={{ 
                          fontSize: '0.85rem', 
                          lineHeight: '1.4',
                          color: '#EEEEEE'
                        }}>
                          {showFullPrompt || !promptData.needsTruncation
                            ? post.promptUsed
                            : promptData.truncated}
                        </p>
                        {promptData.needsTruncation && (
                          <motion.button
                            onClick={() => setShowFullPrompt(!showFullPrompt)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#FFFFFF',
                              fontSize: '0.8rem',
                              marginTop: '0.5rem',
                              cursor: 'pointer',
                              padding: '0'
                            }}
                            whileHover={{ scale: 1.05 }}
                          >
                            {showFullPrompt ? 'Show Less' : 'Show More'}
                          </motion.button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>

          {/* Comments Section */}
          <motion.div
            style={{
              backgroundColor: '#111111',
              borderRadius: '16px',
              padding: '1.5rem',
              border: '1px solid #333333',
              flex: 1
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1rem'
            }}>
              <FaRegComment size={20} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: '600' }}>
                Comments ({post.comments ? post.comments.length : 0})
              </h3>
            </div>

            {/* Add Comment Form */}
            <div style={{
              display: 'flex',
              gap: '0.75rem',
              alignItems: 'flex-start',
              marginBottom: '1.5rem'
            }}>
              <img
                src={user?.photoURL || 'https://via.placeholder.com/32?text=You'}
                alt="Your Profile"
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '1px solid #444444'
                }}
              />
              <div style={{ flex: 1 }}>
                <textarea
                  ref={commentInputRef}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add a comment..."
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #444444',
                    backgroundColor: '#222222',
                    color: '#FFFFFF',
                    outline: 'none',
                    fontSize: '0.9rem',
                    resize: 'vertical',
                    minHeight: '60px'
                  }}
                />
                <motion.button
                  onClick={handleCommentSubmit}
                  disabled={!comment.trim()}
                  style={{
                    backgroundColor: comment.trim() ? '#FFFFFF' : '#666666',
                    color: comment.trim() ? '#000000' : '#CCCCCC',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: comment.trim() ? 'pointer' : 'not-allowed',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    marginTop: '0.5rem'
                  }}
                  whileHover={comment.trim() ? { scale: 1.05 } : {}}
                  whileTap={comment.trim() ? { scale: 0.95 } : {}}
                >
                  Post Comment
                </motion.button>
              </div>
            </div>

            {/* Comments List */}
            <div style={{ 
              maxHeight: '400px', 
              overflowY: 'auto',
              paddingRight: '0.5rem'
            }}>
              {post.comments && post.comments.length > 0 ? (
                post.comments.map((c, index) => (
                  <motion.div
                    key={index}
                    style={{ 
                      marginBottom: '1.5rem',
                      paddingBottom: '1rem',
                      borderBottom: index < post.comments.length - 1 ? '1px solid #333333' : 'none'
                    }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                      <img
                        src={c.profilePic}
                        alt="Commenter Profile"
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: '1px solid #444444'
                        }}
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/32?text=User';
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          marginBottom: '0.25rem'
                        }}>
                          <Link
                            to={`/profile/${c.userId || userId}`}
                            style={{
                              fontSize: '0.9rem',
                              fontWeight: '600',
                              color: '#FFFFFF',
                              textDecoration: 'none'
                            }}
                            onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                            onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                          >
                            @{c.username}
                          </Link>
                          <span style={{ fontSize: '0.8rem', color: '#999999' }}>
                            {formatTimestamp(c.timestamp)}
                          </span>
                        </div>
                        
                        <p style={{ 
                          fontSize: '0.9rem', 
                          lineHeight: '1.4',
                          marginBottom: '0.5rem',
                          color: '#EEEEEE'
                        }}>
                          {renderTextWithMentionsAndHashtags(c.comment)}
                        </p>
                        
                        <div style={{ 
                          display: 'flex', 
                          gap: '1rem', 
                          alignItems: 'center'
                        }}>
                          <motion.button
                            onClick={() => handleCommentLike(index)}
                            style={{
                              color: '#CCCCCC',
                              background: 'none',
                              border: 'none',
                              fontSize: '0.8rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              cursor: 'pointer'
                            }}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            {c.likes && c.likes.includes(user?.uid) ? 
                              <FaHeart size={14} /> : <FaRegHeart size={14} />
                            }
                            {c.likes ? c.likes.length : 0}
                          </motion.button>
                          
                          <motion.button
                            onClick={() => handleReplyClick(index)}
                            style={{
                              color: '#CCCCCC',
                              background: 'none',
                              border: 'none',
                              fontSize: '0.8rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              cursor: 'pointer'
                            }}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <FaReply size={14} />
                            Reply
                          </motion.button>
                        </div>

                        {/* Reply Form */}
                        {replyingTo === index && (
                          <motion.div
                            style={{
                              marginTop: '0.75rem',
                              marginLeft: '1rem',
                              padding: '0.75rem',
                              backgroundColor: '#222222',
                              borderRadius: '8px',
                              border: '1px solid #444444'
                            }}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            transition={{ duration: 0.3 }}
                          >
                            <textarea
                              ref={replyInputRef}
                              value={replyComment}
                              onChange={(e) => setReplyComment(e.target.value)}
                              placeholder={`Reply to @${c.username}...`}
                              style={{
                                width: '100%',
                                padding: '0.5rem',
                                borderRadius: '6px',
                                border: '1px solid #555555',
                                backgroundColor: '#333333',
                                color: '#FFFFFF',
                                outline: 'none',
                                fontSize: '0.85rem',
                                resize: 'vertical',
                                minHeight: '40px'
                              }}
                            />
                            <div style={{ 
                              display: 'flex', 
                              gap: '0.5rem', 
                              marginTop: '0.5rem' 
                            }}>
                              <motion.button
                                onClick={(e) => handleCommentSubmit(e, index)}
                                disabled={!replyComment.trim()}
                                style={{
                                  backgroundColor: replyComment.trim() ? '#FFFFFF' : '#666666',
                                  color: replyComment.trim() ? '#000000' : '#CCCCCC',
                                  padding: '6px 12px',
                                  borderRadius: '6px',
                                  border: 'none',
                                  cursor: replyComment.trim() ? 'pointer' : 'not-allowed',
                                  fontSize: '0.8rem',
                                  fontWeight: '500'
                                }}
                                whileHover={replyComment.trim() ? { scale: 1.05 } : {}}
                                whileTap={replyComment.trim() ? { scale: 0.95 } : {}}
                              >
                                Reply
                              </motion.button>
                              <motion.button
                                onClick={() => {
                                  setReplyingTo(null);
                                  setReplyComment('');
                                }}
                                style={{
                                  backgroundColor: 'transparent',
                                  color: '#CCCCCC',
                                  padding: '6px 12px',
                                  borderRadius: '6px',
                                  border: '1px solid #555555',
                                  cursor: 'pointer',
                                  fontSize: '0.8rem'
                                }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                Cancel
                              </motion.button>
                            </div>
                          </motion.div>
                        )}

                        {/* Replies */}
                        {c.replies && c.replies.length > 0 && (
                          <div style={{ 
                            marginLeft: '1rem', 
                            marginTop: '0.75rem',
                            borderLeft: '2px solid #444444',
                            paddingLeft: '1rem'
                          }}>
                            {c.replies.map((reply, rIndex) => (
                              <motion.div 
                                key={rIndex} 
                                style={{ 
                                  display: 'flex', 
                                  gap: '0.5rem', 
                                  alignItems: 'flex-start', 
                                  marginBottom: '0.75rem'
                                }}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3, delay: rIndex * 0.1 }}
                              >
                                <img
                                  src={reply.profilePic}
                                  alt="Replier Profile"
                                  style={{
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '50%',
                                    objectFit: 'cover',
                                    border: '1px solid #444444'
                                  }}
                                  onError={(e) => {
                                    e.target.src = 'https://via.placeholder.com/24?text=User';
                                  }}
                                />
                                <div style={{ flex: '1' }}>
                                  <div style={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'center',
                                    marginBottom: '0.25rem'
                                  }}>
                                    <Link
                                      to={`/profile/${reply.userId || userId}`}
                                      style={{
                                        fontSize: '0.8rem',
                                        fontWeight: '600',
                                        color: '#FFFFFF',
                                        textDecoration: 'none'
                                      }}
                                      onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                                      onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                                    >
                                      @{reply.username}
                                    </Link>
                                    <span style={{ fontSize: '0.75rem', color: '#999999' }}>
                                      {formatTimestamp(reply.timestamp)}
                                    </span>
                                  </div>
                                  <p style={{ 
                                    fontSize: '0.85rem', 
                                    lineHeight: '1.4',
                                    marginBottom: '0.25rem',
                                    color: '#EEEEEE'
                                  }}>
                                    {renderTextWithMentionsAndHashtags(reply.comment)}
                                  </p>
                                  <motion.button
                                    onClick={() => handleCommentReplyLike(index, rIndex)}
                                    style={{
                                      color: '#CCCCCC',
                                      background: 'none',
                                      border: 'none',
                                      fontSize: '0.75rem',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.25rem',
                                      cursor: 'pointer'
                                    }}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                  >
                                    {reply.likes && reply.likes.includes(user?.uid) ? 
                                      <FaHeart size={12} /> : <FaRegHeart size={12} />
                                    }
                                    {reply.likes ? reply.likes.length : 0}
                                  </motion.button>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div style={{ 
                  textAlign: 'center', 
                  color: '#999999', 
                  padding: '2rem' 
                }}>
                  <FaRegComment size={40} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                  <p>No comments yet. Be the first to comment!</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Recommendations Section */}
      <div style={{ 
        paddingLeft: '80px', 
        transition: 'padding-left 0.3s ease' 
      }}>
        <RecommendedPosts currentPost={post} currentUserId={userId} />
      </div>

      {/* Share Modal */}
      {showShareModal && (
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
            zIndex: 1000
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowShareModal(false)}
        >
          <motion.div
            style={{
              backgroundColor: '#111111',
              padding: '2rem',
              borderRadius: '16px',
              width: '400px',
              maxWidth: '90%',
              color: '#FFFFFF',
              border: '1px solid #333333'
            }}
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ 
              fontSize: '1.3rem', 
              fontWeight: '600', 
              marginBottom: '1rem', 
              textAlign: 'center' 
            }}>
              Share Post
            </h3>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              marginBottom: '1rem' 
            }}>
              <input
                type="text"
                value={window.location.href}
                readOnly
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #444444',
                  backgroundColor: '#222222',
                  color: '#FFFFFF',
                  fontSize: '0.9rem'
                }}
              />
              <motion.button
                onClick={() => copyToClipboard(window.location.href)}
                style={{
                  padding: '0.75rem',
                  backgroundColor: '#FFFFFF',
                  color: '#000000',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FaCopy size={16} /> Copy
              </motion.button>
            </div>
            <motion.button
              onClick={() => setShowShareModal(false)}
              style={{
                display: 'block',
                margin: '0 auto',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                border: '1px solid #444444',
                backgroundColor: 'transparent',
                color: '#FFFFFF',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
              whileHover={{ backgroundColor: '#222222', scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Close
            </motion.button>
          </motion.div>
        </motion.div>
      )}

      {/* Original Modal */}
      {showOriginalModal && post.originalUrl && (
        <motion.div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowOriginalModal(false)}
        >
          <motion.div
            style={{
              maxWidth: '80%',
              maxHeight: '80%',
              borderRadius: '16px',
              overflow: 'hidden',
              position: 'relative',
              backgroundColor: '#111111',
              border: '2px solid #333333'
            }}
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
            onClick={(e) => e.stopPropagation()}
          >
            {post.originalUrl.includes('video') ? (
              <video
                src={post.originalUrl}
                controls
                autoPlay
                loop
                muted
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain'
                }}
              />
            ) : (
              <img
                src={post.originalUrl}
                alt="Original Media"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain'
                }}
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/400?text=Original';
                }}
              />
            )}
            <motion.button
              onClick={() => setShowOriginalModal(false)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                color: '#FFFFFF',
                border: '1px solid #FFFFFF',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '1.2rem'
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              ✕
            </motion.button>
          </motion.div>
        </motion.div>
      )}

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          ::-webkit-scrollbar {
            width: 6px;
          }
          ::-webkit-scrollbar-track {
            background: #333333;
            borderRadius: 8px;
          }
          ::-webkit-scrollbar-thumb {
            background: #FFFFFF;
            borderRadius: 8px;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: #CCCCCC;
          }
        `}
      </style>
    </div>
  );
};

export default PostDetail;