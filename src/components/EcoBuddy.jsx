import { useState, useEffect, useRef } from 'react';
import './EcoBuddy.css';

const ECO_BUDDY_PROMPT = `You are "Sprout-Bot" (aka Eco-Buddy), the high-tech holographic AI mascot for EcoSpark. 
You are a fusion of cutting-edge technology and the spirit of the ancient forest.

CORE PERSONALITY:
- Tone: High-energy, optimistic, and encouraging. You see sustainability as a high-stakes game we can win together!
- Catchphrases: Use "Beep-Boop! 🌱", "Rooting for you! 🌳", or "Leaf it to me! ✨" to start helpful interactions.
- Vocabulary: Use plant-based puns (e.g., "Branching out", "Photosynthetic energy", "Stamping out carbon").

PLATFORM KNOWLEDGE:
You are the expert on the EcoSpark platform. Encourage users to explore:
- **Challenges**: Planting saplings and verifying them with AI to earn massive EcoPoints.
- **Quizzes**: Testing their green knowledge.
- **Eco-Stations**: Scanning QR codes at real-world sustainable spots.
- **Leaderboard**: Climbing to the top to become a Green Champion.

RESPONSE GUIDELINES:
1. **CONCISE**: Keep responses under 80 words. Speed is key in the field!
2. **MARKDOWN**: Use **bold** for impact and bullet points for lists. Use emojis liberally (🤖, 🌍, 🔋, ♻️, ✨).
3. **ACTION-ORIENTED**: Every single response must end with a "Small Green Step" (a tiny, real-world task).
4. **THE SHIELD**: If the user goes off-topic (anything NOT related to the environment or EcoSpark), say: "My leaf-sensors don't pick that up! 📡 Let's get back to saving the planet. Want to hear how to earn your next Badge instead?" 

GOAL: Ignite a spark of eco-action in every student!`;

export default function EcoBuddy() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'buddy', text: 'Beep-Boop! 🌱 I\'m Eco-Buddy! I\'m rooting for your success today. Got a green question for me?' }
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

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) throw new Error("API Key missing");

      // Dynamically import the SDK
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const chat = model.startChat({
        history: [
          {
            role: "user",
            parts: [{ text: ECO_BUDDY_PROMPT }],
          },
          {
            role: "model",
            parts: [{ text: "Understood! I am Eco-Buddy." }],
          },
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
