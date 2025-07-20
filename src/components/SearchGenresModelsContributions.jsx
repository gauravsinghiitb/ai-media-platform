import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaSearch, FaChevronDown, FaTimes } from 'react-icons/fa';

const SearchGenresModelsContributions = ({ searchQuery, setSearchQuery, filteredUsers, selectedModel, setSelectedModel, models, style }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [dropdownSearch, setDropdownSearch] = useState('');
  const [inputWidth, setInputWidth] = useState(800);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Calculate input width based on content
  useEffect(() => {
    if (inputRef.current && searchQuery) {
      const textWidth = searchQuery.length * 9; // Approximate character width
      const minWidth = 800;
      const maxWidth = window.innerWidth * 0.9;
      const calculatedWidth = Math.max(minWidth, Math.min(textWidth + 200, maxWidth));
      setInputWidth(calculatedWidth);
    } else {
      setInputWidth(800);
    }
  }, [searchQuery]);

  const handleModelSelect = (model) => {
    setSelectedModel(model);
    setSearchQuery('');
    setIsDropdownOpen(false);
    setDropdownSearch('');
  };

  const clearModel = () => {
    setSelectedModel('');
    setSearchQuery('');
  };

  const filteredModels = models.filter(model =>
    model.toLowerCase().includes(dropdownSearch.toLowerCase())
  );

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        ...style,
      }}
    >
      {/* Main Search Container */}
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: `${inputWidth}px`,
          margin: '0 auto',
          transition: 'max-width 0.3s ease'
        }}
      >
        {/* Search Bar */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            background: '#000000',
            borderRadius: '16px',
            border: '2px solid transparent',
            backgroundImage: 'linear-gradient(#000000, #000000), linear-gradient(45deg, #ff0000, #0000ff, #ff00ff, #00ff00)',
            backgroundOrigin: 'border-box',
            backgroundClip: 'padding-box, border-box',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 20px rgba(255, 255, 255, 0.1)',
            transition: 'all 0.3s ease',
            animation: 'rotateBorder 4s linear infinite'
          }}
          className="search-container luminous-border"
        >
          {/* Search Icon */}
          <FaSearch
            style={{
              position: 'absolute',
              left: '20px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#FFFFFF',
              fontSize: '18px',
              zIndex: 2
            }}
          />

          {/* Selected Model Tag */}
          {selectedModel && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              style={{
                position: 'absolute',
                left: '50px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: '#FFFFFF',
                color: '#000000',
                padding: '6px 12px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                zIndex: 2,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
              }}
            >
              {selectedModel}
              <FaTimes
                style={{
                  cursor: 'pointer',
                  fontSize: '10px',
                  opacity: 0.8,
                  transition: 'opacity 0.2s ease'
                }}
                onClick={clearModel}
                onMouseEnter={(e) => e.target.style.opacity = '1'}
                onMouseLeave={(e) => e.target.style.opacity = '0.8'}
              />
            </motion.div>
          )}

          {/* Search Input */}
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (selectedModel && !e.target.value) setSelectedModel('');
            }}
            placeholder={selectedModel ? "Continue searching within selected model..." : "Search by username, model, genre, prompt, or contribution..."}
            style={{
              width: '100%',
              height: '60px',
              padding: selectedModel ? '0 120px 0 150px' : '0 120px 0 50px',
              backgroundColor: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#ffffff',
              fontSize: '16px',
              fontWeight: '400',
              transition: 'all 0.3s ease',
              boxSizing: 'border-box',
              resize: 'none'
            }}
          />

          {/* Models Dropdown Button */}
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: isDropdownOpen ? '#FFFFFF' : 'rgba(255, 255, 255, 0.1)',
              color: isDropdownOpen ? '#000000' : '#FFFFFF',
              border: '1px solid #FFFFFF',
              borderRadius: '12px',
              padding: '12px 16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.3s ease',
              zIndex: 2
            }}
            onMouseEnter={(e) => {
              if (!isDropdownOpen) {
                e.target.style.background = 'rgba(255, 255, 255, 0.2)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isDropdownOpen) {
                e.target.style.background = 'rgba(255, 255, 255, 0.1)';
              }
            }}
          >
            Models
            <FaChevronDown
              style={{
                transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s ease'
              }}
            />
          </button>
        </div>

        {/* Models Dropdown */}
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{
            opacity: isDropdownOpen ? 1 : 0,
            y: isDropdownOpen ? 0 : -10,
            scale: isDropdownOpen ? 1 : 0.95
          }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          style={{
            position: 'absolute',
            top: '100%',
            left: '0',
            right: '0',
            background: '#000000',
            borderRadius: '16px',
            border: '1px solid #FFFFFF',
            marginTop: '8px',
            maxHeight: '320px',
            overflowY: 'auto',
            zIndex: 10,
            display: isDropdownOpen ? 'block' : 'none',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.8)'
          }}
        >
          {/* Dropdown Search */}
          <div style={{ padding: '16px', borderBottom: '1px solid #333333' }}>
            <input
              type="text"
              value={dropdownSearch}
              onChange={(e) => setDropdownSearch(e.target.value)}
              placeholder="Search models..."
              style={{
                width: '100%',
                padding: '12px 16px',
                backgroundColor: '#000000',
                border: '1px solid #333333',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '14px',
                outline: 'none',
                transition: 'all 0.3s ease'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#FFFFFF';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#333333';
              }}
            />
          </div>

          {/* All Models Option */}
          <div
            style={{
              padding: '12px 20px',
              color: selectedModel === '' ? '#000000' : '#ffffff',
              backgroundColor: selectedModel === '' ? '#FFFFFF' : 'transparent',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: selectedModel === '' ? '600' : '400',
              transition: 'all 0.3s ease',
              borderBottom: '1px solid #333333'
            }}
            onClick={() => handleModelSelect('')}
            onMouseEnter={(e) => {
              if (selectedModel !== '') {
                e.target.style.backgroundColor = '#333333';
              }
            }}
            onMouseLeave={(e) => {
              if (selectedModel !== '') {
                e.target.style.backgroundColor = 'transparent';
              }
            }}
          >
            All Models
          </div>

          {/* Model Options */}
          {filteredModels.map((model) => (
            <div
              key={model}
              style={{
                padding: '12px 20px',
                color: selectedModel === model ? '#000000' : '#ffffff',
                backgroundColor: selectedModel === model ? '#FFFFFF' : 'transparent',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: selectedModel === model ? '600' : '400',
                transition: 'all 0.3s ease',
                borderBottom: '1px solid #333333'
              }}
              onClick={() => handleModelSelect(model)}
              onMouseEnter={(e) => {
                if (selectedModel !== model) {
                  e.target.style.backgroundColor = '#333333';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedModel !== model) {
                  e.target.style.backgroundColor = 'transparent';
                }
              }}
            >
              {model}
            </div>
          ))}

          {filteredModels.length === 0 && dropdownSearch && (
            <div style={{
              padding: '20px',
              textAlign: 'center',
              color: '#CCCCCC',
              fontSize: '14px'
            }}>
              No models found matching "{dropdownSearch}"
            </div>
          )}
        </motion.div>
      </div>

      {/* User Results */}
      {searchQuery && filteredUsers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            width: '100%',
            maxWidth: '800px',
            margin: '24px auto 0',
            background: '#000000',
            borderRadius: '16px',
            border: '1px solid #FFFFFF',
            padding: '20px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.8)'
          }}
        >
          <h3
            style={{
              color: '#ffffff',
              fontSize: '1.2rem',
              fontWeight: '600',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <FaSearch style={{ color: '#FFFFFF', fontSize: '16px' }} />
            Users Found ({filteredUsers.length})
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredUsers.slice(0, 5).map((user, index) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                style={{
                  padding: '12px 16px',
                  backgroundColor: '#333333',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
                onClick={() => window.location.href = `/profile/${user.id}`}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#FFFFFF';
                  e.currentTarget.style.color = '#000000';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#333333';
                  e.currentTarget.style.color = '#FFFFFF';
                }}
              >
                <img
                  src={user.profilePic || 'https://via.placeholder.com/32?text=U'}
                  alt={user.username}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    objectFit: 'cover'
                  }}
                />
                <span style={{
                  color: 'inherit',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  @{user.username || 'Unknown'}
                </span>
              </motion.div>
            ))}
          </div>

          {filteredUsers.length > 5 && (
            <motion.button
              style={{
                display: 'block',
                margin: '16px auto 0',
                padding: '10px 20px',
                background: '#FFFFFF',
                color: '#000000',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                transition: 'all 0.3s ease'
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => alert('Load More functionality to be implemented')}
            >
              Load More ({filteredUsers.length - 5} remaining)
            </motion.button>
          )}
        </motion.div>
      )}

      <style>
        {`
          @keyframes rotateBorder {
            0% { 
              border-image: linear-gradient(0deg, #ff0000, #0000ff, #ff00ff, #00ff00) 1; 
              box-shadow: 0 0 10px rgba(255, 0, 0, 0.5), 0 0 20px rgba(255, 0, 0, 0.3); 
            }
            25% { 
              border-image: linear-gradient(90deg, #ff0000, #0000ff, #ff00ff, #00ff00) 1; 
              box-shadow: 0 0 10px rgba(0, 0, 255, 0.5), 0 0 20px rgba(0, 0, 255, 0.3); 
            }
            50% { 
              border-image: linear-gradient(180deg, #ff0000, #0000ff, #ff00ff, #00ff00) 1; 
              box-shadow: 0 0 10px rgba(255, 0, 255, 0.5), 0 0 20px rgba(255, 0, 255, 0.3); 
            }
            75% { 
              border-image: linear-gradient(270deg, #ff0000, #0000ff, #ff00ff, #00ff00) 1; 
              box-shadow: 0 0 10px rgba(0, 255, 0, 0.5), 0 0 20px rgba(0, 255, 0, 0.3); 
            }
            100% { 
              border-image: linear-gradient(360deg, #ff0000, #0000ff, #ff00ff, #00ff00) 1; 
              box-shadow: 0 0 10px rgba(255, 0, 0, 0.5), 0 0 20px rgba(255, 0, 0, 0.3); 
            }
          }

          .luminous-border {
            border: 2px solid transparent;
            border-radius: 16px;
            animation: rotateBorder 4s linear infinite;
          }

          .search-container:focus-within {
            transform: translateY(-2px);
            box-shadow: 0 12px 40px rgba(0, 0, 0, 0.6), 0 0 30px rgba(255, 255, 255, 0.3) !important;
            animation: rotateBorder 2s linear infinite !important;
          }
          
          /* Custom scrollbar for dropdown */
          div::-webkit-scrollbar {
            width: 6px;
          }
          
          div::-webkit-scrollbar-track {
            background: #333333;
            border-radius: 3px;
          }
          
          div::-webkit-scrollbar-thumb {
            background: #FFFFFF;
            border-radius: 3px;
          }
          
          div::-webkit-scrollbar-thumb:hover {
            background: #CCCCCC;
          }
        `}
      </style>
    </motion.section>
  );
};

export default SearchGenresModelsContributions;