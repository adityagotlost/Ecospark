import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { INSIGHTS_TOPICS } from '../store';
import { GoogleGenerativeAI } from '@google/generative-ai';
import './Insights.css';

// Using Google Gemini Flash for fast summaries
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export default function Insights() {
  const [activeTopic, setActiveTopic] = useState(INSIGHTS_TOPICS[0]);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchInsights(activeTopic);
  }, [activeTopic]);

  const fetchInsights = async (topic) => {
    const CACHE_KEY = `insight_${topic}`;
    const TTL = 6 * 60 * 60 * 1000; // 6 hours in ms
    
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < TTL) {
          setInsights(data);
          return;
        }
      } catch (e) {
        console.error("Cache read error", e);
      }
    }

    setLoading(true);
    setError(null);
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const prompt = `Act as an environmental journalism hub for students. 
      Topic: ${topic}. 
      Give me exactly 3 of the most recent global sustainability news summaries. 
      Format: JSON array of objects with {title, body, tag, source}. 
      Rules: 
      1. Each body text MUST be under 30 words (30-second bites). 
      2. Content must be factually based on real recent global trends (e.g., new tech, policy wins, biological discoveries). 
      3. Use a supportive, curious, and professional tone.
      4. Ensure valid JSON only, no other text in response.`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      
      // Clean potential JSON markdown code blocks
      const cleanJson = text.replace(/```json|```/g, '').trim();
      const data = JSON.parse(cleanJson);
      
      if (Array.isArray(data)) {
        setInsights(data);
        localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
      } else {
        throw new Error('Invalid format received');
      }
    } catch (err) {
      console.error('Insights Fetch Error:', err);
      setError("Failed to fetch fresh insights. Using AI cached data if available.");
      // Fallback to dummy data if primary fetch fails
      setInsights([
        { title: `Latest in ${topic}`, body: "We're currently fetching the freshest updates. Check back in a moment for student-focused 30-second bites.", tag: topic, source: "EcoSpark Intelligence" }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="insights-container">
      <motion.div 
        className="insights-header"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1>Eco-Insights Hub</h1>
        <div className="header-line"></div>
        <p>Curated 30-second bites on the latest environmental progress</p>
      </motion.div>

      <div className="topics-bar-container">
        <div className="topics-bar">
          {INSIGHTS_TOPICS.map(topic => (
            <button
              key={topic}
              className={`topic-btn ${activeTopic === topic ? 'active' : ''}`}
              onClick={() => setActiveTopic(topic)}
            >
              {topic}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div 
            key="loader"
            className="insights-grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {[1, 2, 3].map(i => (
              <div key={i} className="insight-card shimmer-card">
                <div className="shimmer-tag"></div>
                <div className="shimmer-title"></div>
                <div className="shimmer-body"></div>
              </div>
            ))}
          </motion.div>
        ) : (
          <motion.div 
            key="grid"
            className="insights-grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            {insights.map((item, idx) => (
              <motion.div 
                key={idx}
                className="insight-card"
                style={{ cursor: 'pointer' }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ y: -8, scale: 1.02, transition: { duration: 0.2 } }}
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('ecospark_chat_trigger', { 
                    detail: { message: `Tell me more about this: ${item.title}. Summary: ${item.body}` } 
                  }));
                }}
              >
                <div className="card-accent" />
                <span className="insight-tag">{item.tag || activeTopic}</span>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
                <div className="insight-footer">
                  <span className="source-pill">Via {item.source || 'EcoSpark Intelligence'}</span>
                  <span className="chat-hint">Chat with Eco-Buddy 💬</span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="insights-footer-info">
        <p>✨ Powered by Gemini 1.5 Flash for real-time sustainability intelligence</p>
      </div>
    </div>
  );
}
