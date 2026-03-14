import { useState } from 'react';
import { QUIZZES } from '../store';
import { fbCompleteQuiz } from '../firestore';
import './Quizzes.css';

function QuizModal({ quiz, user, onClose, onComplete }) {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [answers, setAnswers] = useState([]);

  const q = quiz.questions[current];

  const handleSelect = (idx) => {
    if (answered) return;
    setSelected(idx);
    setAnswered(true);
    const correct = idx === q.answer;
    if (correct) setScore(s => s + 1);
    setAnswers(a => [...a, { selected: idx, correct }]);
  };

  const handleNext = async () => {
    if (current < quiz.questions.length - 1) {
      setCurrent(c => c + 1);
      setSelected(null);
      setAnswered(false);
    } else {
      setFinished(true);
      await fbCompleteQuiz(user.uid, quiz.id, score + (selected === q.answer ? 1 : 0), quiz.questions.length);
      onComplete();
    }
  };

  const finalScore = score + (selected === q.answer ? 1 : 0);
  const pct = Math.round((finalScore / quiz.questions.length) * 100);

  if (finished) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="quiz-modal glass-card" onClick={e => e.stopPropagation()}>
          <div className="quiz-result">
            <div className="result-emoji">{pct >= 75 ? '🎉' : pct >= 50 ? '👍' : '📚'}</div>
            <h2 className="result-title">{pct >= 75 ? 'Excellent!' : pct >= 50 ? 'Good Job!' : 'Keep Learning!'}</h2>
            <div className="result-score gradient-text">{finalScore}/{quiz.questions.length}</div>
            <div className="result-pct">{pct}% Correct</div>
            <div className="result-pts">+{Math.round((finalScore/quiz.questions.length)*80)} EcoPoints Earned!</div>
            <button className="btn-primary" onClick={onClose} id="quiz-result-close-btn">Continue →</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="quiz-modal glass-card" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} id="quiz-modal-close">✕</button>

        <div className="quiz-header">
          <div className="quiz-icon">{quiz.icon}</div>
          <div>
            <h2 className="quiz-title">{quiz.title}</h2>
            <div className="quiz-progress-label">{current + 1} / {quiz.questions.length}</div>
          </div>
        </div>

        <div className="quiz-progress-bar">
          <div className="quiz-progress-fill" style={{ width: `${((current + 1) / quiz.questions.length) * 100}%` }} />
        </div>

        <div className="question-card">
          <p className="question-text">{q.q}</p>
        </div>

        <div className="options-grid">
          {q.options.map((opt, i) => (
            <button
              key={i}
              className={`option-btn
                ${answered && i === q.answer ? 'correct' : ''}
                ${answered && i === selected && i !== q.answer ? 'wrong' : ''}
                ${selected === i ? 'selected' : ''}
              `}
              onClick={() => handleSelect(i)}
              id={`quiz-option-${i}`}
              disabled={answered}
            >
              <span className="opt-letter">{String.fromCharCode(65 + i)}</span>
              {opt}
            </button>
          ))}
        </div>

        {answered && (
          <div className={`answer-feedback ${selected === q.answer ? 'fb-correct' : 'fb-wrong'}`}>
            {selected === q.answer ? '✅ Correct! Great job.' : `❌ Wrong. Correct: ${q.options[q.answer]}`}
          </div>
        )}

        {answered && (
          <div className="quiz-actions">
            <button className="btn-primary" onClick={handleNext} id="quiz-next-btn">
              {current < quiz.questions.length - 1 ? 'Next Question →' : 'See Results 🎉'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Quizzes({ user, onUpdate }) {
  const [active, setActive] = useState(null);

  const handleComplete = () => {
    onUpdate?.();
  };

  return (
    <div className="quizzes-page page">
      <div className="section">
        <div className="page-header">
          <h1 className="page-title">🧠 Knowledge Quizzes</h1>
          <p className="page-sub">Test your environmental knowledge and earn EcoPoints</p>
        </div>

        <div className="quizzes-grid">
          {QUIZZES.map((quiz, i) => {
            const attempt = user?.completedQuizzes?.find(q => q.quizId === quiz.id);
            return (
              <div
                key={quiz.id}
                className="quiz-card glass-card"
                onClick={() => setActive(quiz)}
                id={`quiz-card-${quiz.id}`}
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="qc-icon">{quiz.icon}</div>
                <h3 className="qc-title">{quiz.title}</h3>
                <div className="qc-meta">
                  <span>❓ {quiz.questions.length} questions</span>
                  <span>⚡ Up to 80 pts</span>
                </div>
                {attempt ? (
                  <div className="qc-score">
                    <div className="score-bar-track">
                      <div className="score-bar-fill" style={{ width: `${(attempt.score/attempt.total)*100}%` }} />
                    </div>
                    <span className="score-text">{attempt.score}/{attempt.total} · {Math.round((attempt.score/attempt.total)*100)}%</span>
                  </div>
                ) : (
                  <div className="qc-start">Start Quiz →</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {active && (
        <QuizModal
          quiz={active}
          user={user}
          onClose={() => setActive(null)}
          onComplete={handleComplete}
        />
      )}
    </div>
  );
}
