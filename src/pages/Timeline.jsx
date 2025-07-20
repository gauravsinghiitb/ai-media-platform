import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FaArrowUp,
  FaArrowDown,
  FaShareAlt,
  FaArrowCircleDown,
  FaPlusSquare,
  FaSyncAlt,
  FaReply,
  FaTrashAlt,
  FaTimes,
  FaMapMarkerAlt,
} from 'react-icons/fa';
import { LazyImage } from '../components/LazyLoad';

const Timeline = ({
  parentNode,
  allNodes,
  user,
  navigate,
  handleContribute,
  handleUpvote,
  handleDownvote,
  handleDownload,
  handleShare,
  hasUpvoted,
  hasDownvoted,
  nodeComments,
  newNodeComment,
  setNewNodeComment,
  handleNodeCommentSubmit,
  handleNodeCommentLike,
  handleNodeCommentDelete,
  handleReplyClick,
  replyingTo,
  setReplyingTo,
  getRelativeTime,
  handleRemix,
  onLocateInTimeline,
}) => {
  const [expandedComments, setExpandedComments] = useState({});
  const [localComments, setLocalComments] = useState({});
  const [selectedNode, setSelectedNode] = useState(null);

  const toggleComments = (nodeId) => {
    setExpandedComments((prev) => ({
      ...prev,
      [nodeId]: !prev[nodeId],
    }));
  };

  const handleCommentChange = (nodeId, text) => {
    setLocalComments((prev) => ({
      ...prev,
      [nodeId]: text,
    }));
    setNewNodeComment(nodeId, text);
  };

  const handleCommentSubmit = (nodeId, parentCommentId = null) => {
    const commentText = localComments[nodeId]?.trim();
    if (commentText) {
      handleNodeCommentSubmit(nodeId, commentText, parentCommentId);
      setLocalComments((prev) => ({
        ...prev,
        [nodeId]: '',
      }));
      setNewNodeComment(nodeId, '');
      setExpandedComments((prev) => ({
        ...prev,
        [nodeId]: true,
      }));
      if (parentCommentId) {
        setReplyingTo(null);
      }
    }
  };

  const handleKeyDown = (e, nodeId, parentCommentId = null) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleCommentSubmit(nodeId, parentCommentId);
    }
  };

  // Recursive function to render comments and their replies
  const renderComments = (comments, nodeId, level = 0, parentCommentId = null) => {
    return comments.filter(Boolean).map((comment) => {
      const isReplying = replyingTo && replyingTo.nodeId === nodeId && replyingTo.commentId === comment.id;
      return (
        <div
          key={comment.id}
          style={{
            marginLeft: level * 20,
            marginBottom: '5px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              padding: '5px 0',
              borderBottom: '1px solid #333333',
            }}
          >
            <img
              src={comment.profilePic || 'https://dummyimage.com/30x30/000/fff?text=User'}
              alt="Profile"
              style={{ width: '20px', height: '20px', borderRadius: '50%', marginRight: '8px' }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  style={{
                    fontWeight: '500',
                    fontSize: '12px',
                    color: '#FFFFFF',
                    cursor: 'pointer',
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/profile/${comment.userId}`);
                  }}
                >
                  {comment.username || 'Anonymous'}
                </span>
                <span style={{ color: '#888888', fontSize: '10px' }}>
                  {getRelativeTime(comment.timestamp)}
                </span>
              </div>
              <p style={{ fontSize: '12px', margin: '2px 0', color: '#FFFFFF' }}>{comment.comment}</p>
              <div style={{ display: 'flex', gap: '12px', marginTop: '4px', alignItems: 'center' }}>
                {user && (
                  <motion.div
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNodeCommentLike(nodeId, comment.id, parentCommentId);
                    }}
                    style={{
                      cursor: 'pointer',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '2px',
                    }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <FaArrowUp
                      size={14}
                      style={{
                        fill: (comment.userLikes || []).includes(user.uid) ? '#FFFFFF' : 'none',
                        stroke: '#FFFFFF',
                        strokeWidth: (comment.userLikes || []).includes(user.uid) ? 0 : 30,
                      }}
                    />
                    <span style={{ fontSize: '10px' }}>{comment.likesCount || 0}</span>
                  </motion.div>
                )}
                <motion.div
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReplyClick(nodeId, comment.id);
                  }}
                  style={{
                    cursor: 'pointer',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '2px',
                  }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <FaReply
                    size={14}
                    style={{
                      fill: isReplying ? '#FFFFFF' : 'none',
                      stroke: '#FFFFFF',
                      strokeWidth: isReplying ? 0 : 30,
                    }}
                  />
                  <span style={{ fontSize: '10px' }}>Reply</span>
                </motion.div>
                {user && comment.userId === user.uid && (
                  <motion.div
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNodeCommentDelete(nodeId, comment.id, parentCommentId);
                    }}
                    style={{
                      cursor: 'pointer',
                      color: '#FFFFFF',
                      padding: '2px',
                    }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <FaTrashAlt
                      size={14}
                      style={{
                        fill: 'none',
                        stroke: '#FFFFFF',
                        strokeWidth: 30,
                      }}
                    />
                  </motion.div>
                )}
              </div>
              {isReplying && (
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px', marginLeft: '20px' }}>
                  <input
                    type="text"
                    value={localComments[nodeId] || newNodeComment[nodeId] || ''}
                    onChange={(e) => handleCommentChange(nodeId, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, nodeId, comment.id)}
                    placeholder={`Reply to ${comment.username}...`}
                    style={{
                      flex: 1,
                      padding: '5px',
                      backgroundColor: '#333333',
                      color: '#FFFFFF',
                      border: '1px solid #555555',
                      borderRadius: '3px',
                      fontSize: '12px',
                    }}
                  />
                  <motion.button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCommentSubmit(nodeId, comment.id);
                    }}
                    style={{
                      padding: '5px 10px',
                      backgroundColor: '#333333',
                      color: '#FFFFFF',
                      border: '1px solid #555555',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      fontSize: '12px',
                    }}
                    whileHover={{ scale: 1.05, backgroundColor: '#555555' }}
                    whileTap={{ scale: 0.95, backgroundColor: '#444444' }}
                  >
                    Reply
                  </motion.button>
                  <motion.button
                    onClick={(e) => {
                      e.stopPropagation();
                      setReplyingTo(null);
                    }}
                    style={{
                      padding: '5px 10px',
                      backgroundColor: '#333333',
                      color: '#FFFFFF',
                      border: '1px solid #555555',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      fontSize: '12px',
                    }}
                    whileHover={{ scale: 1.05, backgroundColor: '#555555' }}
                    whileTap={{ scale: 0.95, backgroundColor: '#444444' }}
                  >
                    Cancel
                  </motion.button>
                </div>
              )}
            </div>
          </div>
          {comment.replies && comment.replies.length > 0 && renderComments(comment.replies, nodeId, level + 1, comment.id)}
        </div>
      );
    });
  };

  if (!parentNode) {
    return (
      <div style={{ padding: '20px', backgroundColor: '#000000', color: '#FFFFFF' }}>
        <p>Loading timeline...</p>
      </div>
    );
  }

  const filteredNodes = allNodes ? allNodes.filter((node) => node != null) : [];
  // Sort nodes by createdAt in ascending order
  const sortedNodes = filteredNodes.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  const allTimelineNodes = [parentNode, ...sortedNodes];
  const totalContributions = sortedNodes.length;

  return (
    <div className="timeline-section" style={{ padding: '20px', backgroundColor: '#000000', color: '#FFFFFF', position: 'relative' }}>
      <div
        style={{
          position: 'absolute',
          left: '40px',
          top: '120px',
          bottom: '20px',
          width: '2px',
          backgroundColor: '#333333',
          zIndex: 0,
        }}
      />

      <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '10px', color: '#FFFFFF' }}>Timeline</h2>
      <p
        style={{
          fontSize: '22px',
          fontWeight: '600',
          color: '#FFFFFF',
          marginBottom: '20px',
          backgroundColor: '#000000',
          display: 'inline-block',
          padding: '2px 8px',
          borderRadius: '3px',
        }}
      >
        Total Contributions: {totalContributions}
      </p>

      {allTimelineNodes.map((node, index) => {
        const netVotes = (node.upvotesCount || 0) - (node.downvotesCount || 0);
        return (
          <div
            key={node.id}
            style={{ display: 'flex', marginBottom: '40px', position: 'relative', cursor: 'pointer' }}
            onClick={() => setSelectedNode(node)}
          >
            <div
              style={{
                width: '20px',
                height: '20px',
                backgroundColor: '#FFFFFF',
                borderRadius: '50%',
                marginRight: '20px',
                marginTop: '10px',
                marginLeft: '10px',
                zIndex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: '600',
                color: '#000000',
              }}
            >
              {index + 1}
            </div>
            <div style={{ display: 'flex', flex: 1, gap: '20px' }}>
              {/* Left Side: Username, Date Posted, Image/Video */}
              <div style={{ flex: '0 0 200px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <img
                      src={node.profilePic || 'https://dummyimage.com/30x30/000/fff?text=User'}
                      alt="Profile"
                      style={{ width: '20px', height: '20px', borderRadius: '50%' }}
                    />
                    <span
                      style={{
                        fontWeight: '500',
                        fontSize: '14px',
                        color: '#FFFFFF',
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/profile/${node.userId}`);
                      }}
                    >
                      {node.username || 'unknown'}
                    </span>
                  </div>
                  <p style={{ fontSize: '14px', color: '#BBBBBB', marginLeft: '28px' }}>
                    {getRelativeTime(node.createdAt)}
                  </p>
                </div>
                <img
                  src={node.imageUrl}
                  alt={`Node ${node.id}`}
                  style={{ width: '100%', maxWidth: '200px', borderRadius: '5px', marginBottom: '10px' }}
                />
              </div>

              {/* Right Side: Node Details, Actions, Comments */}
              <div style={{ flex: 1 }}>
                {node.id !== '1' && (
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '10px', alignItems: 'center' }}>
                    <motion.div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        border: '1px solid #555555',
                        borderRadius: '5px',
                        padding: '0px 0px',
                      }}
                    >
                      <motion.div
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpvote(node.id, node);
                        }}
                        style={{ cursor: 'pointer', color: '#FFFFFF', padding: '10px' }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <FaArrowUp
                          size={20}
                          style={{
                            fill: hasUpvoted[node.id] ? '#FFFFFF' : 'none',
                            stroke: '#FFFFFF',
                            strokeWidth: hasUpvoted[node.id] ? 0 : 30,
                          }}
                        />
                      </motion.div>
                      <span style={{ fontSize: '12px', color: '#FFFFFF' }}>{netVotes}</span>
                      <motion.div
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownvote(node.id, node);
                        }}
                        style={{ cursor: 'pointer', color: '#FFFFFF', padding: '10px' }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <FaArrowDown
                          size={20}
                          style={{
                            fill: hasDownvoted[node.id] ? '#FFFFFF' : 'none',
                            stroke: '#FFFFFF',
                            strokeWidth: hasDownvoted[node.id] ? 0 : 30,
                          }}
                        />
                      </motion.div>
                    </motion.div>
                    <motion.div
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShare();
                      }}
                      style={{ cursor: 'pointer', color: '#FFFFFF', padding: '6px' }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <FaShareAlt
                        size={20}
                        style={{
                          fill: 'none',
                          stroke: '#FFFFFF',
                          strokeWidth: 30,
                        }}
                      />
                    </motion.div>
                  </div>
                )}
                <p style={{ fontSize: '14px', marginBottom: '5px', color: '#FFFFFF' }}>
                  <strong>Prompt:</strong> {node.prompt || 'N/A'}
                </p>
                <p style={{ fontSize: '14px', marginBottom: '10px', color: '#FFFFFF' }}>
                  <strong>Model:</strong> {node.model || 'Unknown'}
                </p>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '10px', alignItems: 'center' }}>
                  <motion.div
                    onClick={(e) => {
                      e.stopPropagation();
                      handleContribute(node.id);
                    }}
                    className="luminous-border"
                    style={{
                      cursor: 'pointer',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      borderRadius: '5px',
                      padding: '8px 16px',
                      backgroundColor: '#000000',
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FaPlusSquare
                      size={20}
                      style={{
                        fill: 'none',
                        stroke: '#FFFFFF',
                        strokeWidth: 30,
                      }}
                    />
                    <span style={{ fontSize: '12px' }}>Contribute</span>
                  </motion.div>
                  {node.chatLink && (
                    <motion.div
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemix(node.chatLink || '');
                      }}
                      style={{
                        cursor: 'pointer',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        border: '1px solid #555555',
                        borderRadius: '5px',
                        padding: '8px 16px',
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <FaSyncAlt
                        size={20}
                        style={{
                          fill: 'none',
                          stroke: '#FFFFFF',
                          strokeWidth: 30,
                        }}
                      />
                      <span style={{ fontSize: '12px' }}>Remix</span>
                    </motion.div>
                  )}
                  <motion.div
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(node.imageUrl, `node-${node.id}`);
                    }}
                    style={{
                      cursor: 'pointer',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      border: '1px solid #555555',
                      borderRadius: '5px',
                      padding: '8px 16px',
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FaArrowCircleDown
                      size={20}
                      style={{
                        fill: 'none',
                        stroke: '#FFFFFF',
                        strokeWidth: 30,
                      }}
                    />
                    <span style={{ fontSize: '12px' }}>Download</span>
                  </motion.div>
                  {onLocateInTimeline && (
                    <motion.div
                      onClick={(e) => {
                        e.stopPropagation();
                        onLocateInTimeline(node.id);
                      }}
                      style={{
                        cursor: 'pointer',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        border: '1px solid #555555',
                        borderRadius: '5px',
                        padding: '8px 16px',
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <FaMapMarkerAlt
                        size={20}
                        style={{
                          fill: 'none',
                          stroke: '#FFFFFF',
                          strokeWidth: 30,
                        }}
                      />
                      <span style={{ fontSize: '12px' }}>Locate</span>
                    </motion.div>
                  )}
                </div>

                {/* Comments Section (Exclude for Parent Node) */}
                {node.id !== parentNode.id && (
                  <div
                    style={{ marginTop: '10px' }}
                    onClick={(e) => e.stopPropagation()} // Prevent clicks in comments section from opening node details
                  >
                    <motion.div
                      onClick={() => toggleComments(node.id)}
                      style={{
                        cursor: 'pointer',
                        color: '#888888',
                        fontSize: '14px',
                        marginBottom: '8px',
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Comments ({(nodeComments[node.id] || []).filter(Boolean).length})
                    </motion.div>
                    {expandedComments[node.id] && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        style={{
                          maxHeight: '200px',
                          overflowY: 'auto',
                          paddingRight: '8px',
                        }}
                      >
                        {renderComments(nodeComments[node.id] || [], node.id)}
                        {user ? (
                          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                            <input
                              type="text"
                              value={localComments[node.id] || newNodeComment[node.id] || ''}
                              onChange={(e) => handleCommentChange(node.id, e.target.value)}
                              onKeyDown={(e) => handleKeyDown(e, node.id)}
                              placeholder="Add a comment..."
                              style={{
                                flex: 1,
                                padding: '5px',
                                backgroundColor: '#333333',
                                color: '#FFFFFF',
                                border: '1px solid #555555',
                                borderRadius: '3px',
                                fontSize: '12px',
                              }}
                            />
                            <motion.button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCommentSubmit(node.id);
                              }}
                              style={{
                                padding: '5px 10px',
                                backgroundColor: '#333333',
                                color: '#FFFFFF',
                                border: '1px solid #555555',
                                borderRadius: '3px',
                                cursor: 'pointer',
                                fontSize: '12px',
                              }}
                              whileHover={{ scale: 1.05, backgroundColor: '#555555' }}
                              whileTap={{ scale: 0.95, backgroundColor: '#444444' }}
                            >
                              Submit
                            </motion.button>
                          </div>
                        ) : (
                          <p style={{ color: '#888888', fontSize: '12px', marginTop: '8px' }}>
                            Please log in to add a comment.
                          </p>
                        )}
                      </motion.div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* Popup for Node Detail Card */}
      {selectedNode && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setSelectedNode(null)}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            style={{
              backgroundColor: '#000000',
              color: '#FFFFFF',
              padding: '20px',
              borderRadius: '10px',
              maxWidth: '600px',
              width: '90%',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <motion.button
              onClick={() => setSelectedNode(null)}
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
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
            <div style={{ display: 'flex', gap: '20px' }}>
              <div style={{ flex: '0 0 300px' }}>
                <img
                  src={selectedNode.imageUrl}
                  alt={`Node ${selectedNode.id}`}
                  style={{ width: '100%', borderRadius: '5px', marginBottom: '10px' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <img
                    src={selectedNode.profilePic || 'https://dummyimage.com/30x30/000/fff?text=User'}
                    alt="Profile"
                    style={{ width: '30px', height: '30px', borderRadius: '50%' }}
                  />
                  <span
                    style={{
                      fontWeight: '500',
                      fontSize: '16px',
                      color: '#FFFFFF',
                      cursor: 'pointer',
                    }}
                    onClick={() => {
                      navigate(`/profile/${selectedNode.userId}`);
                      setSelectedNode(null);
                    }}
                  >
                    {selectedNode.username || 'unknown'}
                  </span>
                </div>
                <p style={{ fontSize: '14px', color: '#BBBBBB', marginBottom: '10px' }}>
                  {getRelativeTime(selectedNode.createdAt)}
                </p>
                <p style={{ fontSize: '16px', marginBottom: '5px', color: '#FFFFFF' }}>
                  <strong>Prompt:</strong> {selectedNode.prompt || 'N/A'}
                </p>
                <p style={{ fontSize: '16px', marginBottom: '10px', color: '#FFFFFF' }}>
                  <strong>Model:</strong> {selectedNode.model || 'Unknown'}
                </p>
                {selectedNode.id !== '1' && (
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '10px', alignItems: 'center' }}>
                    <motion.div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        border: '1px solid #555555',
                        borderRadius: '5px',
                        padding: '8px 16px',
                      }}
                    >
                      <motion.div
                        onClick={() => handleUpvote(selectedNode.id, selectedNode)}
                        style={{ cursor: 'pointer', color: '#FFFFFF', padding: '2px' }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <FaArrowUp
                          size={20}
                          style={{
                            fill: hasUpvoted[selectedNode.id] ? '#FFFFFF' : 'none',
                            stroke: '#FFFFFF',
                            strokeWidth: hasUpvoted[selectedNode.id] ? 0 : 30,
                          }}
                        />
                      </motion.div>
                      <span style={{ fontSize: '12px', color: '#FFFFFF' }}>
                        {(selectedNode.upvotesCount || 0) - (selectedNode.downvotesCount || 0)}
                      </span>
                      <motion.div
                        onClick={() => handleDownvote(selectedNode.id, selectedNode)}
                        style={{ cursor: 'pointer', color: '#FFFFFF', padding: '2px' }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <FaArrowDown
                          size={20}
                          style={{
                            fill: hasDownvoted[selectedNode.id] ? '#FFFFFF' : 'none',
                            stroke: '#FFFFFF',
                            strokeWidth: hasDownvoted[selectedNode.id] ? 0 : 30,
                          }}
                        />
                      </motion.div>
                    </motion.div>
                    <motion.div
                      onClick={handleShare}
                      style={{ cursor: 'pointer', color: '#FFFFFF', padding: '10px' }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <FaShareAlt
                        size={20}
                        style={{
                          fill: 'none',
                          stroke: '#FFFFFF',
                          strokeWidth: 30,
                        }}
                      />
                    </motion.div>
                  </div>
                )}
                <div style={{ display: 'flex', gap: '12px', marginBottom: '10px', alignItems: 'center' }}>
                  <motion.div
                    onClick={() => handleContribute(selectedNode.id)}
                    className="luminous-border"
                    style={{
                      cursor: 'pointer',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      borderRadius: '5px',
                      padding: '8px 16px',
                      backgroundColor: '#000000',
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FaPlusSquare
                      size={20}
                      style={{
                        fill: 'none',
                        stroke: '#FFFFFF',
                        strokeWidth: 30,
                      }}
                    />
                    <span style={{ fontSize: '12px' }}>Contribute</span>
                  </motion.div>
                  {selectedNode.chatLink && (
                    <motion.div
                      onClick={() => handleRemix(selectedNode.chatLink || '')}
                      style={{
                        cursor: 'pointer',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        border: '1px solid #555555',
                        borderRadius: '5px',
                        padding: '8px 16px',
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <FaSyncAlt
                        size={20}
                        style={{
                          fill: 'none',
                          stroke: '#FFFFFF',
                          strokeWidth: 30,
                        }}
                      />
                      <span style={{ fontSize: '12px' }}>Remix</span>
                    </motion.div>
                  )}
                  <motion.div
                    onClick={() => handleDownload(selectedNode.imageUrl, `node-${selectedNode.id}`)}
                    style={{
                      cursor: 'pointer',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      border: '1px solid #555555',
                      borderRadius: '5px',
                      padding: '8px 16px',
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FaArrowCircleDown
                      size={20}
                      style={{
                        fill: 'none',
                        stroke: '#FFFFFF',
                        strokeWidth: 30,
                      }}
                    />
                    <span style={{ fontSize: '12px' }}>Download</span>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Keyframes for Luminous Multicolor Border */}
      <style>
        {`
          @keyframes rotateBorder {
            0% {
              border-image: linear-gradient(0deg, #ff0000, #0000ff, #ff00ff, #00ff00) 1;
              box-shadow: 0 0 1px rgba(255, 0, 0, 0.5), 0 0 1px rgba(255, 0, 0, 0.3);
            }
            25% {
              border-image: linear-gradient(90deg, #ff0000, #0000ff, #ff00ff, #00ff00) 1;
              box-shadow: 0 0 1px rgba(0, 0, 255, 0.5), 0 0 1px rgba(0, 0, 255, 0.3);
            }
            50% {
              border-image: linear-gradient(180deg, #ff0000, #0000ff, #ff00ff, #00ff00) 1;
              box-shadow: 0 0 1px rgba(255, 0, 255, 0.5), 0 0 1px rgba(255, 0, 255, 0.3);
            }
            75% {
              border-image: linear-gradient(270deg, #ff0000, #0000ff, #ff00ff, #00ff00) 1;
              box-shadow: 0 0 1px rgba(0, 255, 0, 0.5), 0 0 1px rgba(0, 255, 0, 0.3);
            }
            100% {
              border-image: linear-gradient(360deg, #ff0000, #0000ff, #ff00ff, #00ff00) 1;
              box-shadow: 0 0 1px rgba(255, 0, 0, 0.5), 0 0 1px rgba(255, 0, 0, 0.3);
            }
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
    </div>
  );
};

export default Timeline;