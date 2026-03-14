import { useState } from 'react';
import './OnboardingModal.css';

const STEPS = [
  {
    icon: '🌱',
    title: 'Welcome to EcoSpark!',
    desc: "India's #1 gamified environmental learning platform. You're about to become an Eco Hero!",
    highlight: null,
  },
  {
    icon: '📚',
    title: 'Learn & Earn',
    desc: 'Complete interactive lessons on climate, water, waste, and biodiversity. Each lesson earns you EcoPoints!',
    highlight: '📚 Go to Learn',
  },
  {
    icon: '🎯',
    title: 'Real-World Challenges',
    desc: 'Plant trees, segregate waste, cycle to school — real eco-actions earn big points and exclusive badges.',
    highlight: '🎯 See Challenges',
  },
  {
    icon: '🏆',
    title: 'Climb the Leaderboard',
    desc: 'Compete with students across India. Your school\'s rank matters — spread the green spirit!',
    highlight: '🏆 View Leaderboard',
  },
  {
    icon: '🚀',
    title: "You're all set!",
    desc: "Start your eco journey now. Remember: every small action counts towards a greener India. Let's go!",
    highlight: null,
  },
];

export default function OnboardingModal({ onClose }) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div className="onb-overlay">
      <div className="onb-modal glass-card">
        {/* Progress dots */}
        <div className="onb-dots">
          {STEPS.map((_, i) => (
            <div key={i} className={`onb-dot ${i === step ? 'active' : i < step ? 'done' : ''}`} />
          ))}
        </div>

        {/* Content */}
        <div className="onb-icon" key={step}>{current.icon}</div>
        <h2 className="onb-title" key={`t-${step}`}>{current.title}</h2>
        <p className="onb-desc" key={`d-${step}`}>{current.desc}</p>

        {current.highlight && (
          <div className="onb-highlight">{current.highlight}</div>
        )}

        {/* Actions */}
        <div className="onb-actions">
          {step > 0 && (
            <button className="btn-outline onb-back" onClick={() => setStep(s => s - 1)}>
              ← Back
            </button>
          )}
          {isLast ? (
            <button className="btn-primary onb-next" onClick={onClose} id="onboarding-finish-btn">
              🌍 Start Eco Journey!
            </button>
          ) : (
            <button className="btn-primary onb-next" onClick={() => setStep(s => s + 1)} id={`onboarding-next-${step}`}>
              Next →
            </button>
          )}
        </div>

        {!isLast && (
          <button className="onb-skip" onClick={onClose}>Skip intro</button>
        )}
      </div>
    </div>
  );
}
