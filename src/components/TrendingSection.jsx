import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaFire, FaTrendingUp, FaEye, FaHeart, FaComment, FaShare } from 'react-icons/fa';
import { LazyImage } from './LazyLoad';
import { TrendingSectionSkeleton } from './SkeletonLoading';

// Trending Analytics Component
export const TrendingAnalytics = ({ data, className = '', style = {} }) => {
  return (
    <motion.div
      className={className}
      style={{
        background: 'linear-gradient(135deg, #1a1a1a 0%, #333333 100%)',
        borderRadius: '16px',
        padding: '20px',
        border: '1px solid #333333',
        ...style
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '20px'
      }}>
        <FaTrendingUp size={24} style={{ color: '#FF6B6B' }} />
        <h3 style={{
          fontSize: '20px',
          fontWeight: '700',
          color: '#FFFFFF',
          margin: 0
        }}>
          Trending Analytics
        </h3>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '16px'
      }}>
        {data.map((metric, index) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              padding: '16px',
              textAlign: 'center',
              border: '1px solid #333333'
            }}
          >
            <div style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#FFFFFF',
              marginBottom: '4px'
            }}>
              {metric.value}
            </div>
            <div style={{
              fontSize: '12px',
              color: '#CCCCCC',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>
              {metric.label}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

// Trending Post Card
export const TrendingPostCard = ({ post, onClick, className = '', style = {} }) => {
  const engagementScore = (post.likedBy?.length || 0) + (post.comments?.length || 0) * 2 + (post.contributionCount || 0) * 3;

  return (
    <motion.div
      className={className}
      style={{
        background: '#1a1a1a',
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid #333333',
        cursor: 'pointer',
        position: 'relative',
        ...style
      }}
      whileHover={{ 
        scale: 1.02, 
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        borderColor: '#666666'
      }}
      onClick={onClick}
    >
      {/* Trending Badge */}
      <motion.div
        style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          background: 'linear-gradient(45deg, #FF6B6B, #FF8E53)',
          color: '#FFFFFF',
          padding: '4px 8px',
          borderRadius: '6px',
          fontSize: '10px',
          fontWeight: '700',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2 }}
      >
        <FaFire size={10} />
        Trending
      </motion.div>

      {/* Engagement Score */}
      <motion.div
        style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          background: 'rgba(0, 0, 0, 0.8)',
          color: '#FFFFFF',
          padding: '4px 8px',
          borderRadius: '6px',
          fontSize: '10px',
          fontWeight: '600',
          zIndex: 10
        }}
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.3 }}
      >
        {engagementScore} pts
      </motion.div>

      {/* Media */}
      <div style={{ height: '200px', position: 'relative' }}>
        <LazyImage
          src={post.aiGeneratedUrl}
          alt={post.caption || 'Post media'}
          style={{ height: '100%' }}
        />
      </div>

      {/* Content */}
      <div style={{ padding: '16px' }}>
        {/* User Info */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '8px'
        }}>
          <img
            src={post.profilePic || 'https://via.placeholder.com/32x32/333333/666666?text=U'}
            alt="User"
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              objectFit: 'cover'
            }}
          />
          <span style={{
            fontSize: '12px',
            color: '#CCCCCC',
            fontWeight: '600'
          }}>
            @{post.username || 'Unknown'}
          </span>
        </div>

        {/* Caption */}
        <p style={{
          fontSize: '14px',
          color: '#FFFFFF',
          margin: '0 0 12px 0',
          lineHeight: '1.4',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }}>
          {post.caption || 'No caption'}
        </p>

        {/* Engagement Stats */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '12px',
          color: '#CCCCCC'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <FaHeart size={12} />
            <span>{post.likedBy?.length || 0}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <FaComment size={12} />
            <span>{post.comments?.length || 0}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <FaShare size={12} />
            <span>{post.contributionCount || 0}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Trending Section Main Component
export const TrendingSection = ({ 
  posts = [], 
  contributions = [],
  onPostClick,
  onContributionClick,
  loading = false,
  className = '',
  style = {}
}) => {
  const [activeTab, setActiveTab] = useState('posts');
  const [trendingData, setTrendingData] = useState([]);

  // Calculate trending metrics
  useEffect(() => {
    const calculateTrendingMetrics = () => {
      const allItems = [
        ...posts.map(post => ({ ...post, type: 'post' })),
        ...contributions.map(contrib => ({ ...contrib, type: 'contribution' }))
      ];

      // Sort by engagement score
      const sortedItems = allItems.sort((a, b) => {
        const scoreA = (a.likedBy?.length || 0) + (a.comments?.length || 0) * 2 + (a.contributionCount || 0) * 3;
        const scoreB = (b.likedBy?.length || 0) + (b.comments?.length || 0) * 2 + (b.contributionCount || 0) * 3;
        return scoreB - scoreA;
      });

      setTrendingData(sortedItems.slice(0, 12)); // Top 12 trending items
    };

    calculateTrendingMetrics();
  }, [posts, contributions]);

  const analyticsData = [
    { label: 'Total Views', value: posts.reduce((sum, post) => sum + (post.views || 0), 0).toLocaleString() },
    { label: 'Total Likes', value: posts.reduce((sum, post) => sum + (post.likedBy?.length || 0), 0).toLocaleString() },
    { label: 'Total Comments', value: posts.reduce((sum, post) => sum + (post.comments?.length || 0), 0).toLocaleString() },
    { label: 'Total Contributions', value: contributions.length.toLocaleString() }
  ];

  if (loading) {
    return <TrendingSectionSkeleton />;
  }

  return (
    <motion.div
      className={className}
      style={{
        padding: '20px',
        paddingLeft: '100px',
        background: '#000000',
        ...style
      }}
    >
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '30px'
          }}
        >
          <FaFire size={32} style={{ color: '#FF6B6B' }} />
          <h2 style={{
            fontSize: '28px',
            fontWeight: '700',
            color: '#FFFFFF',
            margin: 0
          }}>
            Trending Now
          </h2>
        </motion.div>

        {/* Analytics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{ marginBottom: '30px' }}
        >
          <TrendingAnalytics data={analyticsData} />
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '20px'
          }}
        >
          <motion.button
            onClick={() => setActiveTab('posts')}
            style={{
              background: activeTab === 'posts' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.1)',
              color: activeTab === 'posts' ? '#000000' : '#FFFFFF',
              border: `1px solid ${activeTab === 'posts' ? '#FFFFFF' : '#333333'}`,
              borderRadius: '8px',
              padding: '10px 20px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Trending Posts ({posts.length})
          </motion.button>
          
          <motion.button
            onClick={() => setActiveTab('contributions')}
            style={{
              background: activeTab === 'contributions' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.1)',
              color: activeTab === 'contributions' ? '#000000' : '#FFFFFF',
              border: `1px solid ${activeTab === 'contributions' ? '#FFFFFF' : '#333333'}`,
              borderRadius: '8px',
              padding: '10px 20px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Trending Contributions ({contributions.length})
          </motion.button>
        </motion.div>

        {/* Content Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '20px'
            }}
          >
            {activeTab === 'posts' ? (
              posts.slice(0, 6).map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <TrendingPostCard
                    post={post}
                    onClick={() => onPostClick?.(post)}
                  />
                </motion.div>
              ))
            ) : (
              contributions.slice(0, 6).map((contribution, index) => (
                <motion.div
                  key={contribution.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <TrendingPostCard
                    post={contribution}
                    onClick={() => onContributionClick?.(contribution)}
                  />
                </motion.div>
              ))
            )}
          </motion.div>
        </AnimatePresence>

        {/* Empty State */}
        {((activeTab === 'posts' && posts.length === 0) || 
          (activeTab === 'contributions' && contributions.length === 0)) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: '#CCCCCC'
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>🔥</div>
            <h3 style={{ fontSize: '20px', marginBottom: '10px', color: '#FFFFFF' }}>
              No Trending {activeTab === 'posts' ? 'Posts' : 'Contributions'} Yet
            </h3>
            <p style={{ fontSize: '14px', color: '#999999' }}>
              Be the first to create trending content!
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default TrendingSection; 