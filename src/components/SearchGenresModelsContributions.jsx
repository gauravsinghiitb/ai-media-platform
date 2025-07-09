import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

const SearchGenresModelsContributions = ({ searchQuery, setSearchQuery, filteredUsers, selectedModel, setSelectedModel, models, style }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [dropdownSearch, setDropdownSearch] = useState('');
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleModelSelect = (model) => {
    setSelectedModel(model);
    setSearchQuery('');
    setIsDropdownOpen(false);
  };

  const filteredModels = models.filter(model =>
    model.toLowerCase().includes(dropdownSearch.toLowerCase())
  );

  useEffect(() => {
    if (inputRef.current) {
      const minWidth = 740;
      const scrollWidth = inputRef.current.scrollWidth;
      if (scrollWidth > minWidth) {
        inputRef.current.style.width = `${scrollWidth + 20}px`;
      } else {
        inputRef.current.style.width = `${minWidth}px`;
      }
      if (inputRef.current.scrollWidth > 740) {
        inputRef.current.style.width = `${Math.min(inputRef.current.scrollWidth + 20, window.innerWidth * 0.9)}px`;
      }
    }
  }, [searchQuery]);

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
      style={{
        padding: '0 1rem',
        maxWidth: '80rem',
        margin: 'auto',
        textAlign: 'center',
        ...style,
      }}
    >
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginBottom: '0',
          position: 'relative',
        }}
      >
        <div style={{ width: '100%', maxWidth: '80%', position: 'relative', margin: '0 auto' }}>
          <div
            style={{
              position: 'relative',
              width: '100%',
              margin: '0 auto',
              height: '60px', // Increased height for larger search area
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (selectedModel && !e.target.value) setSelectedModel('');
              }}
              placeholder="Search by username, model, genre, prompt, or contribution..."
              style={{
                padding: '16px 80px 16px 20px', // Increased padding for larger area
                backgroundColor: '#000000',
                borderRadius: '8px',
                color: '#FFFFFF',
                border: '1px solid #333',
                fontSize: '16px',
                width: '740px',
                minWidth: '740px',
                maxWidth: '90%',
                height: '100%', // Full height of container
                boxSizing: 'border-box',
                transition: 'width 0.3s ease',
                outline: 'none',
                position: 'absolute',
                top: 0,
                left: 0,
              }}
              className="luminous-border"
            />
            <div
              style={{
                position: 'absolute',
                top: '50%',
                right: '10px',
                transform: 'translateY(-50%)',
                backgroundColor: '#1A1A1A',
                border: '1px solid #333',
                borderRadius: '4px',
                padding: '4px 8px',
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                zIndex: 2, // Ensure it stays above input
              }}
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15.5 14.5C14.5714 15.4286 13.3158 16 12 16C9.23858 16 7 13.7614 7 11C7 8.23858 9.23858 6 12 6C14.7614 6 17 8.23858 17 11C17 12.3158 16.4286 13.5714 15.5 14.5ZM15.5 14.5L20 19" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span style={{ marginLeft: '5px', fontSize: '14px', color: '#FFFFFF' }}>Models</span>
            </div>
            <div
              ref={dropdownRef}
              style={{
                position: 'absolute',
                top: '100%',
                right: '10px',
                transform: 'translateY(5px)',
                backgroundColor: '#1A1A1A',
                border: '1px solid #333',
                borderRadius: '8px',
                display: isDropdownOpen ? 'block' : 'none',
                zIndex: 10,
                minWidth: '200px',
                maxHeight: '300px',
                overflowY: 'auto',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              }}
            >
              <input
                type="text"
                value={dropdownSearch}
                onChange={(e) => setDropdownSearch(e.target.value)}
                placeholder="Search models..."
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#1A1A1A',
                  color: '#FFFFFF',
                  border: 'none',
                  width: '100%',
                  boxSizing: 'border-box',
                  borderBottom: '1px solid #333',
                }}
              />
              <div
                style={{
                  padding: '8px 12px',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                }}
                onClick={() => handleModelSelect('')}
              >
                All Models
              </div>
              {filteredModels.map((model) => (
                <div
                  key={model}
                  style={{
                    padding: '8px 12px',
                    color: '#FFFFFF',
                    cursor: 'pointer',
                  }}
                  onClick={() => handleModelSelect(model)}
                >
                  {model}
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      <div style={{ minHeight: '180px' }}>
        {searchQuery && filteredUsers.length > 0 && (
          <motion.div
            style={{
              width: '100%',
              maxWidth: '80%',
              margin: '0 auto 24px',
              backgroundColor: '#000000',
              borderRadius: '8px',
              border: '1px solid #FFFFFF',
              padding: 'var(--username-padding, 10px)',
              textAlign: 'center',
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h3
              style={{
                color: '#FFFFFF',
                fontSize: '1.2rem',
                marginBottom: '12px',
              }}
            >
              Users
            </h3>
            {filteredUsers.slice(0, 5).map((user, index) => (
              <motion.p
                key={user.id}
                style={{
                  color: '#FFFFFF',
                  fontSize: 'var(--username-font-size, 14px)',
                  padding: '8px',
                  borderBottom: index < 4 ? '1px solid #333' : 'none',
                  cursor: 'pointer',
                  display: 'inline-block',
                  textAlign: 'center',
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
                  margin: '12px auto 0',
                  padding: '8px 16px',
                  backgroundColor: '#FFFFFF',
                  color: '#000000',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
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
      </div>

      <style>
        {`
          @keyframes rotateBorder {
            0% { border-image: linear-gradient(0deg, #ff0000, #0000ff, #ff00ff, #00ff00) 1; box-shadow: 0 0 10px rgba(255, 0, 0, 0.5), 0 0 20px rgba(255, 0, 0, 0.3); }
            25% { border-image: linear-gradient(90deg, #ff0000, #0000ff, #ff00ff, #00ff00) 1; box-shadow: 0 0 10px rgba(0, 0, 255, 0.5), 0 0 20px rgba(0, 0, 255, 0.3); }
            50% { border-image: linear-gradient(180deg, #ff0000, #0000ff, #ff00ff, #00ff00) 1; box-shadow: 0 0 10px rgba(255, 0, 255, 0.5), 0 0 20px rgba(255, 0, 255, 0.3); }
            75% { border-image: linear-gradient(270deg, #ff0000, #0000ff, #ff00ff, #00ff00) 1; box-shadow: 0 0 10px rgba(0, 255, 0, 0.5), 0 0 20px rgba(0, 255, 0, 0.3); }
            100% { border-image: linear-gradient(360deg, #ff0000, #0000ff, #ff00ff, #00ff00) 1; box-shadow: 0 0 10px rgba(255, 0, 0, 0.5), 0 0 20px rgba(255, 0, 0, 0.3); }
          }
          .luminous-border {
            border: 2px solid transparent;
            border-radius: 8px;
            animation: rotateBorder 4s linear infinite;
          }
          input.luminous-border:focus {
            outline: none;
            border: 2px solid transparent;
            border-radius: 8px;
            border-image: linear-gradient(45deg, #ff0000, #0000ff, #ff00ff, #00ff00, rgb(223, 79, 6)) 1;
            animation: rotateBorder 5s linear infinite;
          }
        `}
      </style>
    </motion.section>
  );
};

export default SearchGenresModelsContributions;