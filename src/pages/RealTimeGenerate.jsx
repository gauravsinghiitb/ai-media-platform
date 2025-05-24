import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import Card from '../components/Card';

function RealTimeGenerate() {
  const [prompt, setPrompt] = useState('');
  const [imageData, setImageData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const generateImage = async () => {
      if (!prompt.trim()) {
        setImageData(null);
        setError('');
        return;
      }

      setLoading(true);
      setError('');

      try {
        const res = await fetch('http://localhost:5000/api/generateImage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt }),
        });

        console.log('Response status:', res.status);
        console.log('Response headers:', res.headers.get('content-type'));

        if (!res.ok) {
          const text = await res.text();
          console.error('Non-OK response:', text);
          throw new Error(`API request failed with status ${res.status}: ${text}`);
        }

        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const text = await res.text();
          console.error('Non-JSON response:', text);
          throw new Error('Expected JSON response, but received: ' + text.slice(0, 50));
        }

        const json = await res.json();

        if (json.error) {
          setError(json.error);
          setImageData(null);
        } else {
          setImageData(`data:image/png;base64,${json.image}`);
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setError(`Failed to generate image: ${err.message}`);
        setImageData(null);
      } finally {
        setLoading(false);
      }
    };

    const timeout = setTimeout(generateImage, 500);
    return () => clearTimeout(timeout);
  }, [prompt]);

  return (
    <>
      <style>
        {`
          .realtime-container {
            color: #ffffff;
            background: linear-gradient(180deg, #0a0a23 0%, #1a1a40 100%);
            padding: 3rem 1rem;
            min-height: 100vh;
            max-width: 80rem;
            margin: 0 auto;
            position: relative;
            overflow: hidden;
          }

          .realtime-header {
            text-align: center;
            padding: 3rem 0;
          }

          .realtime-header h1 {
            font-size: 3rem;
            font-weight: 900;
            background: linear-gradient(90deg, #60a5fa, #f472b6);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            text-shadow: 0 0 20px rgba(96, 165, 250, 0.7);
            margin-bottom: 1rem;
          }

          .prompt-input {
            width: 100%;
            padding: 0.75rem;
            background: rgba(255, 255, 255, 0.05);
            color: #ffffff;
            border: 1px solid rgba(96, 165, 250, 0.3);
            border-radius: 0.5rem;
            font-size: 1rem;
            outline: none;
            transition: all 0.3s;
            box-shadow: 0 0 10px rgba(96, 165, 250, 0.3);
            resize: vertical;
            min-height: 100px;
          }

          .prompt-input:focus {
            border-color: #60a5fa;
            box-shadow: 0 0 15px rgba(96, 165, 250, 0.7);
          }

          .loading {
            text-align: center;
            color: #9ca3af;
            margin: 1rem 0;
            font-size: 1.2rem;
            text-shadow: 0 0 5px rgba(156, 163, 175, 0.5);
            animation: pulseText 1.5s infinite;
          }

          .error {
            text-align: center;
            color: #ef4444;
            margin: 1rem 0;
            font-size: 1.2rem;
            text-shadow: 0 0 5px rgba(239, 68, 68, 0.5);
          }

          @keyframes pulseText {
            0% { opacity: 0.5; }
            50% { opacity: 1; }
            100% { opacity: 0.5; }
          }

          .card-container {
            display: flex;
            justify-content: center;
            margin-top: 2rem;
          }

          .card-wrapper {
            position: relative;
            perspective: 1000px;
          }

          .card-wrapper:hover .card-inner {
            transform: rotateY(10deg) rotateX(5deg);
            box-shadow: 0 0 30px rgba(96, 165, 250, 0.7), 0 0 50px rgba(244, 114, 182, 0.5);
          }

          .card-inner {
            transition: transform 0.5s, box-shadow 0.5s;
            border-radius: 1rem;
            overflow: hidden;
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(5px);
          }
        `}
      </style>

      <div className="realtime-container">
        <motion.div
          className="realtime-header"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <h1>Real-Time AI Image Generator</h1>
        </motion.div>

        <motion.textarea
          className="prompt-input"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Type your prompt here (e.g., 'A cyberpunk city at night with neon lights')..."
          rows="3"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
        />

        {loading && (
          <motion.p
            className="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            Generating image...
          </motion.p>
        )}
        {error && (
          <motion.p
            className="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {error}
          </motion.p>
        )}
        {imageData && (
          <motion.div
            className="card-container"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="card-wrapper">
              <div className="card-inner">
                <Card
                  id={Date.now()}
                  media={imageData}
                  title={prompt.slice(0, 20) + '...'}
                  prompt={prompt}
                  type="image"
                />
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </>
  );
}

export default RealTimeGenerate;