import { useState, useEffect, useRef } from 'react';
import { fbScanEcoStation } from '../firestore';
import './EcoScan.css';

const VALID_CODES = {
  'ECO_FEST_2024': 'station-fest',
  'GREEN_CAMPUS': 'station-campus',
  'SOLAR_PUNK': 'station-solar',
  'RECYCLE_PRO': 'station-recycle'
};

export default function EcoScan({ user, onClose, onUpdate }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [mode, setMode] = useState('input'); // 'input' or 'scanning'
  const [code, setCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (mode === 'scanning') {
      startCamera();
      const timer = setTimeout(() => {
        // Auto-process for the demo after 4 seconds if they haven't manually clicked
        const codes = Object.keys(VALID_CODES);
        const randomCode = codes[Math.floor(Math.random() * codes.length)];
        processCode(randomCode);
      }, 4500);
      return () => {
        clearTimeout(timer);
        stopCamera();
      };
    }
  }, [mode]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access denied:", err);
      setError("📸 Camera access denied. You can still use the manual code above!");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    processCode(code.toUpperCase());
  };

  const processCode = async (inputCode) => {
    if (isProcessing) return;
    setIsProcessing(true);
    setError(null);

    const stationId = VALID_CODES[inputCode];
    
    if (!stationId) {
      setError("❌ Invalid Eco-Station code. Try again!");
      setIsProcessing(false);
      return;
    }

    if (user.ecoStations?.includes(stationId)) {
      setError("ℹ️ You've already scanned this Eco-Station!");
      setIsProcessing(false);
      return;
    }

    try {
      await fbScanEcoStation(user.uid, stationId, 100);
      setSuccess(true);
      setTimeout(() => {
        onUpdate?.();
        onClose();
      }, 2000);
    } catch (err) {
      setError("⚠️ Scanning failed. Please check your connection.");
    } finally {
      setIsProcessing(false);
    }
  };

  const simulateScan = () => {
    setMode('scanning');
    // Randomly pick a code to simulate success
    const codes = Object.keys(VALID_CODES);
    const randomCode = codes[Math.floor(Math.random() * codes.length)];
    
    setTimeout(() => {
      processCode(randomCode);
    }, 2500);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="ecoscan-modal glass-card anim-fade-up" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>

        <div className="ecoscan-header">
          <div className="ecoscan-icon">📡</div>
          <h2 className="ecoscan-title">Eco-Station Scanner</h2>
          <p className="ecoscan-desc">Scan QR codes at physical Eco-Stations to unlock points and badges!</p>
        </div>

        {success ? (
          <div className="ecoscan-success anim-pop">
            <div className="success-icon">🎉</div>
            <h3>Station Verified!</h3>
            <p>+100 EcoPoints Earned</p>
            <div className="success-badge">📍 Eco Explorer Badge Unlocked!</div>
          </div>
        ) : mode === 'scanning' ? (
          <div className="scanner-view">
            <div className="scanner-frame">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className="scanner-video"
              />
              <div className="scanner-line" />
              <div className="scanner-corners">
                <div className="corner tl" /><div className="corner tr" />
                <div className="corner bl" /><div className="corner br" />
              </div>
              <div className="scanner-content">
                <span className="scanner-hint">Point at Eco-Station QR</span>
              </div>
            </div>
            <div className="scanner-status">Searching for Code...</div>
            <p className="scanner-tip">Tip: In this demo, we've simulated a scan for you!</p>
          </div>
        ) : (
          <div className="ecoscan-content">
            <button className="btn-primary scan-btn" onClick={simulateScan}>
              📸 Open QR Scanner
            </button>
            
            <div className="divider"><span>OR ENTER CODE</span></div>

            <form className="manual-form" onSubmit={handleManualSubmit}>
              <input 
                type="text" 
                placeholder="Station Code (e.g. ECO_FEST_2024)"
                value={code}
                onChange={e => setCode(e.target.value)}
                className="form-input code-input"
              />
              <button className="btn-outline submit-btn" disabled={!code.trim() || isProcessing}>
                {isProcessing ? 'Verifying...' : 'Unlock Station'}
              </button>
            </form>

            {error && <div className="ecoscan-error">{error}</div>}
          </div>
        )}
      </div>
    </div>
  );
}
