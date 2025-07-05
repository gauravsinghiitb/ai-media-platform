import React from 'react';
import { motion } from 'framer-motion';

const ModelButtonCategories = ({ categories, selectedCategories, handleFilterByCategory, resetFilters }) => {
  return (
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
};

export default ModelButtonCategories;