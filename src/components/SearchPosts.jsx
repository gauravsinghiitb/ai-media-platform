import React from 'react';
import { motion } from 'framer-motion';
import Card from './Card';
import ContributionCard from './ContributionCard';

const SearchPosts = ({ filteredPosts = [], filteredContributions = [] }) => {
  // Add null checks for safety
  const posts = filteredPosts || [];
  const contributions = filteredContributions || [];
  
  console.log('SearchPosts rendering with filteredPosts:', posts, 'length:', posts.length, 'filteredContributions:', contributions, 'length:', contributions.length);
  
  return (
    (posts.length > 0 || contributions.length > 0) && (
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
          Posts & Contributions
        </motion.h2>
        <div style={{
          columnCount: 3,
          columnGap: '20px',
          margin: '0 auto'
        }}>
          {[...posts, ...contributions].map((item, index) => (
            <motion.div
              key={item.createdAt || item.id || index}
              style={{ breakInside: 'avoid', marginBottom: '20px' }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
            >
              {item.type === 'post' ? (
                <Card post={item} userId={item.userId} aspectRatio="1:1" />
              ) : (
                <ContributionCard
                  contribution={item}
                  userId={item.userId}
                  postId={item.postId}
                  postMedia={item.imageUrl}
                />
              )}
            </motion.div>
          ))}
        </div>
      </motion.section>
    )
  );
};

export default SearchPosts;