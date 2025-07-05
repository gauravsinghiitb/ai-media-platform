import React from 'react';
import { motion } from 'framer-motion';

const SearchGenresModelsContributions = ({ searchQuery, setSearchQuery, filteredUsers }) => {
  return (
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
            placeholder="Search by username, model, genre, prompt, or contribution..."
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: '#000000',
              borderRadius: '8px',
              color: '#FFFFFF',
              border: '2px solid transparent',
              fontSize: '16px',
              width: '100%',
              boxSizing: 'border-box',
              borderImage: 'linear-gradient(45deg, #ff0000, #0000ff, #ff00ff, #00ff00, rgb(223, 79, 6)) 1',
              animation: 'rotateBorder 5s linear infinite'
            }}
            className="luminous-border"
          />
        </div>
        {searchQuery && filteredUsers.length > 0 && (
          <motion.div
            style={{
              maxWidth: '640px',
              margin: '0 auto',
              marginBottom: '24px',
              backgroundColor: '#000000',
              borderRadius: '8px',
              border: '1px solid #FFFFFF',
              padding: '16px'
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h3 style={{ color: '#FFFFFF', fontSize: '1.2rem', marginBottom: '12px' }}>Users</h3>
            {filteredUsers.slice(0, 5).map((user, index) => (
              <motion.p
                key={user.id}
                style={{
                  color: '#FFFFFF',
                  fontSize: '16px',
                  padding: '8px',
                  borderBottom: index < 4 ? '1px solid #333' : 'none',
                  cursor: 'pointer'
                }}
                whileHover={{ backgroundColor: '#222' }}
                onClick={() => window.location.href = `/profile/${user.id}`}
              >
                @{user.username || 'Unknown'}
              </motion.p>
            ))}
            {filteredUsers.length > 5 && (
              <motion.button
                style={{
                  display: 'block',
                  marginTop: '12px',
                  padding: '8px 16px',
                  backgroundColor: '#FFFFFF',
                  color: '#000000',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  width: '100%'
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => alert('Load More functionality to be implemented')}
              >
                Load More
              </motion.button>
            )}
          </motion.div>
        )}
      </motion.div>
      <style>
        {`
          @keyframes rotateBorder {
            0% { border-image: linear-gradient(0deg, #ff0000, #0000ff, #ff00ff, #00ff00) 1; box-shadow: 0 0 10px rgba(255, 0, 0, 0.5), 0 0 20px rgba(255, 0, 0, 0.3); }
            25% { border-image: linear-gradient(90deg, #ff0000, #0000ff, #ff00ff, #00ff00) 1; box-shadow: 0 0 10px rgba(0, 0, 255, 0.5), 0 0 20px rgba(0, 0, 255, 0.3); }
            50% { border-image: linear-gradient(180deg, #ff0000, #0000ff, #ff00ff, #00ff00) 1; box-shadow: 0 0 10px rgba(255, 0, 255, 0.5), 0 0 20px rgba(255, 0, 255, 0.3); }
            75% { border-image: linear-gradient(270deg, #ff0000, #0000ff, #ff00ff, #00ff00) 1; box-shadow: 0 0 10px rgba(0, 255, 0, 0.5), 0 0 20px rgba(0, 255, 0, 0.3); }
            100% { border-image: linear-gradient(360deg, #ff0000, #0000ff, #ff00ff, #00ff00) 1; box-shadow: 0 0 10px rgba(255, 0, 0, 0.5), 0 0 20px rgba(255, 0, 0, 0.3); }
          }
          .luminous-border { border: 2px solid transparent; border-radius: 8px; animation: rotateBorder 4s linear infinite; }
          input.luminous-border:focus { outline: none; border: 2px solid transparent; border-radius: 8px; border-image: linear-gradient(45deg, #ff0000, #0000ff, #ff00ff, #00ff00, rgb(223, 79, 6)) 1; animation: rotateBorder 5s linear infinite; }
        `}
      </style>
    </motion.section>
  );
};

export default SearchGenresModelsContributions;