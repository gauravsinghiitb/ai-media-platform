import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase/firebase';
import { collection, getDocs, doc, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import Card from '../components/Card';
import LoadingSpinner from '../components/LoadingSpinner';

const Explore = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [filteredResults, setFilteredResults] = useState({ users: [], posts: [] });
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [following, setFollowing] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);

  const categories = [
    { name: "Midjourney", filter: "midjourney", type: "model" },
    { name: "DALL·E 3", filter: "dall·e 3", type: "model" },
    { name: "Stable Diffusion", filter: "stable diffusion", type: "model" },
    { name: "Sora (OpenAI)", filter: "sora (openai)", type: "model" },
    { name: "Veo (Google DeepMind)", filter: "veo (google deepmind)", type: "model" },
    { name: "Adobe Firefly", filter: "adobe firefly", type: "model" },
    { name: "Ideogram", filter: "ideogram", type: "model" },
    { name: "Leonardo AI", filter: "leonardo ai", type: "model" },
    { name: "Pika Labs", filter: "pika labs", type: "model" },
    { name: "xAI (Grok)", filter: "xai image generator (grok)", type: "model" },
    { name: "Runway ML Gen Model", filter: "runway ml gen model", type: "model" },
    { name: "Synthesia", filter: "synthesia", type: "model" },
    { name: "DeepBrain AI", filter: "deepbrain ai", type: "model" },
    { name: "Rephrase.ai", filter: "rephrase.ai", type: "model" },
    { name: "Imagen 2 ", filter: "imagen 2 (google deepmind)", type: "model" },
    { name: "Emu (Meta)", filter: "emu (meta)", type: "model" },
    { name: "Make-A-Video (Meta)", filter: "make-a-video (meta)", type: "model" },
    { name: "DreamFusion (Google)", filter: "dreamfusion (google - 3d from text)", type: "model" },
    { name: "Phenaki (Google)", filter: "phenaki (google - long video from text)", type: "model" },
    { name: "Ghibli Art", filter: "ghibli", type: "genre" },
    { name: "Minecraft Style", filter: "minecraft", type: "genre" },
    { name: "Anime Style", filter: "anime", type: "genre" },
    { name: "Pixar Style Art", filter: "pixar", type: "genre" }
  ];

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
        fetchFollowing();
      }
    });

    const fetchData = async () => {
      try {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const allUsers = [];
        const allPosts = [];
        usersSnapshot.forEach((userDoc) => {
          const userData = userDoc.data();
          allUsers.push({ id: userDoc.id, ...userData });
          (userData.posts || []).forEach((post) => {
            if (post && post.aiGeneratedUrl) {
              allPosts.push({ userId: userDoc.id, ...post });
            }
          });
        });
        setUsers(allUsers);
        setPosts(allPosts);
        setFilteredResults({ users: [], posts: [] });
      } catch (err) {
        console.error('Failed to fetch data:', err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) {
      if (selectedCategories.length > 0) {
        const filteredPosts = filterPostsByCategories(selectedCategories);
        setFilteredResults({ users: [], posts: filteredPosts });
      } else {
        setFilteredResults({ users: [], posts: [] });
      }
      return;
    }

    const filteredUsers = users.filter((user) =>
      user.username?.toLowerCase().includes(query)
    );

    let filteredPosts = posts.filter((post) =>
      post.modelUsed?.toLowerCase().includes(query) ||
      post.promptUsed?.toLowerCase().includes(query) ||
      post.caption?.toLowerCase().includes(query)
    );

    if (selectedCategories.length > 0) {
      const categoryPosts = filterPostsByCategories(selectedCategories);
      filteredPosts = filteredPosts.filter((post) =>
        categoryPosts.some((categoryPost) => categoryPost.createdAt === post.createdAt && categoryPost.userId === post.userId)
      );
    }

    setFilteredResults({ users: filteredUsers, posts: filteredPosts });
  }, [searchQuery, users, posts, selectedCategories]);

  const filterPostsByCategories = (selectedCats) => {
    const selectedCategoryObjects = categories.filter((cat) => selectedCats.includes(cat.name));
    let filteredPosts = [];

    selectedCategoryObjects.forEach((category) => {
      let postsForCategory = [];
      if (category.type === 'model') {
        postsForCategory = posts.filter((post) =>
          post.modelUsed?.toLowerCase() === category.filter.toLowerCase()
        );
      } else if (category.type === 'genre') {
        postsForCategory = posts.filter((post) =>
          post.promptUsed?.toLowerCase().includes(category.filter) ||
          post.caption?.toLowerCase().includes(category.filter)
        );
      }
      filteredPosts = [...filteredPosts, ...postsForCategory];
    });

    return [...new Set(filteredPosts.map((post) => JSON.stringify(post)))].map((post) => JSON.parse(post));
  };

  const handleFilterByCategory = (category) => {
    setSelectedCategories((prev) => {
      if (prev.includes(category.name)) {
        return prev.filter((cat) => cat !== category.name);
      } else {
        return [...prev, category.name];
      }
    });
    setSearchQuery('');
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategories([]);
    setFilteredResults({ users: [], posts: [] });
  };

  const handleFollow = async (targetUserId) => {
    if (!currentUser) {
      alert('Please log in to follow users.');
      return;
    }

    try {
      const currentUserRef = doc(db, 'users', currentUser.uid);
      const targetUserRef = doc(db, 'users', targetUserId);

      if (following.includes(targetUserId)) {
        await updateDoc(currentUserRef, {
          following: arrayRemove(targetUserId)
        });
        await updateDoc(targetUserRef, {
          followers: arrayRemove(currentUser.uid)
        });
        setFollowing(following.filter((id) => id !== targetUserId));
      } else {
        await updateDoc(currentUserRef, {
          following: arrayUnion(targetUserId)
        });
        await updateDoc(targetUserRef, {
          followers: arrayUnion(currentUser.uid)
        });
        setFollowing([...following, targetUserId]);
      }
    } catch (err) {
      console.error('Failed to update follow status:', err.message);
    }
  };

  if (loading) return <LoadingSpinner />;

  const renderExploreCategoriesSection = () => (
    <motion.section
      style={{
        padding: '2rem 1rem',
        maxWidth: '80rem',
        margin: '0 auto',
        marginBottom: '2rem', 
        marginTop: '-5rem'
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    >
      <motion.h2
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
        style={{
          fontSize: '1.8rem',
          fontWeight: '800',
          marginBottom: '1.5rem',
          textAlign: 'center',
          color: '#FFFFFF',
          padding: '5px',
          borderRadius: '8px'
        }}
      >
        Models & Categories
      </motion.h2>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        paddingBottom: '1rem'
      }}>
        {categories.map((category, index) => (
          <motion.button
            key={category.name}
            onClick={() => handleFilterByCategory(category)}
            style={{
              padding: '8px 16px',
              backgroundColor: selectedCategories.includes(category.name) ? '#FFFFFF' : '#000000',
              color: selectedCategories.includes(category.name) ? '#000000' : '#FFFFFF',
              borderRadius: '5px',
              border: selectedCategories.includes(category.name) ? '0.1px solid #000000' : '0.1px solid rgb(255, 255, 255)',
              cursor: 'pointer',
              fontSize: '14px'
            }}
            onMouseEnter={(e) => {
              if (!selectedCategories.includes(category.name)) {
                e.target.classList.add('luminous-border');
              }
            }}
            onMouseLeave={(e) => {
              if (!selectedCategories.includes(category.name)) {
                e.target.classList.remove('luminous-border');
              }
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.5 }}
          >
            {category.name}
          </motion.button>
        ))}
      </div>
      <motion.button
        onClick={resetFilters}
        style={{
          display: 'block',
          margin: '1rem auto 0',
          padding: '8px 16px',
          backgroundColor: '#FFFFFF',
          color: '#000000',
          borderRadius: '80px',
          border: 'none',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '500'
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        Reset Filters
      </motion.button>
    </motion.section>
  );

  const renderPostsSection = () => (
    (searchQuery || selectedCategories.length > 0) && (
      <motion.section
        style={{
          padding: '2rem 1rem',
          maxWidth: '80rem',
          margin: '0 auto',
          marginBottom: '2rem'
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <motion.h2
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          style={{
            fontSize: '2rem',
            fontWeight: '800',
            marginBottom: '1.5rem',
            textAlign: 'center',
            color: '#FFFFFF'
          }}
        >
          Posts
        </motion.h2>
        {filteredResults.posts.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0px' }}>
            {filteredResults.posts.map((post, index) => (
              <motion.div
                key={post.createdAt || index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
              >
                <Card post={post} userId={post.userId} aspectRatio="1:1" />
              </motion.div>
            ))}
          </div>
        ) : (
          <p style={{ color: '#FFFFFF', textAlign: 'center', fontSize: '1.2rem', padding: '2rem' }}>
            No posts found.
          </p>
        )}
      </motion.section>
    )
  );

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#000000', paddingBottom: '4rem' }}>
      {/* Search Section */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        style={{
          padding: '4rem 1rem',
          maxWidth: '80rem',
          margin: '0 auto'
        }}
      >
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          style={{
            fontSize: '2.5rem',
            fontWeight: '800',
            marginBottom: '2rem',
            marginTop: '2rem',
            textAlign: 'center',
            color: '#FFFFFF'
          }}
        >
          Explore
        </motion.h1>
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.8 }}
        >
          <div style={{ maxWidth: '640px', margin: '0 auto', marginBottom: '24px' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by username, model, genre, or prompt..."
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: '#000000',
                borderRadius: '8px',
                color: '#FFFFFF',
                border: '2px solid transparent', // Changed from 10px to 2px for better visibility of border-radius
                fontSize: '16px',
                width: '100%',
                boxSizing: 'border-box',
                borderImage: 'linear-gradient(45deg, #ff0000, #0000ff, #ff00ff, #00ff00, rgb(223, 79, 6)) 1',
                animation: 'rotateBorder 5s linear infinite'
              }}
              className="luminous-border"
            />
          </div>
        </motion.div>
      </motion.section>

      {/* Search Results - Users */}
      {filteredResults.users.length > 0 && searchQuery && (
        <motion.section
          style={{
            padding: '2rem 1rem',
            maxWidth: '80rem',
            margin: '0 auto',
            marginBottom: '2rem'
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          <motion.h2
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            style={{
              fontSize: '2rem',
              fontWeight: '800',
              marginBottom: '1.5rem',
              textAlign: 'center',
              color: '#FFFFFF'
            }}
          >
            Users
          </motion.h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {filteredResults.users.map((user, index) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '16px',
                  backgroundColor: '#000000',
                  borderRadius: '8px',
                  border: '1px solid #FFFFFF',
                  cursor: 'pointer'
                }}
              >
                <div
                  style={{ display: 'flex', alignItems: 'center', flex: 1 }}
                  onClick={() => navigate(`/profile/${user.id}`)}
                >
                  {user.profilePic ? (
                    <img
                      src={user.profilePic}
                      alt={user.username}
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        marginRight: '16px',
                        border: '1px solid #FFFFFF'
                      }}
                    />
                  ) : (
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      backgroundColor: '#000000',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#FFFFFF',
                      marginRight: '16px',
                      border: '1px solid #FFFFFF',
                      fontSize: '14px'
                    }}>
                      No Pic
                    </div>
                  )}
                  <p style={{ color: '#FFFFFF', fontWeight: '600', fontSize: '16px' }}>
                    @{user.username || 'Unknown'}
                  </p>
                </div>
                {currentUser && currentUser.uid !== user.id && (
                  <motion.button
                    onClick={() => handleFollow(user.id)}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: following.includes(user.id) ? '#000000' : '#FFFFFF',
                      color: following.includes(user.id) ? '#FFFFFF' : '#000000',
                      borderRadius: '8px',
                      border: following.includes(user.id) ? '1px solid #FFFFFF' : 'none',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {following.includes(user.id) ? 'Unfollow' : 'Follow'}
                  </motion.button>
                )}
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}

      {/* Conditionally Render Sections Based on Search Query */}
      {searchQuery ? (
        <>
          {renderPostsSection()}
          {renderExploreCategoriesSection()}
        </>
      ) : (
        <>
          {renderExploreCategoriesSection()}
          {renderPostsSection()}
        </>
      )}

      <style>
        {`
          @keyframes rotateBorder {
            0% {
              border-image: linear-gradient(0deg, #ff0000, #0000ff, #ff00ff, #00ff00) 1;
              box-shadow: 0 0 10px rgba(255, 0, 0, 0.5), 0 0 20px rgba(255, 0, 0, 0.3);
            }
            25% {
              border-image: linear-gradient(90deg, #ff0000, #0000ff, #ff00ff, #00ff00) 1;
              box-shadow: 0 0 10px rgba(0, 0, 255, 0.5), 0 0 20px rgba(0, 0, 255, 0.3);
            }
            50% {
              border-image: linear-gradient(180deg, #ff0000, #0000ff, #ff00ff, #00ff00) 1;
              box-shadow: 0 0 10px rgba(255, 0, 255, 0.5), 0 0 20px rgba(255, 0, 255, 0.3);
            }
            75% {
              border-image: linear-gradient(270deg, #ff0000, #0000ff, #ff00ff, #00ff00) 1;
              box-shadow: 0 0 10px rgba(0, 255, 0, 0.5), 0 0 20px rgba(0, 255, 0, 0.3);
            }
            100% {
              border-image: linear-gradient(360deg, #ff0000, #0000ff, #ff00ff, #00ff00) 1;
              box-shadow: 0 0 10px rgba(255, 0, 0, 0.5), 0 0 20px rgba(255, 0, 0, 0.3);
            }
          }

          .luminous-border {
            border: 2px solid transparent;
            border-radius: 8px;
            animation: rotateBorder 4s linear infinite;
          }

          input.luminous-border:focus {
            outline: none;
            border: 2px solid transparent; /* Changed from 1.5px to 2px for consistency */
            border-radius: 8px;
            border-image: linear-gradient(45deg, #ff0000, #0000ff, #ff00ff, #00ff00, rgb(223, 79, 6)) 1;
            animation: rotateBorder 5s linear infinite;
          }
        `}
      </style>
    </div>
  );
};

export default Explore;