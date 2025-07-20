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
import { LazyImage } from '../components/LazyLoad';

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

  // Advanced search utilities
  const calculateLevenshteinDistance = (str1, str2) => {
    const matrix = [];
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[str2.length][str1.length];
  };

  const calculateSimilarity = (str1, str2) => {
    if (!str1 || !str2) return 0;
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    const editDistance = calculateLevenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  };

  const fuzzyMatch = (query, text, threshold = 0.6) => {
    if (!query || !text) return false;
    query = query.toLowerCase();
    text = text.toLowerCase();
    
    // Exact match
    if (text.includes(query)) return true;
    
    // Fuzzy matching for individual words
    const queryWords = query.split(' ').filter(word => word.length > 2);
    const textWords = text.split(' ');
    
    for (const queryWord of queryWords) {
      for (const textWord of textWords) {
        if (calculateSimilarity(queryWord, textWord) >= threshold) {
          return true;
        }
      }
    }
    
    return false;
  };

  const calculateRelevanceScore = (item, query, type) => {
    if (!query) return 0;
    
    let score = 0;
    const queryLower = query.toLowerCase();
    
    if (type === 'user') {
      // Username exact match gets highest score
      if (item.username?.toLowerCase() === queryLower) score += 100;
      else if (item.username?.toLowerCase().startsWith(queryLower)) score += 80;
      else if (item.username?.toLowerCase().includes(queryLower)) score += 60;
      else if (fuzzyMatch(query, item.username)) score += 40;
      
      // Display name matching
      if (item.displayName?.toLowerCase().includes(queryLower)) score += 50;
      else if (fuzzyMatch(query, item.displayName)) score += 30;
      
      // Email matching
      if (item.email?.toLowerCase().includes(queryLower)) score += 20;
      
    } else if (type === 'post') {
      // Model exact match gets 100%
      if (item.modelUsed?.toLowerCase() === queryLower) score += 100;
      else if (item.modelUsed?.toLowerCase().includes(queryLower)) score += 80;
      else if (fuzzyMatch(query, item.modelUsed)) score += 60;
      
      // Prompt matching with higher weight
      if (item.promptUsed?.toLowerCase().includes(queryLower)) score += 70;
      else if (fuzzyMatch(query, item.promptUsed)) score += 50;
      
      // Caption matching
      if (item.caption?.toLowerCase().includes(queryLower)) score += 60;
      else if (fuzzyMatch(query, item.caption)) score += 40;
      
      // Username matching
      if (item.username?.toLowerCase().includes(queryLower)) score += 50;
      else if (fuzzyMatch(query, item.username)) score += 30;
      
      // Tags and genre matching
      if (item.tags?.some(tag => tag.toLowerCase().includes(queryLower))) score += 40;
      if (item.genre?.toLowerCase().includes(queryLower)) score += 40;
      
      // Boost score for recent posts
      if (item.createdAt) {
        const daysSinceCreation = (Date.now() - new Date(item.createdAt).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceCreation < 7) score += 20;
        else if (daysSinceCreation < 30) score += 10;
      }
      
      // Boost score based on engagement
      const likes = item.likedBy?.length || 0;
      const comments = item.comments?.length || 0;
      score += Math.min(likes * 2, 50);
      score += Math.min(comments * 3, 30);
      
    } else if (type === 'contribution') {
      // Similar scoring for contributions with exact model match = 100%
      if (item.model?.toLowerCase() === queryLower) score += 100;
      else if (item.model?.toLowerCase().includes(queryLower)) score += 80;
      else if (fuzzyMatch(query, item.model)) score += 60;
      
      if (item.prompt?.toLowerCase().includes(queryLower)) score += 70;
      else if (fuzzyMatch(query, item.prompt)) score += 50;
      
      if (item.username?.toLowerCase().includes(queryLower)) score += 50;
      else if (fuzzyMatch(query, item.username)) score += 30;
      
      if (item.tags?.some(tag => tag.toLowerCase().includes(queryLower))) score += 40;
      if (item.genre?.toLowerCase().includes(queryLower)) score += 40;
    }
    
    // Cap the score at 100
    return Math.min(score, 100);
  };

  const smartSearch = (items, query, type, limit = null) => {
    if (!query) return [];
    
    // Calculate relevance scores for all items
    const scoredItems = items.map(item => ({
      ...item,
      relevanceScore: calculateRelevanceScore(item, query, type)
    })).filter(item => item.relevanceScore > 0);
    
    // Sort by relevance score (highest first)
    const sorted = scoredItems.sort((a, b) => b.relevanceScore - a.relevanceScore);
    
    // Apply limit if specified
    return limit ? sorted.slice(0, limit) : sorted;
  };

  const advancedModelFilter = (items, modelQuery, type) => {
    if (!modelQuery) return items;
    
    return items.filter(item => {
      const modelField = type === 'post' ? item.modelUsed : item.model;
      if (!modelField) return false;
      
      // Exact match first
      if (modelField.toLowerCase() === modelQuery.toLowerCase()) return true;
      
      // Partial match
      if (modelField.toLowerCase().includes(modelQuery.toLowerCase())) return true;
      
      // Fuzzy match for similar model names
      return fuzzyMatch(modelQuery, modelField, 0.7);
    });
  };

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

        let filteredUsers = [];
        let filteredPosts = posts;
        let filteredContributions = contributions;

        // Smart user search with relevance scoring
        if (q) {
          filteredUsers = smartSearch(users, q, 'user', 10);
        }

        // Advanced model filtering
        if (model) {
          filteredPosts = advancedModelFilter(filteredPosts, model, 'post');
          filteredContributions = advancedModelFilter(filteredContributions, model, 'contribution');
        }

        // Smart content search with relevance scoring
        if (q) {
          filteredPosts = smartSearch(filteredPosts, q, 'post');
          filteredContributions = smartSearch(filteredContributions, q, 'contribution');
        }

        // Remove duplicates and apply final sorting
        filteredPosts = filteredPosts.filter((post, index, self) => 
          index === self.findIndex(p => p.id === post.id)
        );

        filteredContributions = filteredContributions.filter((contrib, index, self) => 
          index === self.findIndex(c => c.id === contrib.id)
        );

        // If we have both query and model, boost items that match both
        if (q && model) {
          filteredPosts = filteredPosts.map(post => {
            let combinedScore = post.relevanceScore || 0;
            // Check if the model exactly matches the searched model
            if (post.modelUsed?.toLowerCase() === model.toLowerCase()) {
              combinedScore = 100; // Set to exactly 100% for exact model match
            } else if (advancedModelFilter([post], model, 'post').length > 0) {
              combinedScore = Math.min(combinedScore + 30, 100);
            }
            return { ...post, relevanceScore: combinedScore };
          }).sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));

          filteredContributions = filteredContributions.map(contrib => {
            let combinedScore = contrib.relevanceScore || 0;
            // Check if the model exactly matches the searched model
            if (contrib.model?.toLowerCase() === model.toLowerCase()) {
              combinedScore = 100; // Set to exactly 100% for exact model match
            } else if (advancedModelFilter([contrib], model, 'contribution').length > 0) {
              combinedScore = Math.min(combinedScore + 30, 100);
            }
            return { ...contrib, relevanceScore: combinedScore };
          }).sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
        }

        setFilteredResults({ 
          users: filteredUsers, 
          posts: filteredPosts, 
          contributions: filteredContributions 
        });
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

  const displayPosts = selectedModel || searchQuery ? filteredResults.posts : posts;

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#000000',
        paddingLeft: '80px',
        paddingRight: '20px',
        paddingTop: '40px',
        paddingBottom: '40px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100vw',
        boxSizing: 'border-box'
      }}
    >
      {/* Header Section */}
      <motion.div
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginBottom: '40px',
          width: '100%',
          maxWidth: '1200px'
        }}
      >
        <motion.img
          src="/logo_white_new.png"
          alt="Kryoon Logo"
          style={{ 
            width: '80px', 
            height: '80px',
            marginBottom: '30px',
            filter: 'drop-shadow(0 0 20px rgba(255, 255, 255, 0.3))'
          }}
        />
        
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          style={{
            color: '#FFFFFF',
            fontSize: '3rem',
            fontWeight: '700',
            textAlign: 'center',
            marginBottom: '40px'
          }}
        >
          Explore
        </motion.h1>
      </motion.div>

      {/* Search Section */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.6 }}
        style={{
          width: '100%',
          maxWidth: '900px',
          marginBottom: '50px'
        }}
      >
        <SearchGenresModelsContributions
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          filteredUsers={filteredResults.users}
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
          models={models}
        />
      </motion.div>

      {/* Results Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.8 }}
        style={{
          width: '100%',
          maxWidth: '1400px',
          flex: 1
        }}
      >
        {displayPosts.length === 0 ? (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            style={{
              textAlign: 'center',
              color: '#CCCCCC',
              fontSize: '1.5rem',
              marginTop: '100px'
            }}
          >
            {searchQuery || selectedModel ? 'No results found for your search.' : 'No posts available.'}
          </motion.div>
        ) : (
          <>
            {(searchQuery || selectedModel) && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
                style={{
                  marginBottom: '30px',
                  textAlign: 'center'
                }}
              >
                <h2 style={{ 
                  color: '#FFFFFF', 
                  fontSize: '1.8rem',
                  marginBottom: '10px'
                }}>
                  Search Results
                </h2>
                <p style={{ 
                  color: '#CCCCCC', 
                  fontSize: '1rem'
                }}>
                  Found {displayPosts.length} post{displayPosts.length !== 1 ? 's' : ''}
                  {selectedModel && ` using ${selectedModel}`}
                  {searchQuery && ` matching "${searchQuery}"`}
                  {searchQuery && ' (sorted by relevance)'}
                </p>
              </motion.div>
            )}
            
            <Masonry
              breakpointCols={{
                default: 4,
                1400: 3,
                1000: 2,
                600: 1
              }}
              className="my-masonry-grid"
              columnClassName="my-masonry-grid_column"
              style={{
                display: 'flex',
                marginLeft: '-20px',
                width: 'calc(100% + 20px)'
              }}
            >
              {displayPosts.map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    duration: 0.5, 
                    delay: index * 0.1,
                    ease: "easeOut"
                  }}
                  style={{ 
                    marginLeft: '20px',
                    marginBottom: '20px',
                    breakInside: 'avoid',
                    position: 'relative'
                  }}
                  className="card-container"
                >
                  {/* Relevance Score Indicator - Only shown on hover */}
                  {post.relevanceScore && (searchQuery || selectedModel) && (
                    <div 
                      className="relevance-indicator"
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        background: '#FFFFFF',
                        color: '#000000',
                        padding: '2px 6px',
                        borderRadius: '8px',
                        fontSize: '10px',
                        fontWeight: '600',
                        zIndex: 10,
                        opacity: 0,
                        transition: 'opacity 0.3s ease',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                      }}
                    >
                      {Math.round(post.relevanceScore)}%
                    </div>
                  )}
                  <Card
                    post={post}
                    userId={post.userId}
                    aspectRatio="auto"
                    onClick={() => handleCardClick(post.userId, post.id)}
                  />
                </motion.div>
              ))}
            </Masonry>
          </>
        )}
      </motion.div>

      <style>
        {`
          .my-masonry-grid {
            display: flex;
            margin-left: -20px;
            width: calc(100% + 20px);
          }
          .my-masonry-grid_column {
            padding-left: 20px;
            background-clip: padding-box;
          }
          .my-masonry-grid_column > div {
            margin-bottom: 20px;
          }
          
          .card-container:hover .relevance-indicator {
            opacity: 1 !important;
          }
        `}
      </style>
    </div>
  );
};

export default Explore;