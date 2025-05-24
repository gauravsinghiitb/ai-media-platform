import { motion, useAnimation } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import { db } from '../firebase/firebase';
import { collection, getDocs } from 'firebase/firestore';

function Home() {
  const [trendingPosts, setTrendingPosts] = useState([]);
  const [mostRemixed, setMostRemixed] = useState([]);
  const [newestPosts, setNewestPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const allPosts = [];
        usersSnapshot.forEach((userDoc) => {
          const userData = userDoc.data();
          const userPosts = userData.posts || [];
          userPosts.forEach((post) => {
            if (post && post.aiGeneratedUrl) {
              allPosts.push({ userId: userDoc.id, ...post });
            }
          });
        });

        // Sort posts by likes (trending), remixes (most remixed), and creation date (newest)
        const sortedByLikes = [...allPosts].sort((a, b) => (b.likes || 0) - (a.likes || 0)).slice(0, 3);
        const sortedByRemixes = [...allPosts].sort((a, b) => (b.remixes || 0) - (a.remixes || 0)).slice(0, 3);
        const sortedByDate = [...allPosts].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).slice(0, 3);

        setTrendingPosts(sortedByLikes);
        setMostRemixed(sortedByRemixes);
        setNewestPosts(sortedByDate);
      } catch (error) {
        console.error('Error fetching posts:', error);
        setTrendingPosts([]);
        setMostRemixed([]);
        setNewestPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  const controls = useAnimation();

  useEffect(() => {
    const handleScroll = () => {
      const sections = document.querySelectorAll('.section');
      sections.forEach((section) => {
        const rect = section.getBoundingClientRect();
        if (rect.top <= window.innerHeight * 0.8) {
          controls.start('visible');
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [controls]);

  const heroTitle = "Discover the Future of AI Creativity";
  const titleVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const letterVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.2,
        duration: 0.8,
        ease: "easeOut",
      },
    }),
  };

  return (
    <>
      <style>
        {`
          .home {
            color: #ffffff;
            background:rgb(13, 15, 13); /* Light black background */
            padding-bottom: 4rem;
            position: relative;
            overflow: hidden;
            min-height: 100vh;
          }

          .hero {
            background: linear-gradient(135deg,rgb(1, 1, 1) 0%,rgb(35, 2, 36) 100%); /* Adjusted gradient to match light black */
            padding: 6rem 1rem;
            text-align: center;
            position: relative;
            overflow: hidden;
            min-height: 80vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .hero::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: radial-gradient(circle, rgba(96, 165, 250, 0.3) 0%, transparent 70%);
            z-index: 0;
            animation: pulse 10s infinite;
          }

          @keyframes pulse {
            0% { opacity: 0.3; transform: scale(1); }
            50% { opacity: 0.6; transform: scale(1.1); }
            100% { opacity: 0.3; transform: scale(1); }
          }

          .particles {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1;
          }

          .particle {
            position: absolute;
            background: rgba(96, 165, 250, 0.8);
            border-radius: 50%;
            box-shadow: 0 0 10px rgba(96, 165, 250, 0.5);
            animation: float 15s infinite linear;
          }

          @keyframes float {
            0% { transform: translateY(0) translateX(0); opacity: 0.5; }
            50% { opacity: 1; }
            100% { transform: translateY(-100vh) translateX(20px); opacity: 0.5; }
          }

          .hero-content {
            position: relative;
            z-index: 2;
          }

          .hero h1 {
            font-size: 3.5rem;
            font-weight: 900;
            margin-bottom: 1.5rem;
            background: linear-gradient(90deg, #60a5fa, #f472b6);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            text-shadow: 0 0 20px rgba(96, 165, 250, 0.7);
            letter-spacing: 1px;
          }

          .hero p {
            font-size: 1.5rem;
            color: #d1d5db;
            margin-bottom: 2.5rem;
            text-shadow: 0 0 5px rgba(255, 255, 255, 0.3);
          }

          .cta-button {
            background: linear-gradient(90deg, #60a5fa, #f472b6);
            color: #ffffff;
            padding: 1rem 3rem;
            border-radius: 3rem;
            border: none;
            font-size: 1.2rem;
            font-weight: 600;
            cursor: pointer;
            box-shadow: 0 0 20px rgba(96, 165, 250, 0.7);
            transition: box-shadow 0.3s;
            animation: floatButton 3s infinite ease-in-out;
          }

          .cta-button:hover {
            box-shadow: 0 0 30px rgba(244, 114, 182, 0.9);
          }

          @keyframes floatButton {
            0% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
            100% { transform: translateY(0); }
          }

          .section {
            padding: 4rem 1rem;
            max-width: 80rem;
            margin: 0 auto;
            position: relative;
            background: rgba(255, 255, 255, 0.02);
            border-radius: 1rem;
            margin-bottom: 2rem;
            box-shadow: 0 0 20px rgba(96, 165, 250, 0.1);
          }

          .section h2 {
            font-size: 2.5rem;
            font-weight: 800;
            margin-bottom: 2rem;
            text-align: center;
            background: linear-gradient(90deg, #60a5fa, #f472b6);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            text-shadow: 0 0 15px rgba(96, 165, 250, 0.5);
          }

          .grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
            gap: 1rem;
            grid-auto-rows: auto;
          }

          .loading {
            text-align: center;
            color: #9ca3af;
            font-size: 1.2rem;
            padding: 2rem;
          }

          .no-posts {
            text-align: center;
            color: #d1d5db;
            font-size: 1.2rem;
            padding: 2rem;
          }
        `}
      </style>

      <div className="home">
        <motion.section
          className="hero"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2 }}
        >
          <div className="particles">
            {[...Array(15)].map((_, i) => (
              <div
                key={i}
                className="particle"
                style={{
                  width: `${Math.random() * 5 + 2}px`,
                  height: `${Math.random() * 5 + 2}px`,
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 10}s`,
                }}
              />
            ))}
          </div>

          <div className="hero-content">
            <motion.h1
              variants={titleVariants}
              initial="hidden"
              animate="visible"
            >
              {heroTitle.split('').map((char, index) => (
                <motion.span key={index} variants={letterVariants}>
                  {char}
                </motion.span>
              ))}
            </motion.h1>
            <motion.p
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1, duration: 0.8 }}
            >
              A community for sharing and remixing AI creations
            </motion.p>
            <motion.button
              className="cta-button"
              onClick={() => navigate('/explore')}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              Get Started
            </motion.button>
          </div>
        </motion.section>

        <motion.section
          className="section"
          initial="hidden"
          animate={controls}
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { duration: 1 } },
          }}
        >
          <motion.h2
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            Trending Posts
          </motion.h2>
          {loading ? (
            <p className="loading">Loading...</p>
          ) : trendingPosts.length === 0 ? (
            <p className="no-posts">No trending posts yet.</p>
          ) : (
            <div className="grid">
              {trendingPosts.map((post, index) => (
                <motion.div
                  key={post.createdAt || index}
                  custom={index}
                  initial="hidden"
                  animate={controls}
                  variants={cardVariants}
                >
                  <Card post={post} userId={post.userId} />
                </motion.div>
              ))}
            </div>
          )}
        </motion.section>

        <motion.section
          className="section"
          initial="hidden"
          animate={controls}
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { duration: 1 } },
          }}
        >
          <motion.h2
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            Most Remixed
          </motion.h2>
          {loading ? (
            <p className="loading">Loading...</p>
          ) : mostRemixed.length === 0 ? (
            <p className="no-posts">No remixed posts yet.</p>
          ) : (
            <div className="grid">
              {mostRemixed.map((post, index) => (
                <motion.div
                  key={post.createdAt || index}
                  custom={index}
                  initial="hidden"
                  animate={controls}
                  variants={cardVariants}
                >
                  <Card post={post} userId={post.userId} />
                </motion.div>
              ))}
            </div>
          )}
        </motion.section>

        <motion.section
          className="section"
          initial="hidden"
          animate={controls}
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { duration: 1 } },
          }}
        >
          <motion.h2
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            Newest Creations
          </motion.h2>
          {loading ? (
            <p className="loading">Loading...</p>
          ) : newestPosts.length === 0 ? (
            <p className="no-posts">No new creations yet.</p>
          ) : (
            <div className="grid">
              {newestPosts.map((post, index) => (
                <motion.div
                  key={post.createdAt || index}
                  custom={index}
                  initial="hidden"
                  animate={controls}
                  variants={cardVariants}
                >
                  <Card post={post} userId={post.userId} />
                </motion.div>
              ))}
            </div>
          )}
        </motion.section>
      </div>
    </>
  );
}

export default Home;