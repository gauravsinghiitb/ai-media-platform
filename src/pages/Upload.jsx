import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { db, storage, auth } from '../firebase/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc, collection, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import LoadingSpinner from '../components/LoadingSpinner';
import { FiUpload, FiArrowLeft, FiChevronDown } from 'react-icons/fi';
import { LazyImage } from '../components/LazyLoad';
import UploadProgressPopup from '../components/UploadProgressPopup';
import UploadStatusBar from '../components/UploadStatusBar';

const Upload = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [step, setStep] = useState(1);
  const [aiGeneratedFile, setAiGeneratedFile] = useState(null);
  const [originalFile, setOriginalFile] = useState(null);
  const [modelUsed, setModelUsed] = useState('');
  const [promptUsed, setPromptUsed] = useState('');
  const [chatLink, setChatLink] = useState('');
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mentionQuery, setMentionQuery] = useState('');
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [modelQuery, setModelQuery] = useState('');
  const [showModelSuggestions, setShowModelSuggestions] = useState(false);
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [isDraggingAI, setIsDraggingAI] = useState(false);
  const [isDraggingOriginal, setIsDraggingOriginal] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [showProgressPopup, setShowProgressPopup] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState(0);
  const [showStatusBar, setShowStatusBar] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('uploading');

  const aiGeneratedInputRef = useRef(null);
  const originalInputRef = useRef(null);
  const captionTextareaRef = useRef(null);
  const promptTextareaRef = useRef(null);
  const modelInputRef = useRef(null);

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

  const mockUsers = [
    { username: 'gaurav1', displayName: 'Gaurav' },
    { username: 'gaurav', displayName: 'Gaurav' },
    { username: 'bobsmith', displayName: 'Bob Smith' },
    { username: 'charlie', displayName: 'Charlie' },
    { username: 'diana1', displayName: 'Diana' }
  ];

  const aspectRatios = [
    { label: '1:1 (Square)', value: '1:1' },
    { label: '16:9 (Landscape)', value: '16:9' },
    { label: '9:16 (Vertical)', value: '9:16' },
    { label: '4:3', value: '4:3' },
    { label: '3:4', value: '3:4' },
    { label: '4:5', value: '4:5' },
    { label: '2:3', value: '2:3' }
  ];

  const profanityList = [
    'damn',
    'hell',
    'ass',
    'bitch',
    'shit',
    'fuck',
    'bastard',
    'cunt',
    'dick',
    'piss'
  ];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        navigate('/login');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const filterProfanity = (text) => {
    let filteredText = text;
    profanityList.forEach((word) => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      filteredText = filteredText.replace(regex, '****');
    });
    return filteredText;
  };

  const handleNext = () => {
    if (step === 1) {
      if (!aiGeneratedFile) {
        setError('AI-generated file is required.');
        return;
      }
    }
    setError(null);
    setStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setError(null);
    setMentionQuery('');
    setShowMentionSuggestions(false);
    setModelQuery('');
    setShowModelSuggestions(false);
    setStep((prev) => prev - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      setError('You must be logged in to upload.');
      return;
    }
    if (!aiGeneratedFile) {
      setError('AI-generated file is required.');
      return;
    }

    setError(null);

    // Store upload data in localStorage for progress tracking
    const uploadData = {
      postId: Date.now().toString(),
      aiGeneratedFile: aiGeneratedFile.name,
      originalFile: originalFile ? originalFile.name : null,
      modelUsed,
      promptUsed,
      chatLink,
      caption,
      userId: user.uid,
      username: user.displayName || 'gaurav1',
      profilePic: user.photoURL || 'https://dummyimage.com/30x30/000/fff?text=User',
      status: 'uploading',
      progress: 0,
      startTime: Date.now()
    };
    
    localStorage.setItem('currentUpload', JSON.stringify(uploadData));

    // Navigate to profile page immediately
    navigate(`/profile/${user.uid}`, { 
      state: { 
        showUploadProgress: true,
        uploadData: uploadData
      } 
    });

    // Start upload in background
    const uploadPost = async () => {
      try {
        const postId = uploadData.postId;
        
        // Update progress to 10%
        uploadData.progress = 10;
        localStorage.setItem('currentUpload', JSON.stringify(uploadData));

        // Upload AI-generated file
        const aiGeneratedRef = ref(storage, `posts/${user.uid}/${postId}/ai-generated/${aiGeneratedFile.name}`);
        await uploadBytes(aiGeneratedRef, aiGeneratedFile);
        const aiGeneratedUrl = await getDownloadURL(aiGeneratedRef);
        
        // Update progress to 50%
        uploadData.progress = 50;
        localStorage.setItem('currentUpload', JSON.stringify(uploadData));

        // Upload original file if provided
        let originalUrl = '';
        if (originalFile) {
          const originalRef = ref(storage, `posts/${user.uid}/${postId}/original/${originalFile.name}`);
          await uploadBytes(originalRef, originalFile);
          originalUrl = await getDownloadURL(originalRef);
          
          // Update progress to 80%
          uploadData.progress = 80;
          localStorage.setItem('currentUpload', JSON.stringify(uploadData));
        }

        // Create post document in the 'posts' collection
        const postRef = doc(db, 'posts', postId);
        const post = {
          aiGeneratedUrl,
          originalUrl: originalUrl || '',
          modelUsed,
          promptUsed,
          chatLink,
          caption,
          createdAt: serverTimestamp(),
          userId: user.uid,
          username: user.displayName || 'gaurav1',
          profilePic: user.photoURL || 'https://dummyimage.com/30x30/000/fff?text=User',
          upvotes: 0,
          downvotes: 0,
          upvotedBy: [],
          downvotedBy: [],
          comments: [],
        };

        await setDoc(postRef, post);
        
        // Update progress to 100% and mark as completed
        uploadData.progress = 100;
        uploadData.status = 'completed';
        localStorage.setItem('currentUpload', JSON.stringify(uploadData));

        // Remove upload data after 5 seconds
        setTimeout(() => {
          localStorage.removeItem('currentUpload');
        }, 5000);

      } catch (err) {
        console.error('Failed to upload post:', err);
        uploadData.status = 'error';
        uploadData.error = err.message;
        localStorage.setItem('currentUpload', JSON.stringify(uploadData));
      }
    };

    // Start upload in background
    uploadPost();
  };

  const handleCaptionChange = (e) => {
    const value = e.target.value;
    const filteredValue = filterProfanity(value);
    setCaption(filteredValue);

    const lastWord = filteredValue.split(/[\s\n]/).pop();
    if (lastWord.startsWith('@') && lastWord.length > 1) {
      setMentionQuery(lastWord.slice(1).toLowerCase());
      setShowMentionSuggestions(true);
    } else {
      setMentionQuery('');
      setShowMentionSuggestions(false);
    }

    const textarea = captionTextareaRef.current;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  };

  const handlePromptChange = (e) => {
    const value = e.target.value;
    const filteredValue = filterProfanity(value);
    setPromptUsed(filteredValue);

    const textarea = promptTextareaRef.current;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  };

  const handleModelChange = (e) => {
    const value = e.target.value;
    setModelUsed(value);
    setModelQuery(value.toLowerCase());
    setShowModelSuggestions(value.length > 0);
  };

  const handleModelSelect = (model) => {
    setModelUsed(model);
    setModelQuery('');
    setShowModelSuggestions(false);
  };

  const handleModelDropdownSelect = (model) => {
    setModelUsed(model);
    setShowModelDropdown(false);
  };

  const handleMentionSelect = (username) => {
    const words = caption.split(/[\s\n]/);
    words.pop();
    const newCaption = [...words, `@${username}`].join(' ') + ' ';
    setCaption(newCaption);
    setMentionQuery('');
    setShowMentionSuggestions(false);

    const textarea = captionTextareaRef.current;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  };

  const renderCaptionWithMentionsAndHashtags = (text) => {
    const parts = text.split(/([@#]\w+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('@') || part.startsWith('#')) {
        return (
          <span key={index} style={{ fontWeight: '600', color: '#BBBBBB' }}>
            {part}
          </span>
        );
      }
      return part;
    });
  };

  const getAspectRatioStyle = (ratio) => {
    switch (ratio) {
      case '1:1':
        return { aspectRatio: '1 / 1', width: '100%', maxHeight: '300px' };
      case '16:9':
        return { aspectRatio: '16 / 9', width: '100%', maxHeight: '300px' };
      case '9:16':
        return { aspectRatio: '9 / 16', width: '60%', maxHeight: '400px' };
      case '4:3':
        return { aspectRatio: '4 / 3', width: '100%', maxHeight: '300px' };
      case '3:4':
        return { aspectRatio: '3 / 4', width: '80%', maxHeight: '350px' };
      case '4:5':
        return { aspectRatio: '4 / 5', width: '80%', maxHeight: '375px' };
      case '2:3':
        return { aspectRatio: '2 / 3', width: '70%', maxHeight: '400px' };
      default:
        return { aspectRatio: '1 / 1', width: '100%', maxHeight: '300px' };
    }
  };

  const getSmallAspectRatioStyle = (ratio) => {
    switch (ratio) {
      case '1:1':
        return { aspectRatio: '1 / 1', width: '100%', maxHeight: '150px' };
      case '16:9':
        return { aspectRatio: '16 / 9', width: '100%', maxHeight: '150px' };
      case '9:16':
        return { aspectRatio: '9 / 16', width: '50%', maxHeight: '200px' };
      case '4:3':
        return { aspectRatio: '4 / 3', width: '100%', maxHeight: '150px' };
      case '3:4':
        return { aspectRatio: '3 / 4', width: '70%', maxHeight: '175px' };
      case '4:5':
        return { aspectRatio: '4 / 5', width: '70%', maxHeight: '187px' };
      case '2:3':
        return { aspectRatio: '2 / 3', width: '60%', maxHeight: '200px' };
      default:
        return { aspectRatio: '1 / 1', width: '100%', maxHeight: '150px' };
    }
  };

  const handleDragOver = (e, setIsDragging) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e, setIsDragging) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e, setFile) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && (file.type.startsWith('image/') || file.type.startsWith('video/'))) {
      setFile(file);
    }
    setIsDraggingAI(false);
    setIsDraggingOriginal(false);
  };

  const handleCardClick = (inputRef) => {
    inputRef.current.click();
  };

  if (!user) return <LoadingSpinner />;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#000000', padding: '4rem 1rem' }}>
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        style={{
          maxWidth: '80rem',
          margin: '0 auto'
        }}
      >
        {error && (
          <p style={{ color: '#FF4040', textAlign: 'center', marginBottom: '1rem', fontSize: '1.2rem' }}>
            {error}
          </p>
        )}

        {loading ? (
          <LoadingSpinner />
        ) : (
          <div style={{
            maxWidth: '960px',
            margin: '0 auto'
          }}>
            {/* Step 1: Upload (Left: Files as Cards, Right: Inputs) */}
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="luminous-border"
                style={{
                  backgroundColor: '#000000',
                  padding: '2rem',
                  borderRadius: '8px',
                  border: '2px solid transparent',
                  borderImage: 'linear-gradient(45deg, #ff0000, #0000ff, #ff00ff, #00ff00, rgb(223, 79, 6)) 1',
                  animation: 'rotateBorder 5s linear infinite',
                  display: 'flex',
                  gap: '2rem'
                }}
              >
                {/* Left Side: File Uploads as Cards */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div
                    onDragOver={(e) => handleDragOver(e, setIsDraggingAI)}
                    onDragLeave={(e) => handleDragLeave(e, setIsDraggingAI)}
                    onDrop={(e) => handleDrop(e, setAiGeneratedFile)}
                    onClick={() => handleCardClick(aiGeneratedInputRef)}
                    style={{
                      backgroundColor: '#111111',
                      borderRadius: '8px',
                      border: isDraggingAI ? '2px dashed #00FF00' : '1px solid #FFFFFF',
                      padding: '1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      transition: 'border 0.3s',
                      cursor: 'pointer'
                    }}
                  >
                    <p style={{ color: '#FFFFFF', fontWeight: '600', marginBottom: '0.5rem' }}>
                      AI-Generated Photo/Video (Required)
                    </p>
                    {aiGeneratedFile ? (
                      <div style={{
                        width: '100%',
                        maxHeight: '200px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        marginBottom: '1rem'
                      }}>
                        {aiGeneratedFile.type.startsWith('image') ? (
                          <img
                            src={URL.createObjectURL(aiGeneratedFile)}
                            alt="AI-Generated Preview"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <video
                            src={URL.createObjectURL(aiGeneratedFile)}
                            autoPlay
                            loop
                            muted
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        )}
                      </div>
                    ) : (
                      <div style={{
                        width: '100%',
                        height: '150px',
                        backgroundColor: '#333333',
                        borderRadius: '8px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#FFFFFF',
                        marginBottom: '1rem'
                      }}>
                        <FiUpload style={{ fontSize: '2rem', marginBottom: '0.5rem' }} />
                        <p>{isDraggingAI ? 'Drop here!' : 'Drag & Drop or Click to Change File'}</p>
                      </div>
                    )}
                    <p style={{ color: '#FFFFFF', fontSize: '14px' }}>
                      Change File
                    </p>
                    <input
                      type="file"
                      accept="image/*,video/*"
                      onChange={(e) => setAiGeneratedFile(e.target.files[0])}
                      style={{ display: 'none' }}
                      ref={aiGeneratedInputRef}
                    />
                  </div>
                  <div
                    onDragOver={(e) => handleDragOver(e, setIsDraggingOriginal)}
                    onDragLeave={(e) => handleDragLeave(e, setIsDraggingOriginal)}
                    onDrop={(e) => handleDrop(e, setOriginalFile)}
                    onClick={() => handleCardClick(originalInputRef)}
                    style={{
                      backgroundColor: '#111111',
                      borderRadius: '8px',
                      border: isDraggingOriginal ? '2px dashed #00FF00' : '1px solid #FFFFFF',
                      padding: '1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      transition: 'border 0.3s',
                      cursor: 'pointer'
                    }}
                  >
                    <p style={{ color: '#FFFFFF', fontWeight: '600', marginBottom: '0.5rem' }}>
                      Original Photo/Video (Optional)
                    </p>
                    {originalFile ? (
                      <div style={{
                        width: '100%',
                        maxHeight: '200px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        marginBottom: '1rem'
                      }}>
                        {originalFile.type.startsWith('image') ? (
                          <img
                            src={URL.createObjectURL(originalFile)}
                            alt="Original Preview"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <video
                            src={URL.createObjectURL(originalFile)}
                            autoPlay
                            loop
                            muted
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        )}
                      </div>
                    ) : (
                      <div style={{
                        width: '100%',
                        height: '150px',
                        backgroundColor: '#333333',
                        borderRadius: '8px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#FFFFFF',
                        marginBottom: '1rem'
                      }}>
                        <FiUpload style={{ fontSize: '2rem', marginBottom: '0.5rem' }} />
                        <p>{isDraggingOriginal ? 'Drop here!' : 'Drag & Drop or Click to Change File'}</p>
                      </div>
                    )}
                    <p style={{ color: '#FFFFFF', fontSize: '14px' }}>
                      Change File
                    </p>
                    <input
                      type="file"
                      accept="image/*,video/*"
                      onChange={(e) => setOriginalFile(e.target.files[0])}
                      style={{ display: 'none' }}
                      ref={originalInputRef}
                    />
                  </div>
                </div>

                {/* Right Side: Inputs */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div style={{ position: 'relative' }}>
                    <label style={{ display: 'block', color: '#FFFFFF', marginBottom: '8px', fontWeight: '600' }}>
                      Model Used (Optional)
                    </label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <input
                        ref={modelInputRef}
                        type="text"
                        value={modelUsed}
                        onChange={handleModelChange}
                        placeholder="Type a model name..."
                        style={{
                          width: '100%',
                          padding: '8px',
                          paddingRight: '40px',
                          backgroundColor: '#000000',
                          borderRadius: '8px',
                          color: '#FFFFFF',
                          border: '1px solid #FFFFFF',
                          fontSize: '16px'
                        }}
                      />
                      <motion.button
                        onClick={() => setShowModelDropdown(!showModelDropdown)}
                        style={{
                          position: 'absolute',
                          right: '8px',
                          backgroundColor: 'transparent',
                          border: 'none',
                          color: '#FFFFFF',
                          cursor: 'pointer',
                          padding: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <FiChevronDown size={20} />
                      </motion.button>
                    </div>
                    {showModelSuggestions && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        width: '100%',
                        backgroundColor: '#111111',
                        borderRadius: '8px',
                        border: '1px solid #FFFFFF',
                        maxHeight: '150px',
                        overflowY: 'auto',
                        zIndex: 10,
                        marginTop: '0.5rem'
                      }}>
                        {models
                          .filter((model) => model.toLowerCase().includes(modelQuery))
                          .map((model) => (
                            <div
                              key={model}
                              onClick={() => handleModelSelect(model)}
                              style={{
                                padding: '8px',
                                color: '#FFFFFF',
                                cursor: 'pointer',
                                borderBottom: '1px solid #333333'
                              }}
                              onMouseEnter={(e) => (e.target.style.backgroundColor = '#333333')}
                              onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
                            >
                              {model}
                            </div>
                          ))}
                      </div>
                    )}
                    {showModelDropdown && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        right: 0,
                        width: '200px',
                        backgroundColor: '#111111',
                        borderRadius: '8px',
                        border: '1px solid #FFFFFF',
                        maxHeight: '150px',
                        overflowY: 'auto',
                        zIndex: 10,
                        marginTop: '0.5rem'
                      }}>
                        {models.map((model) => (
                          <div
                            key={model}
                            onClick={() => handleModelDropdownSelect(model)}
                            style={{
                              padding: '8px',
                              color: '#FFFFFF',
                              cursor: 'pointer',
                              borderBottom: '1px solid #333333'
                            }}
                            onMouseEnter={(e) => (e.target.style.backgroundColor = '#333333')}
                            onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
                          >
                            {model}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <label style={{ display: 'block', color: '#FFFFFF', marginBottom: '8px', fontWeight: '600' }}>
                      Prompt Used (Optional)
                    </label>
                    <textarea
                      ref={promptTextareaRef}
                      value={promptUsed}
                      onChange={handlePromptChange}
                      style={{
                        width: '100%',
                        padding: '8px',
                        backgroundColor: '#000000',
                        borderRadius: '8px',
                        color: '#FFFFFF',
                        border: '1px solid #FFFFFF',
                        fontSize: '16px',
                        resize: 'none',
                        minHeight: '50px'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', color: '#FFFFFF', marginBottom: '8px', fontWeight: '600' }}>
                      Chat Link for Remix (Optional)
                    </label>
                    <input
                      type="text"
                      value={chatLink}
                      onChange={(e) => setChatLink(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px',
                        backgroundColor: '#000000',
                        borderRadius: '8px',
                        color: '#FFFFFF',
                        border: '1px solid #FFFFFF',
                        fontSize: '16px'
                      }}
                    />
                  </div>
                  <div style={{ position: 'relative' }}>
                    <label style={{ display: 'block', color: '#FFFFFF', marginBottom: '8px', fontWeight: '600' }}>
                      Caption (Optional)
                    </label>
                    <textarea
                      ref={captionTextareaRef}
                      value={caption}
                      onChange={handleCaptionChange}
                      placeholder="Write a caption... (mention users with @username, use #hashtags)"
                      style={{
                        width: '100%',
                        padding: '8px',
                        backgroundColor: '#000000',
                        borderRadius: '8px',
                        color: '#FFFFFF',
                        border: '1px solid #FFFFFF',
                        fontSize: '16px',
                        resize: 'none',
                        minHeight: '50px'
                      }}
                    />
                    {showMentionSuggestions && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        width: '100%',
                        backgroundColor: '#111111',
                        borderRadius: '8px',
                        border: '1px solid #FFFFFF',
                        maxHeight: '150px',
                        overflowY: 'auto',
                        zIndex: 10,
                        marginTop: '0.5rem'
                      }}>
                        {mockUsers
                          .filter((u) => u.username.toLowerCase().includes(mentionQuery))
                          .map((u) => (
                            <div
                              key={u.username}
                              onClick={() => handleMentionSelect(u.username)}
                              style={{
                                padding: '8px',
                                color: '#FFFFFF',
                                cursor: 'pointer',
                                borderBottom: '1px solid #333333'
                              }}
                              onMouseEnter={(e) => (e.target.style.backgroundColor = '#333333')}
                              onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
                            >
                              <span style={{ fontWeight: '600' }}>@{u.username}</span> - {u.displayName}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                  <motion.button
                    onClick={handleNext}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#FFFFFF',
                      color: '#000000',
                      borderRadius: '8px',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      marginTop: '1rem',
                      alignSelf: 'flex-end'
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Next
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Preview (Left: Post Card, Right: Details + Adjustments) */}
            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="luminous-border"
                style={{
                  backgroundColor: '#000000',
                  padding: '2rem',
                  borderRadius: '8px',
                  border: '2px solid transparent',
                  borderImage: 'linear-gradient(45deg, #ff0000, #0000ff, #ff00ff, #00ff00, rgb(223, 79, 6)) 1',
                  animation: 'rotateBorder 5s linear infinite',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2rem'
                }}
              >
                {/* Top: Buttons */}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <motion.button
                    onClick={handleBack}
                    style={{
                      padding: '8px',
                      backgroundColor: '#FFFFFF',
                      color: '#000000',
                      borderRadius: '8px',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FiArrowLeft size={20} />
                  </motion.button>
                  <motion.button
                    onClick={handleSubmit}
                    disabled={loading}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#FFFFFF',
                      color: '#000000',
                      borderRadius: '8px',
                      border: 'none',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      opacity: loading ? 0.5 : 1
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {loading ? 'Uploading...' : 'Upload Post'}
                  </motion.button>
                </div>

                {/* Main Content */}
                <div style={{ display: 'flex', gap: '2rem' }}>
                  {/* Left Side: Post Card Preview */}
                  <div style={{ flex: 1 }}>
                    <h3 style={{ color: '#FFFFFF', fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>
                      Post Preview
                    </h3>
                    <div style={{
                      padding: '1rem',
                      border: '1px solid #FFFFFF',
                      borderRadius: '8px',
                      backgroundColor: '#111111'
                    }}>
                      <div style={{ marginBottom: '0.5rem' }}>
                        <p style={{ color: '#FFFFFF', fontWeight: '600' }}>
                          @{user?.displayName || 'gaurav1'}
                        </p>
                      </div>
                      <div>
                        {aiGeneratedFile ? (
                          <div style={{
                            ...getAspectRatioStyle(aspectRatio),
                            backgroundColor: '#000000',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                            margin: '0 auto'
                          }}>
                            {aiGeneratedFile.type.startsWith('image') ? (
                              <img
                                src={URL.createObjectURL(aiGeneratedFile)}
                                alt="AI-Generated Preview"
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover',
                                  borderRadius: '8px'
                                }}
                              />
                            ) : (
                              <video
                                src={URL.createObjectURL(aiGeneratedFile)}
                                autoPlay
                                loop
                                muted
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'contain',
                                  backgroundColor: '#000000'
                                }}
                              />
                            )}
                          </div>
                        ) : (
                          <div style={{
                            ...getAspectRatioStyle(aspectRatio),
                            backgroundColor: '#333333',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#FFFFFF',
                            border: '1px solid #FFFFFF',
                            margin: '0 auto'
                          }}>
                            No AI-Generated File
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Details + Adjustments */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div>
                      <label style={{ display: 'block', color: '#FFFFFF', marginBottom: '8px', fontWeight: '600' }}>
                        Adjust Aspect Ratio
                      </label>
                      <select
                        value={aspectRatio}
                        onChange={(e) => setAspectRatio(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px',
                          backgroundColor: '#000000',
                          borderRadius: '8px',
                          color: '#FFFFFF',
                          border: '1px solid #FFFFFF',
                          fontSize: '16px'
                        }}
                      >
                        {aspectRatios.map((ratio) => (
                          <option key={ratio.value} value={ratio.value} style={{ color: '#FFFFFF' }}>
                            {ratio.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    {originalFile && (
                      <div>
                        <p style={{ color: '#FFFFFF', fontWeight: '600', marginBottom: '0.5rem' }}>
                          Original:
                        </p>
                        <div style={{
                          ...getSmallAspectRatioStyle(aspectRatio),
                          backgroundColor: '#000000',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden',
                          margin: '0 auto'
                        }}>
                          {originalFile.type.startsWith('image') ? (
                            <img
                              src={URL.createObjectURL(originalFile)}
                              alt="Original Preview"
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                borderRadius: '8px'
                              }}
                            />
                          ) : (
                            <video
                              src={URL.createObjectURL(originalFile)}
                              autoPlay
                              loop
                              muted
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'contain',
                                backgroundColor: '#000000'
                              }}
                            />
                          )}
                        </div>
                      </div>
                    )}
                    {caption && (
                      <p style={{ color: '#FFFFFF', marginBottom: '0.5rem' }}>
                        <strong>Caption:</strong> {renderCaptionWithMentionsAndHashtags(caption)}
                      </p>
                    )}
                    {(modelUsed || chatLink) && (
                      <div style={{ marginBottom: '0.5rem' }}>
                        <p style={{ color: '#FFFFFF', marginBottom: '0.5rem' }}>
                          <strong>Details:</strong>
                        </p>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          {modelUsed && (
                            <div
                              style={{
                                padding: '8px 16px',
                                backgroundColor: '#222222',
                                border: '1px solid #FFFFFF',
                                borderRadius: '4px',
                                color: '#FFFFFF',
                                fontSize: '14px',
                                fontWeight: '500',
                                textAlign: 'center',
                                minWidth: '120px'
                              }}
                            >
                              {modelUsed}
                            </div>
                          )}
                          {chatLink && (
                            <a
                              href={chatLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                padding: '8px 16px',
                                backgroundColor: '#FFFFFF',
                                color: '#000000',
                                borderRadius: '4px',
                                textDecoration: 'none',
                                fontSize: '14px',
                                fontWeight: '500',
                                textAlign: 'center',
                                minWidth: '120px',
                                display: 'inline-block'
                              }}
                            >
                              Remix
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                    {promptUsed && (
                      <p style={{ color: '#FFFFFF', marginBottom: '0.5rem' }}>
                        <strong>Prompt Used:</strong> {promptUsed}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </motion.section>

      <style>
        {`
          @keyframes rotateBorder {
            0% {
              border-image: linear-gradient(0deg, #ff0000, #0000ff, #ff00ff, #00ff00) 1;
              box-shadow: 0 0 10px rgba(255, 0, 0, 0.5), 0 0 20px rgba(255, 0, 0, 0.3);
            }
            25% {
              border-image: linear-gradient(90deg, #ff0000, #0000ff, #ff00ff, #00ff00) 1;
              box-shadow: 0 0 10px rgba(0, 0, 255, 0.5), 0 0 20px rgba(0, 0, 255, 0.3);
            }
            50% {
              border-image: linear-gradient(180deg, #ff0000, #0000ff, #ff00ff, #00ff00) 1;
              box-shadow: 0 0 10px rgba(255, 0, 255, 0.5), 0 0 20px rgba(255, 0, 255, 0.3);
            }
            75% {
              border-image: linear-gradient(270deg, #ff0000, #0000ff, #ff00ff, #00ff00) 1;
              box-shadow: 0 0 10px rgba(0, 255, 0, 0.5), 0 0 20px rgba(0, 255, 0, 0.3);
            }
            100% {
              border-image: linear-gradient(360deg, #ff0000, #0000ff, #ff00ff, #00ff00) 1;
              box-shadow: 0 0 10px rgba(255, 0, 0, 0.5), 0 0 20px rgba(255, 0, 0, 0.3);
            }
          }

          .luminous-border {
            border: 2px solid transparent;
            border-radius: 8px;
            animation: rotateBorder 4s linear infinite;
          }
        `}
      </style>
      
      {/* Upload Progress Popup */}
      <UploadProgressPopup
        isVisible={showProgressPopup}
        onClose={() => setShowProgressPopup(false)}
        uploadProgress={uploadProgress}
        estimatedTime={estimatedTime}
      />
      
      {/* Upload Status Bar */}
      <UploadStatusBar
        isVisible={showStatusBar}
        onClose={() => setShowStatusBar(false)}
        message="Post upload in progress..."
        status={uploadStatus}
        progress={uploadProgress}
      />
    </div>
  );
};

export default Upload;