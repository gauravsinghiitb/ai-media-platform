import React from 'react';
import { getBezierPath } from 'reactflow';

const FlowingEdge = (props) => {
  const {
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    data = {}, // Default to empty object if data is undefined
  } = props;

  const { isLeafEdge = false } = data; // Default to false if isLeafEdge is undefined

  const edgePath = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const dashArray = isLeafEdge ? '5,5' : '0';

  return (
    <g>
      <path
        fill="none"
        stroke="#FFFFFF"
        strokeWidth={2}
        d={edgePath}
        strokeDasharray={dashArray}
      />
      <path
        fill="none"
        stroke="transparent"
        strokeWidth={10}
        d={edgePath}
        strokeDasharray={dashArray}
      />
    </g>
  );
};

export default FlowingEdge;