import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { fbScanEcoStation } from '../firestore';
import './EcoScan.css';

const VALID_CODES = {
  'ECO_FEST_2024': 'station-fest',
  'GREEN_CAMPUS': 'station-campus',
  'SOLAR_PUNK': 'station-solar',
  'RECYCLE_PRO': 'station-recycle',
  'MEGA_SPARK_10K': 'station-mega'
};

export default function EcoScan({ user, onClose, onUpdate }) {
  const [mode, setMode] = useState('input'); // 'input' or 'scanning'
  const [code, setCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [scannedMega, setScannedMega] = useState(false);
  const qrRef = useRef(null);

  useEffect(() => {
    let html5QrCode = null;

    if (mode === 'scanning') {
      html5QrCode = new Html5Qrcode("reader");
      const config = { fps: 10, qrbox: { width: 250, height: 250 } };

      html5QrCode.start(
        { facingMode: "environment" },
        config,
        (decodedText) => {
          // Success!
          html5QrCode.stop().then(() => {
            processCode(decodedText.trim().toUpperCase());
          }).catch(err => {
            console.error(err);
            processCode(decodedText.trim().toUpperCase());
          });
        },
        (errorMessage) => {
          // ignore scan errors (they happen every frame if no QR seen)
        }
      ).catch(err => {
        console.error("Camera access failed:", err);
        setError("📸 Camera access failed. Please ensure you have given permission.");
      });
    }

    return () => {
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().catch(e => console.error("QR stop error", e));
      }
    };
  }, [mode]);

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    processCode(code.toUpperCase());
  };

  const processCode = async (inputCode) => {
    if (isProcessing) return;
    setIsProcessing(true);
    setError(null);

    // Normalize: strip URLs, trim whitespace, uppercase
    let normalized = inputCode.trim().toUpperCase();
    // If it's a URL (e.g. https://ecospark.web.app?code=ECO_FEST_2024), extract the code param
    try {
      const url = new URL(normalized.toLowerCase());
      const codeParam = url.searchParams.get('code') || url.searchParams.get('station');
      if (codeParam) normalized = codeParam.toUpperCase();
      else {
        // Try extracting from URL path last segment
        const parts = url.pathname.split('/');
        normalized = parts[parts.length - 1].toUpperCase();
      }
    } catch (_) {
      // Not a URL, use as-is
    }
    // Try direct match first, then partial match
    let stationId = VALID_CODES[normalized];
    if (!stationId) {
      const foundKey = Object.keys(VALID_CODES).find(k => normalized.includes(k) || k.includes(normalized));
      stationId = foundKey ? VALID_CODES[foundKey] : null;
    }

    if (!stationId) {
      setError(`❌ Invalid Code. Make sure you're scanning an official EcoSpark QR!`);
      setIsProcessing(false);
      if (mode === 'scanning') {
        setTimeout(() => setMode('input'), 3000);
      }
      return;
    }

    if (user.ecoStations?.includes(stationId)) {
      setError("ℹ️ You've already scanned this Eco-Station!");
      setIsProcessing(false);
      return;
    }

    try {
      const isMega = stationId === 'station-mega';
      await fbScanEcoStation(user.uid, stationId, isMega ? 10000 : 100);
      setScannedMega(isMega);
      setSuccess(true);
      setTimeout(() => {
        onUpdate?.();
        onClose();
      }, 2000);
    } catch (err) {
      setError("⚠️ Verification failed. Please check your connection.");
    } finally {
      setIsProcessing(false);
    }
  };

  const startScanning = () => {
    setMode('scanning');
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
            <p>{scannedMega ? '+10,000' : '+100'} EcoPoints Earned</p>
            <div className="success-badge">📍 {scannedMega ? 'Mega Spark Unlocked!' : 'Eco Explorer Badge Unlocked!'}</div>
          </div>
        ) : mode === 'scanning' ? (
          <div className="scanner-view">
            <div id="reader" className="scanner-frame" />
            
            <div className="scanner-status">
              {isProcessing ? 'Verifying Code...' : 'Searching for QR Code...'}
            </div>
            
            {error && <div className="ecoscan-error">{error}</div>}
            
            <button className="btn-outline" onClick={() => setMode('input')} style={{width: '100%'}}>
              Cancel Scanning
            </button>
          </div>
        ) : (
          <div className="ecoscan-content">
            <button className="btn-primary scan-btn" onClick={startScanning}>
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
