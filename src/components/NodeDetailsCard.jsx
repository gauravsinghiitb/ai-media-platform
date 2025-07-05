import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FaArrowUp,
  FaArrowDown,
  FaShareAlt,
  FaArrowCircleDown,
  FaPlusSquare,
  FaSyncAlt,
  FaTimes,
} from 'react-icons/fa';

// Main component for displaying node details
const NodeDetailsCard = ({
  nodeDetails,
  onContribute,
  onUpvote,
  onDownvote,
  onDownload,
  onShare,
  onRemix,
  hasUpvoted,
  hasDownvoted,
  onClose,
  user,
}) => {
  const initialNetVotes = nodeDetails
    ? (nodeDetails.userUpvotes?.length || nodeDetails.upvotesCount || 0) -
      (nodeDetails.userDownvotes?.length || nodeDetails.downvotesCount || 0)
    : 0;

  const [localIsUpvoted, setLocalIsUpvoted] = useState(
    nodeDetails ? hasUpvoted[nodeDetails.id] || false : false
  );
  const [localIsDownvoted, setLocalIsDownvoted] = useState(
    nodeDetails ? hasDownvoted[nodeDetails.id] || false : false
  );
  const [localNetVotes, setLocalNetVotes] = useState(initialNetVotes);

  // Debug log for nodeDetails and createdAt
  useEffect(() => {
    console.log('NodeDetailsCard - Incoming nodeDetails:', nodeDetails);
    console.log('NodeDetailsCard - createdAt:', nodeDetails?.createdAt);
    if (nodeDetails?.createdAt) {
      const parsedDate = new Date(nodeDetails.createdAt);
      if (!isNaN(parsedDate.getTime())) {
        console.log('NodeDetailsCard - Parsed createdAt:', parsedDate.toISOString());
        console.log('NodeDetailsCard - Formatted time ago:', formatTimeAgo(nodeDetails.createdAt));
      } else {
        console.log('NodeDetailsCard - Invalid createdAt: Unable to parse date');
      }
    } else {
      console.log('NodeDetailsCard - createdAt is undefined or null');
    }
  }, [nodeDetails]);

  useEffect(() => {
    if (nodeDetails) {
      setLocalIsUpvoted(hasUpvoted[nodeDetails.id] || false);
      setLocalIsDownvoted(hasDownvoted[nodeDetails.id] || false);
      setLocalNetVotes(initialNetVotes);
    }
  }, [hasUpvoted, hasDownvoted, nodeDetails, initialNetVotes]);

  if (!nodeDetails) return null;

  // Format timestamp as "X minutes ago", "X hours ago", etc.
  const formatTimeAgo = (timestamp) => {
    console.log('formatTimeAgo - Timestamp:', timestamp);

    if (!timestamp || isNaN(new Date(timestamp).getTime())) {
      console.log('formatTimeAgo - Invalid timestamp, returning fallback');
      return 'Unknown';
    }

    try {
      const now = new Date('2025-06-06T14:11:00.000Z'); // Current time: June 06, 2025, 07:41 PM IST (UTC+5:30)
      const date = new Date(timestamp);
      const diffMs = now - date; // Difference in milliseconds

      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffWeeks = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 7));

      if (diffMinutes < 60) {
        return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
      } else if (diffHours < 24) {
        return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
      } else if (diffDays < 7) {
        return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
      } else {
        return `${diffWeeks} week${diffWeeks !== 1 ? 's' : ''} ago`;
      }
    } catch (error) {
      console.error('formatTimeAgo - Error calculating time ago:', error, timestamp);
      return 'Unknown';
    }
  };

  // Handle upvote action
  const handleUpvote = () => {
    let voteChange = 0;
    if (localIsUpvoted) {
      setLocalIsUpvoted(false);
      voteChange = -1;
    } else {
      setLocalIsUpvoted(true);
      voteChange = 1;
      if (localIsDownvoted) {
        setLocalIsDownvoted(false);
        voteChange += 1;
      }
    }
    setLocalNetVotes((prev) => prev + voteChange);
    onUpvote(nodeDetails.id, nodeDetails);
  };

  // Handle downvote action
  const handleDownvote = () => {
    let voteChange = 0;
    if (localIsDownvoted) {
      setLocalIsDownvoted(false);
      voteChange = 1;
    } else {
      setLocalIsDownvoted(true);
      voteChange = -1;
      if (localIsUpvoted) {
        setLocalIsUpvoted(false);
        voteChange -= 1;
      }
    }
    setLocalNetVotes((prev) => prev + voteChange);
    onDownvote(nodeDetails.id, nodeDetails);
  };

  // Determine the time ago to display based on node ID
  const displayTimeAgo = nodeDetails.id === '1' ? 'N/A' : formatTimeAgo(nodeDetails.createdAt);

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      style={{
        position:'absolute',
        top: '5%',
        left: '15%',
        transform: 'translate(-50%, -50%)',
        maxWidth: '900px',
        width: '90%',
        backgroundColor: '#222222',
        color: '#FFFFFF',
        padding: '30px',
        border: '2px solid #FFFFFF',
        borderRadius: '2px',
        boxShadow: '0 0px 12px rgba(255, 255, 255, 0.73)',
        zIndex: 10000,
      }}
    >
      {/* Close button */}
      <motion.button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: '15px',
          right: '15px',
          background: 'none',
          border: 'none',
          color: '#FFFFFF',
          cursor: 'pointer',
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <FaTimes size={20} />
      </motion.button>

      <div style={{ display: 'flex', gap: '25px' }}>
        {/* Image section */}
        <div style={{ flex: '0 0 350px' }}>
          <img
            src={nodeDetails.imageUrl}
            alt={`Node ${nodeDetails.id}`}
            style={{
              width: '100%',
              borderRadius: '5px',
              marginBottom: '15px',
              border: '1px solid #FFFFFF',
            }}
          />
        </div>

        {/* Details section */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
            <img
              src={nodeDetails.profilePic || 'https://via.placeholder.com/30x30/000/fff?text=User'}
              alt="Profile"
              style={{
                width: '35px',
                height: '35px',
                borderRadius: '50%',
                border: '1px solid #FFFFFF',
              }}
            />
            <span
              style={{
                fontWeight: 'bold',
                fontSize: '18px',
                color: '#FFFFFF',
                cursor: 'pointer',
              }}
            >
              {nodeDetails.username || 'N/A'}
            </span>
          </div>
          <p style={{ fontSize: '14px', color: '#CCCCCC', marginBottom: '15px' }}>
            Created: {displayTimeAgo}
          </p>
          <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#FFFFFF', marginBottom: '10px' }}>
            <strong>Prompt:</strong> {nodeDetails.prompt || 'N/A'}
          </p>
          <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#FFFFFF', marginBottom: '15px' }}>
            <strong>Model:</strong> {nodeDetails.model || 'Unknown'}
          </p>

          {/* Voting and sharing section */}
          {nodeDetails.id !== '1' && (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '10px',
                marginBottom: '15px',
                alignItems: 'center',
              }}
            >
              <motion.div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  border: '1px solid #FFFFFF',
                  borderRadius: '5px',
                  padding: '5px 10px',
                }}
              >
                <motion.div
                  onClick={handleUpvote}
                  style={{ cursor: 'pointer', color: '#FFFFFF', padding: '5px' }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <FaArrowUp
                    size={16}
                    style={{
                      fill: localIsUpvoted ? '#FFFFFF' : 'none',
                      stroke: '#FFFFFF',
                      strokeWidth: localIsUpvoted ? 0 : 30,
                    }}
                  />
                </motion.div>
                <span style={{ fontSize: '14px', color: '#FFFFFF' }}>{localNetVotes}</span>
                <motion.div
                  onClick={handleDownvote}
                  style={{ cursor: 'pointer', color: '#FFFFFF', padding: '5px' }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <FaArrowDown
                    size={16}
                    style={{
                      fill: localIsDownvoted ? '#FFFFFF' : 'none',
                      stroke: '#FFFFFF',
                      strokeWidth: localIsDownvoted ? 0 : 30,
                    }}
                  />
                </motion.div>
              </motion.div>
              <motion.div
                onClick={onShare}
                style={{ cursor: 'pointer', color: '#FFFFFF', padding: '5px' }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <FaShareAlt size={16} style={{ fill: 'none', stroke: '#FFFFFF', strokeWidth: 30 }} />
              </motion.div>
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', marginBottom: '15px' }}>
            {user && (
              <motion.div
                onClick={() => onContribute(nodeDetails.id)}
                style={{
                  cursor: 'pointer',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  border: '1px solid #FFFFFF',
                  borderRadius: '5px',
                  padding: '8px 15px',
                  backgroundColor: '#2E2E2E',
                  transition: 'background-color 0.2s, color 0.2s',
                }}
                whileHover={{ backgroundColor: '#FFFFFF', color: '#1C2526' }}
                whileTap={{ scale: 0.95 }}
              >
                <FaPlusSquare size={16} style={{ fill: 'none', stroke: '#FFFFFF', strokeWidth: 30 }} />
                <span style={{ fontSize: '14px' }}>Contribute</span>
              </motion.div>
            )}
            {nodeDetails.chatLink && (
              <motion.div
                onClick={() => onRemix(nodeDetails.chatLink || '')}
                style={{
                  cursor: 'pointer',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  border: '1px solid #FFFFFF',
                  borderRadius: '5px',
                  padding: '8px 15px',
                  backgroundColor: '#2E2E2E',
                  transition: 'background-color 0.2s, color 0.2s',
                }}
                whileHover={{ backgroundColor: '#FFFFFF', color: '#1C2526' }}
                whileTap={{ scale: 0.95 }}
              >
                <FaSyncAlt size={16} style={{ fill: 'none', stroke: '#FFFFFF', strokeWidth: 30 }} />
                <span style={{ fontSize: '14px' }}>Remix</span>
              </motion.div>
            )}
            <motion.div
              onClick={() => onDownload(nodeDetails.imageUrl, `node-${nodeDetails.id}`)}
              style={{
                cursor: 'pointer',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                border: '1px solid #FFFFFF',
                borderRadius: '5px',
                padding: '8px 15px',
                backgroundColor: '#2E2E2E',
                transition: 'background-color 0.2s, color 0.2s',
              }}
              whileHover={{ backgroundColor: '#FFFFFF', color: '#1C2526' }}
              whileTap={{ scale: 0.95 }}
            >
              <FaArrowCircleDown size={16} style={{ fill: 'none', stroke: '#FFFFFF', strokeWidth: 30 }} />
              <span style={{ fontSize: '14px' }}>Download</span>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default NodeDetailsCard;