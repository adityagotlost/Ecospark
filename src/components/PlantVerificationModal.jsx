import { useState, useRef } from 'react';
import './PlantVerificationModal.css';

const GEMINI_PROMPT = `Analyze this image carefully. Answer ONLY with "TRUE" or "FALSE" and nothing else.

TRUE only if: The image is a real photograph of a newly planted tree sapling or young plant growing in the ground outdoors.

FALSE if any of the following apply:
- It is a drawing, illustration, painting, logo, or graphic design
- It is an indoor potted houseplant
- It is a large, fully-grown tree (not a sapling)
- It does not contain a plant at all
- It is a stock photo or watermarked image

Respond with exactly one word: TRUE or FALSE.`;

export default function PlantVerificationModal({ isOpen, onClose, onVerify }) {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [resultMsg, setResultMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setPreviewUrl(URL.createObjectURL(selected));
      setResultMsg(null);
      setErrorMsg(null);
    }
  };

  const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const verifyPlant = async () => {
    if (!file) {
      setErrorMsg("Please select a photo first.");
      return;
    }

    setIsVerifying(true);
    setResultMsg(null);
    setErrorMsg(null);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

      if (!apiKey) {
        setErrorMsg("AI service is not configured. Please contact support.");
        return;
      }

      const base64Data = await fileToBase64(file);

      const payload = {
        contents: [
          {
            parts: [
              { text: GEMINI_PROMPT },
              {
                inlineData: {
                  mimeType: file.type,
                  data: base64Data,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0,
          maxOutputTokens: 10,
        },
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
        const errData = await response.json();
        console.error('Gemini API error:', errData);
        throw new Error(`API error ${response.status}: ${errData?.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.map(part => part.text || '').join('').trim().toUpperCase();
      console.log('Gemini response:', text);

      if (text === 'TRUE') {
        setResultMsg("✅ Verified! Gemini AI confirmed it's a real outdoor sapling 🌱. Amazing work!");
        setTimeout(() => {
          onVerify();
        }, 1800);
      } else {
        setErrorMsg("❌ Gemini AI couldn't verify this as a real outdoor sapling. Please upload a genuine photo of a newly planted tree in the ground outdoors (no logos, drawings, or indoor plants).");
      }
    } catch (err) {
      console.error("Gemini verification failed:", err);
      setErrorMsg(`Verification failed: ${err.message}. Please try again.`);
    } finally {
      setIsVerifying(false);
    }
  };

  const closeModal = () => {
    setFile(null);
    setPreviewUrl('');
    setResultMsg(null);
    setErrorMsg(null);
    onClose();
  };

  return (
    <div className="plant-modal-overlay">
      <div className="plant-modal glass-card">
        <button className="plant-modal-close" onClick={closeModal}>×</button>

        <div className="plant-modal-header">
          <span className="plant-modal-badge">✨ Powered by Gemini AI</span>
          <h2 className="plant-modal-title">Verify Your Sapling 🌳</h2>
          <p className="plant-modal-desc">
            Upload a real photo of a tree sapling you planted outdoors. Our AI will verify it's the real deal!
          </p>
        </div>

        <div className="plant-modal-content">
          <div className={`plant-upload-box ${previewUrl ? 'has-image' : ''}`}>
            {!previewUrl ? (
              <>
                <input
                  type="file"
                  id="plant-img-upload"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="plant-file-input"
                />
                <label htmlFor="plant-img-upload" className="plant-upload-label">
                  <span className="upload-icon">📸</span>
                  <span className="upload-text">Tap to select photo</span>
                  <span className="upload-hint">Must be a real outdoor sapling</span>
                </label>
              </>
            ) : (
              <div className="plant-preview-wrap">
                <img
                  src={previewUrl}
                  alt="Uploaded plant"
                  className="plant-preview-img"
                />
                <button
                  className="plant-reselect"
                  onClick={() => { setPreviewUrl(''); setFile(null); setResultMsg(null); setErrorMsg(null); }}
                >
                  Change Photo
                </button>
              </div>
            )}
          </div>

          {errorMsg && <div className="plant-msg error">{errorMsg}</div>}
          {resultMsg && <div className="plant-msg success">{resultMsg}</div>}

          <button
            className="btn-primary plant-verify-btn"
            onClick={verifyPlant}
            disabled={!file || isVerifying || !!resultMsg}
          >
            {isVerifying ? (
              <>
                <span className="gemini-spinner" />
                <span>Gemini is analyzing...</span>
              </>
            ) : (
              '🤖 Verify with AI'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
