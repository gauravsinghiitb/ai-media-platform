import React, { useEffect, useRef } from 'react';
import { Handle, Position } from 'reactflow';
import { motion } from 'framer-motion';
import { IoAdd, IoSync } from 'react-icons/io5';

const CustomNode = ({ data }) => {
  console.log(`[Checkpoint] CustomNode Rendered: id=${data.id}`);

  const nodeRef = useRef(null);

  const handleSelect = () => {
    console.log(`[Checkpoint] CustomNode - Node ${data.id} clicked`);
    if (data.onSelect) {
      data.onSelect(data.id);
    }
  };

  const handleContribute = (e) => {
    e.stopPropagation();
    console.log(`[Checkpoint] CustomNode - Contribute clicked for node ${data.id}`);
    if (data.onContribute) {
      data.onContribute(data.id);
    }
  };

  const handleRemix = (e) => {
    e.stopPropagation();
    console.log(`[Checkpoint] CustomNode - Remix clicked for node ${data.id}`);
    if (data.handleRemix) {
      data.handleRemix();
    }
  };

  useEffect(() => {
    const element = nodeRef.current;
    if (element) {
      const { width, height } = element.getBoundingClientRect();
      console.log(`[Checkpoint] CustomNode Dimensions: id=${data.id}, width=${width}px, height=${height}px`);
    }
  }, [data.id]);

  return (
    <motion.div
      ref={nodeRef}
      style={{
        border: data.hovered ? '2px solid #9f86ff' : data.selected ? '2px solid #FFFFFF' : '1px solid #FFFFFF',
        borderRadius: '5px',
        backgroundColor: '#000000',
        color: '#FFFFFF',
        width: 180,
        height: 220,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
      }}
      onClick={handleSelect}
      animate={{
        scale: data.hovered || data.selected ? 1.05 : 1,
      }}
    >
      {/* Profile Picture, Username, and Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '5px', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <img
            src={data.profilePic || 'https://dummyimage.com/30x30/000/fff?text=User'}
            alt="Profile"
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              marginRight: '5px',
            }}
          />
          <span style={{ fontSize: '12px' }}>{data.username || 'unknown'}</span>
        </div>
        <div style={{ display: 'flex', gap: '5px' }}>
          <motion.button
            onClick={handleContribute}
            style={{
              backgroundColor: '#000000', // Black background (remove gray)
              color: '#FFFFFF', // White icon
              border: 'none',
              borderRadius: '50%',
              width: '28px', // Larger button
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title="Contribute"
          >
            <IoAdd size={18} /> {/* Larger icon */}
          </motion.button>
          {data.chatLink && (
            <motion.button
              onClick={handleRemix}
              style={{
                backgroundColor: '#000000', // Black background (remove gray)
                color: '#FFFFFF', // White icon
                border: '1px solid #FFFFFF',
                borderRadius: '50%',
                width: '28px', // Larger button
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title="Remix"
            >
              <IoSync size={18} /> {/* Larger icon */}
            </motion.button>
          )}
        </div>
      </div>

      {/* Media (Image/Video) */}
      <div style={{ flex: 1, padding: '5px' }}>
        {data.imageUrl && (
          /\.(mp4|webm|ogg|mov)(?:\?.*)?$/i.test(data.imageUrl) ? (
            <video
              src={data.imageUrl}
              controls
              style={{
                width: '100%',
                height: '150px',
                objectFit: 'cover',
                borderRadius: '5px',
              }}
              onLoadedMetadata={() => console.log(`[Checkpoint] CustomNode Video Loaded: id=${data.id}`)}
            />
          ) : (
            <img
              src={data.imageUrl}
              alt="Node Media"
              style={{
                width: '100%',
                height: '150px',
                objectFit: 'cover',
                borderRadius: '5px',
              }}
              onLoad={() => console.log(`[Checkpoint] CustomNode Image Loaded: id=${data.id}`)}
            />
          )
        )}
      </div>

      {/* Source and Target Handles */}
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: '#FFFFFF', border: '1px solid #000000' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: '#FFFFFF', border: '1px solid #000000' }}
      />
    </motion.div>
  );
};

export default CustomNode;