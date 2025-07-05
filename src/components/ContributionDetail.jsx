import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase/firebase';
import {
  FaArrowUp,
  FaArrowDown,
  FaShareAlt,
  FaArrowCircleDown,
  FaSyncAlt,
  FaTimes,
  FaReply,
  FaTrashAlt,
} from 'react-icons/fa';
import { v4 as uuidv4 } from 'uuid';

const ContributionDetail = ({ contribution, post, onClose, userId }) => {
  const navigate = useNavigate();
  const mediaUrl = contribution.imageUrl || 'https://dummyimage.com/400x400/000/fff?text=Media+Unavailable';
  const contributorProfilePic = contribution.profilePic || 'https://dummyimage.com/40x40/000/fff?text=User';
  const [likes, setLikes] = useState(contribution.likesCount || 0);
  const [hasLiked, setHasLiked] = useState(contribution.userUpvotes?.includes(userId) || false);
  const [hasDownvoted, setHasDownvoted] = useState(contribution.userDownvotes?.includes(userId) || false);
  const [postHasLiked, setPostHasLiked] = useState(post?.userUpvotes?.includes(userId) || false);
  const [postHasDownvoted, setPostHasDownvoted] = useState(post?.userDownvotes?.includes(userId) || false);
  const [postNetVotes, setPostNetVotes] = useState((post?.upvotesCount || 0) - (post?.downvotesCount || 0));
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [commentError, setCommentError] = useState(null);
  const [navigationError, setNavigationError] = useState(null);
  const initialNetVotes = (contribution.upvotesCount || 0) - (contribution.downvotesCount || 0);
  const [localNetVotes, setLocalNetVotes] = useState(initialNetVotes);
  const [commentsList, setCommentsList] = useState(contribution.comments || []);
  const [isCommentsOnlyView, setIsCommentsOnlyView] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [localComments, setLocalComments] = useState({});

  const handleLocateContribution = () => {
    if (!contribution.parentNode) {
      console.error('Navigation failed: No parent node exists for this contribution');
      setNavigationError('This contribution has no parent node to locate in the timeline.');
      return;
    }

    console.log('Navigating to parent node timeline with:', { userId, postId: contribution.postId, nodeId: contribution.parentNode.id });
    if (userId && contribution.postId && contribution.parentNode.id) {
      const url = `/contribute/${userId}/${contribution.postId}?nodeId=${contribution.parentNode.id}`;
      try {
        navigate(url);
      } catch (error) {
        console.error('Navigation error:', error);
        setNavigationError(
          `Failed to navigate. This might be due to an ad blocker or browser extension. Please disable ad blockers, try incognito mode, or visit: ${window.location.origin}${url}`
        );
      }
    } else {
      console.error('Navigation failed: Missing parameters', { userId, postId: contribution.postId, nodeId: contribution.parentNode.id });
      setNavigationError('Navigation failed: Missing parameters.');
    }
  };

  const handleGoToPost = () => {
    if (userId && contribution.postId) {
      navigate(`/post/${userId}/${contribution.postId}`);
    } else {
      console.error('Navigation failed: Missing parameters for post navigation');
      setNavigationError('Navigation failed: Missing post parameters.');
    }
  };

  const handleUpvote = async () => {
    if (!auth.currentUser) {
      alert('Please log in to upvote.');
      return;
    }

    const currentUserId = auth.currentUser.uid;
    let voteChange = 0;
    let newUserUpvotes = [...(contribution.userUpvotes || [])];
    let newUserDownvotes = [...(contribution.userDownvotes || [])];
    let newUpvotesCount = contribution.upvotesCount || 0;
    let newDownvotesCount = contribution.downvotesCount || 0;

    if (hasLiked) {
      newUserUpvotes = newUserUpvotes.filter(id => id !== currentUserId);
      newUpvotesCount -= 1;
      setHasLiked(false);
      voteChange = -1;
    } else {
      newUserUpvotes.push(currentUserId);
      newUpvotesCount += 1;
      setHasLiked(true);
      voteChange = 1;
      if (hasDownvoted) {
        newUserDownvotes = newUserDownvotes.filter(id => id !== currentUserId);
        newDownvotesCount -= 1;
        setHasDownvoted(false);
        voteChange += 1;
      }
    }

    setLocalNetVotes((prev) => prev + voteChange);
    setLikes(newUpvotesCount);

    try {
      const contributionRef = doc(db, 'contributions', userId, contribution.postId, '7196dcc3-dc50-4b57-8a6b-91133e8c56a8');
      const contributionDoc = await getDoc(contributionRef);
      if (contributionDoc.exists()) {
        const data = contributionDoc.data();
        const updatedNodes = data.nodes.map(node => {
          if (node.id === contribution.id) {
            return {
              ...node,
              userUpvotes: newUserUpvotes,
              userDownvotes: newUserDownvotes,
              upvotesCount: newUpvotesCount,
              downvotesCount: newDownvotesCount,
            };
          }
          return node;
        });
        await updateDoc(contributionRef, { nodes: updatedNodes });
      }
    } catch (error) {
      console.error('Error updating upvote in Firestore:', error);
      alert('Failed to update upvote. Please try again.');
      setHasLiked(!hasLiked);
      setHasDownvoted(hasDownvoted);
      setLocalNetVotes((prev) => prev - voteChange);
      setLikes(contribution.likesCount || 0);
    }
  };

  const handleDownvote = async () => {
    if (!auth.currentUser) {
      alert('Please log in to downvote.');
      return;
    }

    const currentUserId = auth.currentUser.uid;
    let voteChange = 0;
    let newUserUpvotes = [...(contribution.userUpvotes || [])];
    let newUserDownvotes = [...(contribution.userDownvotes || [])];
    let newUpvotesCount = contribution.upvotesCount || 0;
    let newDownvotesCount = contribution.downvotesCount || 0;

    if (hasDownvoted) {
      newUserDownvotes = newUserDownvotes.filter(id => id !== currentUserId);
      newDownvotesCount -= 1;
      setHasDownvoted(false);
      voteChange = 1;
    } else {
      newUserDownvotes.push(currentUserId);
      newDownvotesCount += 1;
      setHasDownvoted(true);
      voteChange = -1;
      if (hasLiked) {
        newUserUpvotes = newUserUpvotes.filter(id => id !== currentUserId);
        newUpvotesCount -= 1;
        setHasLiked(false);
        voteChange -= 1;
      }
    }

    setLocalNetVotes((prev) => prev + voteChange);

    try {
      const contributionRef = doc(db, 'contributions', userId, contribution.postId, '7196dcc3-dc50-4b57-8a6b-91133e8c56a8');
      const contributionDoc = await getDoc(contributionRef);
      if (contributionDoc.exists()) {
        const data = contributionDoc.data();
        const updatedNodes = data.nodes.map(node => {
          if (node.id === contribution.id) {
            return {
              ...node,
              userUpvotes: newUserUpvotes,
              userDownvotes: newUserDownvotes,
              upvotesCount: newUpvotesCount,
              downvotesCount: newDownvotesCount,
            };
          }
          return node;
        });
        await updateDoc(contributionRef, { nodes: updatedNodes });
      }
    } catch (error) {
      console.error('Error updating downvote in Firestore:', error);
      alert('Failed to update downvote. Please try again.');
      setHasDownvoted(!hasDownvoted);
      setHasLiked(hasLiked);
      setLocalNetVotes((prev) => prev - voteChange);
    }
  };

  const handlePostVote = async (type) => {
    if (!auth.currentUser) {
      alert('Please log in to vote.');
      return;
    }

    const currentUserId = auth.currentUser.uid;
    let voteChange = 0;
    let newUserUpvotes = [...(post.userUpvotes || [])];
    let newUserDownvotes = [...(post.userDownvotes || [])];
    let newUpvotesCount = post.upvotesCount || 0;
    let newDownvotesCount = post.downvotesCount || 0;

    if (type === 'upvote') {
      if (postHasLiked) {
        newUserUpvotes = newUserUpvotes.filter(id => id !== currentUserId);
        newUpvotesCount -= 1;
        setPostHasLiked(false);
        voteChange = -1;
      } else {
        newUserUpvotes.push(currentUserId);
        newUpvotesCount += 1;
        setPostHasLiked(true);
        voteChange = 1;
        if (postHasDownvoted) {
          newUserDownvotes = newUserDownvotes.filter(id => id !== currentUserId);
          newDownvotesCount -= 1;
          setPostHasDownvoted(false);
          voteChange += 1;
        }
      }
    } else if (type === 'downvote') {
      if (postHasDownvoted) {
        newUserDownvotes = newUserDownvotes.filter(id => id !== currentUserId);
        newDownvotesCount -= 1;
        setPostHasDownvoted(false);
        voteChange = 1;
      } else {
        newUserDownvotes.push(currentUserId);
        newDownvotesCount += 1;
        setPostHasDownvoted(true);
        voteChange = -1;
        if (postHasLiked) {
          newUserUpvotes = newUserUpvotes.filter(id => id !== currentUserId);
          newUpvotesCount -= 1;
          setPostHasLiked(false);
          voteChange -= 1;
        }
      }
    }

    setPostNetVotes((prev) => prev + voteChange);

    try {
      const postRef = doc(db, 'posts', userId, contribution.postId);
      await updateDoc(postRef, {
        userUpvotes: newUserUpvotes,
        userDownvotes: newUserDownvotes,
        upvotesCount: newUpvotesCount,
        downvotesCount: newDownvotesCount,
      });
    } catch (error) {
      console.error(`Error updating post ${type} in Firestore:`, error);
      alert(`Failed to update ${type}. Please try again.`);
      setPostHasLiked(type === 'upvote' ? !postHasLiked : postHasLiked);
      setPostHasDownvoted(type === 'downvote' ? !postHasDownvoted : postHasDownvoted);
      setPostNetVotes((prev) => prev - voteChange);
    }
  };

  const handleShare = async () => {
    if (userId && contribution.postId && contribution.id) {
      const url = `${window.location.origin}/contribute/${userId}/${contribution.postId}?nodeId=${contribution.id}`;
      try {
        await navigator.clipboard.writeText(url);
        alert('Link copied to clipboard!');
      } catch (error) {
        console.error('Failed to copy URL:', error);
        alert('Failed to copy link. Please copy this URL manually: ' + url);
      }
    } else {
      alert('Cannot share: Missing parameters.');
    }
  };

  const handleDownload = (url, filename) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRemix = (chatLink) => {
    window.open(chatLink, '_blank');
  };

  const handleCommentChange = (nodeId, text, parentCommentId = null) => {
    setLocalComments((prev) => ({
      ...prev,
      [parentCommentId || nodeId]: text,
    }));
    if (!parentCommentId) {
      setNewComment(text);
    }
  };

  const handleCommentSubmit = async (parentCommentId = null) => {
    if (!auth.currentUser) {
      alert('Please log in to comment.');
      return;
    }

    const commentText = parentCommentId ? localComments[parentCommentId] : newComment.trim();
    if (!commentText) {
      setCommentError('Comment cannot be empty.');
      return;
    }

    try {
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }
      const userData = userDoc.data();

      const newCommentObj = {
        id: uuidv4(),
        userId: auth.currentUser.uid,
        username: userData.username?.username || 'user',
        profilePic: userData.profilePic || 'https://dummyimage.com/40x40/000/fff?text=User',
        comment: commentText,
        timestamp: new Date().toISOString(),
        likesCount: 0,
        userLikes: [],
        replies: [],
      };

      const contributionRef = doc(db, 'contributions', userId, contribution.postId, '7196dcc3-dc50-4b57-8a6b-91133e8c56a8');
      const contributionDoc = await getDoc(contributionRef);
      if (contributionDoc.exists()) {
        const data = contributionDoc.data();
        const updatedNodes = data.nodes.map(node => {
          if (node.id === contribution.id) {
            if (parentCommentId) {
              const updatedComments = (node.comments || []).map(comment => {
                if (comment.id === parentCommentId) {
                  return {
                    ...comment,
                    replies: [...(comment.replies || []), newCommentObj],
                  };
                }
                return comment;
              });
              return { ...node, comments: updatedComments };
            } else {
              return {
                ...node,
                comments: [...(node.comments || []), newCommentObj],
              };
            }
          }
          return node;
        });
        await updateDoc(contributionRef, { nodes: updatedNodes });

        if (parentCommentId) {
          setCommentsList(prev => prev.map(comment => {
            if (comment.id === parentCommentId) {
              return {
                ...comment,
                replies: [...(comment.replies || []), newCommentObj],
              };
            }
            return comment;
          }));
          setLocalComments(prev => ({ ...prev, [parentCommentId]: '' }));
          setReplyingTo(null);
        } else {
          setCommentsList([...commentsList, newCommentObj]);
          setNewComment('');
          setCommentError(null);
        }
      }
    } catch (error) {
      console.error('Error adding comment to Firestore:', error);
      setCommentError('Failed to add comment. Please try again.');
    }
  };

  const handleCommentLike = async (commentId, parentCommentId = null) => {
    if (!auth.currentUser) {
      alert('Please log in to like comments.');
      return;
    }

    const currentUserId = auth.currentUser.uid;
    const contributionRef = doc(db, 'contributions', userId, contribution.postId, '7196dcc3-dc50-4b57-8a6b-91133e8c56a8');
    const contributionDoc = await getDoc(contributionRef);
    if (!contributionDoc.exists()) return;

    const data = contributionDoc.data();
    const updatedNodes = data.nodes.map(node => {
      if (node.id === contribution.id) {
        let updatedComments = [...(node.comments || [])];
        if (parentCommentId) {
          updatedComments = updatedComments.map(comment => {
            if (comment.id === parentCommentId) {
              const replies = comment.replies.map(reply => {
                if (reply.id === commentId) {
                  const userLikes = reply.userLikes || [];
                  const likesCount = reply.likesCount || 0;
                  if (userLikes.includes(currentUserId)) {
                    return {
                      ...reply,
                      userLikes: userLikes.filter(id => id !== currentUserId),
                      likesCount: likesCount - 1,
                    };
                  } else {
                    return {
                      ...reply,
                      userLikes: [...userLikes, currentUserId],
                      likesCount: likesCount + 1,
                    };
                  }
                }
                return reply;
              });
              return { ...comment, replies };
            }
            return comment;
          });
        } else {
          updatedComments = updatedComments.map(comment => {
            if (comment.id === commentId) {
              const userLikes = comment.userLikes || [];
              const likesCount = comment.likesCount || 0;
              if (userLikes.includes(currentUserId)) {
                return {
                  ...comment,
                  userLikes: userLikes.filter(id => id !== currentUserId),
                  likesCount: likesCount - 1,
                };
              } else {
                return {
                  ...comment,
                  userLikes: [...userLikes, currentUserId],
                  likesCount: likesCount + 1,
                };
              }
            }
            return comment;
          });
        }
        return { ...node, comments: updatedComments };
      }
      return node;
    });

    await updateDoc(contributionRef, { nodes: updatedNodes });

    setCommentsList(prev => {
      if (parentCommentId) {
        return prev.map(comment => {
          if (comment.id === parentCommentId) {
            const replies = comment.replies.map(reply => {
              if (reply.id === commentId) {
                const userLikes = reply.userLikes || [];
                const likesCount = reply.likesCount || 0;
                if (userLikes.includes(currentUserId)) {
                  return {
                    ...reply,
                    userLikes: userLikes.filter(id => id !== currentUserId),
                    likesCount: likesCount - 1,
                  };
                } else {
                  return {
                    ...reply,
                    userLikes: [...userLikes, currentUserId],
                    likesCount: likesCount + 1,
                  };
                }
              }
              return reply;
            });
            return { ...comment, replies };
          }
          return comment;
        });
      } else {
        return prev.map(comment => {
          if (comment.id === commentId) {
            const userLikes = comment.userLikes || [];
            const likesCount = comment.likesCount || 0;
            if (userLikes.includes(currentUserId)) {
              return {
                ...comment,
                userLikes: userLikes.filter(id => id !== currentUserId),
                likesCount: likesCount - 1,
              };
            } else {
              return {
                ...comment,
                userLikes: [...userLikes, currentUserId],
                likesCount: likesCount + 1,
              };
            }
          }
          return comment;
        });
      }
    });
  };

  const handleCommentDelete = async (commentId, parentCommentId = null) => {
    if (!auth.currentUser) {
      alert('Please log in to delete comments.');
      return;
    }

    const contributionRef = doc(db, 'contributions', userId, contribution.postId, '7196dcc3-dc50-4b57-8a6b-91133e8c56a8');
    const contributionDoc = await getDoc(contributionRef);
    if (!contributionDoc.exists()) return;

    const data = contributionDoc.data();
    const updatedNodes = data.nodes.map(node => {
      if (node.id === contribution.id) {
        let updatedComments = [...(node.comments || [])];
        if (parentCommentId) {
          updatedComments = updatedComments.map(comment => {
            if (comment.id === parentCommentId) {
              const replies = comment.replies.filter(reply => reply.id !== commentId);
              return { ...comment, replies };
            }
            return comment;
          });
        } else {
          updatedComments = updatedComments.filter(comment => comment.id !== commentId);
        }
        return { ...node, comments: updatedComments };
      }
      return node;
    });

    await updateDoc(contributionRef, { nodes: updatedNodes });

    setCommentsList(prev => {
      if (parentCommentId) {
        return prev.map(comment => {
          if (comment.id === parentCommentId) {
            const replies = comment.replies.filter(reply => reply.id !== commentId);
            return { ...comment, replies };
          }
          return comment;
        });
      } else {
        return prev.filter(comment => comment.id !== commentId);
      }
    });
  };

  const handleReplyClick = (commentId) => {
    setReplyingTo({ commentId });
  };

  const renderComments = (comments, level = 0, parentCommentId = null) => {
    return comments.filter(Boolean).map((comment) => {
      const isReplying = replyingTo && replyingTo.commentId === comment.id;
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
                <span style={{ fontWeight: '500', fontSize: '12px', color: '#FFFFFF' }}>
                  {comment.username || 'Anonymous'}
                </span>
                <span style={{ color: '#888888', fontSize: '10px' }}>
                  {formatTimeAgo(comment.timestamp)}
                </span>
              </div>
              <p style={{ fontSize: '12px', margin: '2px 0', color: '#FFFFFF' }}>{comment.comment}</p>
              <div style={{ display: 'flex', gap: '12px', marginTop: '4px', alignItems: 'center' }}>
                {auth.currentUser && (
                  <motion.div
                    onClick={() => handleCommentLike(comment.id, parentCommentId)}
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
                        fill: (comment.userLikes || []).includes(auth.currentUser.uid) ? '#FFFFFF' : 'none',
                        stroke: '#FFFFFF',
                        strokeWidth: (comment.userLikes || []).includes(auth.currentUser.uid) ? 0 : 30,
                      }}
                    />
                    <span style={{ fontSize: '10px' }}>{comment.likesCount || 0}</span>
                  </motion.div>
                )}
                <motion.div
                  onClick={() => handleReplyClick(comment.id)}
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
                {auth.currentUser && comment.userId === auth.currentUser.uid && (
                  <motion.div
                    onClick={() => handleCommentDelete(comment.id, parentCommentId)}
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
                    value={localComments[comment.id] || ''}
                    onChange={(e) => handleCommentChange(contribution.id, e.target.value, comment.id)}
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
                    onClick={() => handleCommentSubmit(comment.id)}
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
                    onClick={() => setReplyingTo(null)}
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
          {comment.replies && comment.replies.length > 0 && renderComments(comment.replies, level + 1, comment.id)}
        </div>
      );
    });
  };

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) {
      return 'Unknown';
    }

    let date;
    if (timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else {
      date = new Date(timestamp);
    }

    if (isNaN(date.getTime())) {
      console.error('Invalid timestamp:', timestamp);
      return 'Unknown';
    }

    try {
      const now = new Date('2025-06-09T09:10:00.000Z'); // 02:40 PM IST (UTC+5:30) = 09:10 UTC
      const diffMs = now - date;

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
      console.error('formatTimeAgo - Error:', error, timestamp);
      return 'Unknown';
    }
  };

  return (
    <motion.div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        style={{
          backgroundColor: '#1C1C1C',
          padding: '20px',
          borderRadius: '10px',
          width: '800px',
          maxWidth: '90%',
          maxHeight: '80vh',
          overflowY: 'auto',
          color: '#FFFFFF',
          border: '1px solid #FFFFFF',
        }}
        onClick={(e) => e.stopPropagation()}
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
      >
        {/* Close Button */}
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

        {/* Contribution Node Section */}
        <div style={{ marginBottom: '20px', borderBottom: '1px solid #FFFFFF', paddingBottom: '15px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '10px' }}>Contribution</h3>
          <div style={{ display: 'flex', gap: '25px' }}>
            {/* Image Section */}
            <div style={{ flex: '0 0 300px' }}>
              {mediaUrl.endsWith('.mp4') || mediaUrl.endsWith('.webm') ? (
                <video
                  src={mediaUrl}
                  style={{
                    width: '100%',
                    height: 'auto',
                    borderRadius: '5px',
                    border: '1px solid #FFFFFF',
                  }}
                  controls
                  onError={(e) => {
                    e.target.src = 'https://dummyimage.com/400x400/000/fff?text=Video+Error';
                  }}
                />
              ) : (
                <img
                  src={mediaUrl}
                  alt="Contribution Media"
                  style={{
                    width: '100%',
                    borderRadius: '5px',
                    border: '1px solid #FFFFFF',
                  }}
                  onError={(e) => {
                    e.target.src = 'https://dummyimage.com/400x400/000/fff?text=Image+Error';
                  }}
                />
              )}
            </div>

            {/* Details Section */}
            <div style={{ flex: 1 }}>
              {isCommentsOnlyView ? (
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  <motion.button
                    onClick={() => setIsCommentsOnlyView(false)}
                    style={{
                      marginBottom: '10px',
                      padding: '5px 10px',
                      borderRadius: '5px',
                      border: '1px solid #FFFFFF',
                      backgroundColor: '#2E2E2E',
                      color: '#FFFFFF',
                      cursor: 'pointer',
                      fontSize: '14px',
                    }}
                    whileHover={{ backgroundColor: '#FFFFFF', color: '#1C2526' }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Back to Details
                  </motion.button>
                  <p style={{ fontSize: '14px', fontWeight: '500', margin: '5px 0' }}>Comments:</p>
                  <div style={{ marginTop: '10px' }}>
                    <form onSubmit={(e) => { e.preventDefault(); handleCommentSubmit(); }} style={{ marginBottom: '15px' }}>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <input
                          type="text"
                          value={newComment}
                          onChange={(e) => handleCommentChange(contribution.id, e.target.value)}
                          placeholder="Add a comment..."
                          style={{
                            flex: 1,
                            padding: '8px',
                            borderRadius: '5px',
                            border: '1px solid #FFFFFF',
                            backgroundColor: '#333333',
                            color: '#FFFFFF',
                          }}
                        />
                        <motion.button
                          type="submit"
                          style={{
                            padding: '8px 15px',
                            borderRadius: '5px',
                            border: 'none',
                            backgroundColor: '#FFFFFF',
                            color: '#000000',
                            cursor: 'pointer',
                            fontSize: '14px',
                          }}
                          whileHover={{ backgroundColor: '#e0e0e0', scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          Post
                        </motion.button>
                      </div>
                      {commentError && (
                        <p style={{ color: '#FF5555', fontSize: '12px', marginTop: '5px' }}>{commentError}</p>
                      )}
                    </form>

                    {commentsList.length > 0 ? (
                      renderComments(commentsList)
                    ) : (
                      <p style={{ fontSize: '13px', color: '#AAAAAA', margin: 0 }}>No comments yet</p>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                    <img
                      src={contributorProfilePic}
                      alt="Contributor"
                      style={{
                        width: '35px',
                        height: '35px',
                        borderRadius: '50%',
                        border: '1px solid #FFFFFF',
                      }}
                      onError={(e) => {
                        e.target.src = 'https://dummyimage.com/40x40/000/fff?text=User';
                      }}
                    />
                    <span style={{ fontWeight: 'bold', fontSize: '18px', color: '#FFFFFF' }}>
                      @{contribution.username || 'user'}
                    </span>
                  </div>
                  <p style={{ fontSize: '14px', color: '#CCCCCC', marginBottom: '15px' }}>
                    Created: {formatTimeAgo(contribution.createdAt)}
                  </p>
                  <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#FFFFFF', marginBottom: '10px' }}>
                    <strong>Prompt:</strong> {contribution.prompt || 'N/A'}
                  </p>
                  <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#FFFFFF', marginBottom: '15px' }}>
                    <strong>Model:</strong> {contribution.model || 'Unknown'}
                  </p>

                  {/* Voting and Sharing Section */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '15px', alignItems: 'center' }}>
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
                            fill: hasLiked ? '#FFFFFF' : 'none',
                            stroke: '#FFFFFF',
                            strokeWidth: hasLiked ? 0 : 30,
                          }}
                        />
                      </motion.div>
                      <span style={{ fontSize: '14px', color: '#FFFFFF' }}>{localNetVotes}</span>
                      <motion.div
                        onClick={handleDownvote}
                        style={{ cursor: "pointer", color: "#FFFFFF", padding: "5px" }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <FaArrowDown
                          size={16}
                          style={{
                            fill: hasDownvoted ? "#FFFFFF" : "none",
                            stroke: "#FFFFFF",
                            strokeWidth: hasDownvoted ? 0 : 30,
                          }}
                        />
                      </motion.div>
                    </motion.div>
                    <motion.div
                      onClick={handleShare}
                      style={{ cursor: "pointer", color: "#FFFFFF", padding: "5px" }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <FaShareAlt
                        size={16}
                        style={{ fill: "none", stroke: "#FFFFFF", strokeWidth: 30 }}
                      />
                    </motion.div>
                  </div>

                  {/* Action Buttons */}
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "10px",
                      alignItems: "center",
                      marginBottom: "15px",
                    }}
                  >
                    <motion.button
                      onClick={() => {
                        setShowComments(!showComments);
                        setIsCommentsOnlyView(true);
                      }}
                      style={{
                        cursor: "pointer",
                        color: "#FFFFFF",
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                        border: "1px solid #FFFFFF",
                        borderRadius: "5px",
                        padding: "8px 15px",
                        backgroundColor: "#2E2E2E",
                        transition: "background-color 0.2s, color 0.2s",
                        fontSize: "14px",
                      }}
                      whileHover={{ backgroundColor: "#FFFFFF", color: "#1C2526" }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Comments ({commentsList.length})
                    </motion.button>
                    {contribution.chatLink && (
                      <motion.div
                        onClick={() => handleRemix(contribution.chatLink)}
                        style={{
                          cursor: "pointer",
                          color: "#FFFFFF",
                          display: "flex",
                          alignItems: "center",
                          gap: "5px",
                          border: "1px solid #FFFFFF",
                          borderRadius: "5px",
                          padding: "8px 15px",
                          backgroundColor: "#2E2E2E",
                          transition: "background-color 0.2s, color 0.2s",
                        }}
                        whileHover={{ backgroundColor: "#FFFFFF", color: "#1C2526" }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <FaSyncAlt
                          size={16}
                          style={{ fill: "none", stroke: "#FFFFFF", strokeWidth: 30 }}
                        />
                        <span style={{ fontSize: "14px" }}>Remix</span>
                      </motion.div>
                    )}
                    <motion.div
                      onClick={() =>
                        handleDownload(contribution.imageUrl, `contribution-${contribution.id}`)
                      }
                      style={{
                        cursor: "pointer",
                        color: "#FFFFFF",
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                        border: "1px solid #FFFFFF",
                        borderRadius: "5px",
                        padding: "8px 15px",
                        backgroundColor: "#2E2E2E",
                        transition: "background-color 0.2s, color 0.2s",
                      }}
                      whileHover={{ backgroundColor: "#FFFFFF", color: "#1C2526" }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <FaArrowCircleDown
                        size={16}
                        style={{ fill: "none", stroke: "#FFFFFF", strokeWidth: 30 }}
                      />
                      <span style={{ fontSize: "14px" }}>Download</span>
                    </motion.div>
                    <motion.button
                      onClick={handleLocateContribution}
                      style={{
                        cursor: "pointer",
                        color: "#FFFFFF",
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                        border: "1px solid #FFFFFF",
                        borderRadius: "5px",
                        padding: "8px 15px",
                        backgroundColor: "#2E2E2E",
                        transition: "background-color 0.2s, color 0.2s",
                        fontSize: "14px",
                      }}
                      whileHover={{ backgroundColor: "#FFFFFF", color: "#1C2526" }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Locate Contribution in Timeline
                    </motion.button>
                  </div>
                  {navigationError && (
                    <p style={{ color: "#FF5555", fontSize: "12px", marginTop: "5px" }}>
                      {navigationError}
                    </p>
                  )}

                  {/* Comments Section */}
                  {showComments && !isCommentsOnlyView && (
                    <div style={{ marginTop: "10px", maxHeight: "200px", overflowY: "auto" }}>
                      <p style={{ fontSize: "14px", fontWeight: "500", margin: "5px 0" }}>
                        Comments:
                      </p>
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleCommentSubmit();
                        }}
                        style={{ marginBottom: "15px" }}
                      >
                        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                          <input
                            type="text"
                            value={newComment}
                            onChange={(e) => handleCommentChange(contribution.id, e.target.value)}
                            placeholder="Add a comment..."
                            style={{
                              flex: 1,
                              padding: "8px",
                              borderRadius: "5px",
                              border: "1px solid #FFFFFF",
                              backgroundColor: "#333333",
                              color: "#FFFFFF",
                            }}
                          />
                          <motion.button
                            type="submit"
                            style={{
                              padding: "8px 15px",
                              borderRadius: "5px",
                              border: "none",
                              backgroundColor: "#FFFFFF",
                              color: "#000000",
                              cursor: "pointer",
                              fontSize: "14px",
                            }}
                            whileHover={{ backgroundColor: "#e0e0e0", scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            Post
                          </motion.button>
                        </div>
                        {commentError && (
                          <p style={{ color: "#FF5555", fontSize: "12px", marginTop: "5px" }}>
                            {commentError}
                          </p>
                        )}
                      </form>

                      {commentsList.length > 0 ? (
                        renderComments(commentsList)
                      ) : (
                        <p style={{ fontSize: "13px", color: "#AAAAAA", margin: 0 }}>
                          No comments yet
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Parent Node Section (Node Post) */}
        {!isCommentsOnlyView && contribution.parentNode && (
          <div style={{ marginBottom: "20px", borderBottom: "1px solid #FFFFFF", paddingBottom: "15px" }}>
            <h3 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "10px" }}>
              Node Post (Contribution Based On)
            </h3>
            <div style={{ display: "flex", gap: "25px" }}>
              <div style={{ flex: "0 0 250px" }}>
                {contribution.parentNode.imageUrl.endsWith(".mp4") ||
                contribution.parentNode.imageUrl.endsWith(".webm") ? (
                  <video
                    src={contribution.parentNode.imageUrl}
                    style={{
                      width: "100%",
                      height: "auto",
                      borderRadius: "5px",
                      border: "1px solid #FFFFFF",
                    }}
                    controls
                    onError={(e) => {
                      e.target.src = "https://dummyimage.com/400x400/000/fff?text=Video+Error";
                    }}
                  />
                ) : (
                  <img
                    src={contribution.parentNode.imageUrl}
                    alt="Parent Node Media"
                    style={{
                      width: "100%",
                      borderRadius: "5px",
                      border: "1px solid #FFFFFF",
                    }}
                    onError={(e) => {
                      e.target.src = "https://dummyimage.com/400x400/000/fff?text=Image+Error";
                    }}
                  />
                )}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "15px" }}>
                  <img
                    src={
                      contribution.parentNode.profilePic ||
                      "https://dummyimage.com/40x40/000/fff?text=User"
                    }
                    alt="Parent Node Creator"
                    style={{
                      width: "35px",
                      height: "35px",
                      borderRadius: "50%",
                      border: "1px solid #FFFFFF",
                    }}
                    onError={(e) => {
                      e.target.src = "https://dummyimage.com/40x40/000/fff?text=User";
                    }}
                  />
                  <span style={{ fontWeight: "bold", fontSize: "18px", color: "#FFFFFF" }}>
                    @{contribution.parentNode.username || "user"}
                  </span>
                </div>
                <p style={{ fontSize: "14px", color: "#CCCCCC", marginBottom: "15px" }}>
                  Created: {formatTimeAgo(contribution.parentNode.createdAt)}
                </p>
                <p style={{ fontSize: "16px", fontWeight: "bold", color: "#FFFFFF", marginBottom: "10px" }}>
                  <strong>Prompt:</strong> {contribution.parentNode.prompt || "N/A"}
                </p>
                <p style={{ fontSize: "16px", fontWeight: "bold", color: "#FFFFFF", marginBottom: "15px" }}>
                  <strong>Model:</strong> {contribution.parentNode.model || "Unknown"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Original Post Section */}
        {!isCommentsOnlyView && post && (
          <div style={{ marginBottom: "20px", borderBottom: "1px solid #FFFFFF", paddingBottom: "15px" }}>
            <h3 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "10px" }}>Original Post</h3>
            <div style={{ display: "flex", gap: "15px" }}>
              <div style={{ flex: "0 0 200px" }}>
                {post.aiGeneratedUrl && (
                  <>
                    {post.aiGeneratedUrl.endsWith(".mp4") || post.aiGeneratedUrl.endsWith(".webm") ? (
                      <video
                        src={post.aiGeneratedUrl}
                        style={{
                          width: "100%",
                          height: "auto",
                          borderRadius: "5px",
                          border: "1px solid #FFFFFF",
                        }}
                        controls
                        onError={(e) => {
                          e.target.src = "https://dummyimage.com/400x400/000/fff?text=Video+Error";
                        }}
                      />
                    ) : (
                      <img
                        src={post.aiGeneratedUrl}
                        alt="Original Post Media"
                        style={{
                          width: "100%",
                          borderRadius: "5px",
                          border: "1px solid #FFFFFF",
                        }}
                        onError={(e) => {
                          e.target.src = "https://dummyimage.com/400x400/000/fff?text=Image+Error";
                        }}
                      />
                    )}
                  </>
                )}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "15px" }}>
                  <img
                    src={post.profilePic || "https://dummyimage.com/40x40/000/fff?text=User"}
                    alt="Original Poster"
                    style={{
                      width: "35px",
                      height: "35px",
                      borderRadius: "50%",
                      border: "1px solid #FFFFFF",
                    }}
                    onError={(e) => {
                      e.target.src = "https://dummyimage.com/40x40/000/fff?text=User";
                    }}
                  />
                  <span style={{ fontWeight: "bold", fontSize: "18px", color: "#FFFFFF" }}>
                    @{post.username || "user"}
                  </span>
                </div>
                <p style={{ fontSize: "14px", color: "#CCCCCC", marginBottom: "15px" }}>
                  Created: {formatTimeAgo(post.createdAt)}
                </p>
                <p style={{ fontSize: "16px", fontWeight: "bold", color: "#FFFFFF", marginBottom: "10px" }}>
                  <strong>Caption:</strong> {post.caption || "No caption"}
                </p>

                {/* Voting and Download Section for Post */}
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "10px",
                    marginBottom: "15px",
                    alignItems: "center",
                  }}
                >
                  <motion.div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                      border: "1px solid #FFFFFF",
                      borderRadius: "5px",
                      padding: "5px 10px",
                    }}
                  >
                    <motion.div
                      onClick={() => handlePostVote("upvote")}
                      style={{ cursor: "pointer", color: "#FFFFFF", padding: "5px" }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <FaArrowUp
                        size={16}
                        style={{
                          fill: postHasLiked ? "#FFFFFF" : "none",
                          stroke: "#FFFFFF",
                          strokeWidth: postHasLiked ? 0 : 30,
                        }}
                      />
                    </motion.div>
                    <span style={{ fontSize: "14px", color: "#FFFFFF" }}>{postNetVotes}</span>
                    <motion.div
                      onClick={() => handlePostVote("downvote")}
                      style={{ cursor: "pointer", color: "#FFFFFF", padding: "5px" }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <FaArrowDown
                        size={16}
                        style={{
                          fill: postHasDownvoted ? "#FFFFFF" : "none",
                          stroke: "#FFFFFF",
                          strokeWidth: postHasDownvoted ? 0 : 30,
                        }}
                      />
                    </motion.div>
                  </motion.div>
                  <motion.div
                    onClick={() => handleDownload(post.aiGeneratedUrl, `post-${contribution.postId}`)}
                    style={{
                      cursor: "pointer",
                      color: "#FFFFFF",
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                      border: "1px solid #FFFFFF",
                      borderRadius: "5px",
                      padding: "8px 15px",
                      backgroundColor: "#2E2E2E",
                      transition: "background-color 0.2s, color 0.2s",
                    }}
                    whileHover={{ backgroundColor: "#FFFFFF", color: "#1C2526" }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FaArrowCircleDown
                      size={16}
                      style={{ fill: "none", stroke: "#FFFFFF", strokeWidth: 30 }}
                    />
                    <span style={{ fontSize: "14px" }}>Download</span>
                  </motion.div>
                  <motion.button
                    onClick={handleGoToPost}
                    style={{
                      cursor: "pointer",
                      color: "#FFFFFF",
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                      border: "1px solid #FFFFFF",
                      borderRadius: "5px",
                      padding: "8px 15px",
                      backgroundColor: "#2E2E2E",
                      transition: "background-color 0.2s, color 0.2s",
                      fontSize: "14px",
                    }}
                    whileHover={{ backgroundColor: "#FFFFFF", color: "#1C2526" }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Go to Post
                  </motion.button>
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default ContributionDetail;