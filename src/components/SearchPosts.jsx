import React from 'react';
import { motion } from 'framer-motion';
import Card from './Card';
import ContributionCard from './ContributionCard';

const SearchPosts = ({ filteredPosts, filteredContributions }) => {
  return (
    (filteredPosts.length > 0 || filteredContributions.length > 0) && (
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
          {[...filteredPosts, ...filteredContributions].map((item, index) => (
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