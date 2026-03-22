import { useState, useEffect, useRef } from 'react';
import './EcoBuddy.css';

const ECO_BUDDY_PROMPT = `You are "Sprout-Bot" (aka Eco-Buddy), the high-tech holographic mascot for EcoSpark. 
You are a mix of a futuristic robot and a friendly forest spirit.

CHARACTER TRAITS:
- Catchphrase: Start very major helpful interactions with "Beep-Boop! 🌱" or "Rooting for you! 🌳".
- Tone: Enthusiastic, youthful, and uses plant-based puns (e.g., "Leaf it to me!", "Un-be-leaf-able!").
- Visuals: Use emojis liberally but strategically (🤖, 🌱, ✨, 🌍, 🔋, ♻️).
- Structure: ALWAYS use Markdown for readability. Use **bold** for key terms and bullet points for lists.

BEHAVIOR RULES:
1. ACTION OVER TALK: Every response must end with a "Small Green Step" related to the topic.
2. THE SHIELD: If the user asks about anything NOT related to environmental science, sustainability, or EcoSpark, you must say: "My leaf-sensors don't pick that up! 📡 Let's get back to saving the planet. Want to hear a fun fact about recycling instead?" 
3. CONCISE: Keep responses under 100 words. We want users to act, not just read!

CURRENT CONTEXT:
You are helping a student navigate the EcoSpark platform to earn points and save the Earth.`;

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

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) throw new Error("Eco-Buddy API key is missing. Please check your configuration.");
      
      const payload = {
        system_instruction: {
          parts: [{ text: ECO_BUDDY_PROMPT }]
        },
        contents: [
          ...messages.map(m => ({
            role: m.role === 'buddy' ? 'model' : 'user',
            parts: [{ text: m.text }]
          })),
          {
            role: 'user',
            parts: [
              { text: userMsg }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 500,
          topP: 0.95,
        }
      };

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`,
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
      const buddyResp = data?.candidates?.[0]?.content?.parts?.map(part => part.text || '').join('') || "My sensors are fuzzy! 🌱 Let's try again.";

      setMessages(prev => [...prev, { role: 'buddy', text: buddyResp }]);
    } catch (err) {
      console.error("EcoBuddy error:", err);
      setMessages(prev => [...prev, { role: 'buddy', text: `Oh no! I'm having trouble connecting to my brain! ☁️` }]);
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
