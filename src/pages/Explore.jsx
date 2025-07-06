import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase/firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import SearchUsers from '../components/SearchUsers';
import SearchPosts from '../components/SearchPosts';
import SearchGenresModelsContributions from '../components/SearchGenresModelsContributions';
import ModelButtonCategories from '../components/ModelButtonCategories';
import LoadingSpinner from '../components/LoadingSpinner';
import { models } from '../data/models';

const Explore = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [contributions, setContributions] = useState([]);
  const [filteredResults, setFilteredResults] = useState({ users: [], posts: [], contributions: [] });
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [following, setFollowing] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);

  const categories = [
    ...models.map(model => ({ name: model, filter: model.toLowerCase(), type: "model" })).sort((a, b) => a.name.localeCompare(b.name)),
    { name: "Ghibli Art", filter: "ghibli", type: "genre" },
    { name: "Anime Style", filter: "anime", type: "genre" },
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
        fetchFollowing().catch(console.error);
      }
    });

    const fetchData = async () => {
      try {
        console.log('Fetching users...');
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const allUsers = [];
        usersSnapshot.forEach((userDoc) => {
          const userData = userDoc.data();
          allUsers.push({ id: userDoc.id, ...userData, username: userData.username?.username, profilePic: userData.profilePic });
        });
        console.log('Users fetched:', allUsers.length, allUsers);

        console.log('Fetching posts...');
        const postsSnapshot = await getDocs(collection(db, 'posts'));
        const allPosts = [];
        postsSnapshot.forEach((postDoc) => {
          const postData = postDoc.data();
          console.log('Post data:', postDoc.id, postData);
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
        console.log('Posts fetched:', allPosts.length, allPosts);

        console.log('Fetching contributions...');
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
        console.log('Contributions fetched:', allContributions.length, allContributions);

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

  const getUsernameFromUserId = async (userId) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      return userDoc.exists() ? userDoc.data().username?.username : null;
    } catch (err) {
      console.error('Error fetching username:', err.message);
      return null;
    }
  };

  const debouncedSearch = useCallback(
    useMemo(() => {
      const debounce = (func, delay) => {
        let timeoutId;
        return (...args) => {
          clearTimeout(timeoutId);
          timeoutId = setTimeout(() => func.apply(null, args), delay);
        };
      };

      const handleSearch = (query) => {
        const filterData = () => {
          const q = query.toLowerCase().trim();
          console.log('Search query:', q);
          if (!q) {
            if (selectedCategories.length > 0) {
              const filteredItems = filterItemsByCategories(selectedCategories);
              console.log('Applying category filter, filtered posts:', filteredItems.posts);
              setFilteredResults({ users: [], posts: filteredItems.posts, contributions: filteredItems.contributions });
            } else {
              console.log('No search or categories, resetting filtered results');
              setFilteredResults({ users: [], posts: [], contributions: [] });
            }
            return;
          }

          const filteredUsers = users.filter((user) =>
            user.username?.toLowerCase().startsWith(q)
          );
          console.log('Filtered users:', filteredUsers);

          const filteredPosts = posts.filter((post) =>
            post.modelUsed?.toLowerCase().includes(q) ||
            post.promptUsed?.toLowerCase().includes(q) ||
            post.caption?.toLowerCase().includes(q) ||
            post.username?.toLowerCase().includes(q)
          );
          console.log('Filtered posts:', filteredPosts);

          const filteredContributions = contributions.filter((contrib) =>
            contrib.model?.toLowerCase().includes(q) ||
            contrib.prompt?.toLowerCase().includes(q) ||
            contrib.username?.toLowerCase().includes(q)
          );
          console.log('Filtered contributions:', filteredContributions);

          setFilteredResults({ users: filteredUsers, posts: filteredPosts, contributions: filteredContributions });
        };
        filterData();
      };

      return debounce(handleSearch, 300);
    }, [users, posts, contributions, selectedCategories]),
    [users, posts, contributions, selectedCategories]
  );

  useEffect(() => {
    console.log('useEffect triggered with selectedCategories:', selectedCategories);
    debouncedSearch(searchQuery);
    setFilteredResults(prev => {
      const newResults = selectedCategories.length > 0 ? filterItemsByCategories(selectedCategories) : { posts: [], contributions: [] };
      console.log('Setting filteredResults to:', newResults);
      return { ...prev, ...newResults, users: [] };
    });
  }, [searchQuery, debouncedSearch, selectedCategories]);

  const filterItemsByCategories = (selectedCats) => {
    console.log('Filtering by categories:', selectedCats);
    const selectedCategoryObjects = categories.filter((cat) => selectedCats.includes(cat.name));
    let filteredPosts = [];
    let filteredContributions = [];

    selectedCategoryObjects.forEach((category) => {
      let postsForCategory = [];
      let contributionsForCategory = [];
      if (category.type === 'model') {
        postsForCategory = posts.filter((post) =>
          post.modelUsed?.toLowerCase() === category.filter.toLowerCase()
        );
        contributionsForCategory = contributions.filter((contrib) =>
          contrib.model?.toLowerCase() === category.filter.toLowerCase()
        );
      } else if (category.type === 'genre') {
        postsForCategory = posts.filter((post) =>
          post.promptUsed?.toLowerCase().includes(category.filter) ||
          post.caption?.toLowerCase().includes(category.filter)
        );
        contributionsForCategory = contributions.filter((contrib) =>
          contrib.prompt?.toLowerCase().includes(category.filter)
        );
      }
      filteredPosts = [...filteredPosts, ...postsForCategory];
      filteredContributions = [...filteredContributions, ...contributionsForCategory];
    });

    console.log('Filtered posts by category:', filteredPosts);
    console.log('Filtered contributions by category:', filteredContributions);

    return {
      posts: [...new Set(filteredPosts.map((post) => JSON.stringify(post)))].map((post) => JSON.parse(post)),
      contributions: [...new Set(filteredContributions.map((contrib) => JSON.stringify(contrib)))].map((contrib) => JSON.parse(contrib))
    };
  };

  const handleFilterByCategory = (category) => {
    console.log('Category clicked:', category.name);
    setSelectedCategories((prev) => {
      const newSelected = prev.includes(category.name)
        ? prev.filter((cat) => cat !== category.name)
        : [...prev, category.name];
      console.log('Updated selectedCategories:', newSelected);
      return newSelected;
    });
    setSearchQuery('');
  };

  const resetFilters = () => {
    console.log('Resetting filters');
    setSearchQuery('');
    setSelectedCategories([]);
    setFilteredResults({ users: [], posts: [], contributions: [] });
  };

  const handleFollow = async (targetUserId) => {
    if (!currentUser) {
      alert('Please log in to follow users.');
      return;
    }

    try {
      const currentUserRef = doc(db, 'users', currentUser.uid);
      const targetUserRef = doc(db, 'users', targetUserId);

      // Note: Follow/unfollow logic requires write permissions
    } catch (err) {
      console.error('Failed to update follow status:', err.message);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#000000', padding: '2rem 1rem 2rem 250px' }}>
      <SearchGenresModelsContributions
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filteredUsers={filteredResults.users}
      />
      {searchQuery && (
        <SearchPosts
          filteredPosts={filteredResults.posts}
          filteredContributions={filteredResults.contributions}
        />
      )}
      <ModelButtonCategories
        categories={categories}
        selectedCategories={selectedCategories}
        handleFilterByCategory={handleFilterByCategory}
        resetFilters={resetFilters}
      />
    </div>
  );
};

export default Explore;