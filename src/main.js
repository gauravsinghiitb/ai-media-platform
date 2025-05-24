import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

function Root() {
  const [userPosts, setUserPosts] = useState([]);

  const addPost = (newPost) => {
    setUserPosts((prev) => [...prev, newPost]);
  };

  return (
    <App addPost={addPost} userPosts={userPosts} />
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);