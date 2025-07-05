import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase/firebase';
import { motion } from 'framer-motion';
import LoadingSpinner from './LoadingSpinner';

const ContributeForm = ({ user, parentNodeId, postId, onSubmit }) => {
  const [prompt, setPrompt] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [modelInput, setModelInput] = useState('');
  const [chatLink, setChatLink] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const models = [
    "Midjourney v6.1", "Midjourney",
    "DALL·E v3", "DALL·E",
    "Stable Diffusion v3.5", "Stable Diffusion",
    "Recraft V3", "Recraft",
    "FLUX1.1 [pro]", "FLUX",
    "Imagen v2 (Google DeepMind)", "Imagen",
    "Adobe Firefly",
    "Magic Image (Canva)", "Magic Image",
    "Ideogram",
    "GPT-4o (Chatgpt OpenAI)",
    "Stable Diffusion XL v1.0", "Stable Diffusion XL",
    "Phoenix (Leonardo AI)",
    "Emu (Meta)",
    "Midjourney v7 Alpha",
    "Niji v6 (Midjourney)", "Niji",
    "Sora (OpenAI)",
    "Runway ML Gen Model v3 Alpha", "Runway ML Gen Model",
    "Kling AI 2.0 (Kuaishou Technology)", "Kling AI",
    "Hailuo AI (MiniMax)", "Hailuo AI",
    "Pika (Pika Labs)", "Pika",
    "Veo v2 (Google DeepMind)", "Veo",
    "Dream Machine (Luma Labs)", "Dream Machine",
    "Synthesia",
    "Adobe Firefly Video",
    "VideoPoet (Google)", "VideoPoet",
    "Midjourney v5.2",
    "Midjourney v5.1",
    "Midjourney v5",
    "Midjourney v4",
    "Midjourney v3",
    "Midjourney v2",
    "Midjourney v1",
    "Stable Diffusion v2.1",
    "Stable Diffusion v2.0",
    "Stable Diffusion v1.5",
    "Stable Diffusion v1.4",
    "Stable Diffusion v1.3",
    "Stable Diffusion v1.2",
    "Stable Diffusion v1.1",
    "Stable Diffusion XL Turbo",
    "DALL·E v2",
    "DALL·E v1",
    "Seedream 3.0 (ByteDance)", "Seedream",
    "HiDream-I1-Dev (HiDream)", "HiDream",
    "FLUX.1 [dev]",
    "DreamFusion (Google)", "DreamFusion",
    "Grok (xAI)", "Grok",
    "Gemini",
    "Vision (ChatGPT)",
    "Runway ML Gen Model v4",
    "Runway ML Gen Model v3 Turbo",
    "Runway ML Gen Model v2",
    "Runway ML Gen Model v1",
    "Kaiber v2", "Kaiber",
    "Kaiber v1",
    "Hunyuan Video (Tencent)",
    "VideoCrafter1 (Tencent)", "VideoCrafter",
    "Veo v3 (Google DeepMind)",
    "DeepBrain AI",
    "Rephrase.ai",
    "LTX Studio (Lightricks)",
    "Colossyan",
    "Wan 2.1 (Alibaba)", "Wan",
    "Hunyuan-Video-Fast (WaveSpeed AI)", "Hunyuan-Video",
    "Step-Video (WaveSpeed AI)", "Step-Video",
    "Mochi 1 (Genmo AI)", "Mochi",
    "Niji v5 (Midjourney)",
    "Niji (Midjourney)",
    "beta (Midjourney)",
    "test (Midjourney)",
    "testp (Midjourney)"
  ];

  const filteredModels = models.filter((model) =>
    model.toLowerCase().includes(modelInput.toLowerCase())
  );

  const validateInputs = () => {
    if (!user) {
      setError('You must be logged in to contribute.');
      return false;
    }
    if (!imageFile) {
      setError('Please upload a media file (image or video).');
      return false;
    }
    const fileSizeMB = imageFile.size / (1024 * 1024);
    if (fileSizeMB > 20) {
      setError('File size exceeds 20MB limit.');
      return false;
    }
    const acceptedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/webm', 'video/ogg', 'video/mov'];
    if (!acceptedTypes.includes(imageFile.type)) {
      setError('Unsupported file type. Please upload an image (JPEG, PNG, GIF) or video (MP4, WebM, OGG, MOV).');
      return false;
    }
    if (chatLink && !/^https?:\/\/[^\s]+$/i.test(chatLink)) {
      setError('Please enter a valid URL for the chat link, or leave it empty.');
      return false;
    }
    setError(null);
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateInputs()) return;

    setLoading(true);
    setSuccessMessage('');

    try {
      const storagePath = `contributions/${user.uid}/${postId}/${Date.now()}_${imageFile.name}`;
      const storageRef = ref(storage, storagePath);
      await uploadBytes(storageRef, imageFile);
      const imageUrl = await getDownloadURL(storageRef);

      const contributionRef = collection(db, `contributions/${user.uid}/${postId}`);
      await addDoc(contributionRef, {
        nodes: [{
          id: Date.now().toString(),
          imageUrl,
          ...(prompt.trim() && { prompt: prompt.trim() }),
          ...(modelInput.trim() && { model: modelInput.trim() }),
          parentId: parentNodeId,
          userId: user.uid,
          username: user.displayName || 'Anonymous',
          profilePic: user.photoURL || 'https://dummyimage.com/30x30/000/fff?text=User',
          createdAt: new Date().toISOString(),
          upvotesCount: 0,
          downvotesCount: 0,
          userUpvotes: [],
          userDownvotes: [],
          comments: [],
          ...(chatLink.trim() && { chatLink: chatLink.trim() }),
        }],
        edges: [],
      });
      

      setPrompt('');
      setImageFile(null);
      setModelInput('');
      setChatLink('');
      setSuccessMessage('Thanks for the contribution!');
      setTimeout(() => setSuccessMessage(''), 3000);
      onSubmit();
    } catch (err) {
      console.error('Error submitting contribution:', err);
      setError('Failed to submit contribution.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 1000,
        backgroundColor: '#000000',
        color: '#FFFFFF',
        padding: '20px',
        border: '2px solid #FFFFFF',
        borderRadius: '10px',
        width: '450px',
        maxWidth: '90%',
        boxShadow: '0 6px 12px rgba(0,0,0,0.5)',
      }}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {loading && <LoadingSpinner />}
      <h2 style={{ fontSize: '18px', margin: '0 0 15px 0', fontWeight: '600', textAlign: 'center' }}>Contribute</h2>
      {error && (
        <p style={{ color: '#FF0000', fontSize: '13px', marginBottom: '10px', textAlign: 'center' }}>{error}</p>
      )}
      {successMessage && (
        <p style={{ color: '#00FF00', fontSize: '13px', marginBottom: '10px', textAlign: 'center' }}>{successMessage}</p>
      )}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', fontSize: '14px', marginBottom: '5px' }}>
            Upload Media (Image/Video) <span style={{ color: '#FF0000' }}>*</span>
          </label>
          <input
            type="file"
            accept="image/jpeg,image/png,image/gif,video/mp4,video/webm,video/ogg,video/mov"
            onChange={(e) => setImageFile(e.target.files[0])}
            style={{
              width: '100%',
              padding: '8px',
              backgroundColor: '#000000',
              color: '#FFFFFF',
              border: '1px solid #FFFFFF',
              borderRadius: '5px',
              fontSize: '13px',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
            disabled={loading}
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', fontSize: '14px', marginBottom: '5px' }}>
            Prompt (Optional)
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter the prompt used for your contribution"
            style={{
              width: '100%',
              padding: '8px',
              backgroundColor: '#000000',
              color: '#FFFFFF',
              border: '1px solid #FFFFFF',
              borderRadius: '5px',
              fontSize: '13px',
              resize: 'vertical',
              height: '80px',
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => e.target.style.borderColor = '#FFFFFF'}
            onBlur={(e) => e.target.style.borderColor = '#FFFFFF'}
            disabled={loading}
          />
        </div>
        <div style={{ marginBottom: '15px', display: 'flex', gap: '10px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '14px', marginBottom: '5px' }}>
              Model Used (Optional)
            </label>
            <input
              type="text"
              value={modelInput}
              onChange={(e) => setModelInput(e.target.value)}
              placeholder="Enter model name"
              style={{
                width: '100%',
                padding: '8px',
                backgroundColor: '#000000',
                color: '#FFFFFF',
                border: '1px solid #FFFFFF',
                borderRadius: '5px',
                fontSize: '13px',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => e.target.style.borderColor = '#FFFFFF'}
              onBlur={(e) => e.target.style.borderColor = '#FFFFFF'}
              disabled={loading}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '14px', marginBottom: '5px' }}>
              Model Suggestions
            </label>
            <div
              style={{
                maxHeight: '100px',
                overflowY: 'auto',
                backgroundColor: '#000000',
                border: '1px solid #FFFFFF',
                borderRadius: '5px',
                padding: '5px',
              }}
            >
              {filteredModels.length > 0 ? (
                filteredModels.map((model) => (
                  <div
                    key={model}
                    onClick={() => !loading && setModelInput(model)}
                    style={{
                      padding: '6px',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      color: '#FFFFFF',
                      fontSize: '13px',
                      backgroundColor: model === modelInput ? '#FFFFFF' : 'transparent',
                      color: model === modelInput ? '#000000' : '#FFFFFF',
                      borderRadius: '3px',
                      transition: 'background-color 0.2s, color 0.2s',
                    }}
                    onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = model === modelInput ? '#FFFFFF' : '#FFFFFF', e.target.style.color = model === modelInput ? '#000000' : '#000000')}
                    onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = model === modelInput ? '#FFFFFF' : 'transparent', e.target.style.color = model === modelInput ? '#000000' : '#FFFFFF')}
                  >
                    {model}
                  </div>
                ))
              ) : (
                <div style={{ padding: '6px', color: '#FFFFFF', fontSize: '13px' }}>
                  No matching models
                </div>
              )}
            </div>
          </div>
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', fontSize: '14px', marginBottom: '5px' }}>
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
              backgroundColor: '#000000',
              color: '#FFFFFF',
              border: '1px solid #FFFFFF',
              borderRadius: '5px',
              fontSize: '13px',
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => e.target.style.borderColor = '#FFFFFF'}
            onBlur={(e) => e.target.style.borderColor = '#FFFFFF'}
            disabled={loading}
          />
        </div>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', alignItems: 'center' }}>
          <motion.button
            type="submit"
            style={{
              padding: '8px 16px',
              backgroundColor: loading ? '#FFFFFF' : '#000000',
              color: loading ? '#000000' : '#FFFFFF',
              border: '2px solid #FFFFFF',
              borderRadius: '5px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'background-color 0.2s, color 0.2s',
            }}
            whileHover={loading ? {} : { backgroundColor: '#FFFFFF', color: '#000000' }}
            whileTap={loading ? {} : { scale: 0.95 }}
            disabled={loading}
          >
            {loading ? 'Submitting...' : 'Submit Contribution'}
          </motion.button>
        </div>
      </form>
      <style>
        {`
          input[type="file"]::-webkit-file-upload-button {
            background-color: #000000;
            color: #FFFFFF;
            border: 1px solid #FFFFFF;
            border-radius: 5px;
            padding: 4px 8px;
            cursor: pointer;
            transition: background-color 0.2s, color 0.2s;
            font-size: 13px;
          }
          input[type="file"]::-webkit-file-upload-button:hover {
            background-color: #FFFFFF;
            color: #000000;
          }
        `}
      </style>
    </motion.div>
  );
};

export default ContributeForm;