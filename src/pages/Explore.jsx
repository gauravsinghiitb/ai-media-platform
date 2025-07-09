import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase/firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import SearchPosts from '../components/SearchPosts';
import SearchGenresModelsContributions from '../components/SearchGenresModelsContributions';
import LoadingSpinner from '../components/LoadingSpinner';
import Masonry from 'react-masonry-css';
import Card from '../components/Card';
import { models } from '../data/models.js';

const Explore = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [contributions, setContributions] = useState([]);
  const [filteredResults, setFilteredResults] = useState({ users: [], posts: [], contributions: [] });
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [following, setFollowing] = useState([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        const fetchFollowing = async () => {
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            setFollowing(userDoc.data().following || []);
          }
        };
        fetchFollowing().catch(console.error);
      }
    });

    const fetchData = async () => {
      try {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const allUsers = [];
        usersSnapshot.forEach((userDoc) => {
          const userData = userDoc.data();
          allUsers.push({
            id: userDoc.id,
            ...userData,
            username: userData.username?.username,
            profilePic: userData.profilePic
          });
        });

        const postsSnapshot = await getDocs(collection(db, 'posts'));
        const allPosts = [];
        postsSnapshot.forEach((postDoc) => {
          const postData = postDoc.data();
          const userId = postData.userId || postDoc.id;
          if (postData.aiGeneratedUrl) {
            allPosts.push({
              id: postDoc.id,
              userId,
              ...postData,
              type: 'post',
              createdAt: postData.createdAt || new Date().toISOString(),
              modelUsed: postData.modelUsed || 'Unknown',
              username: postData.username || 'Unknown',
              likedBy: postData.likedBy || [],
              caption: postData.caption || 'No caption'
            });
          }
        });

        const contributionsSnapshot = await getDocs(collection(db, 'contributions'));
        const allContributions = [];
        contributionsSnapshot.forEach((contribDoc) => {
          const contribData = contribDoc.data();
          const userId = contribData.userId || contribDoc.id.split('/')[0];
          const postId = contribData.postId || contribDoc.id.split('/')[1];
          if (contribData.nodes) {
            contribData.nodes.forEach(node => {
              if (node.imageUrl) {
                allContributions.push({
                  id: node.id || contribDoc.id,
                  userId,
                  postId,
                  ...node,
                  type: 'contribution',
                  createdAt: node.createdAt || new Date().toISOString(),
                  model: node.model || 'Unknown',
                  username: node.username || 'Unknown'
                });
              }
            });
          }
        });

        setUsers(allUsers);
        setPosts(allPosts);
        setContributions(allContributions);
        setFilteredResults({ users: [], posts: [], contributions: [] });
      } catch (err) {
        console.error('Failed to fetch data:', err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData().catch(console.error);

    return () => unsubscribe();
  }, []);

  const debouncedSearch = useCallback(
    useMemo(() => {
      const debounce = (func, delay) => {
        let timeoutId;
        return (...args) => {
          clearTimeout(timeoutId);
          timeoutId = setTimeout(() => func.apply(null, args), delay);
        };
      };

      const handleSearch = (query, model) => {
        const q = query.toLowerCase().trim();
        if (!q && !model) {
          setFilteredResults({ users: [], posts: [], contributions: [] });
          return;
        }

        const filteredUsers = users.filter((user) =>
          user.username?.toLowerCase().startsWith(q)
        );

        let filteredPosts = posts;
        let filteredContributions = contributions;

        if (model) {
          filteredPosts = posts.filter((post) => post.modelUsed === model);
          filteredContributions = contributions.filter((contrib) => contrib.model === model);
        } else if (q) {
          filteredPosts = posts.filter((post) =>
            post.modelUsed?.toLowerCase().includes(q) ||
            post.promptUsed?.toLowerCase().includes(q) ||
            post.caption?.toLowerCase().includes(q) ||
            post.username?.toLowerCase().includes(q)
          );
          filteredContributions = contributions.filter((contrib) =>
            contrib.model?.toLowerCase().includes(q) ||
            contrib.prompt?.toLowerCase().includes(q) ||
            contrib.username?.toLowerCase().includes(q)
          );
        }

        setFilteredResults({ users: filteredUsers, posts: filteredPosts, contributions: filteredContributions });
      };

      return debounce(handleSearch, 300);
    }, [users, posts, contributions]),
    [users, posts, contributions]
  );

  useEffect(() => {
    debouncedSearch(searchQuery, selectedModel);
  }, [searchQuery, selectedModel, debouncedSearch]);

  const handleCardClick = (userId, postId) => {
    if (currentUser) {
      navigate(`/post/${userId}/${postId}`);
    } else {
      navigate('/login');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#000000',
        padding: '2rem 1rem 2rem 250px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}
    >
      <motion.img
        src="/logo_white_new.png"
        alt="Company Logo"
        initial={{ y:-20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
        style={{ width: '100px', marginBottom: '2rem' }}
      />
      <SearchGenresModelsContributions
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filteredUsers={filteredResults.users}
        selectedModel={selectedModel}
        setSelectedModel={setSelectedModel}
        models={models}
        style={{
          '--search-input-width': '740px',
          '--username-font-size': '1.2rem',
          '--username-padding': '10px',
          marginBottom: '0',
          position: 'relative',
          top: 0,
          width: '100%',
          maxWidth: '80rem'
        }}
      />
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        style={{ width: '100%', marginTop: '0', textAlign: 'center', minHeight: 'calc(100vh - 180px)' }}
      >
        <Masonry
          breakpointCols={{ default: 5, 1100: 2, 700: 1 }}
          className="my-masonry-grid"
          columnClassName="my-masonry-grid_column"
          style={{
            margin: '0',
            width: '100%',
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'center'
          }}
          direction="rtl"
        >
          {(selectedModel || searchQuery ? filteredResults.posts : posts).map((post) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              style={{ marginRight: '20px', marginBottom: '0' }}
            >
              <Card
                post={post}
                userId={post.userId}
                aspectRatio="1:1"
                onClick={() => handleCardClick(post.userId, post.id)}
              />
            </motion.div>
          ))}
        </Masonry>
      </motion.section>
    </div>
  );
};

export default Explore;