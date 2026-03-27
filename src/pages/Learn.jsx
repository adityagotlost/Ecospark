import { useState } from 'react';
import { LESSONS } from '../store';
import { fbCompleteLesson } from '../firestore';
import './Learn.css';

function LessonModal({ lesson, user, onClose, onComplete }) {
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const isDone = user?.completedLessons?.includes(lesson.id);

  const handleComplete = async () => {
    await fbCompleteLesson(user.uid, lesson.id, lesson.points);
    setDone(true);
    onComplete();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="lesson-modal glass-card" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} id="lesson-modal-close">✕</button>
        <div className="lm-header" style={{ '--lesson-color': lesson.color }}>
          <div className="lm-icon">{lesson.icon}</div>
          <div>
            <div className="lm-category" style={{ color: lesson.color }}>{lesson.category}</div>
            <h2 className="lm-title">{lesson.title}</h2>
            <div className="lm-meta">
              <span>⚡ +{lesson.points} pts</span>
              <span className={`difficulty-chip diff-${lesson.difficulty.toLowerCase()}`}>{lesson.difficulty}</span>
            </div>
          </div>
        </div>

        <div className="lm-progress-bar">
          <div className="lm-progress-fill" style={{ width: `${((step + 1) / lesson.content.length) * 100}%`, background: lesson.color }} />
        </div>
        <div className="lm-step-count">{step + 1} / {lesson.content.length}</div>

        <div className="lm-content">
          {lesson.content[step].type === 'fact' ? (
            <div className="lm-fact-card">
              <div className="lm-fact-label">💡 Did you know?</div>
              <p>{lesson.content[step].body}</p>
            </div>
          ) : (
            <p className="lm-text">{lesson.content[step].body}</p>
          )}
        </div>

        <div className="lm-actions">
          {step > 0 && (
            <button className="btn-outline" onClick={() => setStep(s => s - 1)} id="lesson-prev-btn">← Prev</button>
          )}
          {step < lesson.content.length - 1 ? (
            <button className="btn-primary" onClick={() => setStep(s => s + 1)} id="lesson-next-btn">Next →</button>
          ) : isDone || done ? (
            <div className="lm-done-msg">✅ Lesson Completed! +{lesson.points} EcoPoints</div>
          ) : (
            <button className="btn-primary" onClick={handleComplete} id="lesson-complete-btn">
              🌱 Complete & Earn {lesson.points} pts
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Learn({ user, onUpdate }) {
  const [active, setActive] = useState(null);
  const [filter, setFilter] = useState('All');

  const categories = ['All', ...new Set(LESSONS.map(l => l.category))];

  const handleUpdate = () => {
    onUpdate?.();
  };

  const DIFFICULTY_ORDER = { Beginner: 0, Intermediate: 1, Advanced: 2 };
  const filtered = (filter === 'All' ? LESSONS : LESSONS.filter(l => l.category === filter))
    .slice()
    .sort((a, b) => (DIFFICULTY_ORDER[a.difficulty] ?? 0) - (DIFFICULTY_ORDER[b.difficulty] ?? 0));

  return (
    <div className="learn-page page">
      <div className="section">
        <div className="page-header">
          <h1 className="page-title">📚 Environmental Learning Hub</h1>
          <p className="page-sub">Interactive lessons aligned with NEP 2020 & India's sustainability goals</p>
        </div>

        {/* Filter tabs */}
        <div className="filter-tabs">
          {categories.map(c => (
            <button
              key={c}
              className={`filter-tab ${filter === c ? 'active' : ''}`}
              onClick={() => setFilter(c)}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Lesson grid */}
        <div className="lessons-grid">
          {filtered.map((l, i) => {
            const done = user?.completedLessons?.includes(l.id);
            return (
              <div
                key={l.id}
                className={`lesson-card glass-card ${done ? 'lesson-done' : ''}`}
                style={{ '--lesson-color': l.color, animationDelay: `${i * 60}ms` }}
                onClick={() => setActive(l)}
                id={`lesson-card-${l.id}`}
              >
                <div className="lc-done-badge">{done ? '✅' : ''}</div>
                <div className="lc-icon" style={{ background: `${l.color}18` }}>{l.icon}</div>
                <div className={`difficulty-chip diff-${l.difficulty.toLowerCase()}`}>{l.difficulty}</div>
                <h3 className="lc-title">{l.title}</h3>
                <p className="lc-category">{l.category}</p>
                <div className="lc-meta">
                  <span style={{ color: l.color }}>⚡ +{l.points} pts</span>
                </div>
                <div className="lc-bar">
                  <div className="lc-bar-fill" style={{ width: done ? '100%' : '0%', background: l.color }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {active && (
        <LessonModal
          lesson={active}
          user={user}
          onClose={() => setActive(null)}
          onComplete={() => { handleUpdate(); }}
        />
      )}
    </div>
  );
}
