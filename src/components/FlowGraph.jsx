import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ReactFlow, { Background, Controls, useReactFlow, applyNodeChanges } from 'reactflow';
import 'reactflow/dist/style.css';
import CustomNode from './CustomNode';
import FlowingEdge from './FlowingEdge';
import { v4 as uuid } from 'uuid';
import { useParams } from 'react-router-dom'; // Add this import
import { collection, query, getDocs } from 'firebase/firestore'; // Add Firestore imports
import { db } from '../firebase/firebase'; // Adjust the path to your firebase config

// Debounce utility function
const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

const nodeTypes = {
  custom: CustomNode,
};

const edgeTypes = {
  flowing: FlowingEdge,
};

// Suppress ResizeObserver warning as a fallback
if (typeof window !== 'undefined') {
  const originalError = console.error;
  console.error = (...args) => {
    if (
      args[0] &&
      typeof args[0] === 'string' &&
      args[0].includes('ResizeObserver loop completed with undelivered notifications')
    ) {
      return;
    }
    originalError(...args);
  };
}

const FlowGraph = ({
  parentNode,
  allNodes,
  initialEdges,
  onPaneClick,
  handleContribute,
  handleNodeSelect,
  handleNodeHover,
  handleNodeHoverEnd,
  user,
  hoveredNodeId,
  nodeId,
  initialTreeNodes,
  setInitialTreeNodes,
  setIsInitialFitDone,
  handleRemix,
}) => {
  const { userId, postId } = useParams(); // Extract userId and postId from URL
  const { fitView: originalFitView } = useReactFlow();
  const [nodes, setNodes] = useState(initialTreeNodes || []);
  const [edges, setEdges] = useState(initialEdges || []);
  const [isInitialFitDoneLocal, setIsInitialFitDoneLocal] = useState(false);
  const [contributionId, setContributionId] = useState(null); // State for contributionId

  // Fetch the contribution document to get the contributionId
  useEffect(() => {
    const fetchContribution = async () => {
      try {
        const contributionsRef = collection(db, 'contributions', userId, postId);
        const q = query(contributionsRef);
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const doc = querySnapshot.docs[0]; // Take the first contribution document
          setContributionId(doc.id); // Set the contributionId (e.g., 5f1eb3bf-40b3-4e4c-8a44-6d76c03c55b0)
          console.log('FlowGraph - Fetched contributionId:', doc.id);
        } else {
          console.error('No contribution documents found');
        }
      } catch (error) {
        console.error('Error fetching contribution:', error);
      }
    };

    if (userId && postId) {
      fetchContribution();
    }
  }, [userId, postId]);

  // Debounce fitView to prevent rapid calls
  const fitView = useMemo(
    () => debounce(originalFitView, 100),
    [originalFitView]
  );

  const onNodesChange = useCallback(
    (changes) => {
      setNodes((nds) => applyNodeChanges(changes, nds));
    },
    []
  );

  const buildTree = useCallback(
    (parent, allNodesList, depth = 0, parentPosition = { x: 0, y: 0 }) => {
      console.log('[Node Logs] buildTree Called: parent.id=', parent?.id, 'depth=', depth);
      if (!parent) return { nodes: [], edges: [] };

      const children = allNodesList.filter((node) => node.parentId === parent.id);
      const nodeSpacingX = 220;
      const nodeSpacingY = 260;

      const totalWidth = (children.length - 1) * nodeSpacingX;
      const startX = parentPosition.x - totalWidth / 2;

      const treeNodes = [
        {
          id: parent.id,
          type: 'custom',
          data: {
            ...parent,
            contributionId, // Pass contributionId to CustomNode
            userId, // Pass userId to CustomNode
            postId, // Pass postId to CustomNode
            onContribute: () => handleContribute(parent.id),
            onSelect: () => handleNodeSelect(parent.id),
            onHover: () => handleNodeHover(parent.id),
            onHoverEnd: () => handleNodeHoverEnd(parent.id),
            user,
            hovered: false,
            selected: nodeId === parent.id,
            handleRemix: () => handleRemix(parent.chatLink),
          },
          position: parentPosition,
          style: { width: 180, height: 220 },
          draggable: true,
        },
      ];

      const treeEdges = [];

      children.forEach((child, index) => {
        const childPosition = {
          x: startX + index * nodeSpacingX,
          y: parentPosition.y + nodeSpacingY,
        };
        const subtree = buildTree(child, allNodesList, depth + 1, childPosition);
        treeNodes.push(...subtree.nodes);
        treeEdges.push(...subtree.edges);

        treeEdges.push({
          id: uuid(),
          source: parent.id,
          target: child.id,
          sourceHandle: 'source',
          targetHandle: 'target',
          type: 'flowing',
          data: { isLeafEdge: false, hovered: false },
        });
      });

      return { nodes: treeNodes, edges: treeEdges };
    },
    [
      handleContribute,
      handleNodeSelect,
      handleNodeHover,
      handleNodeHoverEnd,
      user,
      nodeId,
      handleRemix,
      contributionId, // Add contributionId to dependencies
      userId, // Add userId to dependencies
      postId, // Add postId to dependencies
    ]
  );

  // Custom comparison to avoid recomputing if parentNode or allNodes hasn't meaningfully changed
  const computedTree = useMemo(() => {
    if (!parentNode) return { nodes: [], edges: [], serializedKey: '' };

    const serializedKey = JSON.stringify({
      parentNode: { id: parentNode.id, parentId: parentNode.parentId },
      allNodes: allNodes.map((node) => ({ id: node.id, parentId: node.parentId })),
    });

    return { ...buildTree(parentNode, allNodes), serializedKey };
  }, [parentNode, allNodes, buildTree]);

  // Track the previous serialized key to avoid unnecessary updates
  const [prevSerializedKey, setPrevSerializedKey] = useState(null);

  useEffect(() => {
    if (!parentNode) {
      setNodes([]);
      setEdges([]);
      return;
    }

    // Only update if the tree structure has actually changed
    if (computedTree.serializedKey !== prevSerializedKey) {
      const { nodes: treeNodes, edges: treeEdges } = computedTree;
      setNodes(treeNodes);
      // Avoid calling setInitialTreeNodes to prevent parent rerender loop
      // setInitialTreeNodes(treeNodes);

      const newEdges = [...(initialEdges || []), ...treeEdges];
      setEdges(newEdges);

      // Only call fitView if initial fit hasn't been done
      if (!isInitialFitDoneLocal) {
        setTimeout(() => {
          // console.log('[Node Logs] fitView Scheduled in FlowGraph');
          fitView({ padding: 0.5, minZoom: 0.05, maxZoom: 1.5, duration: 800 });
          setIsInitialFitDone(true);
          setIsInitialFitDoneLocal(true);
        }, 100);
      }

      setPrevSerializedKey(computedTree.serializedKey);
    }
  }, [parentNode, computedTree, initialEdges, fitView, setIsInitialFitDone, isInitialFitDoneLocal]);

  // Update hovered state without rebuilding the entire graph
  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        data: {
          ...node.data,
          hovered: node.id === hoveredNodeId,
        },
      }))
    );

    setEdges((eds) =>
      eds.map((edge) => {
        const isHovered =
          edge.source === hoveredNodeId || edge.target === hoveredNodeId;
        return {
          ...edge,
          data: {
            ...edge.data,
            hovered: isHovered,
          },
        };
      })
    );
  }, [hoveredNodeId]);

  // Update selected state without rebuilding the entire graph
  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        data: {
          ...node.data,
          selected: node.id === nodeId,
        },
      }))
    );
  }, [nodeId]);

  const onNodeClick = useCallback(
    (event, node) => {
      // console.log('[Node Logs] onNodeClick: node.id=', node.id);
      handleNodeSelect(node.id);
    },
    [handleNodeSelect]
  );

  const onNodeMouseEnter = useCallback(
    (event, node) => {
      // console.log('[Node Logs] onNodeMouseEnter: node.id=', node.id);
      handleNodeHover(node.id);
    },
    [handleNodeHover]
  );

  const onNodeMouseLeave = useCallback(
    (event, node) => {
      // console.log('[Node Logs] onNodeMouseLeave: node.id=', node.id);
      handleNodeHoverEnd(node.id);
    },
    [handleNodeHoverEnd]
  );

  const onPaneClickCallback = useCallback(() => {
    // console.log('[Node Logs] onPaneClick Called in FlowGraph');
    onPaneClick();
  }, [onPaneClick]);

  return (
    <div style={{ height: '100vh', width: '100%', backgroundColor: '#000000' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onNodeClick={onNodeClick}
        onNodeMouseEnter={onNodeMouseEnter}
        onNodeMouseLeave={onNodeMouseLeave}
        onPaneClick={onPaneClickCallback}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        minZoom={0.05}
        maxZoom={1.5}
        fitView={false}
      >
        <Background color="#FFFFFF" gap={16} />
        <Controls />
      </ReactFlow>
    </div>
  );
};

// Memoize the component to prevent unnecessary rerenders
export default React.memo(FlowGraph, (prevProps, nextProps) => {
  // Custom comparison for props
  const areEqual =
    prevProps.parentNode?.id === nextProps.parentNode?.id &&
    prevProps.allNodes.length === nextProps.allNodes.length &&
    prevProps.allNodes.every((node, index) =>
      node.id === nextProps.allNodes[index]?.id &&
      node.parentId === nextProps.allNodes[index]?.id
    ) &&
    prevProps.initialEdges.length === nextProps.initialEdges.length &&
    prevProps.initialEdges.every((edge, index) =>
      edge.id === nextProps.initialEdges[index]?.id
    ) &&
    prevProps.hoveredNodeId === nextProps.hoveredNodeId &&
    prevProps.nodeId === nextProps.nodeId &&
    prevProps.initialTreeNodes === nextProps.initialTreeNodes;

  return areEqual;
});