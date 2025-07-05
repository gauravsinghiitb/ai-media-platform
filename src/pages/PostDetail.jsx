import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { db, storage } from '../firebase/firebase';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { auth } from '../firebase/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { ref, getDownloadURL } from 'firebase/storage';
import { FaHeart, FaRegHeart, FaPlay, FaBookmark, FaRegBookmark, FaShareAlt, FaRegComment, FaReply, FaCopy } from 'react-icons/fa';
import { motion } from 'framer-motion';

const PostDetail = () => {
  const { userId, postId } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [comment, setComment] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [mediaError, setMediaError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [userProfilePic, setUserProfilePic] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showOriginalModal, setShowOriginalModal] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showFullPrompt, setShowFullPrompt] = useState(false);
  const videoRef = useRef(null);
  const commentInputRef = useRef(null);

  console.log('PostDetail - userId from URL:', userId);
  console.log('PostDetail - postId from URL:', postId);

  const profanityList = [
    'nigga',
    'ass',
    'bitch',
    'shit',
    'fuck',
    'bastard',
    'cunt',
    'dick',
    'piss'
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

        // Fetch the post document from the posts collection
        const postDocRef = doc(db, 'posts', postId);
        const postDoc = await getDoc(postDocRef);
        if (!postDoc.exists()) {
          throw new Error('Post not found');
        }

        let postData = postDoc.data();
        console.log('PostDetail - Fetched post data:', postData);

        // Verify the post belongs to the user
        if (postData.userId !== userId) {
          throw new Error('Post does not belong to this user');
        }

        // Resolve aiGeneratedUrl if it's a storage path
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

        // Resolve originalUrl if present and it's a storage path
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

        // Fetch the user document
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
        setPost({ ...postData, username: userData.username?.username || 'user' }); // Fixed: Extract the username string

        // Check if the current user has liked the post
        if (user && postData.likedBy && postData.likedBy.includes(user.uid)) {
          setIsLiked(true);
        }
      } catch (err) {
        console.error('PostDetail - Error fetching post:', err);
        if (err.code === 'permission-denied') {
          setError('You do not have permission to view this post.');
          setTimeout(() => {
            navigate('/');
          }, 3000);
        } else if (err.message === 'Post not found' || err.message === 'Post does not belong to this user') {
          setError('The post you are trying to access does not exist.');
          setTimeout(() => {
            navigate(`/profile/${userId}`);
          }, 3000);
        } else if (err.message === 'User not found') {
          setError('The user does not exist.');
          setTimeout(() => {
            navigate('/');
          }, 3000);
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
          if (err.code === 'permission-denied') {
            console.warn('PostDetail - Permission denied when checking saved status');
          }
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
    if (isVideo) {
      console.log('PostDetail - Video URL:', post?.aiGeneratedUrl);
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

    if (!comment.trim()) {
      return;
    }

    try {
      const postDocRef = doc(db, 'posts', postId);
      const commenterDocRef = doc(db, 'users', user.uid);
      const commenterDoc = await getDoc(commenterDocRef);
      const commenterData = commenterDoc.exists() ? commenterDoc.data() : {};
      const newComment = {
        username: commenterData.username?.username || 'Anonymous', // Adjusted for nested username object
        userId: user.uid,
        profilePic: commenterData.profilePic || 'https://via.placeholder.com/30?text=User',
        comment: filterProfanity(comment.trim()),
        timestamp: new Date().toISOString(),
        likes: [],
        replies: [],
      };

      let updatedComments = post.comments || [];
      if (parentCommentId) {
        updatedComments = updatedComments.map((c, index) => {
          if (index === parseInt(parentCommentId)) {
            const updatedReplies = c.replies ? [...c.replies, newComment] : [newComment];
            return { ...c, replies: updatedReplies };
          }
          return c;
        });
      } else {
        updatedComments = [...updatedComments, newComment];
      }

      await updateDoc(postDocRef, { comments: updatedComments });
      setPost((prev) => ({
        ...prev,
        comments: updatedComments,
      }));
      setComment('');
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
    navigate(`/contribute/${userId}/${postId}/1`); // Include nodeId as '1' for the parent node
  };

  const handleSave = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const savedPostDocRef = doc(db, 'posts', 'usersavedpost', user.uid, postId);
      if (isSaved) {
        // Unsave the post by deleting the document
        await setDoc(savedPostDocRef, {}, { merge: false }); // Firestore doesn't have a direct delete in this context, so we overwrite with empty data
        setIsSaved(false);
        console.log('PostDetail - Post unsaved successfully');
      } else {
        // Save the post
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

  const truncatePrompt = (prompt) => {
    const words = prompt.split(/\s+/);
    if (words.length <= 70) return { truncated: prompt, needsTruncation: false };
    return {
      truncated: words.slice(0, 70).join(' ') + '...',
      needsTruncation: true
    };
  };

  if (loading) {
    return <div style={{ color: '#FFFFFF', backgroundColor: '#000000', padding: '10px' }}>Loading...</div>;
  }

  if (error) {
    return <div style={{ color: '#FF4040', backgroundColor: '#000000', padding: '10px' }}>{error}</div>;
  }

  if (!post || !post.aiGeneratedUrl) {
    return <div style={{ color: '#FFFFFF', backgroundColor: '#000000', padding: '10px' }}>Post not found</div>;
  }

  const promptData = post.promptUsed ? truncatePrompt(post.promptUsed) : { truncated: '', needsTruncation: false };

  return (
    <div style={{
      backgroundColor: '#000000',
      color: '#FFFFFF',
      minHeight: '100vh',
      padding: '2rem 0.5rem',
      display: 'flex',
      gap: '1.5rem',
      '@media (max-width: 768px)': {
        flexDirection: 'column'
      }
    }}>
      {/* Left Side: AI Image */}
      <div style={{
        flex: '1',
        maxWidth: '45%',
        position: 'sticky',
        top: '2rem',
        alignSelf: 'flex-start',
        '@media (max-width: 768px)': {
          maxWidth: '100%',
          position: 'relative',
          top: 0
        }
      }}>
        <motion.div
          style={{
            borderRadius: '8px',
            padding: '0.3rem',
            backgroundColor: '#000000'
          }}
        >
          {mediaError ? (
            <div style={{
              width: '100%',
              maxHeight: '400px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#000000',
              color: '#FFFFFF',
              fontSize: '14px',
              borderRadius: '8px',
              boxShadow: '0 0 8px rgba(255, 255, 255, 0.1)'
            }}>
              Media failed to load
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
                  maxHeight: '400px',
                  objectFit: 'contain',
                  backgroundColor: '#000000',
                  borderRadius: '8px',
                  boxShadow: '0 0 8px rgba(255, 255, 255, 0.1)'
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
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                  whileHover={{ scale: 1.2 }}
                >
                  <FaPlay size={20} />
                </motion.button>
              )}
            </>
          ) : (
            <img
              src={post.aiGeneratedUrl}
              alt="Post"
              style={{
                width: '100%',
                maxHeight: '400px',
                objectFit: 'contain',
                backgroundColor: '#000000',
                borderRadius: '8px',
                boxShadow: '0 0 8px rgba(255, 255, 255, 0.1)'
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

      {/* Right Side: All Details */}
      <div style={{
        flex: '1',
        maxHeight: 'calc(100vh - 4rem)',
        overflowY: 'auto',
        paddingRight: '0.3rem',
        scrollbarWidth: 'thin',
        scrollbarColor: '#FFFFFF #333333',
        '@media (max-width: 768px)': {
          maxHeight: 'none'
        }
      }}>
        {/* Post Info Section */}
        <div style={{ marginBottom: '1rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '0.5rem'
          }}>
            <img
              src={userProfilePic}
              alt="User Profile"
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '1px solid #FFFFFF'
              }}
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/24?text=User';
              }}
            />
            <Link
              to={`/profile/${userId}`}
              style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#FFFFFF',
                textDecoration: 'none',
                position: 'relative'
              }}
              onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
              onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
            >
              @{post.username || 'user'}
              <span
                style={{
                  position: 'absolute',
                  bottom: '-2px',
                  left: 0,
                  width: '100%',
                  height: '2px',
                  background: 'linear-gradient(90deg, #FFFFFF, #BBBBBB, #FFFFFF)',
                  animation: 'glow 2s ease-in-out infinite'
                }}
              />
            </Link>
          </div>

          {post.caption && (
            <p style={{
              fontSize: '14px',
              marginBottom: '0.5rem'
            }}>
              {renderTextWithMentionsAndHashtags(post.caption)}
            </p>
          )}

          <div style={{
            display: 'flex',
            gap: '1rem',
            marginBottom: '0.5rem',
            alignItems: 'center'
          }}>
            <motion.button
              onClick={handleLike}
              style={{
                color: '#FFFFFF',
                background: 'none',
                border: 'none',
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
              whileHover={{ scale: 1.2 }}
            >
              {isLiked ? <FaHeart size={20} /> : <FaRegHeart size={20} />} {post.likedBy ? post.likedBy.length : 0}
            </motion.button>
            <motion.button
              onClick={handleShare}
              style={{
                color: '#FFFFFF',
                background: 'none',
                border: 'none',
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center'
              }}
              whileHover={{ scale: 1.2 }}
            >
              <FaShareAlt size={20} />
            </motion.button>
            <motion.button
              onClick={handleSave}
              style={{
                color: '#FFFFFF',
                background: 'none',
                border: 'none',
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center'
              }}
              whileHover={{ scale: 1.2 }}
            >
              {isSaved ? <FaBookmark size={20} /> : <FaRegBookmark size={20} />}
            </motion.button>
          </div>

          <p style={{
            fontSize: '14px',
            color: '#CCCCCC',
            textAlign: 'right'
          }}>
            Posted on: {post.createdAt?.toDate ? post.createdAt.toDate().toLocaleString() : new Date(post.createdAt).toLocaleString()}
          </p>
        </div>

        <hr style={{
          border: 'none',
          borderTop: '1px solid #333333',
          margin: '0.8rem 0'
        }} />

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '0.8rem'
        }}>
          <motion.div
            className="luminous-colorful-border"
            style={{
              padding: '8px 12px',
              borderRadius: '4px',
              background: '#000000',
              color: '#FFFFFF',
              fontSize: '14px',
              fontWeight: '500',
              textAlign: 'center',
              minWidth: '100px',
              border: '1px solid #FFFFFF'
            }}
            whileHover={{ scale: 1.05 }}
          >
            {post.modelUsed || 'Unknown'}
          </motion.div>
          <motion.button
            onClick={handleRemix}
            disabled={!post.chatLink}
            style={{
              padding: '8px 12px',
              background: post.chatLink
                ? 'linear-gradient(45deg, #FFFFFF, #CCCCCC)'
                : 'linear-gradient(45deg, #555555, #666666)',
              color: post.chatLink ? '#000000' : '#AAAAAA',
              borderRadius: '4px',
              border: '1px solid #FFFFFF',
              cursor: post.chatLink ? 'pointer' : 'not-allowed',
              fontSize: '14px',
              fontWeight: '500',
              textAlign: 'center',
              minWidth: '100px',
              boxShadow: post.chatLink ? '0 0 5px rgba(255, 255, 255, 0.2)' : 'none'
            }}
            whileHover={post.chatLink ? { scale: 1.05 } : {}}
          >
            Remix
          </motion.button>
          <motion.button
            onClick={handleContribute}
            style={{
              padding: '8px 12px',
              background: 'linear-gradient(45deg, #FFD700, #FFA500)', // Gold to orange gradient
              color: '#000000',
              borderRadius: '4px',
              border: '1px solid #FFFFFF',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              textAlign: 'center',
              minWidth: '100px',
              boxShadow: '0 0 5px rgba(255, 215, 0, 0.2)'
            }}
            whileHover={{ scale: 1.05 }}
          >
            Contribute
          </motion.button>
        </div>

        {(post.originalUrl || post.promptUsed) && (
          <div style={{
            display: 'flex',
            gap: '0.8rem',
            marginBottom: '0.8rem',
            alignItems: 'flex-start',
            flexWrap: 'wrap'
          }}>
            {post.originalUrl && (
              <div style={{ flex: '0 0 auto' }}>
                <p style={{ fontSize: '16px', fontWeight: '600', marginBottom: '0.5rem' }}>
                  Original:
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
                    border: '1px solid #FFFFFF',
                    cursor: 'pointer'
                  }}
                  onClick={() => setShowOriginalModal(true)}
                  whileHover={{ scale: 1.02 }}
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
                        objectFit: 'cover',
                        backgroundColor: '#000000'
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
                minWidth: '150px',
                paddingTop: post.originalUrl ? '24px' : '0'
              }}>
                <p style={{ fontSize: '16px', fontWeight: '600', marginBottom: '0.3rem' }}>
                  Prompt:{' '}
                  <span style={{ fontWeight: '400', fontSize: '14px' }}>
                    {showFullPrompt || !promptData.needsTruncation
                      ? post.promptUsed
                      : promptData.truncated}
                  </span>
                  {promptData.needsTruncation && (
                    <motion.button
                      onClick={() => setShowFullPrompt(!showFullPrompt)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#007bff',
                        fontSize: '14px',
                        marginLeft: '5px',
                        cursor: 'pointer',
                        padding: '0'
                      }}
                      whileHover={{ scale: 1.05 }}
                    >
                      {showFullPrompt ? 'See Less' : 'See More'}
                    </motion.button>
                  )}
                </p>
              </div>
            )}
          </div>
        )}

        <hr style={{
          border: 'none',
          borderTop: '1px solid #333333',
          margin: '0.8rem 0'
        }} />

        <div style={{ marginBottom: '0.8rem' }}>
          <motion.button
            onClick={() => setShowComments(!showComments)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'none',
              border: 'none',
              color: '#FFFFFF',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
            whileHover={{ scale: 1.05 }}
          >
            <FaRegComment size={20} /> {post.comments ? post.comments.length : 0} Comments
          </motion.button>

          {showComments && (
            <>
              <div style={{ marginTop: '0.8rem', marginBottom: '0.8rem' }}>
                {post.comments && post.comments.length > 0 ? (
                  post.comments.map((c, index) => (
                    <div key={index} style={{ marginBottom: '0.8rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                        <img
                          src={c.profilePic}
                          alt="Commenter Profile"
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            border: '1px solid #FFFFFF'
                          }}
                          onError={(e) => {
                            console.error('PostDetail - Comment profile pic error:', c.profilePic);
                            e.target.src = 'https://via.placeholder.com/24?text=User';
                          }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Link
                              to={`/profile/${c.userId || userId}`}
                              style={{
                                fontSize: '14px',
                                fontWeight: '600',
                                color: '#FFFFFF',
                                textDecoration: 'none'
                              }}
                              onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                              onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                            >
                              @{c.username}
                            </Link>
                            <p style={{ fontSize: '12px', color: '#CCCCCC' }}>
                              {formatTimestamp(c.timestamp)}
                            </p>
                          </div>
                          <p style={{ fontSize: '14px', marginTop: '0.2rem' }}>
                            {renderTextWithMentionsAndHashtags(c.comment)}
                          </p>
                          <div style={{ display: 'flex', gap: '0.8rem', marginTop: '0.5rem' }}>
                            <motion.button
                              onClick={() => handleCommentLike(index)}
                              style={{
                                color: '#FFFFFF',
                                background: 'none',
                                border: 'none',
                                fontSize: '14px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                              whileHover={{ scale: 1.1 }}
                            >
                              {c.likes && c.likes.includes(user?.uid) ? <FaHeart size={18} /> : <FaRegHeart size={18} />}
                              {c.likes ? c.likes.length : 0}
                            </motion.button>
                            <motion.button
                              onClick={() => commentInputRef.current.focus()}
                              style={{
                                color: '#FFFFFF',
                                background: 'none',
                                border: 'none',
                                fontSize: '14px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                              whileHover={{ scale: 1.1 }}
                            >
                              <FaReply size={18} /> Reply
                            </motion.button>
                          </div>
                        </div>
                      </div>
                      {c.replies && c.replies.length > 0 && (
                        <div style={{ marginLeft: '1.5rem', marginTop: '0.5rem', position: 'relative' }}>
                          <div style={{
                            position: 'absolute',
                            left: '12px',
                            top: '-0.3rem',
                            bottom: '0',
                            width: '2px',
                            backgroundColor: '#CCCCCC'
                          }} />
                          {c.replies.map((reply, rIndex) => (
                            <div key={rIndex} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', marginBottom: '0.5rem', position: 'relative' }}>
                              <div style={{
                                position: 'absolute',
                                left: '-0.75rem',
                                top: '12px',
                                width: '0.75rem',
                                height: '2px',
                                backgroundColor: '#CCCCCC'
                              }} />
                              <img
                                src={reply.profilePic}
                                alt="Replier Profile"
                                style={{
                                  width: '20px',
                                  height: '20px',
                                  borderRadius: '50%',
                                  objectFit: 'cover',
                                  border: '1px solid #FFFFFF'
                                }}
                                onError={(e) => {
                                  console.error('PostDetail - Reply profile pic error:', reply.profilePic);
                                  e.target.src = 'https://via.placeholder.com/20?text=User';
                                }}
                              />
                              <div style={{ flex: '1' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <Link
                                    to={`/profile/${reply.userId || userId}`}
                                    style={{
                                      fontSize: '13px',
                                      fontWeight: '600',
                                      color: '#FFFFFF',
                                      textDecoration: 'none'
                                    }}
                                    onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                                    onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                                  >
                                    @{reply.username}
                                  </Link>
                                  <p style={{ fontSize: '11px', color: '#CCCCCC' }}>
                                    {formatTimestamp(reply.timestamp)}
                                  </p>
                                </div>
                                <p style={{ fontSize: '13px', marginTop: '0.2rem' }}>
                                  {renderTextWithMentionsAndHashtags(reply.comment)}
                                </p>
                                <div style={{ display: 'flex', gap: '0.8rem', marginTop: '0.5rem' }}>
                                  <motion.button
                                    onClick={() => handleCommentReplyLike(index, rIndex)}
                                    style={{
                                      color: '#FFFFFF',
                                      background: 'none',
                                      border: 'none',
                                      fontSize: '13px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '4px'
                                    }}
                                    whileHover={{ scale: 1.1 }}
                                  >
                                    {reply.likes && reply.likes.includes(user?.uid) ? <FaHeart size={16} /> : <FaRegHeart size={16} />}
                                    {reply.likes ? reply.likes.length : 0}
                                  </motion.button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p style={{ fontSize: '14px', color: '#CCCCCC', marginBottom: '0.8rem' }}>
                    No comments yet.
                  </p>
                )}
              </div>

              <div style={{
                display: 'flex',
                gap: '0.5rem',
                alignItems: 'center'
              }}>
                <input
                  ref={commentInputRef}
                  type="text"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleCommentSubmit(e);
                    }
                  }}
                  placeholder="Add a comment..."
                  style={{
                    flex: '1',
                    padding: '8px',
                    borderRadius: '8px',
                    border: '1px solid #FFFFFF',
                    backgroundColor: '#000000',
                    color: '#FFFFFF',
                    outline: 'none',
                    fontSize: '14px'
                  }}
                />
                <motion.button
                  onClick={handleCommentSubmit}
                  style={{
                    backgroundColor: '#FFFFFF',
                    color: '#000000',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Post
                </motion.button>
              </div>
            </>
          )}
        </div>
      </div>

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
        >
          <motion.div
            style={{
              backgroundColor: '#000000',
              padding: '1.5rem',
              borderRadius: '8px',
              width: '350px',
              maxWidth: '90%',
              color: '#FFFFFF',
              border: '1px solid #FFFFFF'
            }}
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
          >
            <h3 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '0.5rem', textAlign: 'center' }}>
              Share Post
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.5rem' }}>
              <input
                type="text"
                value={window.location.href}
                readOnly
                style={{
                  flex: 1,
                  padding: '6px',
                  borderRadius: '8px',
                  border: '1px solid #FFFFFF',
                  backgroundColor: '#222222',
                  color: '#FFFFFF',
                  fontSize: '12px'
                }}
              />
              <motion.button
                onClick={() => copyToClipboard(window.location.href)}
                style={{
                  padding: '6px',
                  backgroundColor: '#FFFFFF',
                  color: '#000000',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px'
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FaCopy size={18} /> Copy
              </motion.button>
            </div>
            <motion.button
              onClick={() => setShowShareModal(false)}
              style={{
                display: 'block',
                margin: '0 auto',
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid #FFFFFF',
                backgroundColor: '#000000',
                color: '#FFFFFF',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '500'
              }}
              whileHover={{ backgroundColor: '#1a1a1a', scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Close
            </motion.button>
          </motion.div>
        </motion.div>
      )}

      {showOriginalModal && post.originalUrl && (
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
            zIndex: 1000
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowOriginalModal(false)}
        >
          <motion.div
            style={{
              width: '350px',
              height: '350px',
              borderRadius: '8px',
              overflow: 'hidden',
              position: 'relative',
              backgroundColor: '#222222',
              border: '1px solid #FFFFFF'
            }}
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
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
                  objectFit: 'cover',
                  backgroundColor: '#000000'
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
                  e.target.src = 'https://via.placeholder.com/350?text=Original';
                }}
              />
            )}
            <motion.button
              onClick={() => setShowOriginalModal(false)}
              style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
              whileHover={{ scale: 1.1 }}
            >
              ✕
            </motion.button>
          </motion.div>
        </motion.div>
      )}

      <style>
        {`
          @keyframes rotateColorfulBorder {
            0% {
              border-image: linear-gradient(0deg, #FF4040, #40C4FF, #FFD740, #FF40FF) 1;
              box-shadow: 0 0 10px rgba(255, 64, 64, 0.5);
            }
            25% {
              border-image: linear-gradient(90deg, #40C4FF, #FFD740, #FF40FF, #FF4040) 1;
              box-shadow: 0 0 10px rgba(64, 196, 255, 0.5);
            }
            50% {
              border-image: linear-gradient(180deg, #FFD740, #FF40FF, #FF4040, #40C4FF) 1;
              box-shadow: 0 0 10px rgba(255, 215, 64, 0.5);
            }
            75% {
              border-image: linear-gradient(270deg, #FF40FF, #FF4040, #40C4FF, #FFD740) 1;
              box-shadow: 0 0 10px rgba(255, 64, 255, 0.5);
            }
            100% {
              border-image: linear-gradient(360deg, #FF4040, #40C4FF, #FFD740, #FF40FF) 1;
              box-shadow: 0 0 10px rgba(255, 64, 64, 0.5);
            }
          }

          @keyframes glow {
            0% { opacity: 0.6; }
            50% { opacity: 1; }
            100% { opacity: 0.6; }
          }

          .luminous-colorful-border {
            border: 2px solid transparent;
            border-radius: 4px;
            animation: rotateColorfulBorder 6s linear infinite;
          }

          ::-webkit-scrollbar {
            width: 4px;
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
            background: #BBBBBB;
          }
        `}
      </style>
    </div>
  );
};

export default PostDetail;