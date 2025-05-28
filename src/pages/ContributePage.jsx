import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, storage } from '../firebase/firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import { motion } from 'framer-motion';
import { auth } from '../firebase/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { FaHeart, FaRegHeart, FaTimes } from 'react-icons/fa';
import { FiRepeat, FiPlusCircle, FiPlay, FiPause } from 'react-icons/fi';
import ReactFlow, { Background, Controls, useNodesState, useEdgesState, Handle } from 'reactflow';
import 'reactflow/dist/style.css';

// Define the list of models
const models = [
  "Midjourney",
  "DALL·E 3",
  "Stable Diffusion",
  "Sora (OpenAI)",
  "Veo 2 (Google DeepMind)",
  "Veo 3 (Google DeepMind)",
  "Adobe Firefly",
  "Ideogram",
  "Leonardo AI",
  "Pika Labs",
  "xAI Image Generator (Grok)",
  "Runway ML Gen Model",
  "Synthesia",
  "DeepBrain AI",
  "Rephrase.ai",
  "Imagen 2 (Google DeepMind)",
  "Emu (Meta)",
  "Make-A-Video (Meta)",
  "DreamFusion (Google - 3D from text)",
  "Phenaki (Google - long video from text)",
];

// Debounce utility function
const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Throttle utility function
const throttle = (func, limit) => {
  let inThrottle;
  return (...args) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// Custom Edge Component with Bending Lines and Flow Animation
const FlowingEdge = ({ id, sourceX, sourceY, targetX, targetY, data }) => {
  const controlPoint1X = sourceX;
  const controlPoint1Y = sourceY + (targetY - sourceY) / 2;
  const controlPoint2X = targetX;
  const controlPoint2Y = sourceY + (targetY - sourceY) / 2;
  const curvedPath = `M${sourceX},${sourceY} C${controlPoint1X},${controlPoint1Y} ${controlPoint2X},${controlPoint2Y} ${targetX},${targetY}`;

  const { isHovered } = data || {};
  const strokeColor = isHovered ? '#E0FFFF' : '#808080';

  return (
    <svg style={{ overflow: 'visible', position: 'absolute', zIndex: 1 }}>
      <path
        id={id}
        d={curvedPath}
        stroke={strokeColor}
        strokeWidth={isHovered ? 4 : 2}
        fill="none"
        style={isHovered ? { filter: 'drop-shadow(0 0 5px rgba(224, 255, 255, 0.8))' } : {}}
      >
        {isHovered && (
          <animate
            attributeName="strokeDashoffset"
            from="1000"
            to="0"
            dur="2s"
            repeatCount="indefinite"
            restart="always"
          />
        )}
      </path>
      {isHovered && (
        <path
          d={curvedPath}
          stroke={strokeColor}
          strokeWidth={4}
          fill="none"
          strokeDasharray="1000"
          style={{ filter: 'drop-shadow(0 0 5px rgba(224, 255, 255, 0.8))' }}
        >
          <animate
            attributeName="strokeDashoffset"
            from="1000"
            to="0"
            dur="2s"
            repeatCount="indefinite"
            restart="always"
          />
        </path>
      )}
    </svg>
  );
};

// Custom Node Component
const CustomNode = React.memo(({ data, setEdges }) => {
  const { imageUrl, username, profilePic, userId, onContribute, onSelect, onHover, onHoverEnd, currentUserId, id: nodeId, isParent, isConnectedToHovered } = data;
  const navigate = useNavigate();
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef(null);
  const [videoError, setVideoError] = useState(null);

  const isVideo = imageUrl && /\.(mp4|webm|ogg|mov)(?:\?.*)?$/i.test(imageUrl);
  console.log(`CustomNode [Node ${nodeId}] - Video detection:`, { isVideo, imageUrl });

  useEffect(() => {
    console.log(`CustomNode [Node ${nodeId}] - videoRef assigned:`, videoRef.current);
  }, []);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        console.log(`CustomNode [Node ${nodeId}] - Attempting to pause video`);
        videoRef.current.pause();
        console.log(`CustomNode [Node ${nodeId}] - Video paused successfully`);
      } else {
        console.log(`CustomNode [Node ${nodeId}] - Attempting to play video`);
        videoRef.current.play().then(() => {
          console.log(`CustomNode [Node ${nodeId}] - Video playing successfully`);
        }).catch((err) => {
          console.error(`CustomNode [Node ${nodeId}] - Video playback error:`, err);
          setVideoError('Failed to play video: ' + err.message);
        });
      }
      setIsPlaying(!isPlaying);
    } else {
      console.error(`CustomNode [Node ${nodeId}] - videoRef is null, cannot play/pause`);
    }
  };

  useEffect(() => {
    if (videoError) {
      console.log(`CustomNode [Node ${nodeId}] - videoError updated:`, videoError);
    }
  }, [videoError, nodeId]);

  const throttledHover = useCallback(
    throttle(() => onHover(nodeId), 300),
    [onHover, nodeId]
  );

  const throttledHoverEnd = useCallback(
    throttle(() => onHoverEnd(nodeId), 300),
    [onHoverEnd, nodeId]
  );

  const nodeWidth = isParent ? 300 : 200;
  const nodeHeight = isParent ? 270 : 220;

  return (
    <motion.div
      style={{
        width: `${nodeWidth}px`,
        height: `${nodeHeight}px`,
        padding: '5px',
        borderRadius: '8px',
        backgroundColor: '#1a1a1a',
        border: isConnectedToHovered ? '3px solid #E0FFFF' : '2px solid #808080',
        textAlign: 'center',
        color: '#FFFFFF',
        position: 'relative',
        boxShadow: isConnectedToHovered ? '0 0 15px rgba(255, 255, 255, 0.8)' : '0 0 10px rgba(255, 255, 255, 0.5)',
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      onClick={() => onSelect(nodeId)}
      onMouseEnter={throttledHover}
      onMouseLeave={throttledHoverEnd}
    >
      <Handle
        type="target"
        position="top"
        id="target"
        style={{ background: '#FFFFFF', width: '8px', height: '8px' }}
      />
      <Handle
        type="source"
        position="bottom"
        id="source"
        style={{ background: '#FFFFFF', width: '8px', height: '8px' }}
      />
      <div style={{ position: 'absolute', top: '5px', right: '5px' }}>
        <motion.button
          onClick={(e) => {
            e.stopPropagation();
            onContribute(nodeId);
          }}
          style={{
            background: 'none',
            border: 'none',
            color: '#FFFFFF',
            cursor: 'pointer',
          }}
          whileHover={{ scale: 1.2 }}
        >
          <FiPlusCircle size={16} />
        </motion.button>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
        <img
          src={profilePic || 'https://dummyimage.com/30x30/000/fff?text=User'}
          alt="Profile"
          style={{ width: '30px', height: '30px', borderRadius: '50%', marginRight: '8px', cursor: 'pointer' }}
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/profile/${userId}`);
          }}
          onError={(e) => (e.target.src = 'https://dummyimage.com/30x30/000/fff?text=User')}
        />
        <span
          style={{ fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/profile/${userId}`);
          }}
        >
          {username || 'Unknown'}
        </span>
      </div>
      <hr style={{ border: '1px solid #FFFFFF', margin: '5px 0' }} />
      {isVideo ? (
        <div style={{ position: 'relative' }}>
          <video
            ref={videoRef}
            src={imageUrl}
            controls
            preload="metadata"
            style={{ width: '100%', height: isParent ? '230px' : '180px', objectFit: 'cover', borderRadius: '4px' }}
            onCanPlay={() => console.log(`CustomNode [Node ${nodeId}] - Video can play, metadata loaded`)}
            onError={(e) => {
              const errorMessage = e.nativeEvent.message || 'Unknown error';
              console.error(`CustomNode [Node ${nodeId}] - Video load error:`, {
                error: errorMessage,
                url: imageUrl,
                code: e.nativeEvent.code,
                message: e.nativeEvent.message,
              });
              setVideoError(`Failed to load video: ${errorMessage} (URL: ${imageUrl})`);
              e.target.src = 'https://dummyimage.com/180x180/000/fff?text=Video+Not+Found';
            }}
          />
          {videoError && (
            <p style={{ color: '#FF4040', fontSize: '12px', marginTop: '5px' }}>{videoError}</p>
          )}
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              handlePlayPause();
            }}
            style={{
              position: 'absolute',
              bottom: '10px',
              right: '10px',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '50%',
              padding: '10px',
              cursor: 'pointer',
            }}
            whileHover={{ scale: 1.1 }}
          >
            {isPlaying ? <FiPause size={24} /> : <FiPlay size={24} />}
          </motion.button>
        </div>
      ) : (
        <img
          src={imageUrl || 'https://dummyimage.com/180x180/000/fff?text=Image+Not+Found'}
          alt="Node"
          style={{ width: '100%', height: isParent ? '230px' : '180px', objectFit: 'cover', borderRadius: '4px' }}
          onError={(e) => (e.target.src = 'https://dummyimage.com/180x180/000/fff?text=Image+Not+Found')}
        />
      )}
    </motion.div>
  );
});

// Define nodeTypes and edgeTypes outside the component to prevent redefinition
const edgeTypes = {
  flowing: FlowingEdge,
};

const nodeTypes = {
  custom: CustomNode,
};

const ContributePage = () => {
  const { userId, postId, nodeId } = useParams();
  const navigate = useNavigate();
  const [parentNode, setParentNode] = useState(null);
  const [allNodes, setAllNodes] = useState([]);
  const [file, setFile] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [chatLink, setChatLink] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [customModel, setCustomModel] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [showPopup, setShowPopup] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [user, setUser] = useState(null);
  const [likedNodes, setLikedNodes] = useState({});
  const [selectedNodeDetails, setSelectedNodeDetails] = useState(null);
  const [initialTreeNodes, setInitialTreeNodes] = useState([]);
  const [initialEdges, setInitialEdges] = useState([]);
  const [connectToNodeId, setConnectToNodeId] = useState(null);
  const [hoveredNodeId, setHoveredNodeId] = useState(null);
  const [isInitialFitDone, setIsInitialFitDone] = useState(false);
  const [videoError, setVideoError] = useState(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    console.log('SelectedNodeDetails - videoRef assigned:', videoRef.current);
  }, []);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        console.log('SelectedNodeDetails - Attempting to pause video');
        videoRef.current.pause();
        console.log('SelectedNodeDetails - Video paused successfully');
      } else {
        console.log('SelectedNodeDetails - Attempting to play video');
        videoRef.current.play().then(() => {
          console.log('SelectedNodeDetails - Video playing successfully');
        }).catch((err) => {
          console.error('SelectedNodeDetails - Video playback error:', err);
          setVideoError('Failed to play video: ' + err.message);
        });
      }
      setIsPlaying(!isPlaying);
    } else {
      console.error('SelectedNodeDetails - videoRef is null, cannot play/pause');
    }
  };

  useEffect(() => {
    if (videoError) {
      console.log('SelectedNodeDetails - videoError updated:', videoError);
    }
  }, [videoError]);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser && parentNode && allNodes.length > 0) {
        const initialLikedNodes = {};
        if (parentNode.likedBy?.includes(currentUser.uid)) {
          initialLikedNodes[parentNode.id] = true;
        }
        allNodes.forEach((node) => {
          if (node.likedBy?.includes(currentUser.uid)) {
            initialLikedNodes[node.id] = true;
          }
        });
        setLikedNodes(initialLikedNodes);
      }
    });

    return () => {
      unsubscribeAuth();
    };
  }, [parentNode, allNodes]);

  useEffect(() => {
    let unsubscribeContributions = null;

    const fetchParentNodeAndContributions = async () => {
      try {
        if (!userId || !postId || !nodeId) {
          throw new Error('Missing userId, postId, or nodeId');
        }

        const userDocRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userDocRef);
        if (!userDoc.exists()) {
          throw new Error('User not found');
        }

        const userData = userDoc.data();

        if (!userData.posts || !Array.isArray(userData.posts)) {
          throw new Error('Posts array not found in user document');
        }

        const post = userData.posts.find((p) => p.createdAt === postId);
        if (!post) {
          throw new Error('Post not found');
        }

        let imageUrl = post.aiGeneratedUrl;
        console.log('fetchParentNodeAndContributions - Initial imageUrl for parent node:', imageUrl);

        if (imageUrl && !imageUrl.startsWith('https://')) {
          try {
            const storageRef = ref(storage, imageUrl);
            imageUrl = await getDownloadURL(storageRef);
            console.log('fetchParentNodeAndContributions - Resolved imageUrl for parent node:', imageUrl);
          } catch (err) {
            console.error('fetchParentNodeAndContributions - Error fetching downloadable URL for parent node:', err);
            setError(`Failed to load parent node media: ${err.message}`);
            imageUrl = 'https://dummyimage.com/180x180/000/fff?text=Media+Not+Found';
          }
        }

        if (nodeId === '1') {
          setParentNode({
            id: '1',
            imageUrl: imageUrl,
            prompt: post.promptUsed || 'Original Post',
            model: post.modelUsed || 'Unknown',
            likes: post.likedBy?.length || 0,
            likedBy: post.likedBy || [],
            chatLink: post.chatLink || '',
            userId: userId,
            username: userData.username || 'Unknown',
            profilePic: userData.profilePic || 'https://dummyimage.com/30x30/000/fff?text=User',
          });
        }

        const contributionsRef = doc(db, 'contributions', postId);
        const contributionsDoc = await getDoc(contributionsRef);
        let contributionsData = contributionsDoc.exists() ? contributionsDoc.data() : { nodes: [], edges: [] };

        if (!Array.isArray(contributionsData.nodes)) {
          contributionsData.nodes = [];
        }
        if (!Array.isArray(contributionsData.edges)) {
          contributionsData.edges = [];
        }

        const updatedNodes = await Promise.all(
          contributionsData.nodes.map(async (node) => {
            let nodeImageUrl = node.imageUrl;
            console.log(`fetchParentNodeAndContributions - Initial imageUrl for node ${node.id}:`, nodeImageUrl);

            if (nodeImageUrl && !nodeImageUrl.startsWith('https://')) {
              try {
                const storageRef = ref(storage, nodeImageUrl);
                nodeImageUrl = await getDownloadURL(storageRef);
                console.log(`fetchParentNodeAndContributions - Resolved imageUrl for node ${node.id}:`, nodeImageUrl);
              } catch (err) {
                console.error(`fetchParentNodeAndContributions - Error fetching downloadable URL for node ${node.id}:`, err);
                nodeImageUrl = 'https://dummyimage.com/180x180/000/fff?text=Media+Not+Found';
              }
            }

            if (!node.userId) {
              return {
                ...node,
                imageUrl: nodeImageUrl,
                userId: userId,
                username: userData.username || 'Unknown',
                profilePic: userData.profilePic || 'https://dummyimage.com/30x30/000/fff?text=User',
              };
            }
            const contributorDocRef = doc(db, 'users', node.userId);
            const contributorDoc = await getDoc(contributorDocRef);
            const contributorData = contributorDoc.exists() ? contributorDoc.data() : {};
            return {
              ...node,
              imageUrl: nodeImageUrl,
              userId: node.userId,
              username: contributorData.username || 'Unknown',
              profilePic: contributorData.profilePic || 'https://dummyimage.com/30x30/000/fff?text=User',
            };
          })
        );

        setAllNodes(updatedNodes);
        setInitialEdges(contributionsData.edges);

        unsubscribeContributions = onSnapshot(contributionsRef, async (docSnapshot) => {
          if (docSnapshot.exists()) {
            const data = docSnapshot.data();
            const nodesData = Array.isArray(data.nodes) ? data.nodes : [];
            const edgesData = Array.isArray(data.edges) ? data.edges : [];

            const nodesWithUsernames = await Promise.all(
              nodesData.map(async (node) => {
                let nodeImageUrl = node.imageUrl;
                console.log(`fetchParentNodeAndContributions (onSnapshot) - Initial imageUrl for node ${node.id}:`, nodeImageUrl);

                if (nodeImageUrl && !nodeImageUrl.startsWith('https://')) {
                  try {
                    const storageRef = ref(storage, nodeImageUrl);
                    nodeImageUrl = await getDownloadURL(storageRef);
                    console.log(`fetchParentNodeAndContributions (onSnapshot) - Resolved imageUrl for node ${node.id}:`, nodeImageUrl);
                  } catch (err) {
                    console.error(`fetchParentNodeAndContributions (onSnapshot) - Error fetching downloadable URL for node ${node.id}:`, err);
                    nodeImageUrl = 'https://dummyimage.com/180x180/000/fff?text=Media+Not+Found';
                  }
                }

                if (!node.userId) {
                  return {
                    ...node,
                    imageUrl: nodeImageUrl,
                    userId: userId,
                    username: userData.username || 'Unknown',
                    profilePic: userData.profilePic || 'https://dummyimage.com/30x30/000/fff?text=User',
                  };
                }
                const contributorDocRef = doc(db, 'users', node.userId);
                const contributorDoc = await getDoc(contributorDocRef);
                const contributorData = contributorDoc.exists() ? contributorDoc.data() : {};
                return {
                  ...node,
                  imageUrl: nodeImageUrl,
                  userId: node.userId,
                  username: contributorData.username || 'Unknown',
                  profilePic: contributorData.profilePic || 'https://dummyimage.com/30x30/000/fff?text=User',
                };
              })
            );

            setAllNodes(nodesWithUsernames);
            setInitialEdges(edgesData);
          } else {
            setAllNodes([]);
            setInitialEdges([]);
          }
        }, (err) => {
          setError(`Failed to listen for contributions: ${err.message}`);
        });
      } catch (err) {
        if (err.code === 'permission-denied') {
          setError('You do not have permission to view this post. This may be due to restricted fields in the user data.');
          setTimeout(() => {
            navigate('/');
          }, 3000);
        } else if (err.message === 'Post not found') {
          setError('The post you are trying to access does not exist.');
          setTimeout(() => {
            navigate(`/profile/${userId}`);
          }, 3000);
        } else if (err.message === 'User not found') {
          setError('The user does not exist.');
          setTimeout(() => {
            navigate('/');
          }, 3000);
        } else {
          setError(`Failed to load parent node: ${err.message}`);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchParentNodeAndContributions();

    return () => {
      if (unsubscribeContributions) {
        unsubscribeContributions();
      }
    };
  }, [userId, postId, nodeId, navigate]);

  const computeLeafNodeIds = (nodeId, edges) => {
    if (!nodeId) return [];
    const leafNodeIds = new Set();

    edges.forEach((edge) => {
      if (edge.source === nodeId) {
        leafNodeIds.add(edge.target);
      }
    });

    return Array.from(leafNodeIds);
  };

  const computeInitialPositions = (nodesToPosition, edgesToPosition) => {
    const newNodes = [];
    const hoveredLeafNodeIds = hoveredNodeId ? computeLeafNodeIds(hoveredNodeId, edgesToPosition) : [];

    const leafToLeafEdges = edgesToPosition.filter(edge => {
      const sourceNode = nodesToPosition.find(node => node.id === edge.source);
      const targetNode = nodesToPosition.find(node => node.id === edge.target);
      const isNotParentChild = sourceNode && targetNode && sourceNode.parentId !== edge.target && targetNode.parentId !== edge.source;
      const isLeafToLeaf = isNotParentChild && edge.source !== parentNode.id && edge.target !== parentNode.id;
      return isLeafToLeaf;
    });

    const newEdges = edgesToPosition
      .filter((edge) => {
        const sourceExists = nodesToPosition.some((node) => node.id === edge.source);
        const targetExists = nodesToPosition.some((node) => node.id === edge.target);
        const isValid = sourceExists && targetExists;
        return isValid;
      })
      .map((edge) => ({
        ...edge,
        type: 'flowing',
        data: {
          isLeafEdge: leafToLeafEdges.some(lle => lle.id === edge.id),
          isHovered: (hoveredNodeId && (edge.source === hoveredNodeId || edge.target === hoveredNodeId)) || false,
        },
      }));

    const parentNodeWidth = 300;
    const parentNodeHeight = 270;
    const childNodeWidth = 200;
    const childNodeHeight = 220;
    const verticalSpacing = 150;
    const horizontalSpacing = 50;

    const calculateSubtreeWidth = (nodeId) => {
      const children = nodesToPosition.filter((n) => n.parentId === nodeId);
      if (children.length === 0) return childNodeWidth + horizontalSpacing;
      return children.reduce((sum, child) => sum + calculateSubtreeWidth(child.id), 0);
    };

    const positionNodesTree = (nodeId, level = 1, startX = 0) => {
      const node = nodesToPosition.find((n) => n.id === nodeId);
      if (!node) return;

      const children = nodesToPosition.filter((n) => n.parentId === nodeId);
      const isParentNode = nodeId === parentNode.id;
      const nodeWidth = isParentNode ? parentNodeWidth : childNodeWidth;
      const nodeHeight = isParentNode ? parentNodeHeight : childNodeHeight;

      const subtreeWidth = calculateSubtreeWidth(nodeId);
      const centerX = startX + (subtreeWidth - nodeWidth) / 2;
      const y = 50 + (level - 1) * (nodeHeight + verticalSpacing);

      const isConnectedToHovered = hoveredNodeId && newEdges.some(edge => 
        (edge.source === hoveredNodeId && edge.target === nodeId) || 
        (edge.target === hoveredNodeId && edge.source === nodeId)
      );

      newNodes.push({
        id: node.id,
        type: 'custom',
        data: {
          ...node,
          isParent: isParentNode,
          onContribute: handleContribute,
          onSelect: handleNodeSelect,
          onHover: handleNodeHover,
          onHoverEnd: handleNodeHoverEnd,
          likedNodes,
          currentUserId: user?.uid,
          setEdges: setEdges,
          isConnectedToHovered,
        },
        position: { x: centerX, y },
      });

      if (children.length > 0) {
        const totalChildrenWidth = children.reduce((sum, child) => sum + calculateSubtreeWidth(child.id), 0);
        let currentX = startX;
        children.forEach((child) => {
          const childSubtreeWidth = calculateSubtreeWidth(child.id);
          positionNodesTree(child.id, level + 1, currentX);
          currentX += childSubtreeWidth;
        });
      }
    };

    const totalTreeWidth = calculateSubtreeWidth(parentNode.id);
    const initialX = (window.innerWidth - totalTreeWidth) / 2;
    positionNodesTree(parentNode.id, 1, initialX);

    const adjustedNodes = new Set();
    let adjustmentIndex = 0;

    leafToLeafEdges.forEach(edge => {
      const sourceNode = newNodes.find(n => n.id === edge.source);
      const targetNode = newNodes.find(n => n.id === edge.target);
      if (sourceNode && targetNode && !adjustedNodes.has(edge.target)) {
        const offsetX = sourceNode.position.x < targetNode.position.x ? 150 : -150;
        const offsetY = 100;
        targetNode.position.x = sourceNode.position.x + offsetX;
        targetNode.position.y = sourceNode.position.y + offsetY * (adjustmentIndex + 1);
        adjustedNodes.add(edge.target);
        adjustmentIndex++;
      }
    });

    return { nodes: newNodes, edges: newEdges };
  };

  useEffect(() => {
    if (!parentNode) return;

    const allNodesCombined = [parentNode, ...allNodes];
    const { nodes: computedNodes, edges: computedEdges } = computeInitialPositions(allNodesCombined, initialEdges);

    setNodes(computedNodes);
    setEdges(computedEdges);

    if (!initialTreeNodes.length) {
      setInitialTreeNodes(computedNodes);
      setIsInitialFitDone(true);
    }
  }, [parentNode, allNodes, initialEdges, hoveredNodeId]);

  const handleUpvote = async (nodeId, isParent = false) => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const contributionsRef = doc(db, 'contributions', postId);
      const contributionsDoc = await getDoc(contributionsRef);
      let contributionsData = contributionsDoc.exists() ? contributionsDoc.data() : { nodes: [], edges: [] };

      if (isParent && nodeId === '1') {
        let updatedLikedBy = parentNode.likedBy || [];
        if (likedNodes[nodeId]) {
          updatedLikedBy = updatedLikedBy.filter((uid) => uid !== user.uid);
        } else {
          if (!updatedLikedBy.includes(user.uid)) {
            updatedLikedBy.push(user.uid);
          }
        }

        const userDocRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userDocRef);
        const userData = userDoc.data();
        const updatedPosts = userData.posts.map((p) =>
          p.createdAt === postId ? { ...p, likedBy: updatedLikedBy } : p
        );

        await setDoc(userDocRef, { posts: updatedPosts }, { merge: true });

        setLikedNodes((prev) => ({ ...prev, [nodeId]: !prev[nodeId] }));
        setParentNode((prev) => ({ ...prev, likedBy: updatedLikedBy, likes: updatedLikedBy.length }));
        if (selectedNodeDetails && selectedNodeDetails.id === nodeId) {
          setSelectedNodeDetails((prev) => ({ ...prev, likes: updatedLikedBy.length, likedBy: updatedLikedBy }));
        }
      } else {
        const updatedNodes = contributionsData.nodes.map((n) => {
          if (n.id === nodeId) {
            let updatedLikedBy = n.likedBy || [];
            if (likedNodes[nodeId]) {
              updatedLikedBy = updatedLikedBy.filter((uid) => uid !== user.uid);
            } else {
              if (!updatedLikedBy.includes(user.uid)) {
                updatedLikedBy.push(user.uid);
              }
            }
            setLikedNodes((prev) => ({ ...prev, [nodeId]: !prev[nodeId] }));
            setAllNodes((prevNodes) =>
              prevNodes.map((ln) =>
                ln.id === nodeId
                  ? { ...ln, likedBy: updatedLikedBy, likes: updatedLikedBy.length }
                  : ln
              )
            );
            if (selectedNodeDetails && selectedNodeDetails.id === nodeId) {
              setSelectedNodeDetails((prev) => ({ ...prev, likes: updatedLikedBy.length, likedBy: updatedLikedBy }));
            }
            return { ...n, likedBy: updatedLikedBy, likes: updatedLikedBy.length };
          }
          return n;
        });
        await setDoc(contributionsRef, { ...contributionsData, nodes: updatedNodes }, { merge: true });
      }
    } catch (err) {
      setError('Failed to update likes: ' + err.message);
    }
  };

  const handleRemix = (chatLink) => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (chatLink) {
      window.open(chatLink, '_blank');
    }
  };

  const handleContribute = useCallback((nodeId) => {
    if (!user) {
      navigate('/login');
      return;
    }
    setSelectedNodeId(nodeId);
    setShowPopup(true);
  }, [user, navigate]);

  const handleNodeSelect = useCallback((nodeId) => {
    const node = [parentNode, ...allNodes].find(n => n.id === nodeId);
    if (node) {
      setSelectedNodeDetails(node);
      setIsPlaying(false);
      setVideoError(null);
    }
  }, [parentNode, allNodes]);

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

  const handleNodeHover = useCallback((nodeId) => {
    debouncedHandleNodeHover(nodeId);
  }, [debouncedHandleNodeHover]);

  const handleNodeHoverEnd = useCallback((nodeId) => {
    debouncedHandleNodeHoverEnd(nodeId);
  }, [debouncedHandleNodeHoverEnd]);

  const handleCanvasClick = useCallback(() => {
    setHoveredNodeId(null);
  }, []);

  const handleResetLayout = useCallback(() => {
    setNodes(initialTreeNodes.map((node) => ({
      ...node,
      position: { ...node.position },
    })));
    setEdges(initialEdges);
    setIsInitialFitDone(true);
  }, [initialTreeNodes, initialEdges]);

  const handleFileChange = useCallback((e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const fileSizeMB = selectedFile.size / (1024 * 1024);
      if (fileSizeMB > 20) {
        setError('File size exceeds 20MB limit');
        setFile(null);
      } else {
        setFile(selectedFile);
        setError('');
      }
    }
  }, []);

  const handleModelChange = useCallback((e) => {
    const value = e.target.value;
    setSelectedModel(value);
    if (value !== 'custom') {
      setCustomModel('');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    if (!file || !prompt || (!selectedModel && !customModel)) {
      setError('Please fill in all fields');
      return;
    }

    try {
      const fileExtension = file.name.split('.').pop();
      const storageRef = ref(storage, `contributions/${postId}/${uuidv4()}.${fileExtension}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      const newNodeId = uuidv4();
      const modelUsed = selectedModel === 'custom' ? customModel : selectedModel;
      const newNode = {
        id: newNodeId,
        imageUrl: downloadURL,
        prompt,
        model: modelUsed,
        parentId: selectedNodeId,
        likes: 0,
        likedBy: [],
        createdAt: new Date().toISOString(),
        chatLink: chatLink || '',
        userId: user.uid,
        username: user.displayName || 'Unknown',
        profilePic: user.photoURL || 'https://dummyimage.com/30x30/000/fff?text=User',
      };

      if (!newNode.id || !newNode.imageUrl || !newNode.prompt || !newNode.model || !newNode.parentId) {
        throw new Error('Invalid node data: Missing required fields');
      }

      const contributionsRef = doc(db, 'contributions', postId);
      const contributionsDoc = await getDoc(contributionsRef);
      const contributionsData = contributionsDoc.exists() ? contributionsDoc.data() : { nodes: [], edges: [] };

      const existingNodes = Array.isArray(contributionsData.nodes) ? contributionsData.nodes : [];
      const existingEdges = Array.isArray(contributionsData.edges) ? contributionsData.edges : [];

      const newEdges = [];

      const parentEdge = {
        id: uuidv4(),
        source: selectedNodeId,
        target: newNodeId,
        sourceHandle: 'source',
        targetHandle: 'target',
        type: 'flowing',
        data: {},
      };
      newEdges.push(parentEdge);

      if (connectToNodeId && connectToNodeId !== selectedNodeId) {
        const leafEdge = {
          id: uuidv4(),
          source: connectToNodeId,
          target: newNodeId,
          sourceHandle: 'source',
          targetHandle: 'target',
          type: 'flowing',
          data: {},
        };
        newEdges.push(leafEdge);
      }

      const updatedNodes = [...existingNodes, newNode];
      const updatedEdges = [...existingEdges, ...newEdges];

      await setDoc(contributionsRef, {
        nodes: updatedNodes,
        edges: updatedEdges,
      }, { merge: true });

      setShowPopup(false);
      setFile(null);
      setPrompt('');
      setChatLink('');
      setSelectedModel('');
      setCustomModel('');
      setConnectToNodeId(null);
      setError('');
    } catch (err) {
      setError(`Failed to submit contribution: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#000000', color: '#FFFFFF' }}>
        <p style={{ fontSize: '18px', fontWeight: '500' }}>Loading...</p>
      </div>
    );
  }

  if (error && !showPopup) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#000000', color: '#FFFFFF' }}>
        <p style={{ fontSize: '18px', fontWeight: '500' }}>{error}</p>
      </div>
    );
  }

  if (!parentNode) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#000000', color: '#FFFFFF' }}>
        <p style={{ fontSize: '18px', fontWeight: '500' }}>Parent node not found</p>
      </div>
    );
  }

  const allAvailableNodes = [parentNode, ...allNodes];

  return (
    <div style={{ position: 'relative', height: '100vh', width: '100vw', margin: '0', padding: '0', backgroundColor: '#000000' }}>
      <div
        style={{
          position: 'absolute',
          top: '10px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: '1000',
          display: 'flex',
          gap: '10px',
        }}
      >
        <motion.button
          onClick={handleResetLayout}
          style={{
            padding: '8px 16px',
            backgroundColor: '#555555',
            color: '#FFFFFF',
            border: '1px solid #FFFFFF',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Reset Layout
        </motion.button>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onPaneClick={handleCanvasClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView={isInitialFitDone}
        fitViewOptions={{ padding: 0.2 }}
        style={{ height: '100vh', width: '100vw', backgroundColor: '#000000' }}
      >
        <Background color="#FFFFFF" gap={16} />
        <Controls />
      </ReactFlow>

      {showPopup && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}
        >
          <motion.div
            style={{
              backgroundColor: '#1a1a1a',
              padding: '20px',
              borderRadius: '8px',
              width: '400px',
              color: '#FFFFFF',
              position: 'relative',
            }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <h2 style={{ fontSize: '20px', marginBottom: '15px', textAlign: 'center' }}>Contribute to Node</h2>
            {error && <p style={{ color: '#FF4040', textAlign: 'center', marginBottom: '10px' }}>{error}</p>}
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '15px' }}>
                <label htmlFor="file-input" style={{ fontSize: '14px', fontWeight: '500', display: 'block', marginBottom: '5px' }}>
                  Upload Image/Video (max 20MB):
                </label>
                <input
                  id="file-input"
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileChange}
                  style={{ display: 'block', marginTop: '5px', color: '#FFFFFF', backgroundColor: '#333333', padding: '5px', borderRadius: '5px', border: '1px solid #FFFFFF' }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label htmlFor="prompt-input" style={{ fontSize: '14px', fontWeight: '500', display: 'block', marginBottom: '5px' }}>
                  Prompt:
                </label>
                <textarea
                  id="prompt-input"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows="3"
                  style={{ width: '100%', padding: '5px', marginTop: '5px', backgroundColor: '#333333', color: '#FFFFFF', border: '1px solid #FFFFFF', borderRadius: '5px' }}
                  required
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label htmlFor="chatlink-input" style={{ fontSize: '14px', fontWeight: '500', display: 'block', marginBottom: '5px' }}>
                  Chat Link (optional):
                </label>
                <input
                  id="chatlink-input"
                  type="url"
                  value={chatLink}
                  onChange={(e) => setChatLink(e.target.value)}
                  placeholder="https://example.com/chat"
                  style={{ width: '100%', padding: '5px', marginTop: '5px', backgroundColor: '#333333', color: '#FFFFFF', border: '1px solid #FFFFFF', borderRadius: '5px' }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label htmlFor="connect-to-node" style={{ fontSize: '14px', fontWeight: '500', display: 'block', marginBottom: '5px' }}>
                  Connect to Another Node (optional):
                </label>
                <select
                  id="connect-to-node"
                  value={connectToNodeId || ''}
                  onChange={(e) => setConnectToNodeId(e.target.value || null)}
                  style={{ width: '100%', padding: '5px', marginTop: '5px', backgroundColor: '#333333', color: '#FFFFFF', border: '1px solid #FFFFFF', borderRadius: '5px' }}
                >
                  <option value="">None</option>
                  {allAvailableNodes
                    .filter((node) => node.id !== selectedNodeId)
                    .map((node) => (
                      <option key={node.id} value={node.id}>
                        {node.prompt || 'Node ' + node.id}
                      </option>
                    ))}
                </select>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label htmlFor="model-select" style={{ fontSize: '14px', fontWeight: '500', display: 'block', marginBottom: '5px' }}>
                  Model Used:
                </label>
                <select
                  id="model-select"
                  value={selectedModel}
                  onChange={handleModelChange}
                  style={{ width: '100%', padding: '5px', marginTop: '5px', backgroundColor: '#333333', color: '#FFFFFF', border: '1px solid #FFFFFF', borderRadius: '5px' }}
                  required
                >
                  <option value="">Select a model</option>
                  {models.map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                  <option value="custom">Custom Model</option>
                </select>
              </div>

              {selectedModel === 'custom' && (
                <div style={{ marginBottom: '15px' }}>
                  <label htmlFor="custom-model-input" style={{ fontSize: '14px', fontWeight: '500', display: 'block', marginBottom: '5px' }}>
                    Custom Model Name:
                  </label>
                  <input
                    id="custom-model-input"
                    type="text"
                    value={customModel}
                    onChange={(e) => setCustomModel(e.target.value)}
                    style={{ width: '100%', padding: '5px', marginTop: '5px', backgroundColor: '#333333', color: '#FFFFFF', border: '1px solid #FFFFFF', borderRadius: '5px' }}
                    required
                  />
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                <motion.button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '10px',
                    backgroundColor: '#007bff',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: '500',
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Submit
                </motion.button>
                <motion.button
                  type="button"
                  onClick={() => {
                    setShowPopup(false);
                    setError('');
                    setConnectToNodeId(null);
                  }}
                  style={{
                    flex: 1,
                    padding: '10px',
                    backgroundColor: '#555555',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: '500',
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Cancel
                </motion.button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {selectedNodeDetails && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}
        >
          <motion.div
            style={{
              backgroundColor: '#1a1a1a',
              padding: '20px',
              borderRadius: '8px',
              width: '500px',
              color: '#FFFFFF',
              position: 'relative',
            }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <motion.button
              onClick={() => setSelectedNodeDetails(null)}
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: 'none',
                border: 'none',
                color: '#FFFFFF',
                cursor: 'pointer',
              }}
              whileHover={{ scale: 1.2 }}
            >
              <FaTimes size={20} />
            </motion.button>
            <h2 style={{ fontSize: '20px', marginBottom: '15px', textAlign: 'center' }}>Node Details</h2>
            {selectedNodeDetails.imageUrl && /\.(mp4|webm|ogg|mov)(?:\?.*)?$/i.test(selectedNodeDetails.imageUrl) ? (
              <div style={{ position: 'relative' }}>
                <video
                  ref={videoRef}
                  src={selectedNodeDetails.imageUrl}
                  controls
                  preload="metadata"
                  style={{ maxWidth: '100%', maxHeight: '300px', objectFit: 'contain', borderRadius: '4px', display: 'block', margin: '0 auto' }}
                  onCanPlay={() => console.log('SelectedNodeDetails - Video can play, metadata loaded')}
                  onError={(e) => {
                    const errorMessage = e.nativeEvent.message || 'Unknown error';
                    console.error('SelectedNodeDetails - Video load error:', {
                      error: errorMessage,
                      url: selectedNodeDetails.imageUrl,
                      code: e.nativeEvent.code,
                      message: e.nativeEvent.message,
                    });
                    setVideoError(`Failed to load video: ${errorMessage} (URL: ${selectedNodeDetails.imageUrl})`);
                    e.target.src = 'https://dummyimage.com/300x300/000/fff?text=Video+Not+Found';
                  }}
                />
                {videoError && (
                  <p style={{ color: '#FF4040', fontSize: '12px', marginTop: '5px', textAlign: 'center' }}>{videoError}</p>
                )}
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePlayPause();
                  }}
                  style={{
                    position: 'absolute',
                    bottom: '10px',
                    right: '10px',
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '50%',
                    padding: '10px',
                    cursor: 'pointer',
                  }}
                  whileHover={{ scale: 1.1 }}
                >
                  {isPlaying ? <FiPause size={24} /> : <FiPlay size={24} />}
                </motion.button>
              </div>
            ) : (
              <img
                src={selectedNodeDetails.imageUrl || 'https://dummyimage.com/300x300/000/fff?text=Image+Not+Found'}
                alt="Node"
                style={{ maxWidth: '100%', maxHeight: '300px', objectFit: 'contain', borderRadius: '4px', display: 'block', margin: '0 auto' }}
                onError={(e) => (e.target.src = 'https://dummyimage.com/300x300/000/fff?text=Image+Not+Found')}
              />
            )}
            <p style={{ fontSize: '14px', margin: '10px 0' }}><strong>Prompt:</strong> {selectedNodeDetails.prompt || 'N/A'}</p>
            <p style={{ fontSize: '14px', margin: '10px 0' }}>{selectedNodeDetails.model || 'N/A'}</p>
            <p style={{ fontSize: '14px', margin: '10px 0' }}>
              <strong>Contributor:</strong>{' '}
              <span
                style={{ color: '#007bff', cursor: 'pointer' }}
                onClick={() => navigate(`/profile/${selectedNodeDetails.userId}`)}
              >
                {selectedNodeDetails.username || 'Unknown'}
              </span>
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '15px' }}>
              <motion.button
                onClick={() => handleUpvote(selectedNodeDetails.id, selectedNodeDetails.id === '1')}
                style={{
                  backgroundColor: '#000000',
                  color: '#FFFFFF',
                  border: '1px solid #FFFFFF',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                }}
                whileHover={{ scale: 1.05 }}
              >
                {likedNodes[selectedNodeDetails.id] ? <FaHeart /> : <FaRegHeart />} {selectedNodeDetails.likes || 0}
              </motion.button>
              <motion.button
                onClick={() => handleRemix(selectedNodeDetails.chatLink)}
                disabled={!selectedNodeDetails.chatLink}
                style={{
                  backgroundColor: selectedNodeDetails.chatLink ? '#000000' : '#333333',
                  color: '#FFFFFF',
                  border: '1px solid #FFFFFF',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: selectedNodeDetails.chatLink ? 'pointer' : 'not-allowed',
                }}
                whileHover={selectedNodeDetails.chatLink ? { scale: 1.05 } : {}}
              >
                <FiRepeat /> Remix
              </motion.button>
              <motion.button
                onClick={() => {
                  setSelectedNodeDetails(null);
                  handleContribute(selectedNodeDetails.id);
                }}
                style={{
                  backgroundColor: '#000000',
                  color: '#FFFFFF',
                  border: '1px solid #FFFFFF',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                }}
                whileHover={{ scale: 1.05 }}
              >
                <FiPlusCircle /> Contribute
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ContributePage;