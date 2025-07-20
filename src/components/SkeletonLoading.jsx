import React from 'react';
import { motion } from 'framer-motion';

// Skeleton animation
const shimmerAnimation = {
  initial: { x: '-100%' },
  animate: { x: '100%' },
  transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' }
};

// Video Card Skeleton
export const VideoCardSkeleton = () => (
  <motion.div
    style={{
      width: '100%',
      height: '400px',
      background: '#1a1a1a',
      borderRadius: '12px',
      overflow: 'hidden',
      position: 'relative',
      border: '1px solid #333333'
    }}
  >
    {/* Video placeholder */}
    <div style={{ height: '70%', background: '#333333', position: 'relative', overflow: 'hidden' }}>
      <motion.div
        {...shimmerAnimation}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)'
        }}
      />
    </div>
    
    {/* Content area */}
    <div style={{ padding: '12px' }}>
      {/* User info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#333333' }} />
        <div style={{ flex: 1 }}>
          <div style={{ height: '12px', background: '#333333', borderRadius: '4px', marginBottom: '4px', width: '60%' }} />
          <div style={{ height: '10px', background: '#333333', borderRadius: '4px', width: '40%' }} />
        </div>
      </div>
      
      {/* Caption */}
      <div style={{ height: '14px', background: '#333333', borderRadius: '4px', marginBottom: '6px' }} />
      <div style={{ height: '14px', background: '#333333', borderRadius: '4px', width: '80%' }} />
    </div>
  </motion.div>
);

// Post Card Skeleton
export const PostCardSkeleton = () => (
  <motion.div
    style={{
      width: '100%',
      background: '#1a1a1a',
      borderRadius: '12px',
      overflow: 'hidden',
      border: '1px solid #333333'
    }}
  >
    {/* Image placeholder */}
    <div style={{ height: '200px', background: '#333333', position: 'relative', overflow: 'hidden' }}>
      <motion.div
        {...shimmerAnimation}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)'
        }}
      />
    </div>
    
    {/* Content */}
    <div style={{ padding: '12px' }}>
      <div style={{ height: '16px', background: '#333333', borderRadius: '4px', marginBottom: '8px' }} />
      <div style={{ height: '12px', background: '#333333', borderRadius: '4px', width: '70%' }} />
    </div>
  </motion.div>
);

// User Profile Skeleton
export const UserProfileSkeleton = () => (
  <motion.div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      padding: '20px',
      background: 'linear-gradient(135deg, #1a1a1a 0%, #333333 100%)',
      borderRadius: '16px',
      border: '1px solid #333333'
    }}
  >
    {/* Avatar */}
    <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#333333' }} />
    
    {/* Info */}
    <div style={{ flex: 1 }}>
      <div style={{ height: '20px', background: '#333333', borderRadius: '4px', marginBottom: '8px', width: '60%' }} />
      <div style={{ height: '14px', background: '#333333', borderRadius: '4px', width: '40%' }} />
    </div>
    
    {/* Stats */}
    <div style={{ padding: '12px 20px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '12px' }}>
      <div style={{ height: '20px', background: '#333333', borderRadius: '4px', marginBottom: '4px' }} />
      <div style={{ height: '10px', background: '#333333', borderRadius: '4px', width: '80%' }} />
    </div>
  </motion.div>
);

// Video Feed Skeleton
export const VideoFeedSkeleton = () => (
  <div style={{ padding: '20px', paddingLeft: '100px' }}>
    {[...Array(3)].map((_, index) => (
      <motion.div
        key={index}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        style={{ marginBottom: '20px' }}
      >
        <VideoCardSkeleton />
      </motion.div>
    ))}
  </div>
);

// Grid Skeleton
export const GridSkeleton = ({ columns = 5, items = 10 }) => (
  <div style={{
    columnCount: columns,
    columnGap: '20px',
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '0 10px'
  }}>
    {[...Array(items)].map((_, index) => (
      <motion.div
        key={index}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: index * 0.05 }}
        style={{ 
          breakInside: 'avoid', 
          marginBottom: '20px' 
        }}
      >
        <PostCardSkeleton />
      </motion.div>
    ))}
  </div>
);

// Search Results Skeleton
export const SearchResultsSkeleton = () => (
  <div style={{ padding: '20px', paddingLeft: '100px' }}>
    <div style={{ marginBottom: '30px' }}>
      <UserProfileSkeleton />
    </div>
    <GridSkeleton items={6} />
  </div>
);

// Trending Section Skeleton
export const TrendingSectionSkeleton = () => (
  <div style={{ padding: '20px', paddingLeft: '100px' }}>
    <motion.div
      style={{
        height: '40px',
        background: '#333333',
        borderRadius: '8px',
        marginBottom: '20px',
        width: '200px'
      }}
    />
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '20px'
    }}>
      {[...Array(6)].map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <VideoCardSkeleton />
        </motion.div>
      ))}
    </div>
  </div>
);

// Filter Skeleton
export const FilterSkeleton = () => (
  <motion.div
    style={{
      display: 'flex',
      gap: '12px',
      marginBottom: '20px',
      flexWrap: 'wrap'
    }}
  >
    {[...Array(5)].map((_, index) => (
      <motion.div
        key={index}
        style={{
          height: '36px',
          background: '#333333',
          borderRadius: '18px',
          width: '80px'
        }}
      />
    ))}
  </motion.div>
);

export default {
  VideoCardSkeleton,
  PostCardSkeleton,
  UserProfileSkeleton,
  VideoFeedSkeleton,
  GridSkeleton,
  SearchResultsSkeleton,
  TrendingSectionSkeleton,
  FilterSkeleton
}; 