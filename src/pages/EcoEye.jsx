import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fbAddEcoPoints } from '../firestore';
import './EcoEye.css';

const ECO_EYE_SYSTEM_PROMPT = `Analyze this image for the EcoSpark Sustainability Platform. 
Identify if it relates to environmental conservation, waste management, renewable energy, or plants.
Return a JSON object strictly following this structure:
{
  "isEco": boolean,
  "label": "Name of the object/action",
  "score": number (1-10),
  "tip": "One concise sustainable tip",
  "points": number (suggested points: 50 for common items, 150 for rare/high impact),
  "reason": "Short explanation if not eco-related",
  "isPlant": boolean (true if the image is a plant, tree, or flower),
  "plantUseCases": ["string array of exactly 3 interesting uses (medicinal, environmental, or culinary)"],
  "funFact": "One fascinating fun fact about this plant"
}`;

export default function EcoEye({ user }) {
  const [image, setImage] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result);
        setResult(null);
        setError(null);
        startAIScan(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const startAIScan = async (base64Data) => {
    setIsScanning(true);
    try {
      // Prioritize the separate plant API key if configured, otherwise fallback to the global one
      const apiKey = import.meta.env.VITE_GEMINI_PLANT_API_KEY || import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) throw new Error("API Key missing");

      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      // Clean the base64 string to get only the data part
      const base64Content = base64Data.split(',')[1];

      const result = await model.generateContent([
        ECO_EYE_SYSTEM_PROMPT,
        {
          inlineData: {
            data: base64Content,
            mimeType: "image/jpeg"
          }
        }
      ]);

      const responseText = result.response.text();
      // Extract JSON from the response if the model wraps it in markdown blocks
      const cleanJson = responseText.replace(/```json|```/g, '').trim();
      const aiData = JSON.parse(cleanJson);

      setResult(aiData);

      if (aiData.isEco && aiData.points > 0) {
        await fbAddEcoPoints(user.uid, aiData.points);
      }
    } catch (err) {
      console.error("Eco-Eye Scan Error:", err);
      setError("Failed to analyze image. Please try a clearer photo!");
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="eco-eye-container page-transition">
      <div className="eco-eye-header">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Eco-Eye <span style={{fontSize: '0.8em', opacity: 0.7}}>Scanner</span>
        </motion.h1>
        <div className="header-line" />
        <p style={{color: 'var(--color-text-dim)'}}>Scan real-world objects to earn EcoPoints through AI verification.</p>
      </div>

      <div className="scanner-viewport">
        <div className="scanner-overlay">
          <div className="corner top-left" />
          <div className="corner top-right" />
          <div className="corner bottom-left" />
          <div className="corner bottom-right" />
          {isScanning && <div className="scan-line" />}
        </div>

        <AnimatePresence mode="wait">
          {image ? (
            <motion.img 
              key="preview"
              src={image} 
              alt="Scan Preview" 
              className="preview-img"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            />
          ) : (
            <motion.div 
              key="placeholder"
              className="placeholder-content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <span className="p-icon">👁️</span>
              <p>Place an eco-friendly item or task in view to begin</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="controls-group">
        <input 
          type="file" 
          accept="image/*" 
          capture="environment" // Hint for mobile camera
          style={{ display: 'none' }}
          ref={fileInputRef}
          onChange={handleFileSelect}
        />
        
        <button 
          className="btn-upload" 
          onClick={() => fileInputRef.current.click()}
          disabled={isScanning}
        >
          {isScanning ? (
            <>Processing... 🧬</>
          ) : (
            <>{image ? 'Scan Another Link' : 'Capture / Upload'} 📸</>
          )}
        </button>

        {error && <div className="error-msg" style={{color: '#f87171', marginTop: '1rem'}}>{error}</div>}

        {result && (
          <motion.div 
            className="scan-result-card glass-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="result-header">
              <span className="result-tag">{result.isEco ? '✅ Verified Eco' : '⚠️ Unverified'}</span>
              {result.isEco && <span className="result-points">+ {result.points} PTS</span>}
            </div>
            
            <h3 className="result-title">{result.label}</h3>
            <p className="result-desc">
              {result.isEco ? `Eco Score: ${result.score}/10` : result.reason}
            </p>

            {result.isEco && (
              <div className="tip-box">
                <span className="tip-icon">💡</span>
                <p className="tip-text">{result.tip}</p>
              </div>
            )}

            {result.isPlant && (
              <motion.div 
                className="plant-profile"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ delay: 0.3 }}
              >
                <div className="plant-header">
                  <span className="plant-icon">🌿</span>
                  <h4>Botanical Profile</h4>
                </div>
                
                {result.plantUseCases && result.plantUseCases.length > 0 && (
                  <div className="plant-uses">
                    <h5>Key Benefits & Uses:</h5>
                    <ul className="use-cases-list">
                      {result.plantUseCases.map((use, idx) => (
                        <li key={idx}><span>🌱</span> {use}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.funFact && (
                  <div className="fun-fact-box">
                    <strong>Did you know?</strong> {result.funFact}
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
