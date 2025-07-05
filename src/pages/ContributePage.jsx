import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, storage } from '../firebase/firebase';
import { doc, getDoc, setDoc, onSnapshot, collection, getDocs, updateDoc, arrayUnion } from '../firebase/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import { motion } from 'framer-motion';
import { auth } from '../firebase/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { ReactFlowProvider, useReactFlow } from 'reactflow';
import LoadingSpinner from '../components/LoadingSpinner';
import FlowGraph from '../components/FlowGraph';
import NodeDetailsCard from '../components/NodeDetailsCard';
import ContributionPopup from '../components/ContributionPopup';
import Timeline from './Timeline';

// Debounce utility
const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Utility to calculate relative time (e.g., "5 minutes ago")
const getRelativeTime = (timestamp) => {
  if (!timestamp) return 'Just now';
  const now = new Date();
  const past = new Date(timestamp);
  const diffMs = now - past;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
};

// Custom hook to track element dimensions
const useElementDimensions = (ref) => {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const updateDimensions = () => {
      const { width, height } = element.getBoundingClientRect();
      setDimensions({ width, height });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);

    const observer = new ResizeObserver(() => updateDimensions());
    observer.observe(element);

    return () => {
      window.removeEventListener('resize', updateDimensions);
      observer.disconnect();
    };
  }, [ref]);

  return dimensions;
};

// Error Boundary for ResizeObserver issues
class ResizeErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ResizeErrorBoundary Caught Error:', error.message, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ color: '#FFFFFF', padding: '50px', textAlign: 'center' }}>
          <p>Error in graph rendering: {this.state.error?.message || 'Unknown error'}</p>
          <p>Please try refreshing the page.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

// Utility to sanitize node data
const sanitizeNodeData = (node) => {
  if (!node) return null;
  const sanitizedNode = { ...node };
  
  sanitizedNode.id = node.id || uuidv4();
  sanitizedNode.upvotesCount = Number.isInteger(node.upvotesCount) ? node.upvotesCount : 0;
  sanitizedNode.downvotesCount = Number.isInteger(node.downvotesCount) ? node.downvotesCount : 0;
  sanitizedNode.userUpvotes = Array.isArray(node.userUpvotes) ? node.userUpvotes : [];
  sanitizedNode.userDownvotes = Array.isArray(node.userDownvotes) ? node.userDownvotes : [];
  sanitizedNode.comments = Array.isArray(node.comments) ? node.comments.map(sanitizeCommentData) : [];
  sanitizedNode.username = typeof node.username === 'string' ? node.username : 'unknown';
  sanitizedNode.imageUrl = typeof node.imageUrl === 'string' ? node.imageUrl : 'https://dummyimage.com/180x180/000/fff?text=Media+Not+Found';
  sanitizedNode.prompt = typeof node.prompt === 'string' ? node.prompt : '';
  sanitizedNode.model = typeof node.model === 'string' ? node.model : 'Unknown';
  sanitizedNode.userId = typeof node.userId === 'string' ? node.userId : '';
  sanitizedNode.profilePic = typeof node.profilePic === 'string' ? node.profilePic : 'https://dummyimage.com/30x30/000/fff?text=User';
  sanitizedNode.createdAt = typeof node.createdAt === 'string' ? node.createdAt : new Date().toISOString();
  sanitizedNode.chatLink = typeof node.chatLink === 'string' || node.chatLink === null ? node.chatLink : null;
  sanitizedNode.parentId = typeof node.parentId === 'string' ? node.parentId : null;

  Object.keys(sanitizedNode).forEach((key) => {
    if (sanitizedNode[key] === undefined) {
      delete sanitizedNode[key];
    }
  });

  return sanitizedNode;
};

// Utility to sanitize comment data
const sanitizeCommentData = (comment) => {
  if (!comment) return null;
  const sanitizedComment = { ...comment };
  
  sanitizedComment.id = comment.id || uuidv4();
  sanitizedComment.comment = typeof comment.comment === 'string' ? comment.comment : '';
  sanitizedComment.username = typeof comment.username === 'string' ? comment.username : 'Anonymous';
  sanitizedComment.profilePic = typeof comment.profilePic === 'string' ? comment.profilePic : 'https://dummyimage.com/30x30/000/fff?text=User';
  sanitizedComment.timestamp = typeof comment.timestamp === 'string' ? comment.timestamp : new Date().toISOString();
  sanitizedComment.userLikes = Array.isArray(comment.userLikes) ? comment.userLikes : [];
  sanitizedComment.likesCount = Number.isInteger(comment.likesCount) ? comment.likesCount : 0;
  sanitizedComment.userId = typeof comment.userId === 'string' ? comment.userId : '';
  sanitizedComment.replies = Array.isArray(comment.replies) ? comment.replies.map(sanitizeCommentData) : [];

  Object.keys(sanitizedComment).forEach((key) => {
    if (sanitizedComment[key] === undefined) {
      delete sanitizedComment[key];
    }
  });

  return sanitizedComment;
};

// Main ContributePage Component
const ContributePage = () => {
  const { userId, postId, nodeId } = useParams();
  const navigate = useNavigate();
  const { fitView } = useReactFlow();
  const [parentNode, setParentNode] = useState(null);
  const [allNodes, setAllNodes] = useState([]);
  const [initialEdges, setInitialEdges] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [showPopup, setShowPopup] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [user, setUser] = useState(null);
  const [hasUpvoted, setHasUpvoted] = useState({});
  const [hasDownvoted, setHasDownvoted] = useState({});
  const [selectedNodeDetails, setSelectedNodeDetails] = useState(null);
  const [initialTreeNodes, setInitialTreeNodes] = useState([]);
  const [hoveredNodeId, setHoveredNodeId] = useState(null);
  const [isInitialFitDone, setIsInitialFitDone] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [contributionMessage, setContributionMessage] = useState('');
  const [textContributions, setTextContributions] = useState([]);
  const [textContribution, setTextContribution] = useState('');
  const [containerHeight, setContainerHeight] = useState('80vh');
  const [nodeComments, setNodeComments] = useState({});
  const [newNodeComment, setNewNodeComment] = useState({});
  const [replyingTo, setReplyingTo] = useState(null); // Track which comment is being replied to

  const graphContainerRef = useRef(null);
  const dimensions = useElementDimensions(graphContainerRef);

  const memoizedParentNode = useMemo(() => parentNode ? sanitizeNodeData(parentNode) : null, [parentNode]);
  const memoizedAllNodes = useMemo(() => allNodes.filter(Boolean).map(sanitizeNodeData).filter(Boolean), [allNodes]);

  const totalContributions = memoizedAllNodes.length; // Total contributions excluding parent node

  const debouncedSetAllNodes = useCallback(
    debounce((nodes) => {
      setAllNodes(nodes);
    }, 300),
    []
  );

  const debouncedSetInitialEdges = useCallback(
    debounce((edges) => {
      setInitialEdges(edges);
    }, 300),
    []
  );

  const handleContribute = useCallback(
    (nodeId) => {
      if (!user) {
        navigate('/login');
        return;
      }
      setSelectedNodeId(nodeId);
      setShowPopup(true);
      setSelectedNodeDetails(null);
    },
    [user, navigate]
  );

  const handleNodeSelect = useCallback(
    (nodeId) => {
      const node = [memoizedParentNode, ...memoizedAllNodes].find((n) => n && n.id === nodeId);
      if (node) {
        setSelectedNodeDetails(node);
        setNewNodeComment((prev) => ({
          ...prev,
          [nodeId]: prev[nodeId] || '',
        }));
      } else {
        setSelectedNodeDetails(null);
      }
    },
    [memoizedParentNode, memoizedAllNodes]
  );

  const debouncedHandleNodeHover = useCallback(
    debounce((nodeId) => {
      setHoveredNodeId(nodeId);
    }, 200),
    []
  );

  const debouncedHandleNodeHoverEnd = useCallback(
    debounce(() => {
      setHoveredNodeId(null);
    }, 200),
    []
  );

  const handleNodeHover = useCallback(
    (nodeId) => {
      debouncedHandleNodeHover(nodeId);
    },
    [debouncedHandleNodeHover]
  );

  const handleNodeHoverEnd = useCallback(
    (nodeId) => {
      debouncedHandleNodeHoverEnd(nodeId);
    },
    [debouncedHandleNodeHoverEnd]
  );

  const handleCanvasClick = useCallback(() => {
    setHoveredNodeId(null);
    setSelectedNodeDetails(null);
    setShowPopup(false);
    setSelectedNodeId(null);
  }, []);

  const debouncedFitView = useCallback(
    debounce(() => {
      fitView({ padding: 0.5, minZoom: 0.05, maxZoom: 1.5, duration: 800 });
      setIsInitialFitDone(true);
    }, 200),
    [fitView]
  );

  const handleResetLayout = useCallback(() => {
    if (isInitialFitDone) {
      return;
    }
    setInitialTreeNodes(
      initialTreeNodes.map((node) => ({
        ...node,
        position: { ...node.position },
      }))
    );
    setInitialEdges(initialEdges);
    debouncedFitView();
  }, [initialTreeNodes, initialEdges, debouncedFitView, isInitialFitDone]);

  const handleUpvote = useCallback(
    async (nodeId, nodeData) => {
      if (!user) {
        navigate('/login');
        return;
      }

      const currentUpvote = hasUpvoted[nodeId] || false;
      const currentDownvote = hasDownvoted[nodeId] || false;

      try {
        if (nodeId === '1') {
          setError('Upvoting the parent post is not supported in this view.');
          return;
        }

        const contributionsRef = collection(db, 'contributions', userId, postId);
        const contributionsSnapshot = await getDocs(contributionsRef);
        let targetContributionDoc = null;
        let contributionId = null;

        for (const docSnap of contributionsSnapshot.docs) {
          const data = docSnap.data();
          if (data.nodes && data.nodes.some((node) => node.id === nodeId)) {
            targetContributionDoc = data;
            contributionId = docSnap.id;
            break;
          }
        }

        if (!targetContributionDoc) {
          throw new Error('Contribution not found for the node');
        }

        const updatedNodes = targetContributionDoc.nodes.map((n) => {
          if (n.id === nodeId) {
            let newUpvotesCount = Number.isInteger(n.upvotesCount) ? n.upvotesCount : 0;
            let newDownvotesCount = Number.isInteger(n.downvotesCount) ? n.downvotesCount : 0;
            const userUpvotes = Array.isArray(n.userUpvotes) ? n.userUpvotes : [];
            const userDownvotes = Array.isArray(n.userDownvotes) ? n.userDownvotes : [];

            if (currentUpvote) {
              newUpvotesCount = Math.max(0, newUpvotesCount - 1);
              n.userUpvotes = userUpvotes.filter((uid) => uid !== user.uid);
            } else {
              newUpvotesCount = newUpvotesCount + 1;
              n.userUpvotes = [...userUpvotes, user.uid];
              if (currentDownvote) {
                newDownvotesCount = Math.max(0, newDownvotesCount - 1);
                n.userDownvotes = userDownvotes.filter((uid) => uid !== user.uid);
              }
            }

            setAllNodes((prevNodes) =>
              prevNodes.map((ln) =>
                ln.id === nodeId
                  ? {
                      ...ln,
                      upvotesCount: newUpvotesCount,
                      downvotesCount: newDownvotesCount,
                      userUpvotes: n.userUpvotes,
                      userDownvotes: n.userDownvotes,
                    }
                  : ln
              )
            );
            if (selectedNodeDetails && selectedNodeDetails.id === nodeId) {
              setSelectedNodeDetails((prev) => ({
                ...prev,
                upvotesCount: newUpvotesCount,
                downvotesCount: newDownvotesCount,
                userUpvotes: n.userUpvotes,
                userDownvotes: n.userDownvotes,
              }));
            }
            return sanitizeNodeData({
              ...n,
              upvotesCount: newUpvotesCount,
              downvotesCount: newDownvotesCount,
              userUpvotes: n.userUpvotes,
              userDownvotes: n.userDownvotes,
            });
          }
          return sanitizeNodeData(n);
        });

        await setDoc(doc(db, 'contributions', userId, postId, contributionId), { ...targetContributionDoc, nodes: updatedNodes }, { merge: true });

        setHasUpvoted((prev) => ({
          ...prev,
          [nodeId]: !currentUpvote,
        }));
        if (currentDownvote) {
          setHasDownvoted((prev) => ({
            ...prev,
            [nodeId]: false,
          }));
        }
      } catch (err) {
        setError('Failed to upvote: ' + err.message);
      }
    },
    [user, navigate, userId, postId, hasUpvoted, hasDownvoted, selectedNodeDetails]
  );

  const handleDownvote = useCallback(
    async (nodeId, nodeData) => {
      if (!user) {
        navigate('/login');
        return;
      }

      const currentDownvote = hasDownvoted[nodeId] || false;
      const currentUpvote = hasUpvoted[nodeId] || false;

      try {
        if (nodeId === '1') {
          setError('Downvoting the parent post is not supported in this view.');
          return;
        }

        const contributionsRef = collection(db, 'contributions', userId, postId);
        const contributionsSnapshot = await getDocs(contributionsRef);
        let targetContributionDoc = null;
        let contributionId = null;

        for (const docSnap of contributionsSnapshot.docs) {
          const data = docSnap.data();
          if (data.nodes && data.nodes.some((node) => node.id === nodeId)) {
            targetContributionDoc = data;
            contributionId = docSnap.id;
            break;
          }
        }

        if (!targetContributionDoc) {
          throw new Error('Contribution not found for the node');
        }

        const updatedNodes = targetContributionDoc.nodes.map((n) => {
          if (n.id === nodeId) {
            let newDownvotesCount = Number.isInteger(n.downvotesCount) ? n.downvotesCount : 0;
            let newUpvotesCount = Number.isInteger(n.upvotesCount) ? n.upvotesCount : 0;
            const userDownvotes = Array.isArray(n.userDownvotes) ? n.userDownvotes : [];
            const userUpvotes = Array.isArray(n.userUpvotes) ? n.userUpvotes : [];

            if (currentDownvote) {
              newDownvotesCount = Math.max(0, newDownvotesCount - 1);
              n.userDownvotes = userDownvotes.filter((uid) => uid !== user.uid);
            } else {
              newDownvotesCount = newDownvotesCount + 1;
              n.userDownvotes = [...userDownvotes, user.uid];
              if (currentUpvote) {
                newUpvotesCount = Math.max(0, newUpvotesCount - 1);
                n.userUpvotes = userUpvotes.filter((uid) => uid !== user.uid);
              }
            }

            setAllNodes((prevNodes) =>
              prevNodes.map((ln) =>
                ln.id === nodeId
                  ? {
                      ...ln,
                      upvotesCount: newUpvotesCount,
                      downvotesCount: newDownvotesCount,
                      userUpvotes: n.userUpvotes,
                      userDownvotes: n.userDownvotes,
                    }
                  : ln
              )
            );
            if (selectedNodeDetails && selectedNodeDetails.id === nodeId) {
              setSelectedNodeDetails((prev) => ({
                ...prev,
                upvotesCount: newUpvotesCount,
                downvotesCount: newDownvotesCount,
                userUpvotes: n.userUpvotes,
                userDownvotes: n.userDownvotes,
              }));
            }
            return sanitizeNodeData({
              ...n,
              upvotesCount: newUpvotesCount,
              downvotesCount: newDownvotesCount,
              userUpvotes: n.userUpvotes,
              userDownvotes: n.userDownvotes,
            });
          }
          return sanitizeNodeData(n);
        });

        await setDoc(doc(db, 'contributions', userId, postId, contributionId), { ...targetContributionDoc, nodes: updatedNodes }, { merge: true });

        setHasDownvoted((prev) => ({
          ...prev,
          [nodeId]: !currentDownvote,
        }));
        if (currentUpvote) {
          setHasUpvoted((prev) => ({
            ...prev,
            [nodeId]: false,
          }));
        }
      } catch (err) {
        setError('Failed to downvote: ' + err.message);
      }
    },
    [user, navigate, userId, postId, hasUpvoted, hasDownvoted, selectedNodeDetails]
  );

  const handleNodeCommentSubmit = useCallback(
    async (nodeId, commentText, parentCommentId = null) => {
      if (!user) {
        navigate('/login');
        return;
      }

      if (!commentText?.trim()) {
        setError('Comment cannot be empty.');
        return;
      }

      try {
        // Fetch user's custom profile picture
        let userProfilePic = 'https://dummyimage.com/30x30/000/fff?text=User';
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          userProfilePic = userData.profilePic || userProfilePic;
        }

        const contributionsRef = collection(db, 'contributions', userId, postId);
        const contributionsSnapshot = await getDocs(contributionsRef);
        let targetContributionDoc = null;
        let contributionId = null;

        for (const docSnap of contributionsSnapshot.docs) {
          const data = docSnap.data();
          if (data.nodes && data.nodes.some((node) => node.id === nodeId)) {
            targetContributionDoc = data;
            contributionId = docSnap.id;
            break;
          }
        }

        if (!targetContributionDoc) {
          throw new Error('Contribution not found for the node');
        }

        // Ensure comments field exists
        const nodeIndex = targetContributionDoc.nodes.findIndex((n) => n.id === nodeId);
        if (nodeIndex !== -1 && !Array.isArray(targetContributionDoc.nodes[nodeIndex].comments)) {
          targetContributionDoc.nodes[nodeIndex].comments = [];
        }

        const newComment = sanitizeCommentData({
          id: uuidv4(),
          comment: commentText.trim(),
          username: user.displayName || 'Anonymous',
          profilePic: userProfilePic,
          timestamp: new Date().toISOString(),
          userId: user.uid,
          userLikes: [],
          likesCount: 0,
          replies: [],
        });

        const updatedNodes = targetContributionDoc.nodes.map((n) => {
          if (n.id === nodeId) {
            let updatedComments = [...(Array.isArray(n.comments) ? n.comments : [])];
            if (parentCommentId) {
              // Add as a reply to the parent comment
              const updateReplies = (comments) => {
                return comments.map((comment) => {
                  if (comment.id === parentCommentId) {
                    return {
                      ...comment,
                      replies: [...(Array.isArray(comment.replies) ? comment.replies : []), newComment],
                    };
                  }
                  if (comment.replies && comment.replies.length > 0) {
                    return {
                      ...comment,
                      replies: updateReplies(comment.replies),
                    };
                  }
                  return comment;
                });
              };
              updatedComments = updateReplies(updatedComments);
            } else {
              // Add as a top-level comment
              updatedComments.push(newComment);
            }

            // Update local state immediately
            setNodeComments((prev) => ({
              ...prev,
              [nodeId]: updatedComments,
            }));
            setAllNodes((prevNodes) =>
              prevNodes.map((ln) =>
                ln.id === nodeId ? { ...ln, comments: updatedComments } : ln
              )
            );
            if (selectedNodeDetails && selectedNodeDetails.id === nodeId) {
              setSelectedNodeDetails((prev) => ({
                ...prev,
                comments: updatedComments,
              }));
            }
            return sanitizeNodeData({
              ...n,
              comments: updatedComments,
            });
          }
          return sanitizeNodeData(n);
        });

        await setDoc(doc(db, 'contributions', userId, postId, contributionId), { ...targetContributionDoc, nodes: updatedNodes }, { merge: true });

        setNewNodeComment((prev) => ({
          ...prev,
          [nodeId]: '',
        }));
        setReplyingTo(null);
        setError(null);
      } catch (err) {
        setError('Failed to add comment: ' + err.message);
      }
    },
    [user, navigate, userId, postId, selectedNodeDetails]
  );

  const handleNodeCommentLike = useCallback(
    async (nodeId, commentId, parentCommentId = null) => {
      if (!user) {
        navigate('/login');
        return;
      }

      try {
        const contributionsRef = collection(db, 'contributions', userId, postId);
        const contributionsSnapshot = await getDocs(contributionsRef);
        let targetContributionDoc = null;
        let contributionId = null;

        for (const docSnap of contributionsSnapshot.docs) {
          const data = docSnap.data();
          if (data.nodes && data.nodes.some((node) => node.id === nodeId)) {
            targetContributionDoc = data;
            contributionId = docSnap.id;
            break;
          }
        }

        if (!targetContributionDoc) {
          throw new Error('Contribution not found for the node');
        }

        const updatedNodes = targetContributionDoc.nodes.map((n) => {
          if (n.id === nodeId) {
            const updateCommentLikes = (comments) => {
              return comments.map((comment) => {
                if (comment.id === commentId) {
                  const userLikes = Array.isArray(comment.userLikes) ? comment.userLikes : [];
                  const likesCount = Number.isInteger(comment.likesCount) ? comment.likesCount : 0;
                  if (userLikes.includes(user.uid)) {
                    return sanitizeCommentData({
                      ...comment,
                      userLikes: userLikes.filter((uid) => uid !== user.uid),
                      likesCount: Math.max(0, likesCount - 1),
                    });
                  } else {
                    return sanitizeCommentData({
                      ...comment,
                      userLikes: [...userLikes, user.uid],
                      likesCount: likesCount + 1,
                    });
                  }
                }
                if (comment.replies && comment.replies.length > 0) {
                  return {
                    ...comment,
                    replies: updateCommentLikes(comment.replies),
                  };
                }
                return comment;
              });
            };

            const updatedComments = updateCommentLikes(Array.isArray(n.comments) ? n.comments : []);

            setNodeComments((prev) => ({
              ...prev,
              [nodeId]: updatedComments,
            }));
            setAllNodes((prevNodes) =>
              prevNodes.map((ln) =>
                ln.id === nodeId ? { ...ln, comments: updatedComments } : ln
              )
            );
            if (selectedNodeDetails && selectedNodeDetails.id === nodeId) {
              setSelectedNodeDetails((prev) => ({
                ...prev,
                comments: updatedComments,
              }));
            }
            return sanitizeNodeData({
              ...n,
              comments: updatedComments,
            });
          }
          return sanitizeNodeData(n);
        });

        await setDoc(doc(db, 'contributions', userId, postId, contributionId), { ...targetContributionDoc, nodes: updatedNodes }, { merge: true });
      } catch (err) {
        setError('Failed to like comment: ' + err.message);
      }
    },
    [user, navigate, userId, postId, selectedNodeDetails]
  );

  const handleNodeCommentDelete = useCallback(
    async (nodeId, commentId, parentCommentId = null) => {
      if (!user) {
        navigate('/login');
        return;
      }

      try {
        const contributionsRef = collection(db, 'contributions', userId, postId);
        const contributionsSnapshot = await getDocs(contributionsRef);
        let targetContributionDoc = null;
        let contributionId = null;

        for (const docSnap of contributionsSnapshot.docs) {
          const data = docSnap.data();
          if (data.nodes && data.nodes.some((node) => node.id === nodeId)) {
            targetContributionDoc = data;
            contributionId = docSnap.id;
            break;
          }
        }

        if (!targetContributionDoc) {
          throw new Error('Contribution not found for the node');
        }

        const updatedNodes = targetContributionDoc.nodes.map((n) => {
          if (n.id === nodeId) {
            const removeComment = (comments) => {
              if (parentCommentId) {
                return comments.map((comment) => {
                  if (comment.id === parentCommentId) {
                    return {
                      ...comment,
                      replies: comment.replies.filter((reply) => reply.id !== commentId),
                    };
                  }
                  if (comment.replies && comment.replies.length > 0) {
                    return {
                      ...comment,
                      replies: removeComment(comment.replies),
                    };
                  }
                  return comment;
                });
              } else {
                return comments.filter((comment) => comment.id !== commentId);
              }
            };

            const updatedComments = removeComment(Array.isArray(n.comments) ? n.comments : []);

            setNodeComments((prev) => ({
              ...prev,
              [nodeId]: updatedComments,
            }));
            setAllNodes((prevNodes) =>
              prevNodes.map((ln) =>
                ln.id === nodeId ? { ...ln, comments: updatedComments } : ln
              )
            );
            if (selectedNodeDetails && selectedNodeDetails.id === nodeId) {
              setSelectedNodeDetails((prev) => ({
                ...prev,
                comments: updatedComments,
              }));
            }
            return sanitizeNodeData({
              ...n,
              comments: updatedComments,
            });
          }
          return sanitizeNodeData(n);
        });

        await setDoc(doc(db, 'contributions', userId, postId, contributionId), { ...targetContributionDoc, nodes: updatedNodes }, { merge: true });
      } catch (err) {
        setError('Failed to delete comment: ' + err.message);
      }
    },
    [user, navigate, userId, postId, selectedNodeDetails]
  );

  const handleReplyClick = useCallback((nodeId, commentId) => {
    setReplyingTo({ nodeId, commentId });
  }, []);

  const handleDownload = useCallback(async (url, fileName) => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Network response was not ok');
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;

      const extension = url.match(/\.(mp4|webm|ogg|mov|jpg|jpeg|png|gif)(?:\?.*)?$/i)?.[1] || 'jpg';
      link.setAttribute('download', `${fileName}.${extension}`);

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      setError('Failed to download media: ' + err.message);
    }
  }, []);

  const handleShare = useCallback(() => {
    const currentUrl = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: 'Check out this contribution tree!',
        url: currentUrl,
      }).catch((err) => {
        setError('Failed to share page: ' + err.message);
      });
    } else {
      navigator.clipboard
        .writeText(currentUrl)
        .then(() => {
          alert('Page URL copied to clipboard!');
        })
        .catch((err) => {
          setError('Failed to copy page URL: ' + err.message);
        });
    }
  }, []);

  const handleRemix = useCallback(
    (chatLink) => {
      if (!chatLink) {
        setError('Remixing is not supported without a chat link.');
        return;
      }
      window.open(chatLink, '_blank');
    },
    []
  );

  const handleContributionSubmit = useCallback(
    async (e, { file, prompt, modelInput, chatLink }) => {
      e.preventDefault();
  
      if (!user) {
        navigate('/login');
        return;
      }
      if (!file) {
        setError('Please add a file');
        return;
      }
  
      const fileSizeMB = file.size / (1024 * 1024);
      if (fileSizeMB > 20) {
        setError('File size exceeds 20MB limit');
        return;
      }
  
      setIsUploading(true);
      setContributionMessage('');
      setError('');
  
      try {
        const storagePath = `contributions/${userId}/${postId}/${Date.now()}-${file.name}`;
        const storageRef = ref(storage, storagePath);
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);
  
        const newNodeId = uuidv4();
        const newNode = sanitizeNodeData({
          id: newNodeId,
          imageUrl: downloadURL,
          prompt: prompt || null,       // Allow empty prompt
          model: modelInput || null,    // Allow empty model
          parentId: selectedNodeId,
          upvotesCount: 0,
          downvotesCount: 0,
          userUpvotes: [],
          userDownvotes: [],
          comments: [],
          createdAt: new Date().toISOString(),
          userId: user.uid,
          username: user.displayName || 'unknown',
          profilePic: user.photoURL || 'https://dummyimage.com/30x30/000/fff?text=User',
          chatLink: chatLink || null,
        });
  
        const newEdges = [];
        const parentEdge = {
          id: uuidv4(),
          source: selectedNodeId,
          target: newNodeId,
          sourceHandle: 'source',
          targetHandle: 'target',
          type: 'flowing',
          data: { isLeafEdge: false },
        };
        newEdges.push(parentEdge);
  
        const contributionId = uuidv4();
        const contributionRef = doc(db, 'contributions', userId, postId, contributionId);
        await setDoc(
          contributionRef,
          {
            nodes: [newNode],
            edges: newEdges,
          },
          { merge: true }
        );
  
        setContributionMessage('Thanks for the contribution');
        setTimeout(() => {
          setContributionMessage('');
          setShowPopup(false);
          setSelectedNodeId(null);
        }, 3000);
      } catch (err) {
        setError(`Failed to submit contribution: ${err.message}`);
      } finally {
        setIsUploading(false);
      }
    },
    [user, userId, postId, selectedNodeId, navigate]
  );
  

  const handleTextContributionSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (!user) {
        navigate('/login');
        return;
      }
      if (!textContribution.trim()) {
        setError('Contribution cannot be empty');
        return;
      }

      try {
        const commentDocRef = doc(collection(db, 'posts', postId, 'comments'));
        const newComment = {
          userId: user.uid,
          username: user.displayName || 'unknown',
          profilePic: user.photoURL || 'https://dummyimage.com/30x30/000/fff?text=User',
          comment: textContribution.trim(),
          timestamp: new Date().toISOString(),
          likesCount: 0,
          userLikes: [],
        };

        await setDoc(commentDocRef, newComment);
        setTextContribution('');
        setError(null);
      } catch (err) {
        setError('Failed to submit comment: ' + err.message);
      }
    },
    [user, postId, textContribution, navigate]
  );

  const handleTextContributionLike = useCallback(
    async (commentId) => {
      if (!user) {
        navigate('/login');
        return;
      }

      try {
        const commentDocRef = doc(db, 'posts', postId, 'comments', commentId);
        const commentDoc = await getDoc(commentDocRef);
        if (!commentDoc.exists()) {
          throw new Error('Comment not found');
        }

        const commentData = commentDoc.data();
        const currentLikesCount = Number.isInteger(commentData.likesCount) ? commentData.likesCount : 0;
        const userLikes = Array.isArray(commentData.userLikes) ? commentData.userLikes : [];
        const userHasLiked = userLikes.includes(user.uid);

        const updatedLikesCount = userHasLiked ? Math.max(0, currentLikesCount - 1) : currentLikesCount + 1;
        const updatedUserLikes = userHasLiked
          ? userLikes.filter((uid) => uid !== user.uid)
          : [...userLikes, user.uid];

        await updateDoc(commentDocRef, {
          likesCount: updatedLikesCount,
          userLikes: updatedUserLikes,
        });

        setTextContributions((prev) =>
          prev.map((contrib) =>
            contrib.id === commentId
              ? {
                  ...contrib,
                  likesCount: updatedLikesCount,
                  userLikes: updatedUserLikes,
                }
              : contrib
          )
        );
      } catch (err) {
        setError('Failed to like comment: ' + err.message);
      }
    },
    [user, postId]
  );

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSelectedNodeDetails(null);
        setShowPopup(false);
        setSelectedNodeId(null);
        setReplyingTo(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const initialHasUpvoted = {};
        const initialHasDownvoted = {};
        [memoizedParentNode, ...memoizedAllNodes].forEach((node) => {
          if (node) {
            initialHasUpvoted[node.id] = (node.userUpvotes || []).includes(currentUser.uid);
            initialHasDownvoted[node.id] = (node.userDownvotes || []).includes(currentUser.uid);
          }
        });
        setHasUpvoted(initialHasUpvoted);
        setHasDownvoted(initialHasDownvoted);
      }
    });

    return () => unsubscribeAuth();
  }, [memoizedParentNode, memoizedAllNodes]);

  useEffect(() => {
    let unsubscribeContributions = null;
    let unsubscribeComments = null;

    const loadData = async () => {
      try {
        if (!userId || !postId || !nodeId) {
          throw new Error('Missing userId, postId, or nodeId');
        }

        const postDocRef = doc(db, 'posts', postId);
        const postDoc = await getDoc(postDocRef);
        if (!postDoc.exists()) {
          throw new Error('Post not found');
        }

        const postData = postDoc.data();
        if (postData.userId !== userId) {
          throw new Error('Post does not belong to this user');
        }

        let imageUrl = postData.aiGeneratedUrl;
        if (imageUrl && !imageUrl.startsWith('https://')) {
          try {
            const storageRef = ref(storage, imageUrl);
            imageUrl = await getDownloadURL(storageRef);
          } catch (err) {
            imageUrl = 'https://dummyimage.com/180x180/000/fff?text=Media+Not+Found';
          }
        }

        const userDocRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userDocRef);
        const userData = userDoc.exists() ? userDoc.data() : {};

        let username = 'unknown';
        if (userData.username) {
          username = typeof userData.username === 'string' ? userData.username : userData.username.username || 'unknown';
        }

        const parentNodeData = sanitizeNodeData({
          id: '1',
          imageUrl: imageUrl,
          prompt: postData.promptUsed || 'Original Post',
          model: postData.modelUsed || 'Unknown',
          userId: userId,
          username: username,
          profilePic: userData.profilePic || 'https://dummyimage.com/30x30/000/fff?text=User',
          caption: postData.caption || '',
          createdAt: postData.createdAt || new Date().toISOString(),
          upvotesCount: Number.isInteger(postData.upvotesCount) ? postData.upvotesCount : 0,
          downvotesCount: 0,
          userUpvotes: [],
          userDownvotes: [],
          comments: [],
          chatLink: postData.chatLink || null,
        });
        setParentNode(parentNodeData);

        const contributionsRef = collection(db, 'contributions', userId, postId);
        const contributionsSnapshot = await getDocs(contributionsRef);
        let allNodesData = [];
        let allEdgesData = [];

        for (const docSnap of contributionsSnapshot.docs) {
          const contributionData = docSnap.data();
          if (Array.isArray(contributionData.nodes)) {
            allNodesData = [...allNodesData, ...contributionData.nodes];
          }
          if (Array.isArray(contributionData.edges)) {
            allEdgesData = [...allEdgesData, ...contributionData.edges];
          }
        }

        const updatedNodes = await Promise.all(
          allNodesData.map(async (node) => {
            if (!node) return null;
            let nodeImageUrl = node.imageUrl;
            if (nodeImageUrl && !nodeImageUrl.startsWith('https://')) {
              try {
                const storageRef = ref(storage, nodeImageUrl);
                nodeImageUrl = await getDownloadURL(storageRef);
              } catch (err) {
                nodeImageUrl = 'https://dummyimage.com/180x180/000/fff?text=Media+Not+Found';
              }
            }

            const userDocRef = doc(db, 'users', node.userId);
            const userDoc = await getDoc(userDocRef);
            const userData = userDoc.exists() ? userDoc.data() : {};

            let username = 'unknown';
            if (node.username) {
              username = typeof node.username === 'string' ? node.username : node.username.username || 'unknown';
            } else if (userData.username) {
              username = typeof userData.username === 'string' ? userData.username : userData.username.username || 'unknown';
            }

            return sanitizeNodeData({
              ...node,
              imageUrl: nodeImageUrl,
              username: username,
              profilePic: userData.profilePic || node.profilePic || 'https://dummyimage.com/30x30/000/fff?text=User',
              downvotesCount: Number.isInteger(node.downvotesCount) ? node.downvotesCount : 0,
              userUpvotes: node.userUpvotes || node.userLikes || [],
              userDownvotes: node.userDownvotes || node.userDislikes || [],
              comments: Array.isArray(node.comments) ? node.comments.map(sanitizeCommentData) : [],
            });
          })
        );

        setAllNodes(updatedNodes.filter(Boolean));
        setInitialEdges(allEdgesData);

        const initialNodeComments = {};
        const initialNewNodeComments = {};
        updatedNodes.filter(Boolean).forEach((node) => {
          if (node) {
            initialNodeComments[node.id] = node.comments || [];
            initialNewNodeComments[node.id] = '';
          }
        });
        setNodeComments(initialNodeComments);
        setNewNodeComment(initialNewNodeComments);

        const commentsRef = collection(db, 'posts', postId, 'comments');
        unsubscribeComments = onSnapshot(
          commentsRef,
          (snapshot) => {
            const commentsData = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
              userLikes: Array.isArray(doc.data().userLikes) ? doc.data().userLikes : [],
              likesCount: Number.isInteger(doc.data().likesCount) ? doc.data().likesCount : 0,
            }));
            setTextContributions(commentsData);
          },
          (err) => {
            setError('Failed to load comments: ' + err.message);
          }
        );

        unsubscribeContributions = onSnapshot(
          contributionsRef,
          async (snapshot) => {
            let updatedNodesData = [];
            let updatedEdgesData = [];

            for (const docSnap of snapshot.docs) {
              const data = docSnap.data();
              if (Array.isArray(data.nodes)) {
                updatedNodesData = [...updatedNodesData, ...data.nodes];
              }
              if (Array.isArray(data.edges)) {
                updatedEdgesData = [...updatedEdgesData, ...data.edges];
              }
            }

            const nodesWithUpdatedUrls = await Promise.all(
              updatedNodesData.map(async (node) => {
                if (!node) return null;
                let nodeImageUrl = node.imageUrl;
                if (nodeImageUrl && !nodeImageUrl.startsWith('https://')) {
                  try {
                    const storageRef = ref(storage, nodeImageUrl);
                    nodeImageUrl = await getDownloadURL(storageRef);
                  } catch (err) {
                    nodeImageUrl = 'https://dummyimage.com/180x180/000/fff?text=Media+Not+Found';
                  }
                }
                const userDocRef = doc(db, 'users', node.userId);
                const userDoc = await getDoc(userDocRef);
                const userData = userDoc.exists() ? userDoc.data() : {};

                let username = 'unknown';
                if (node.username) {
                  username = typeof node.username === 'string' ? node.username : node.username.username || 'unknown';
                } else if (userData.username) {
                  username = typeof userData.username === 'string' ? userData.username : userData.username.username || 'unknown';
                }

                return sanitizeNodeData({
                  ...node,
                  imageUrl: nodeImageUrl,
                  username: username,
                  profilePic: userData.profilePic || node.profilePic || 'https://dummyimage.com/30x30/000/fff?text=User',
                  downvotesCount: Number.isInteger(node.downvotesCount) ? node.downvotesCount : 0,
                  userUpvotes: node.userUpvotes || node.userLikes || [],
                  userDownvotes: node.userDownvotes || node.userDislikes || [],
                  comments: Array.isArray(node.comments) ? node.comments.map(sanitizeCommentData) : [],
                });
              })
            );

            debouncedSetAllNodes(nodesWithUpdatedUrls.filter(Boolean));
            debouncedSetInitialEdges(updatedEdgesData);

            const updatedNodeComments = {};
            const preservedNewNodeComments = { ...newNodeComment };
            nodesWithUpdatedUrls.filter(Boolean).forEach((node) => {
              if (node) {
                updatedNodeComments[node.id] = node.comments || [];
                if (!(node.id in preservedNewNodeComments)) {
                  preservedNewNodeComments[node.id] = '';
                }
              }
            });
            setNodeComments(updatedNodeComments);
            setNewNodeComment(preservedNewNodeComments);
          },
          (err) => {
            setError(`Failed to listen for contributions: ${err.message}`);
          }
        );
      } catch (err) {
        if (err.code === 'permission-denied') {
          setError('You do not have permission to view this post.');
          setTimeout(() => navigate('/'), 3000);
        } else if (err.message === 'Post not found') {
          setError('The post you are trying to access does not exist.');
          setTimeout(() => navigate(`/profile/${userId}`), 3000);
        } else if (err.message === 'Post does not belong to this user') {
          setError('This post does not belong to the specified user.');
          setTimeout(() => navigate(`/profile/${userId}`), 3000);
        } else {
          setError(`Failed to load data: ${err.message}`);
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();

    return () => {
      if (unsubscribeContributions) unsubscribeContributions();
      if (unsubscribeComments) unsubscribeComments();
    };
  }, [userId, postId, nodeId, navigate, debouncedSetAllNodes, debouncedSetInitialEdges, newNodeComment]);

  useEffect(() => {
    if (nodeId && nodeId !== '1' && allNodes.length > 0) {
      const node = [memoizedParentNode, ...memoizedAllNodes].find((n) => n && n.id === nodeId);
      if (node) {
        setSelectedNodeDetails(node);
        setNewNodeComment((prev) => ({
          ...prev,
          [nodeId]: prev[nodeId] || '',
        }));
      }
    }
  }, [nodeId, memoizedParentNode, memoizedAllNodes]);

  const memoizedInitialEdges = useMemo(() => initialEdges, [initialEdges]);
  const memoizedInitialTreeNodes = useMemo(() => initialTreeNodes, [initialTreeNodes]);

  if (error && !showPopup) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#000000', color: '#FFFFFF' }}>
        <p style={{ fontSize: '18px', fontWeight: '500' }}>{error}</p>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#000000', color: '#FFFFFF', minHeight: '100vh' }}>
      <div
        ref={graphContainerRef}
        style={{
          height: containerHeight,
          width: '100%',
          position: 'relative',
          borderBottom: '2px solid #FFFFFF',
        }}
      >
        {loading && (
          <div style={{ position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 1000 }}>
            <LoadingSpinner />
          </div>
        )}
        <div
          style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            zIndex: '1000',
            display: 'flex',
            gap: '10px',
          }}
        >
          <motion.button
            onClick={handleResetLayout}
            style={{
              padding: '8px 16px',
              backgroundColor: '#000000',
              color: '#FFFFFF',
              border: '1px solid #FFFFFF',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95, backgroundColor: '#9f86ff' }}
          >
            Reset Layout
          </motion.button>
        </div>

        <ResizeErrorBoundary>
          <FlowGraph
            parentNode={memoizedParentNode}
            allNodes={memoizedAllNodes}
            initialEdges={memoizedInitialEdges}
            onPaneClick={handleCanvasClick}
            handleContribute={handleContribute}
            handleNodeSelect={handleNodeSelect}
            handleNodeHover={handleNodeHover}
            handleNodeHoverEnd={handleNodeHoverEnd}
            user={user}
            hoveredNodeId={hoveredNodeId}
            nodeId={nodeId}
            initialTreeNodes={memoizedInitialTreeNodes}
            setInitialTreeNodes={setInitialTreeNodes}
            setIsInitialFitDone={setIsInitialFitDone}
            handleRemix={handleRemix}
          />
        </ResizeErrorBoundary>

        {selectedNodeDetails && !showPopup && (
          <NodeDetailsCard
            nodeDetails={{
              ...selectedNodeDetails,
              totalContributions,
            }}
            onContribute={handleContribute}
            onUpvote={handleUpvote}
            onDownvote={handleDownvote}
            onDownload={handleDownload}
            onShare={handleShare}
            onRemix={handleRemix}
            hasUpvoted={hasUpvoted}
            hasDownvoted={hasDownvoted}
            onClose={() => setSelectedNodeDetails(null)}
            user={user}
            nodeComments={nodeComments[selectedNodeDetails.id] || []}
            handleNodeCommentSubmit={handleNodeCommentSubmit}
            handleNodeCommentLike={handleNodeCommentLike}
            handleNodeCommentDelete={handleNodeCommentDelete}
            handleReplyClick={handleReplyClick}
            replyingTo={replyingTo}
            setReplyingTo={setReplyingTo}
            newNodeComment={newNodeComment[selectedNodeDetails.id] || ''}
            setNewNodeComment={(text) =>
              setNewNodeComment((prev) => ({
                ...prev,
                [selectedNodeDetails.id]: text,
              }))
            }
            navigate={navigate}
            getRelativeTime={getRelativeTime}
          />
        )}

        {showPopup && (
          <ContributionPopup
            onSubmit={handleContributionSubmit}
            onCancel={() => {
              setShowPopup(false);
              setSelectedNodeId(null);
              setError('');
              setContributionMessage('');
            }}
            error={error}
            contributionMessage={contributionMessage}
            isUploading={isUploading}
          />
        )}
      </div>

      <Timeline
        parentNode={memoizedParentNode}
        allNodes={memoizedAllNodes}
        user={user}
        navigate={navigate}
        handleContribute={handleContribute}
        handleUpvote={handleUpvote}
        handleDownvote={handleDownvote}
        handleDownload={handleDownload}
        handleShare={handleShare}
        hasUpvoted={hasUpvoted}
        hasDownvoted={hasDownvoted}
        textContributions={textContributions.map((contrib) => ({
          ...contrib,
          timestamp: getRelativeTime(contrib.timestamp),
        }))}
        textContribution={textContribution}
        setTextContribution={setTextContribution}
        handleTextContributionSubmit={handleTextContributionSubmit}
        handleTextContributionLike={handleTextContributionLike}
        nodeComments={nodeComments}
        newNodeComment={newNodeComment}
        setNewNodeComment={(nodeId, text) => {
          setNewNodeComment((prev) => ({
            ...prev,
            [nodeId]: text,
          }));
        }}
        handleNodeCommentSubmit={handleNodeCommentSubmit}
        handleNodeCommentLike={handleNodeCommentLike}
        handleNodeCommentDelete={handleNodeCommentDelete}
        handleReplyClick={handleReplyClick}
        replyingTo={replyingTo}
        setReplyingTo={setReplyingTo}
        getRelativeTime={getRelativeTime}
        handleRemix={handleRemix}
      />
    </div>
  );
};

const WrappedContributePage = () => (
  <ReactFlowProvider>
    <ContributePage />
  </ReactFlowProvider>
);

export default WrappedContributePage;