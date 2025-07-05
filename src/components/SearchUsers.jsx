import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const SearchUsers = ({ users, currentUser, following, handleFollow, filteredUsers }) => {
  const navigate = useNavigate();

  return (
    filteredUsers.length > 0 && (
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
          {filteredUsers.slice(0, 5).map((user, index) => (
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
                    onError={(e) => {
                      e.target.src = 'https://dummyimage.com/48x48/000/fff?text=No+Pic';
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
                width: 'fit-content',
                margin: '0 auto'
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => alert('Load More functionality to be implemented')}
            >
              Load More
            </motion.button>
          )}
        </div>
      </motion.section>
    )
  );
};

export default SearchUsers;