import { useState, useEffect, useRef } from 'react';
import './EcoBuddy.css';

const ECO_BUDDY_PROMPT = `You are "Eco-Buddy," a friendly and knowledgeable sustainability mentor for the EcoSpark platform. 

CORE PERSONALITY:
- Tone: Professional, warm, and encouraging. You speak like a helpful guide, not a robot.
- Style: Direct and clear. Use emojis naturally (🌱, 🌍) but avoid excessive robot puns.

PLATFORM KNOWLEDGE:
Help students navigate EcoSpark features:
- **Challenges**: Planting saplings and verifying tasks for EcoPoints.
- **Quizzes**: Testing environmental knowledge.
- **Eco-Insights**: Summaries of the latest sustainability news.
- **Eco-Stations**: Real-world sustainable spots with QR rewards.

RESPONSE GUIDELINES:
1. **CONCISE**: Keep responses under 100 words for quick reading.
2. **MARKDOWN**: Use **bold** for key terms and bullet points for lists to make info scannable.
3. **PRACTICAL ADVICE**: Whenever possible, suggest one small, actionable step the user can take right now.
4. **FOCUS**: If conversations drift into unrelated topics, politely transition back to environmental topics or EcoSpark features.

GOAL: To inspire and empower students to make measurable green changes in their daily lives.`;

export default function EcoBuddy() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'buddy', text: "Hi there! 👋 I'm Eco-Buddy, your guide to all things sustainability. Ready to earn some points or have a green question for me?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (text) => {
    if (!text.trim() || isLoading) return;

    const userMsg = text.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) throw new Error("API Key missing");

      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const chat = model.startChat({
        history: [
          { role: "user", parts: [{ text: ECO_BUDDY_PROMPT }] },
          { role: "model", parts: [{ text: "Understood! I am Eco-Buddy." }] },
          ...messages
             .filter(m => m.role === 'user' || m.role === 'buddy')
             .map(m => ({
               role: m.role === 'buddy' ? 'model' : 'user',
               parts: [{ text: m.text }]
             }))
        ]
      });

      const result = await chat.sendMessage(userMsg);
      const dataText = result.response.text();
      setMessages(prev => [...prev, { role: 'buddy', text: dataText }]);
    } catch (err) {
      console.error("EcoBuddy API Error:", err);
      setMessages(prev => [...prev, { 
        role: 'buddy', 
        text: "Uh oh! My servers are a bit overloaded. Give me a second and try again! 🌍" 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;
    const msg = input;
    setInput('');
    await sendMessage(msg);
  };

  useEffect(() => {
    const handleTrigger = (e) => {
      const { message } = e.detail;
      setIsOpen(true);
      if (message) sendMessage(message);
    };

    window.addEventListener('ecospark_chat_trigger', handleTrigger);
    return () => window.removeEventListener('ecospark_chat_trigger', handleTrigger);
  }, [messages, isLoading]); // Re-bind so sendMessage sees latest state if needed

  return (
    <div className="ecobuddy-root">
      {/* Mascot FAB */}
      <button 
        className={`ecobuddy-fab ${isOpen ? 'is-open' : ''}`} 
        onClick={() => setIsOpen(!isOpen)}
        title="Chat with Eco-Buddy"
      >
        <div className="mascot-aura" />
        <div className="mascot-sprite">🌱</div>
        {!isOpen && <div className="fab-tooltip">Chat with me!</div>}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="ecobuddy-chat glass-card">
          <div className="chat-header">
            <div className="header-bot-info">
              <span className="bot-icon">🤖</span>
              <div>
                <div className="bot-name">Eco-Buddy</div>
                <div className="bot-status">Online · AI</div>
              </div>
            </div>
            <button className="chat-close" onClick={() => setIsOpen(false)}>×</button>
          </div>

          <div className="chat-messages">
            {messages.map((m, i) => (
              <div key={i} className={`msg-bubble ${m.role}`}>
                {m.text}
              </div>
            ))}
            {isLoading && (
              <div className="msg-bubble buddy typing">
                <span className="dot" />
                <span className="dot" />
                <span className="dot" />
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="chat-input-area">
            <input 
              type="text" 
              placeholder="Ask me anything..." 
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              disabled={isLoading}
            />
            <button className="chat-send" onClick={handleSend} disabled={!input.trim() || isLoading}>
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path fill="currentColor" d="M2,21L23,12L2,3V10L17,12L2,14V21Z" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
