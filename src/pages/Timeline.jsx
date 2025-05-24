import { motion, useAnimation } from 'framer-motion';
import { useEffect, useState } from 'react';
import Card from '../components/Card';

function Timeline() {
  const [timelineEvents, setTimelineEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTimeline = async () => {
      setLoading(true);
      try {
        const res = await fetch('http://localhost:5000/api/timeline');
        const data = await res.json();
        const sortedEvents = data.sort((a, b) => new Date(b.date) - new Date(a.date));
        setTimelineEvents(sortedEvents);
      } catch (error) {
        console.error('Error fetching timeline:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTimeline();
  }, []);

  const controls = useAnimation();

  useEffect(() => {
    const handleScroll = () => {
      const events = document.querySelectorAll('.timeline-event');
      events.forEach((event) => {
        const rect = event.getBoundingClientRect();
        if (rect.top <= window.innerHeight * 0.8) {
          controls.start('visible');
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [controls]);

  const eventVariants = {
    hidden: { opacity: 0, x: -50 },
    visible: (i) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: i * 0.3,
        duration: 0.8,
        ease: "easeOut",
      },
    }),
  };

  return (
    <>
      <style>
        {`
          .timeline-container {
            color: #ffffff;
            background: linear-gradient(180deg, #0a0a23 0%, #1a1a40 100%);
            padding: 3rem 1rem;
            min-height: 100vh;
            position: relative;
            overflow: hidden;
          }

          .timeline-header {
            text-align: center;
            padding: 3rem 0;
          }

          .timeline-header h1 {
            font-size: 3rem;
            font-weight: 900;
            background: linear-gradient(90deg, #60a5fa, #f472b6);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            text-shadow: 0 0 20px rgba(96, 165, 250, 0.7);
            margin-bottom: 1rem;
          }

          .timeline {
            max-width: 800px;
            margin: 0 auto;
            position: relative;
          }

          .timeline::before {
            content: '';
            position: absolute;
            left: 50%;
            top: 0;
            width: 2px;
            height: 100%;
            background: linear-gradient(180deg, #60a5fa, #f472b6);
            box-shadow: 0 0 10px rgba(96, 165, 250, 0.5);
            transform: translateX(-50%);
          }

          .timeline-event {
            display: flex;
            align-items: center;
            margin-bottom: 2rem;
            position: relative;
          }

          .timeline-event:nth-child(odd) {
            flex-direction: row-reverse;
          }

          .timeline-date {
            flex: 1;
            text-align: center;
            font-size: 1.2rem;
            color: #d1d5db;
            text-shadow: 0 0 5px rgba(96, 165, 250, 0.5);
          }

          .timeline-card {
            flex: 2;
          }

          .timeline-event::after {
            content: '';
            position: absolute;
            left: 50%;
            width: 16px;
            height: 16px;
            background: #60a5fa;
            border-radius: 50%;
            box-shadow: 0 0 10px rgba(96, 165, 250, 0.7);
            transform: translateX(-50%);
            z-index: 1;
          }

          .loading {
            text-align: center;
            color: #9ca3af;
            font-size: 1.2rem;
            padding: 2rem;
          }
        `}
      </style>

      <div className="timeline-container">
        <motion.div
          className="timeline-header"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <h1>Your Timeline</h1>
        </motion.div>

        <div className="timeline">
          {loading ? (
            <p className="loading">Loading...</p>
          ) : (
            timelineEvents.map((event, index) => (
              <motion.div
                key={event.id}
                className="timeline-event"
                custom={index}
                initial="hidden"
                animate={controls}
                variants={eventVariants}
              >
                <div className="timeline-date">{event.date}</div>
                <div className="timeline-card">
                  <Card
                    id={event.id}
                    media={event.media}
                    title={event.title}
                    prompt={event.prompt}
                    type={event.type}
                    username={event.username}
                    modelName={event.modelName}
                    realImage={event.realImage}
                    comments={event.comments}
                  />
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </>
  );
}

export default Timeline;