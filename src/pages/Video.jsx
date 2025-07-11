import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, storage } from '../firebase/firebase';
import { collection, getDocs, query, where, limit, doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { auth } from '../firebase/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { ref, getDownloadURL } from 'firebase/storage';
import { FaHeart, FaRegHeart, FaComment, FaEdit, FaShare, FaPlay, FaBookmark, FaRegBookmark } from 'react-icons/fa';
import { motion } from 'framer-motion';

const Video = () => {
  const navigate = useNavigate();
  const [videos, setVideos] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const videoRefs = useRef([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      fetchAllVideos();
    });
    return () => unsubscribe();
  }, []);

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
          return { id: docSnap.id, ...data, aiGeneratedUrl: resolvedAiGeneratedUrl, isSaved: false };
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
      const scrollPosition = window.scrollY + window.innerHeight / 2;
      const newIndex = Math.floor(scrollPosition / (window.innerHeight * 0.9));
      if (newIndex >= 0 && newIndex < videoRefs.current.length) {
        setCurrentIndex(newIndex);
        videoRefs.current.forEach((ref, idx) => {
          if (ref) ref[idx === newIndex ? 'play' : 'pause']();
        });
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [videos.length]);

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
    navigator.clipboard.writeText(url).then(() => alert('Link copied!')).catch(err => {
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

  if (loading) return <div style={{ color: '#FFF', background: '#000', padding: '20px', textAlign: 'center' }}>Loading...</div>;
  if (error) return <div style={{ color: '#FF4040', background: '#000', padding: '20px', textAlign: 'center' }}>{error}</div>;
  if (!videos.length) return <div style={{ color: '#FFF', background: '#000', padding: '20px', textAlign: 'center' }}>No videos available.</div>;

  return (
    <div style={{ backgroundColor: '#000', color: '#FFF', padding: '20px', minHeight: '100vh', overflowY: 'auto' }}>
      {videos.map((video, index) => (
        <div key={video.id} style={{ height: '90vh', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '40px' }}>
          {/* LEFT SIDE DETAILS */}
          <div style={{ width: '25vw', color: '#FFF', display: index === currentIndex ? 'flex' : 'none', flexDirection: 'column', justifyContent: 'center', gap: '20px', fontSize: '18px' }}>
            <p><strong>Model:</strong> {video.modelUsed || 'Unknown'}</p>
            <p><strong>Prompt:</strong> {video.promptUsed || 'N/A'}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img src={video.profilePic || 'https://via.placeholder.com/40?text=User'} alt="User" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
              <span style={{ fontWeight: '600', fontSize: '20px' }}>@{video.username || 'user'}</span>
            </div>
            <p style={{ fontSize: '20px' }}>{video.caption || ''}</p>
          </div>

          {/* VIDEO */}
          <div style={{ position: 'relative', width: '100%', maxWidth: '400px', aspectRatio: '9/16', border: '1px solid #333', borderRadius: '8px', overflow: 'hidden' }}>
            <video
              ref={el => videoRefs.current[index] = el}
              src={video.aiGeneratedUrl}
              controls
              autoPlay={index === currentIndex}
              loop
              muted
              playsInline
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              onError={() => console.error(`Error loading video ${video.id}`)}
            />
          </div>

          {/* RIGHT SIDE ICONS */}
          <div style={{ width: '60px', color: '#FFF', display: index === currentIndex ? 'flex' : 'none', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '20px' }}>
            <motion.button onClick={() => handleLike(video.id)} whileHover={{ scale: 1.1 }} style={{ background: 'none', border: 'none', color: '#FFF' }}>
              {video.likedBy && video.likedBy.includes(user?.uid) ? <FaHeart size={28} /> : <FaRegHeart size={28} />}
              <div>{video.likedBy?.length || 0}</div>
            </motion.button>
            <motion.button onClick={() => handleContribute(video.userId, video.id)} whileHover={{ scale: 1.1 }} style={{ background: 'none', border: 'none', color: '#FFF' }}>
              <FaEdit size={28} />
            </motion.button>
            <motion.button onClick={() => navigate(`/post/${video.userId}/${video.id}`)} whileHover={{ scale: 1.1 }} style={{ background: 'none', border: 'none', color: '#FFF' }}>
              <FaComment size={28} />
            </motion.button>
            <motion.button onClick={() => handleRemix(video.chatLink)} whileHover={{ scale: 1.1 }} style={{ background: 'none', border: 'none', color: '#FFF' }} disabled={!video.chatLink}>
              <FaPlay size={28} />
            </motion.button>
            <motion.button onClick={() => handleShare(video.id)} whileHover={{ scale: 1.1 }} style={{ background: 'none', border: 'none', color: '#FFF' }}>
              <FaShare size={28} />
            </motion.button>
            <motion.button onClick={() => handleSave(video.id)} whileHover={{ scale: 1.1 }} style={{ background: 'none', border: 'none', color: '#FFF' }}>
              {video.isSaved ? <FaBookmark size={28} /> : <FaRegBookmark size={28} />}
            </motion.button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Video;