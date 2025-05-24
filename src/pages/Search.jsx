// import { motion } from 'framer-motion';
// import { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { db } from '../firebase/firebase';
// import { collection, query, where, getDocs } from 'firebase/firestore';

// function Search() {
//   const navigate = useNavigate();
//   const [searchTerm, setSearchTerm] = useState('');
//   const [users, setUsers] = useState([]);
//   const [posts, setPosts] = useState([]);

//   useEffect(() => {
//     const search = async () => {
//       if (!searchTerm.trim()) {
//         setUsers([]);
//         setPosts([]);
//         return;
//       }

//       try {
//         const usersQuery = query(
//           collection(db, 'users'),
//           where('username', '>=', searchTerm.trim()),
//           where('username', '<=', searchTerm.trim() + '\uf8ff')
//         );
//         const usersSnapshot = await getDocs(usersQuery);
//         const userResults = usersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
//         setUsers(userResults);

//         const allPosts = [];
//         const usersSnapshotAll = await getDocs(collection(db, 'users'));
//         for (const userDoc of usersSnapshotAll.docs) {
//           const user = userDoc.data();
//           const userPosts = user.posts || [];
//           userPosts.forEach((post) => {
//             if (post.title.toLowerCase().includes(searchTerm.toLowerCase())) {
//               allPosts.push({ ...post, username: user.username });
//             }
//           });
//         }
//         setPosts(allPosts);
//       } catch (err) {
//         console.error('Search error:', err);
//       }
//     };

//     search();
//   }, [searchTerm]);

//   return (
//       <style>
//         {`
//           .search-container {
//             color: #ffffff;
//             background: linear-gradient(180deg, #0a0a23 0%, #1a1a40 100%);
//             padding: 3rem 1rem;
//             min-height: 100vh;
//             position: relative;
//             overflow: hidden;
//           }

//           .search-input {
//             width: 100%;
//             max-width: 600px;
//             margin: 0 auto;
//             padding: 0.75rem;
//             background: rgba(255, 255, 255, 0.05);
//             color: #ffffff;
//             border: 1px solid rgba(96, 165, 250, 0.3);
//             border-radius: 0.5rem;
//             font-size: 1rem;
//             outline: none;
//             display: block;
//             margin-bottom: 2rem;
//           }

//           .search-input:focus {
//             border-color: #60a5fa;
//             box-shadow: 0 0 15px rgba(96, 165, 250, 0.7);
//           }

//           .search-results {
//             max-width: 80rem;
//             margin: 0 auto;
//           }

//           .section-title {
//             font-size: 1.5rem;
//             color: #60a5fa;
//             margin-bottom: 1rem;
//           }

//           .user-list, .post-list {
//             display: grid;
//             grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
//             gap: 1rem;
//             margin-bottom: 2rem;
//           }

//           .user-item, .post-item {
//             background: rgba(255, 255, 255, 0.05);
//             padding: 1rem;
//             border-radius: 0.5rem;
//             cursor: pointer;
//           }

//           .user-item:hover, .post-item:hover {
//             background: rgba(96, 165, 250, 0.1);
//           }

//           .user-item img {
//             width: 50px;
//             height: 50px;
//             border-radius: 50%;
//             margin-right: 1rem;
//           }

//           .post-item img {
//             width: 100%;
//             border-radius: 0.5rem;
//             margin-bottom: 0.5rem;
//           }
//         `}
//       </style>