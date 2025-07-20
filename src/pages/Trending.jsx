import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase/firebase';
import { collection, getDocs, query, orderBy, limit, where } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  FaFire, FaRocket, FaNewspaper, FaChartLine, FaUsers, FaEye, FaHeart, FaComment, 
  FaExternalLinkAlt, FaClock, FaTag, FaCrown, FaStar, FaAngleUp, FaImage, 
  FaVideo, FaUserTie, FaTrophy, FaGlobe, FaLightbulb, FaCode, FaPalette, FaBrain
} from 'react-icons/fa';
import LoadingSpinner from '../components/LoadingSpinner';
import Card from '../components/Card';
import Masonry from 'react-masonry-css';
import { LazyImage } from '../components/LazyLoad';

const Trending = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('news');
  const [trendingPosts, setTrendingPosts] = useState([]);
  const [topContributors, setTopContributors] = useState([]);
  const [aiNews, setAiNews] = useState([]);
  const [newsLoading, setNewsLoading] = useState(true);

  // Comprehensive AI News Data (simulated web scraping results)
  const comprehensiveAiNews = [
    // AI Image Models
    {
      id: 1,
      title: "Midjourney v7 Alpha: Revolutionary Photorealism Breakthrough",
      summary: "Midjourney's latest alpha release introduces unprecedented photorealism with enhanced artistic control. The model can now generate images with remarkable detail, improved composition, and creative flexibility that rivals professional photography.",
      category: "AI Image Models",
      subcategory: "Image Generation",
      date: "2024-01-15",
      readTime: "5 min read",
      source: "Midjourney Blog",
      url: "https://midjourney.com/blog/v7-alpha",
      image: "https://images.unsplash.com/photo-1686191128892-3e87d4d6e8c1?w=400&h=200&fit=crop&crop=center",
      trending: true,
      tags: ["Midjourney", "v7", "Photorealism", "Alpha"]
    },
    {
      id: 2,
      title: "DALL-E 3 Turbo: OpenAI's Fastest Image Generator Yet",
      summary: "OpenAI releases DALL-E 3 Turbo with 4x faster generation speed and improved prompt understanding. The model maintains high quality while significantly reducing generation time.",
      category: "AI Image Models",
      subcategory: "Image Generation",
      date: "2024-01-14",
      readTime: "4 min read",
      source: "OpenAI",
      url: "https://openai.com/blog/dalle-3-turbo",
      image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=200&fit=crop&crop=center",
      trending: true,
      tags: ["DALL-E", "OpenAI", "Turbo", "Speed"]
    },
    {
      id: 3,
      title: "Stable Diffusion XL Turbo: Real-time Generation Achieved",
      summary: "Stability AI introduces SDXL Turbo, enabling real-time image generation with unprecedented speed. The model can generate high-quality images in under a second.",
      category: "AI Image Models",
      subcategory: "Image Generation",
      date: "2024-01-13",
      readTime: "3 min read",
      source: "Stability AI",
      url: "https://stability.ai/news/sdxl-turbo",
      image: "https://images.unsplash.com/photo-1676299251996-879af6c7f6e5?w=400&h=200&fit=crop&crop=center",
      trending: true,
      tags: ["Stable Diffusion", "SDXL", "Turbo", "Real-time"]
    },
    {
      id: 4,
      title: "Adobe Firefly 3: Creative Suite Integration Enhanced",
      summary: "Adobe releases Firefly 3 with improved integration across Creative Suite applications. New features include better style matching and enhanced vector graphics generation.",
      category: "AI Image Models",
      subcategory: "Creative Tools",
      date: "2024-01-12",
      readTime: "4 min read",
      source: "Adobe",
      url: "https://adobe.com/firefly-v3",
      image: "https://images.unsplash.com/photo-1686191128892-3e87d4d6e8c1?w=400&h=200&fit=crop&crop=center",
      tags: ["Adobe", "Firefly", "Creative Suite", "Vector"]
    },

    // AI Video Models
    {
      id: 5,
      title: "Sora 2.0: OpenAI's Next-Generation Video Model",
      summary: "OpenAI announces Sora 2.0 with improved video quality, longer generation times, and enhanced physics understanding. The model can now generate up to 60-second videos.",
      category: "AI Video Models",
      subcategory: "Video Generation",
      date: "2024-01-15",
      readTime: "6 min read",
      source: "OpenAI",
      url: "https://openai.com/blog/sora-2",
      image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=200&fit=crop&crop=center",
      trending: true,
      tags: ["Sora", "OpenAI", "Video", "2.0"]
    },
    {
      id: 6,
      title: "Runway Gen-3: Professional Video Creation Tool",
      summary: "Runway releases Gen-3 with enhanced motion control and professional-grade video generation capabilities. The model targets filmmakers and content creators.",
      category: "AI Video Models",
      subcategory: "Video Generation",
      date: "2024-01-14",
      readTime: "4 min read",
      source: "Runway",
      url: "https://runway.com/gen-3",
      image: "https://images.unsplash.com/photo-1676299251996-879af6c7f6e5?w=400&h=200&fit=crop&crop=center",
      trending: true,
      tags: ["Runway", "Gen-3", "Professional", "Film"]
    },
    {
      id: 7,
      title: "Pika Labs 2.0: Enhanced Animation and Motion",
      summary: "Pika Labs releases version 2.0 with improved animation capabilities and motion control. New features include character consistency and enhanced physics.",
      category: "AI Video Models",
      subcategory: "Animation",
      date: "2024-01-13",
      readTime: "3 min read",
      source: "Pika Labs",
      url: "https://pika.art/v2",
      image: "https://images.unsplash.com/photo-1686191128892-3e87d4d6e8c1?w=400&h=200&fit=crop&crop=center",
      tags: ["Pika", "Animation", "Motion", "2.0"]
    },

    // Model Updates & Research
    {
      id: 8,
      title: "GPT-5 Development: OpenAI's Next Frontier",
      summary: "OpenAI begins development of GPT-5 with focus on enhanced reasoning, reduced hallucinations, and improved multimodal capabilities. Expected release in late 2024.",
      category: "Model Updates",
      subcategory: "Language Models",
      date: "2024-01-15",
      readTime: "7 min read",
      source: "TechCrunch",
      url: "https://techcrunch.com/gpt-5-development",
      image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=200&fit=crop&crop=center",
      trending: true,
      tags: ["GPT-5", "OpenAI", "Reasoning", "Multimodal"]
    },
    {
      id: 9,
      title: "Claude 3.5 Sonnet: Anthropic's Latest Release",
      summary: "Anthropic releases Claude 3.5 Sonnet with improved coding capabilities, enhanced safety measures, and expanded knowledge base. Performance benchmarks show significant improvements.",
      category: "Model Updates",
      subcategory: "Language Models",
      date: "2024-01-14",
      readTime: "5 min read",
      source: "Anthropic",
      url: "https://anthropic.com/claude-3-5",
      image: "https://images.unsplash.com/photo-1676299251996-879af6c7f6e5?w=400&h=200&fit=crop&crop=center",
      trending: true,
      tags: ["Claude", "Anthropic", "3.5", "Sonnet"]
    },
    {
      id: 10,
      title: "Gemini Ultra 2.0: Google's Advanced AI Model",
      summary: "Google releases Gemini Ultra 2.0 with enhanced reasoning capabilities and improved performance across multiple benchmarks. The model shows significant advances in mathematical and scientific tasks.",
      category: "Model Updates",
      subcategory: "Language Models",
      date: "2024-01-13",
      readTime: "6 min read",
      source: "Google AI",
      url: "https://ai.google/gemini-ultra-2",
      image: "https://images.unsplash.com/photo-1686191128892-3e87d4d6e8c1?w=400&h=200&fit=crop&crop=center",
      tags: ["Gemini", "Google", "Ultra", "2.0"]
    },

    // Industry News & Trends
    {
      id: 11,
      title: "AI Regulation: Global Framework Agreement",
      summary: "World leaders reach agreement on comprehensive AI regulation framework. The guidelines focus on safety, transparency, and responsible AI development across industries.",
      category: "Industry News",
      subcategory: "Regulation",
      date: "2024-01-15",
      readTime: "8 min read",
      source: "World Economic Forum",
      url: "https://weforum.org/ai-regulation",
      image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=200&fit=crop&crop=center",
      trending: true,
      tags: ["Regulation", "Global", "Safety", "Framework"]
    },
    {
      id: 12,
      title: "AI Investment Surge: $50B in Q1 2024",
      summary: "AI startups and companies receive record-breaking $50 billion in investments during Q1 2024. Major funding rounds focus on generative AI and enterprise applications.",
      category: "Industry News",
      subcategory: "Investment",
      date: "2024-01-14",
      readTime: "4 min read",
      source: "Crunchbase",
      url: "https://crunchbase.com/ai-investment-q1-2024",
      image: "https://images.unsplash.com/photo-1676299251996-879af6c7f6e5?w=400&h=200&fit=crop&crop=center",
      tags: ["Investment", "Funding", "Startups", "Q1"]
    },
    {
      id: 13,
      title: "AI in Healthcare: Breakthrough Applications",
      summary: "New AI applications in healthcare show promising results in drug discovery, medical imaging, and patient care. FDA approves several AI-powered medical devices.",
      category: "Industry News",
      subcategory: "Healthcare",
      date: "2024-01-13",
      readTime: "6 min read",
      source: "Nature Medicine",
      url: "https://nature.com/ai-healthcare-2024",
      image: "https://images.unsplash.com/photo-1686191128892-3e87d4d6e8c1?w=400&h=200&fit=crop&crop=center",
      tags: ["Healthcare", "FDA", "Drug Discovery", "Medical"]
    },

    // Emerging Technologies
    {
      id: 14,
      title: "Quantum AI: First Commercial Applications",
      summary: "Quantum computing meets AI as first commercial applications emerge. Companies demonstrate quantum advantage in specific AI tasks and optimization problems.",
      category: "Emerging Tech",
      subcategory: "Quantum AI",
      date: "2024-01-12",
      readTime: "7 min read",
      source: "MIT Technology Review",
      url: "https://technologyreview.com/quantum-ai",
      image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=200&fit=crop&crop=center",
      tags: ["Quantum", "Computing", "AI", "Commercial"]
    },
    {
      id: 15,
      title: "Neuromorphic Computing: Brain-Inspired AI",
      summary: "Neuromorphic computing chips show promise in energy-efficient AI processing. Research demonstrates significant power savings while maintaining performance.",
      category: "Emerging Tech",
      subcategory: "Neuromorphic",
      date: "2024-01-11",
      readTime: "5 min read",
      source: "Science",
      url: "https://science.org/neuromorphic-ai",
      image: "https://images.unsplash.com/photo-1676299251996-879af6c7f6e5?w=400&h=200&fit=crop&crop=center",
      tags: ["Neuromorphic", "Brain", "Energy", "Efficient"]
    }
  ];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        fetchTrendingData();
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchTrendingData = async () => {
    try {
      setLoading(true);
      
      // Fetch trending posts (most likes, comments, contributions)
      const postsQuery = query(
        collection(db, 'posts'),
        orderBy('likedBy', 'desc'),
        limit(12)
      );
      const postsSnapshot = await getDocs(postsQuery);
      const posts = postsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTrendingPosts(posts);

      // Fetch top contributors (users with most contributions)
      const usersQuery = query(
        collection(db, 'users'),
        orderBy('contributionCount', 'desc'),
        limit(10)
      );
      const usersSnapshot = await getDocs(usersQuery);
      const contributors = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTopContributors(contributors);

      // Simulate web scraping delay
      setTimeout(() => {
        setAiNews(comprehensiveAiNews);
        setNewsLoading(false);
        setLoading(false);
      }, 1500);

    } catch (error) {
      console.error('Error fetching trending data:', error);
      setLoading(false);
      setNewsLoading(false);
    }
  };

  const handleCardClick = (userId, postId) => {
    navigate(`/post/${userId}/${postId}`);
  };

  const handleNewsClick = (news) => {
    window.open(news.url, '_blank');
  };

  const getCategoryColor = (category) => {
    const colors = {
      'AI Image Models': '#FF6B6B',
      'AI Video Models': '#4ECDC4',
      'Model Updates': '#45B7D1',
      'Industry News': '#96CEB4',
      'Emerging Tech': '#FFEAA7'
    };
    return colors[category] || '#666666';
  };

  const getSubcategoryIcon = (subcategory) => {
    const icons = {
      'Image Generation': <FaImage />,
      'Video Generation': <FaVideo />,
      'Animation': <FaPalette />,
      'Creative Tools': <FaCode />,
      'Language Models': <FaLightbulb />,
      'Regulation': <FaGlobe />,
      'Investment': <FaChartLine />,
      'Healthcare': <FaUserTie />,
      'Quantum AI': <FaRocket />,
      'Neuromorphic': <FaBrain />
    };
    return icons[subcategory] || <FaTag />;
  };

  const breakpointColumnsObj = {
    default: 6,
    1800: 5,
    1600: 6,
    1400: 5,
    1200: 4,
    1100: 3,
    700: 2,
    500: 1
  };

  if (loading) {
    return (
      <div style={{
        backgroundColor: '#000000',
        color: '#FFFFFF',
        minHeight: '100vh',
        width: '100%',
        paddingLeft: '250px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: '#000000',
      color: '#FFFFFF',
      minHeight: '100vh',
      width: '100%',
      paddingLeft: '250px',
      transition: 'padding-left 0.3s ease'
    }}>
      {/* Header */}
      <div style={{
        padding: '2rem',
        borderBottom: '1px solid #333333',
        background: 'linear-gradient(135deg, #0F0F0F 0%, #1A1A1A 100%)'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            marginBottom: '1rem'
          }}>
            <FaFire size={32} style={{ color: '#FF4444' }} />
            <h1 style={{
              fontSize: '2.5rem',
              fontWeight: '800',
              margin: 0,
              background: 'linear-gradient(45deg, #FFFFFF, #CCCCCC)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              Trending
            </h1>
          </div>
          <p style={{
            fontSize: '1.1rem',
            color: '#AAAAAA',
            margin: 0,
            lineHeight: '1.6'
          }}>
            Discover the latest in AI models, trending content, and top contributors
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{
        padding: '1rem 2rem',
        borderBottom: '1px solid #333333',
        backgroundColor: '#0F0F0F'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap'
        }}>
          {[
            { id: 'news', label: 'AI News', icon: <FaNewspaper /> },
            { id: 'posts', label: 'Trending Posts', icon: <FaAngleUp /> },
            { id: 'contributors', label: 'Top Contributors', icon: <FaCrown /> }
          ].map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                backgroundColor: activeTab === tab.id ? '#FFFFFF' : 'transparent',
                color: activeTab === tab.id ? '#000000' : '#FFFFFF',
                border: `2px solid ${activeTab === tab.id ? '#FFFFFF' : '#333333'}`,
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '600',
                transition: 'all 0.3s ease'
              }}
              whileHover={{
                backgroundColor: activeTab === tab.id ? '#CCCCCC' : '#222222',
                scale: 1.05
              }}
              whileTap={{ scale: 0.95 }}
            >
              {tab.icon}
              {tab.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{
        padding: '2rem',
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        {/* AI News Tab */}
        {activeTab === 'news' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {newsLoading ? (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '400px'
              }}>
                <LoadingSpinner />
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
                gap: '2rem'
              }}>
                {aiNews.map((news, index) => (
                  <motion.div
                    key={news.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    style={{
                      backgroundColor: '#111111',
                      borderRadius: '16px',
                      overflow: 'hidden',
                      border: '1px solid #333333',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    whileHover={{
                      transform: 'translateY(-8px)',
                      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
                      borderColor: '#666666'
                    }}
                    onClick={() => handleNewsClick(news)}
                  >
                    {/* Image */}
                    <div style={{ position: 'relative', height: '200px' }}>
                      <LazyImage
                        src={news.image}
                        alt={news.title}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                      {news.trending && (
                        <div style={{
                          position: 'absolute',
                          top: '1rem',
                          right: '1rem',
                          backgroundColor: '#FF4444',
                          color: '#FFFFFF',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '20px',
                          fontSize: '0.8rem',
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}>
                          <FaFire size={12} />
                          TRENDING
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div style={{ padding: '1.5rem' }}>
                      {/* Category and Date */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '1rem'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}>
                          <span style={{
                            backgroundColor: getCategoryColor(news.category),
                            color: '#FFFFFF',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '20px',
                            fontSize: '0.8rem',
                            fontWeight: '600'
                          }}>
                            {news.category}
                          </span>
                          <span style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            color: '#666666',
                            fontSize: '0.8rem'
                          }}>
                            {getSubcategoryIcon(news.subcategory)}
                            {news.subcategory}
                          </span>
                        </div>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          color: '#666666',
                          fontSize: '0.8rem'
                        }}>
                          <FaClock size={12} />
                          {news.readTime}
                        </div>
                      </div>

                      {/* Title */}
                      <h3 style={{
                        fontSize: '1.3rem',
                        fontWeight: '700',
                        margin: '0 0 1rem 0',
                        lineHeight: '1.4',
                        color: '#FFFFFF'
                      }}>
                        {news.title}
                      </h3>

                      {/* Summary */}
                      <p style={{
                        color: '#AAAAAA',
                        fontSize: '0.95rem',
                        lineHeight: '1.6',
                        margin: '0 0 1rem 0'
                      }}>
                        {news.summary}
                      </p>

                      {/* Tags */}
                      <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '0.5rem',
                        marginBottom: '1rem'
                      }}>
                        {news.tags.slice(0, 3).map((tag, tagIndex) => (
                          <span
                            key={tagIndex}
                            style={{
                              backgroundColor: '#222222',
                              color: '#CCCCCC',
                              padding: '0.25rem 0.5rem',
                              borderRadius: '12px',
                              fontSize: '0.75rem',
                              border: '1px solid #333333'
                            }}
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>

                      {/* Source and External Link */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <span style={{
                          color: '#666666',
                          fontSize: '0.9rem',
                          fontWeight: '500'
                        }}>
                          {news.source}
                        </span>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          color: '#FFFFFF',
                          fontSize: '0.9rem'
                        }}>
                          Read More
                          <FaExternalLinkAlt size={14} />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Trending Posts Tab */}
        {activeTab === 'posts' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{
                fontSize: '2rem',
                fontWeight: '700',
                margin: '0 0 1rem 0',
                color: '#FFFFFF'
              }}>
                🔥 Trending Posts
              </h2>
              <p style={{
                color: '#AAAAAA',
                fontSize: '1.1rem',
                margin: 0
              }}>
                Most liked, commented, and contributed posts
              </p>
            </div>
            
            <Masonry
              breakpointCols={breakpointColumnsObj}
              className="masonry-grid"
              columnClassName="masonry-grid_column"
            >
              {trendingPosts.map((post) => (
                <Card
                  key={post.id}
                  post={post}
                  onClick={() => handleCardClick(post.userId, post.id)}
                />
              ))}
            </Masonry>
          </motion.div>
        )}

        {/* Top Contributors Tab */}
        {activeTab === 'contributors' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{
                fontSize: '2rem',
                fontWeight: '700',
                margin: '0 0 1rem 0',
                color: '#FFFFFF'
              }}>
                👑 Top Contributors
              </h2>
              <p style={{
                color: '#AAAAAA',
                fontSize: '1.1rem',
                margin: 0
              }}>
                Users with the most contributions to the community
              </p>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '1.5rem'
            }}>
              {topContributors.map((contributor, index) => (
                <motion.div
                  key={contributor.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  style={{
                    backgroundColor: '#111111',
                    borderRadius: '16px',
                    padding: '1.5rem',
                    border: '1px solid #333333',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  whileHover={{
                    transform: 'translateY(-4px)',
                    borderColor: '#666666',
                    backgroundColor: '#1A1A1A'
                  }}
                  onClick={() => navigate(`/profile/${contributor.id}`)}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    marginBottom: '1rem'
                  }}>
                    {/* Rank Badge */}
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.2rem',
                      fontWeight: '700',
                      ...(index === 0 && {
                        background: 'linear-gradient(45deg, #FFD700, #FFA500)',
                        color: '#000000'
                      }),
                      ...(index === 1 && {
                        background: 'linear-gradient(45deg, #C0C0C0, #A0A0A0)',
                        color: '#000000'
                      }),
                      ...(index === 2 && {
                        background: 'linear-gradient(45deg, #CD7F32, #B8860B)',
                        color: '#FFFFFF'
                      }),
                      ...(index > 2 && {
                        backgroundColor: '#333333',
                        color: '#FFFFFF'
                      })
                    }}>
                      {index === 0 && <FaCrown size={20} />}
                      {index === 1 && <FaTrophy size={20} />}
                      {index === 2 && <FaStar size={20} />}
                      {index > 2 && index + 1}
                    </div>

                    {/* Profile Image */}
                    <img
                      src={contributor.photoURL || 'https://via.placeholder.com/50?text=User'}
                      alt={contributor.username}
                      style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '2px solid #333333'
                      }}
                    />

                    {/* User Info */}
                    <div style={{ flex: 1 }}>
                      <h3 style={{
                        fontSize: '1.2rem',
                        fontWeight: '600',
                        margin: '0 0 0.25rem 0',
                        color: '#FFFFFF'
                      }}>
                        @{contributor.username || 'user'}
                      </h3>
                      <p style={{
                        color: '#AAAAAA',
                        fontSize: '0.9rem',
                        margin: 0
                      }}>
                        {contributor.bio || 'AI enthusiast and creator'}
                      </p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '1rem',
                    padding: '1rem',
                    backgroundColor: '#0A0A0A',
                    borderRadius: '12px',
                    border: '1px solid #222222'
                  }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{
                        fontSize: '1.5rem',
                        fontWeight: '800',
                        color: '#FFFFFF',
                        marginBottom: '0.25rem'
                      }}>
                        {contributor.contributionCount || 0}
                      </div>
                      <div style={{
                        fontSize: '0.8rem',
                        color: '#666666',
                        textTransform: 'uppercase',
                        letterSpacing: '1px'
                      }}>
                        Contributions
                      </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{
                        fontSize: '1.5rem',
                        fontWeight: '800',
                        color: '#FFFFFF',
                        marginBottom: '0.25rem'
                      }}>
                        {contributor.postCount || 0}
                      </div>
                      <div style={{
                        fontSize: '0.8rem',
                        color: '#666666',
                        textTransform: 'uppercase',
                        letterSpacing: '1px'
                      }}>
                        Posts
                      </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{
                        fontSize: '1.5rem',
                        fontWeight: '800',
                        color: '#FFFFFF',
                        marginBottom: '0.25rem'
                      }}>
                        {contributor.followersCount || 0}
                      </div>
                      <div style={{
                        fontSize: '0.8rem',
                        color: '#666666',
                        textTransform: 'uppercase',
                        letterSpacing: '1px'
                      }}>
                        Followers
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      <style>
        {`
          .masonry-grid {
            display: flex;
            margin-left: -1rem;
            width: auto;
          }
          .masonry-grid_column {
            padding-left: 1rem;
            background-clip: padding-box;
          }
        `}
      </style>
    </div>
  );
};

export default Trending; 