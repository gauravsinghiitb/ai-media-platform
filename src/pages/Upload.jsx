import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { db, storage, auth } from '../firebase/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import LoadingSpinner from '../components/LoadingSpinner';
import { FiUpload, FiArrowLeft } from 'react-icons/fi';

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
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [isDraggingAI, setIsDraggingAI] = useState(false);
  const [isDraggingOriginal, setIsDraggingOriginal] = useState(false);

  const aiGeneratedInputRef = useRef(null);
  const originalInputRef = useRef(null);
  const captionTextareaRef = useRef(null);
  const promptTextareaRef = useRef(null);

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
    "Phenaki (Google - long video from text)"
  ];

  const mockUsers = [
    { username: 'gaurav1', displayName: 'Gaurav' },
    { username: 'alice123', displayName: 'Alice' },
    { username: 'bobsmith', displayName: 'Bob Smith' },
    { username: 'charlie_x', displayName: 'Charlie' },
    { username: 'diana99', displayName: 'Diana' }
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

    setLoading(true);
    setError(null);

    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        await updateDoc(userDocRef, { username: 'gaurav1', posts: [] });
      }

      const aiGeneratedRef = ref(storage, `${user.uid}/ai-generated/${Date.now()}-${aiGeneratedFile.name}`);
      await uploadBytes(aiGeneratedRef, aiGeneratedFile);
      const aiGeneratedUrl = await getDownloadURL(aiGeneratedRef);

      let originalUrl = '';
      if (originalFile) {
        const originalRef = ref(storage, `${user.uid}/original/${Date.now()}-${originalFile.name}`);
        await uploadBytes(originalRef, originalFile);
        originalUrl = await getDownloadURL(originalRef);
      }

      const post = {
        aiGeneratedUrl,
        originalUrl: originalUrl || '',
        modelUsed,
        promptUsed,
        chatLink,
        caption,
        createdAt: new Date().toISOString(),
        username: userDoc.data()?.username || 'gaurav1',
        likes: 0,
        comments: [],
      };

      await updateDoc(userDocRef, { posts: arrayUnion(post) });
      navigate('/feed');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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
                  <div>
                    <label style={{ display: 'block', color: '#FFFFFF', marginBottom: '8px', fontWeight: '600' }}>
                      Model Used (Optional)
                    </label>
                    <select
                      value={modelUsed}
                      onChange={(e) => setModelUsed(e.target.value)}
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
                      <option value="" style={{ color: '#FFFFFF' }}>Select a model</option>
                      {models.map((model) => (
                        <option key={model} value={model} style={{ color: '#FFFFFF' }}>{model}</option>
                      ))}
                    </select>
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
    </div>
  );
};

export default Upload;