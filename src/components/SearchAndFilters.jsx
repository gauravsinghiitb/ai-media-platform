import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSearch, FaFilter, FaTimes, FaSort, FaCalendar, FaFire, FaThumbsUp, FaEye } from 'react-icons/fa';

// Categories and Tags
export const CATEGORIES = [
  { id: 'all', name: 'All', icon: '🎬' },
  { id: 'ai-generated', name: 'AI Generated', icon: '🤖' },
  { id: 'art', name: 'Art', icon: '🎨' },
  { id: 'music', name: 'Music', icon: '🎵' },
  { id: 'gaming', name: 'Gaming', icon: '🎮' },
  { id: 'comedy', name: 'Comedy', icon: '😂' },
  { id: 'education', name: 'Education', icon: '📚' },
  { id: 'technology', name: 'Technology', icon: '💻' },
  { id: 'lifestyle', name: 'Lifestyle', icon: '🌟' },
  { id: 'news', name: 'News', icon: '📰' }
];

export const POPULAR_TAGS = [
  'trending', 'viral', 'creative', 'inspiration', 'tutorial', 
  'behind-the-scenes', 'challenge', 'reaction', 'review', 'tutorial'
];

export const SORT_OPTIONS = [
  { id: 'latest', name: 'Latest', icon: FaCalendar },
  { id: 'trending', name: 'Trending', icon: FaFire },
  { id: 'popular', name: 'Most Popular', icon: FaThumbsUp },
  { id: 'views', name: 'Most Viewed', icon: FaEye }
];

// Search Component
export const SearchBar = ({ 
  onSearch, 
  placeholder = "Search posts, users, and contributions...",
  initialValue = '',
  className = '',
  style = {}
}) => {
  const [query, setQuery] = useState(initialValue);
  const [isFocused, setIsFocused] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    onSearch(query.trim());
  };

  const handleClear = () => {
    setQuery('');
    onSearch('');
  };

  return (
    <motion.div
      ref={searchRef}
      className={className}
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: '600px',
        ...style
      }}
    >
      <form onSubmit={handleSearch}>
        <motion.div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            background: isFocused ? '#FFFFFF' : '#1a1a1a',
            border: `2px solid ${isFocused ? '#FFFFFF' : '#333333'}`,
            borderRadius: '12px',
            padding: '12px 16px',
            transition: 'all 0.3s ease'
          }}
          whileHover={{ scale: 1.02 }}
        >
          <FaSearch 
            size={18} 
            style={{ 
              color: isFocused ? '#000000' : '#666666',
              marginRight: '12px'
            }} 
          />
          
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            placeholder={placeholder}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: '16px',
              color: isFocused ? '#000000' : '#FFFFFF',
              fontWeight: '500'
            }}
          />
          
          <AnimatePresence>
            {query && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={handleClear}
                type="button"
                style={{
                  background: 'none',
                  border: 'none',
                  color: isFocused ? '#000000' : '#666666',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <FaTimes size={14} />
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>
      </form>
    </motion.div>
  );
};

// Category Filter Component
export const CategoryFilter = ({ 
  selectedCategory, 
  onCategoryChange,
  categories = CATEGORIES,
  className = '',
  style = {}
}) => {
  return (
    <motion.div
      className={className}
      style={{
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap',
        ...style
      }}
    >
      {categories.map((category) => (
        <motion.button
          key={category.id}
          onClick={() => onCategoryChange(category.id)}
          style={{
            background: selectedCategory === category.id ? '#FFFFFF' : 'rgba(255, 255, 255, 0.1)',
            color: selectedCategory === category.id ? '#000000' : '#FFFFFF',
            border: `1px solid ${selectedCategory === category.id ? '#FFFFFF' : '#333333'}`,
            borderRadius: '20px',
            padding: '8px 16px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.3s ease'
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <span style={{ fontSize: '16px' }}>{category.icon}</span>
          {category.name}
        </motion.button>
      ))}
    </motion.div>
  );
};

// Tag Filter Component
export const TagFilter = ({ 
  selectedTags, 
  onTagChange,
  tags = POPULAR_TAGS,
  className = '',
  style = {}
}) => {
  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      onTagChange(selectedTags.filter(t => t !== tag));
    } else {
      onTagChange([...selectedTags, tag]);
    }
  };

  return (
    <motion.div
      className={className}
      style={{
        display: 'flex',
        gap: '6px',
        flexWrap: 'wrap',
        ...style
      }}
    >
      {tags.map((tag) => (
        <motion.button
          key={tag}
          onClick={() => toggleTag(tag)}
          style={{
            background: selectedTags.includes(tag) ? '#FFFFFF' : 'transparent',
            color: selectedTags.includes(tag) ? '#000000' : '#CCCCCC',
            border: `1px solid ${selectedTags.includes(tag) ? '#FFFFFF' : '#666666'}`,
            borderRadius: '16px',
            padding: '6px 12px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: '500',
            textTransform: 'capitalize',
            transition: 'all 0.3s ease'
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          #{tag}
        </motion.button>
      ))}
    </motion.div>
  );
};

// Sort Component
export const SortFilter = ({ 
  selectedSort, 
  onSortChange,
  sortOptions = SORT_OPTIONS,
  className = '',
  style = {}
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = sortOptions.find(option => option.id === selectedSort);

  return (
    <motion.div
      ref={dropdownRef}
      className={className}
      style={{
        position: 'relative',
        ...style
      }}
    >
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: 'rgba(255, 255, 255, 0.1)',
          color: '#FFFFFF',
          border: '1px solid #333333',
          borderRadius: '8px',
          padding: '10px 16px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          minWidth: '140px'
        }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <FaSort size={14} />
        {selectedOption?.name || 'Sort by'}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              background: '#1a1a1a',
              border: '1px solid #333333',
              borderRadius: '8px',
              marginTop: '4px',
              zIndex: 1000,
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
            }}
          >
            {sortOptions.map((option) => (
              <motion.button
                key={option.id}
                onClick={() => {
                  onSortChange(option.id);
                  setIsOpen(false);
                }}
                style={{
                  width: '100%',
                  background: selectedSort === option.id ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '12px 16px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  textAlign: 'left',
                  borderBottom: '1px solid #333333'
                }}
                whileHover={{ background: 'rgba(255, 255, 255, 0.1)' }}
              >
                <option.icon size={14} />
                {option.name}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Advanced Filters Component
export const AdvancedFilters = ({ 
  filters, 
  onFilterChange,
  className = '',
  style = {}
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleFilterChange = (key, value) => {
    onFilterChange({
      ...filters,
      [key]: value
    });
  };

  return (
    <motion.div
      className={className}
      style={{
        background: '#1a1a1a',
        border: '1px solid #333333',
        borderRadius: '12px',
        padding: '16px',
        ...style
      }}
    >
      <motion.button
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          background: 'none',
          border: 'none',
          color: '#FFFFFF',
          cursor: 'pointer',
          fontSize: '16px',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          width: '100%',
          justifyContent: 'space-between'
        }}
        whileHover={{ color: '#CCCCCC' }}
      >
        <span>Advanced Filters</span>
        <FaFilter size={16} />
      </motion.button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              marginTop: '16px',
              borderTop: '1px solid #333333',
              paddingTop: '16px'
            }}
          >
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px'
            }}>
              {/* Date Range */}
              <div>
                <label style={{ color: '#CCCCCC', fontSize: '14px', marginBottom: '8px', display: 'block' }}>
                  Date Range
                </label>
                <select
                  value={filters.dateRange || 'all'}
                  onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                  style={{
                    width: '100%',
                    background: '#333333',
                    color: '#FFFFFF',
                    border: '1px solid #666666',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    fontSize: '14px'
                  }}
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="year">This Year</option>
                </select>
              </div>

              {/* Content Type */}
              <div>
                <label style={{ color: '#CCCCCC', fontSize: '14px', marginBottom: '8px', display: 'block' }}>
                  Content Type
                </label>
                <select
                  value={filters.contentType || 'all'}
                  onChange={(e) => handleFilterChange('contentType', e.target.value)}
                  style={{
                    width: '100%',
                    background: '#333333',
                    color: '#FFFFFF',
                    border: '1px solid #666666',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    fontSize: '14px'
                  }}
                >
                  <option value="all">All Types</option>
                  <option value="video">Videos</option>
                  <option value="image">Images</option>
                  <option value="contribution">Contributions</option>
                </select>
              </div>

              {/* Engagement Filter */}
              <div>
                <label style={{ color: '#CCCCCC', fontSize: '14px', marginBottom: '8px', display: 'block' }}>
                  Min Engagement
                </label>
                <input
                  type="number"
                  value={filters.minEngagement || ''}
                  onChange={(e) => handleFilterChange('minEngagement', e.target.value)}
                  placeholder="0"
                  style={{
                    width: '100%',
                    background: '#333333',
                    color: '#FFFFFF',
                    border: '1px solid #666666',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Combined Search and Filters Component
export const SearchAndFilters = ({
  onSearch,
  onCategoryChange,
  onTagChange,
  onSortChange,
  onFilterChange,
  selectedCategory = 'all',
  selectedTags = [],
  selectedSort = 'latest',
  filters = {},
  showAdvancedFilters = true,
  className = '',
  style = {}
}) => {
  return (
    <motion.div
      className={className}
      style={{
        padding: '20px',
        background: '#000000',
        borderBottom: '1px solid #333333',
        ...style
      }}
    >
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        {/* Search Bar */}
        <SearchBar onSearch={onSearch} />
        
        {/* Filters Row */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <CategoryFilter
            selectedCategory={selectedCategory}
            onCategoryChange={onCategoryChange}
          />
          
          <SortFilter
            selectedSort={selectedSort}
            onSortChange={onSortChange}
          />
        </div>

        {/* Tags */}
        <TagFilter
          selectedTags={selectedTags}
          onTagChange={onTagChange}
        />

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <AdvancedFilters
            filters={filters}
            onFilterChange={onFilterChange}
          />
        )}
      </div>
    </motion.div>
  );
};

export default {
  SearchBar,
  CategoryFilter,
  TagFilter,
  SortFilter,
  AdvancedFilters,
  SearchAndFilters,
  CATEGORIES,
  POPULAR_TAGS,
  SORT_OPTIONS
}; 