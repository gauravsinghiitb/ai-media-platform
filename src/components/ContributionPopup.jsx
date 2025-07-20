import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaUpload, FaTimes } from 'react-icons/fa';
import LoadingSpinner from './LoadingSpinner';
import { models } from '../data/models';

// Main component for the contribution popup
const ContributionPopup = ({ onSubmit, onCancel, error, contributionMessage, isUploading }) => {
  const [file, setFile] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [modelInput, setModelInput] = useState('');
  const [chatLink, setChatLink] = useState('');
  const [localError, setLocalError] = useState('');

  // List of available models for suggestions
  // const models = [
  //   "Midjourney v6.1", "Midjourney",
  //   "DALL·E v3", "DALL·E",
  //   "Stable Diffusion v3.5", "Stable Diffusion",
  //   "Recraft V3", "Recraft",
  //   "FLUX1.1 [pro]", "FLUX",
  //   "Imagen v2 (Google DeepMind)", "Imagen",
  //   "Adobe Firefly",
  //   "Magic Image (Canva)", "Magic Image",
  //   "Ideogram",
  //   "GPT-4o (Chatgpt OpenAI)",
  //   "Stable Diffusion XL v1.0", "Stable Diffusion XL",
  //   "Phoenix (Leonardo AI)",
  //   "Emu (Meta)",
  //   "Midjourney v7 Alpha",
  //   "Niji v6 (Midjourney)", "Niji",
  //   "Sora (OpenAI)",
  //   "Runway ML Gen Model v3 Alpha", "Runway ML Gen Model",
  //   "Kling AI 2.0 (Kuaishou Technology)", "Kling AI",
  //   "Hailuo AI (MiniMax)", "Hailuo AI",
  //   "Pika (Pika Labs)", "Pika",
  //   "Veo v2 (Google DeepMind)", "Veo",
  //   "Dream Machine (Luma Labs)", "Dream Machine",
  //   "Synthesia",
  //   "Adobe Firefly Video",
  //   "VideoPoet (Google)", "VideoPoet",
  //   "Midjourney v5.2",
  //   "Midjourney v5.1",
  //   "Midjourney v5",
  //   "Midjourney v4",
  //   "Midjourney v3",
  //   "Midjourney v2",
  //   "Midjourney v1",
  //   "Stable Diffusion v2.1",
  //   "Stable Diffusion v2.0",
  //   "Stable Diffusion v1.5",
  //   "Stable Diffusion v1.4",
  //   "Stable Diffusion v1.3",
  //   "Stable Diffusion v1.2",
  //   "Stable Diffusion v1.1",
  //   "Stable Diffusion XL Turbo",
  //   "DALL·E v2",
  //   "DALL·E v1",
  //   "Seedream 3.0 (ByteDance)", "Seedream",
  //   "HiDream-I1-Dev (HiDream)", "HiDream",
  //   "FLUX.1 [dev]",
  //   "DreamFusion (Google)", "DreamFusion",
  //   "Grok (xAI)", "Grok",
  //   "Gemini",
  //   "Vision (ChatGPT)",
  //   "Runway ML Gen Model v4",
  //   "Runway ML Gen Model v3 Turbo",
  //   "Runway ML Gen Model v2",
  //   "Runway ML Gen Model v1",
  //   "Kaiber v2", "Kaiber",
  //   "Kaiber v1",
  //   "Hunyuan Video (Tencent)",
  //   "VideoCrafter1 (Tencent)", "VideoCrafter",
  //   "Veo v3 (Google DeepMind)",
  //   "DeepBrain AI",
  //   "Rephrase.ai",
  //   "LTX Studio (Lightricks)",
  //   "Colossyan",
  //   "Wan 2.1 (Alibaba)", "Wan",
  //   "Hunyuan-Video-Fast (WaveSpeed AI)", "Hunyuan-Video",
  //   "Step-Video (WaveSpeed AI)", "Step-Video",
  //   "Mochi 1 (Genmo AI)", "Mochi",
  //   "Niji v5 (Midjourney)",
  //   "Niji (Midjourney)",
  //   "beta (Midjourney)",
  //   "test (Midjourney)",
  //   "testp (Midjourney)"
  // ];

  // Filter models based on user input for real-time suggestions
  const filteredModels = models.filter((model) =>
    model.toLowerCase().includes(modelInput.toLowerCase())
  );

  // Validate user inputs before submission
  const validateInputs = () => {
    if (!file) {
      setLocalError('Please upload a media file (image or video).');
      return false;
    }
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > 20) {
      setLocalError('File size exceeds 20MB limit.');
      return false;
    }
    const acceptedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/webm', 'video/ogg', 'video/mov'];
    if (!acceptedTypes.includes(file.type)) {
      setLocalError('Unsupported file type. Please upload an image (JPEG, PNG, GIF) or video (MP4, WebM, OGG, MOV).');
      return false;
    }
    if (chatLink && !/^https?:\/\/[^\s]+$/i.test(chatLink)) {
      setLocalError('Please enter a valid URL for the chat link, or leave it empty.');
      return false;
    }
    setLocalError('');
    return true;
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateInputs()) return;
    const submissionData = {
      file,
      prompt: prompt.trim() || null,
      model: modelInput.trim() || null,
      chatLink: chatLink.trim() || null,
      createdAt: new Date().toISOString(),
    };
    onSubmit(e, submissionData);
  };

  return (
    <motion.div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(8px)',
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onCancel}
    >
      <motion.div
        style={{
          backgroundColor: '#0F0F0F',
          color: '#FFFFFF',
          padding: '30px',
          border: '2px solid #333333',
          borderRadius: '20px',
          width: '90%',
          maxWidth: '600px',
          maxHeight: '85vh',
          overflowY: 'auto',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
          position: 'relative',
        }}
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        transition={{ duration: 0.3 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <motion.button
          onClick={onCancel}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid #333333',
            color: '#FFFFFF',
            cursor: 'pointer',
            width: '35px',
            height: '35px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            transition: 'all 0.2s',
          }}
          whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', borderColor: '#FFFFFF' }}
          whileTap={{ scale: 0.9 }}
        >
          <FaTimes size={18} />
        </motion.button>

        {/* Loading spinner */}
        {isUploading && <LoadingSpinner />}

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h2 style={{ 
            fontSize: '28px', 
            margin: '0 0 12px 0', 
            fontWeight: '700',
            background: 'linear-gradient(45deg, #FFFFFF, #CCCCCC)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            ✨ Add Contribution
          </h2>
          <p style={{ color: '#AAAAAA', fontSize: '16px', margin: 0, lineHeight: '1.5' }}>
            Share your creative work and inspire others
          </p>
        </div>
              {(error || localError) && (
          <div style={{ 
            backgroundColor: 'rgba(255, 0, 0, 0.1)', 
            border: '1px solid #FF4444', 
            borderRadius: '10px', 
            padding: '12px', 
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            <p style={{ color: '#FF4444', fontSize: '14px', margin: 0 }}>{error || localError}</p>
          </div>
        )}
        {contributionMessage && (
          <div style={{ 
            backgroundColor: 'rgba(76, 175, 80, 0.1)', 
            border: '1px solid #4CAF50', 
            borderRadius: '10px', 
            padding: '12px', 
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            <p style={{ color: '#4CAF50', fontSize: '14px', margin: 0 }}>{contributionMessage}</p>
          </div>
        )}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Custom file upload area */}
        <div>
          <label style={{ display: 'block', fontSize: '16px', marginBottom: '10px', color: '#FFFFFF', fontWeight: '600' }}>
            📁 Upload Media <span style={{ color: '#FF4444' }}>*</span>
          </label>
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '120px',
              backgroundColor: '#1A1A1A',
              border: '2px dashed #444444',
              borderRadius: '15px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: isUploading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => !isUploading && (e.target.style.borderColor = '#666666', e.target.style.backgroundColor = '#222222')}
            onMouseLeave={(e) => !isUploading && (e.target.style.borderColor = '#444444', e.target.style.backgroundColor = '#1A1A1A')}
            onClick={() => !isUploading && document.getElementById('fileInputPopup').click()}
          >
            <FaUpload size={24} style={{ marginBottom: '8px', color: '#666666' }} />
            <span style={{ color: '#AAAAAA', fontSize: '16px', textAlign: 'center' }}>
              {file ? file.name : 'Click to upload image or video'}
            </span>
            <input
              id="fileInputPopup"
              type="file"
              accept="image/jpeg,image/png,image/gif,video/mp4,video/webm,video/ogg,video/mov"
              onChange={(e) => setFile(e.target.files[0])}
              style={{ display: 'none' }}
              disabled={isUploading}
            />
          </div>
        </div>

        {/* Prompt input */}
        <div>
          <label style={{ display: 'block', fontSize: '16px', marginBottom: '10px', color: '#FFFFFF', fontWeight: '600' }}>
            ✍️ Prompt (Optional)
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter the prompt used for your contribution..."
            style={{
              width: '100%',
              padding: '15px',
              backgroundColor: '#1A1A1A',
              color: '#FFFFFF',
              border: '2px solid #333333',
              borderRadius: '12px',
              fontSize: '14px',
              resize: 'vertical',
              height: '100px',
              transition: 'all 0.3s ease',
              outline: 'none',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#666666';
              e.target.style.backgroundColor = '#222222';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#333333';
              e.target.style.backgroundColor = '#1A1A1A';
            }}
            disabled={isUploading}
          />
        </div>

        {/* Model input with real-time suggestions */}
        <div>
          <label style={{ display: 'block', fontSize: '16px', marginBottom: '10px', color: '#FFFFFF', fontWeight: '600' }}>
            🤖 Model Used (Optional)
          </label>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
            <input
              type="text"
              value={modelInput}
              onChange={(e) => setModelInput(e.target.value)}
              placeholder="Enter model name..."
              style={{
                flex: 1,
                padding: '15px',
                backgroundColor: '#1A1A1A',
                color: '#FFFFFF',
                border: '2px solid #333333',
                borderRadius: '12px',
                fontSize: '14px',
                transition: 'all 0.3s ease',
                outline: 'none',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#666666';
                e.target.style.backgroundColor = '#222222';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#333333';
                e.target.style.backgroundColor = '#1A1A1A';
              }}
              disabled={isUploading}
            />
            <div
              style={{
                flex: 1,
                maxHeight: '150px',
                overflowY: 'auto',
                backgroundColor: '#1A1A1A',
                border: '2px solid #333333',
                borderRadius: '12px',
                padding: '10px',
              }}
            >
              {filteredModels.length > 0 ? (
                filteredModels.slice(0, 8).map((model) => (
                  <div
                    key={model}
                    onClick={() => !isUploading && setModelInput(model)}
                    style={{
                      padding: '10px',
                      cursor: isUploading ? 'not-allowed' : 'pointer',
                      color: '#FFFFFF',
                      fontSize: '14px',
                      backgroundColor: model === modelInput ? '#333333' : 'transparent',
                      borderRadius: '8px',
                      transition: 'all 0.2s ease',
                      marginBottom: '2px',
                    }}
                    onMouseEnter={(e) => {
                      if (!isUploading) {
                        e.target.style.backgroundColor = model === modelInput ? '#444444' : '#222222';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isUploading) {
                        e.target.style.backgroundColor = model === modelInput ? '#333333' : 'transparent';
                      }
                    }}
                  >
                    {model}
                  </div>
                ))
              ) : (
                <div style={{ padding: '10px', color: '#666666', fontSize: '14px', textAlign: 'center' }}>
                  No matching models found
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Chat Link input */}
        <div>
          <label style={{ display: 'block', fontSize: '16px', marginBottom: '10px', color: '#FFFFFF', fontWeight: '600' }}>
            🔗 Chat Link (Optional)
          </label>
          <input
            type="url"
            value={chatLink}
            onChange={(e) => setChatLink(e.target.value)}
            placeholder="Enter chat link (e.g., https://chat.example.com)"
            style={{
              width: '100%',
              padding: '15px',
              backgroundColor: '#1A1A1A',
              color: '#FFFFFF',
              border: '2px solid #333333',
              borderRadius: '12px',
              fontSize: '14px',
              transition: 'all 0.3s ease',
              outline: 'none',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#666666';
              e.target.style.backgroundColor = '#222222';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#333333';
              e.target.style.backgroundColor = '#1A1A1A';
            }}
            disabled={isUploading}
          />
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', alignItems: 'center', marginTop: '10px' }}>
          <motion.button
            type="button"
            onClick={onCancel}
            style={{
              padding: '15px 30px',
              backgroundColor: 'transparent',
              color: '#FFFFFF',
              border: '2px solid #444444',
              borderRadius: '12px',
              cursor: isUploading ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: '600',
              transition: 'all 0.3s ease',
              minWidth: '120px',
            }}
            whileHover={isUploading ? {} : { 
              backgroundColor: '#222222', 
              borderColor: '#666666',
              scale: 1.05
            }}
            whileTap={isUploading ? {} : { scale: 0.95 }}
            disabled={isUploading}
          >
            Cancel
          </motion.button>
          <motion.button
            type="submit"
            style={{
              padding: '15px 30px',
              backgroundColor: isUploading ? '#444444' : '#FFFFFF',
              color: isUploading ? '#AAAAAA' : '#000000',
              border: '2px solid #FFFFFF',
              borderRadius: '12px',
              cursor: isUploading ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: '600',
              transition: 'all 0.3s ease',
              minWidth: '120px',
            }}
            whileHover={isUploading ? {} : { 
              backgroundColor: '#CCCCCC',
              scale: 1.05
            }}
            whileTap={isUploading ? {} : { scale: 0.95 }}
            disabled={isUploading}
          >
            {isUploading ? '⏳ Uploading...' : '🚀 Submit'}
          </motion.button>
        </div>
      </form>
        </motion.div>
      </motion.div>
    );
  };

  export default ContributionPopup;