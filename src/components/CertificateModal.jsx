import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import './CertificateModal.css';

const today = new Date().toLocaleDateString('en-IN', {
  year: 'numeric', month: 'long', day: 'numeric',
});

function CertificateCard({ cert, user, innerRef }) {
  return (
    <div className="cert-card" ref={innerRef} style={{ '--cert-color': cert.color, '--cert-gradient': cert.gradient }}>
      {/* Decorative border frame */}
      <div className="cert-border-outer">
        <div className="cert-border-inner">

          {/* Header */}
          <div className="cert-header">
            <div className="cert-logo">🌿 EcoSpark</div>
            <div className="cert-org">Tech Sangram · Environmental Initiative</div>
          </div>

          {/* Main seal */}
          <div className="cert-seal-row">
            <div className="cert-seal-line" />
            <div className="cert-seal">
              <div className="cert-seal-icon">{cert.icon}</div>
            </div>
            <div className="cert-seal-line" />
          </div>

          {/* Certificate body */}
          <div className="cert-body">
            <div className="cert-presents">This is to certify that</div>
            <div className="cert-name">{user?.name || 'Eco Hero'}</div>
            <div className="cert-presents">has successfully achieved</div>
            <div className="cert-title" style={{ background: cert.gradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {cert.title}
            </div>
            <div className="cert-subtitle">{cert.subtitle}</div>
            <div className="cert-desc">{cert.description}</div>
          </div>

          {/* Footer */}
          <div className="cert-footer">
            <div className="cert-footer-left">
              <div className="cert-date">{today}</div>
              <div className="cert-date-label">Date of Achievement</div>
            </div>
            <div className="cert-level-badge" style={{ background: `${cert.color}22`, border: `1.5px solid ${cert.color}`, color: cert.color }}>
              {cert.level}
            </div>
            <div className="cert-footer-right">
              <div className="cert-sig">EcoSpark Platform</div>
              <div className="cert-sig-label">Issued by</div>
            </div>
          </div>

          {/* Corner ornaments */}
          <div className="cert-corner tl" />
          <div className="cert-corner tr" />
          <div className="cert-corner bl" />
          <div className="cert-corner br" />
        </div>
      </div>
    </div>
  );
}

export default function CertificateModal({ cert, user, onClose }) {
  const cardRef = useRef(null);
  const [downloading, setDownloading] = useState(false);

  const downloadPNG = async () => {
    if (!cardRef.current || downloading) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: '#050d0a',
        useCORS: true,
        logging: false,
      });
      const link = document.createElement('a');
      link.download = `EcoSpark_Certificate_${cert.id}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (e) {
      console.error('PNG export error:', e);
    } finally {
      setDownloading(false);
    }
  };

  const downloadPDF = async () => {
    if (!cardRef.current || downloading) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: '#050d0a',
        useCORS: true,
        logging: false,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [canvas.width / 2, canvas.height / 2] });
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
      pdf.save(`EcoSpark_Certificate_${cert.id}.pdf`);
    } catch (e) {
      console.error('PDF export error:', e);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="cert-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="cert-modal"
          initial={{ scale: 0.85, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', stiffness: 260, damping: 22 }}
          onClick={e => e.stopPropagation()}
        >
          <CertificateCard cert={cert} user={user} innerRef={cardRef} />

          <div className="cert-actions">
            <button className="cert-btn cert-btn-secondary" onClick={onClose}>✕ Close</button>
            <button
              className="cert-btn cert-btn-outline"
              onClick={downloadPNG}
              disabled={downloading}
              id="cert-download-png"
            >
              {downloading ? '⏳ Generating...' : '🖼️ Download PNG'}
            </button>
            <button
              className="cert-btn cert-btn-primary"
              onClick={downloadPDF}
              disabled={downloading}
              id="cert-download-pdf"
            >
              {downloading ? '⏳ Generating...' : '📄 Download PDF'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
