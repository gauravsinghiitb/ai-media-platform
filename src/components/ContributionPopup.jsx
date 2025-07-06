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
        top: '12%',
        left: '26%',
        transform: 'translate(-50%, -50%)',
        zIndex: 1000,
        backgroundColor: '#222222',
        color: '#FFFFFF',
        padding: '20px',
        border: '2px solid #FFFFFF',
        borderRadius: '10px',
        width: '650px',
        maxWidth: '90%',
        boxShadow: '0 6px 12px rgba(0,0,0,0.5)',
      }}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3 }}
    >
      {/* Close button */}
      <motion.button
        onClick={onCancel}
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
        <FaTimes size={18} />
      </motion.button>

      {/* Loading spinner */}
      {isUploading && <LoadingSpinner />}

      <h2 style={{ fontSize: '18px', margin: '0 0 15px 0', fontWeight: '600', textAlign: 'center' }}>Contribute to the Post(Node)</h2>
      {(error || localError) && (
        <p style={{ color: '#FF0000', fontSize: '13px', marginBottom: '10px', textAlign: 'center' }}>{error || localError}</p>
      )}
      {contributionMessage && (
        <p style={{ color: '#FFFFFF', fontSize: '13px', marginBottom: '10px', textAlign: 'center', backgroundColor: '#4CAF50', padding: '5px', borderRadius: '5px' }}>{contributionMessage}</p>
      )}
      <form onSubmit={handleSubmit}>
        {/* Custom file upload area */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', fontSize: '14px', marginBottom: '5px', color: '#CCCCCC' }}>
            Upload Media (Image/Video) <span style={{ color: '#FF0000' }}>*</span>
          </label>
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '80px',
              backgroundColor: '#2E2E2E',
              border: '2px dashed #FFFFFF',
              borderRadius: '5px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: isUploading ? 'not-allowed' : 'pointer',
            }}
            onClick={() => !isUploading && document.getElementById('fileInputPopup').click()}
          >
            <FaUpload size={20} style={{ marginRight: '10px', color: '#FFFFFF' }} />
            <span style={{ color: '#FFFFFF', fontSize: '14px' }}>
              {file ? file.name : 'Upload File'}
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
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', fontSize: '14px', marginBottom: '5px', color: '#CCCCCC' }}>
            Prompt (Optional)
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter the prompt used for your contribution"
            style={{
              width: '100%',
              padding: '8px',
              backgroundColor: '#2E2E2E',
              color: '#FFFFFF',
              border: '1px solid #FFFFFF',
              borderRadius: '5px',
              fontSize: '13px',
              resize: 'vertical',
              height: '80px',
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => e.target.style.borderColor = '#CCCCCC'}
            onBlur={(e) => e.target.style.borderColor = '#FFFFFF'}
            disabled={isUploading}
          />
        </div>

        {/* Model input with real-time suggestions */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', fontSize: '14px', marginBottom: '5px', color: '#CCCCCC' }}>
            Model Used (Optional)
          </label>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input
              type="text"
              value={modelInput}
              onChange={(e) => setModelInput(e.target.value)}
              placeholder="Enter model name"
              style={{
                flex: 1,
                padding: '8px',
                backgroundColor: '#2E2E2E',
                color: '#FFFFFF',
                border: '1px solid #FFFFFF',
                borderRadius: '5px',
                fontSize: '13px',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => e.target.style.borderColor = '#CCCCCC'}
              onBlur={(e) => e.target.style.borderColor = '#FFFFFF'}
              disabled={isUploading}
            />
            <div
              style={{
                flex: 1,
                maxHeight: '100px',
                overflowY: 'auto',
                backgroundColor: '#2E2E2E',
                border: '1px solid #FFFFFF',
                borderRadius: '5px',
                padding: '5px',
              }}
            >
              {filteredModels.length > 0 ? (
                filteredModels.map((model) => (
                  <div
                    key={model}
                    onClick={() => !isUploading && setModelInput(model)}
                    style={{
                      padding: '6px',
                      cursor: isUploading ? 'not-allowed' : 'pointer',
                      color: '#FFFFFF',
                      fontSize: '13px',
                      backgroundColor: model === modelInput ? '#4A4A4A' : 'transparent',
                      borderRadius: '3px',
                      transition: 'background-color 0.2s',
                    }}
                    onMouseEnter={(e) => !isUploading && (e.target.style.backgroundColor = model === modelInput ? '#4A4A4A' : '#4A4A4A')}
                    onMouseLeave={(e) => !isUploading && (e.target.style.backgroundColor = model === modelInput ? '#4A4A4A' : 'transparent')}
                  >
                    {model}
                  </div>
                ))
              ) : (
                <div style={{ padding: '6px', color: '#CCCCCC', fontSize: '13px' }}>
                  No matching models
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Chat Link input */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', fontSize: '14px', marginBottom: '5px', color: '#CCCCCC' }}>
            Chat Link (Optional)
          </label>
          <input
            type="url"
            value={chatLink}
            onChange={(e) => setChatLink(e.target.value)}
            placeholder="Enter chat link (e.g., https://chat.example.com)"
            style={{
              width: '100%',
              padding: '8px',
              backgroundColor: '#2E2E2E',
              color: '#FFFFFF',
              border: '1px solid #FFFFFF',
              borderRadius: '5px',
              fontSize: '13px',
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => e.target.style.borderColor = '#CCCCCC'}
            onBlur={(e) => e.target.style.borderColor = '#FFFFFF'}
            disabled={isUploading}
          />
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', alignItems: 'center' }}>
          <motion.button
            type="button"
            onClick={onCancel}
            style={{
              padding: '8px 16px',
              backgroundColor: '#2E2E2E',
              color: '#FFFFFF',
              border: '2px solid #FFFFFF',
              borderRadius: '5px',
              cursor: isUploading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'background-color 0.2s, color 0.2s',
            }}
            whileHover={isUploading ? {} : { backgroundColor: '#FFFFFF', color: '#1C2526' }}
            whileTap={isUploading ? {} : { scale: 0.95 }}
            disabled={isUploading}
          >
            Cancel
          </motion.button>
          <motion.button
            type="submit"
            style={{
              padding: '8px 16px',
              backgroundColor: isUploading ? '#4A4A4A' : '#222222',
              color: '#FFFFFF',
              border: '2px solid #FFFFFF',
              borderRadius: '5px',
              cursor: isUploading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'background-color 0.2s, color 0.2s',
            }}
            whileHover={isUploading ? {} : { backgroundColor: '#FFFFFF', color: '#1C2526' }}
            whileTap={isUploading ? {} : { scale: '0.95' }}
            disabled={isUploading}
          >
            {isUploading ? 'Uploading...' : 'Submit'}
          </motion.button>
        </div>
      </form>
    </motion.div>
  );
};

export default ContributionPopup;