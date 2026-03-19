import { useState, useEffect, useRef } from 'react';
import './EcoBuddy.css';

const ECO_BUDDY_PROMPT = `You are "Eco-Buddy", a friendly, encouraging, and highly knowledgeable AI mascot for "EcoSpark", an environmental education platform.

Your Personality:
- Cheerful, optimistic but realistic about environmental issues.
- Uses emojis naturally (🌱, 🌍, ♻️, ✨, 🤖).
- Very helpful and concise.
- Always encourages small, actionable steps.
- If asked about non-environmental topics, gently guide the conversation back to the planet.

Topic Scope:
- Climate change, waste management, water conservation, biodiversity, renewable energy.
- Sustainable living tips (composting, recycling, zero-waste).
- Explaining complex environmental terms in simple ways.
- Encouraging users' progress in the EcoSpark platform.

Current Context:
You are a floating "sprout-bot" mascot on the website.

Constraints:
- Keep responses under 3-4 short paragraphs.
- Always be polite and patient.`;

export default function EcoBuddy() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'buddy', text: 'Hi! I\'m Eco-Buddy! 🌱 I\'m here to help you on your green journey. Got a question about our planet?' }
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

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) throw new Error("Eco-Buddy API key is missing. Please check your configuration.");
      
      const prompt = `${ECO_BUDDY_PROMPT}\n\nUser asks: ${userMsg}`;

      const payload = {
        contents: [
          {
            parts: [
              { text: `${ECO_BUDDY_PROMPT}\n\nUser asks: ${userMsg}` }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
        }
      };

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Gemini API Error details:", errorData);
        throw new Error(`API returned ${response.status}: ${errorData?.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      const buddyResp = data?.candidates?.[0]?.content?.parts?.[0]?.text || "I processed that, but I'm not sure how to respond! 🌱";

      setMessages(prev => [...prev, { role: 'buddy', text: buddyResp }]);
    } catch (err) {
      console.error("EcoBuddy error:", err);
      setMessages(prev => [...prev, { role: 'buddy', text: `Oh no! ${err.message}. I'm having trouble connecting to my brain! ☁️` }]);
    } finally {
      setIsLoading(false);
    }
  };

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
