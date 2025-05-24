import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

const Post = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [post, setPost] = useState(null);
  const [error, setError] = useState(null);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([]);
  const [likes, setLikes] = useState(0);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        navigate('/login');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const userDocs = await Promise.all(
          (await getDoc(doc(db, 'users', user.uid))).data().posts.map((_, index) => index)
        );
        const postIndex = userDocs.findIndex((index) => index.toString() === postId);
        if (postIndex === -1) {
          setError('Post not found');
          return;
        }
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const postData = userDoc.data().posts[postIndex];
        setPost(postData);
        setComments([]); // Placeholder for comments
        setLikes(Math.floor(Math.random() * 100)); // Placeholder for likes
      } catch (err) {
        setError(err.message);
      }
    };

    if (user) fetchPost();
  }, [user, postId]);

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (comment.trim()) {
      setComments([...comments, { user: user.email, text: comment }]);
      setComment('');
    }
  };

  if (error) return <div className="text-red-500 text-center mt-10">{error}</div>;
  if (!post) return <div className="text-center mt-10 text-gray-500">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto mt-10 p-6 bg-white rounded-2xl shadow-lg animate-fade-in">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Left Side: AI-Generated Content */}
          <div className="md:w-1/2">
            {post.aiGeneratedUrl.includes('video') ? (
              <video
                src={post.aiGeneratedUrl}
                autoPlay
                loop
                muted
                className="w-full rounded-xl shadow-md"
              />
            ) : (
              <img
                src={post.aiGeneratedUrl}
                alt={post.caption}
                className="w-full rounded-xl shadow-md"
              />
            )}
          </div>

          {/* Right Side: Details */}
          <div className="md:w-1/2 flex flex-col">
            {/* Header */}
            <div className="flex items-center mb-4">
              <img
                src={post.profilePic || 'https://via.placeholder.com/40'}
                alt="Profile"
                className="w-12 h-12 rounded-full mr-3 border-2 border-indigo-500"
              />
              <div>
                <span
                  className="font-semibold text-indigo-600 hover:underline cursor-pointer"
                  onClick={() => navigate(`/profile/${user.uid}`)}
                >
                  @gaurav1
                </span>
                <p className="text-sm text-gray-500">{post.modelUsed || 'Unknown Model'}</p>
              </div>
            </div>

            {/* Post Details */}
            <h2 className="text-2xl font-bold text-gray-800 mb-3">{post.caption || 'Untitled'}</h2>
            <p className="text-gray-600 mb-4">{post.caption}</p>
            <p className="text-sm text-gray-500 mb-2">Model: {post.modelUsed || 'N/A'}</p>
            {post.promptUsed && <p className="text-sm text-gray-500 mb-2">Prompt: {post.promptUsed}</p>}
            {post.chatLink && (
              <a
                href={post.chatLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-500 hover:underline mb-3 block font-medium"
              >
                Remix this Post
              </a>
            )}

            {/* Likes */}
            <div className="flex items-center mb-4">
              <button
                onClick={() => setLikes(likes + 1)}
                className="flex items-center text-red-500 hover:text-red-600 transition-colors"
              >
                <svg className="w-6 h-6 mr-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {likes} Likes
              </button>
            </div>

            {/* Original Image (if exists) */}
            {post.originalUrl && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Original Image</h3>
                {post.originalUrl.includes('video') ? (
                  <video
                    src={post.originalUrl}
                    autoPlay
                    loop
                    muted
                    className="w-full rounded-xl shadow-md"
                  />
                ) : (
                  <img
                    src={post.originalUrl}
                    alt="Original"
                    className="w-full rounded-xl shadow-md"
                  />
                )}
              </div>
            )}

            {/* Comments */}
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Comments</h3>
              <div className="max-h-48 overflow-y-auto mb-4 p-3 bg-gray-100 rounded-lg">
                {comments.length === 0 ? (
                  <p className="text-gray-500">No comments yet.</p>
                ) : (
                  comments.map((c, index) => (
                    <div key={index} className="mb-2">
                      <span className="font-semibold text-gray-700">{c.user}</span>: {c.text}
                    </div>
                  ))
                )}
              </div>
              <form onSubmit={handleCommentSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  className="bg-indigo-600 text-white p-3 rounded-lg hover:bg-indigo-700 transition duration-300"
                >
                  Post
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Post;