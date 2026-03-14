import { useState } from 'react';
import { fbAddEcoPoints } from '../firestore';
import './Calculator.css';

const ACTIVITIES = [
  {
    category: '🚗 Transport',
    color: '#ef4444',
    items: [
      { id: 'car_km',       label: 'Car travel per day',          unit: 'km',   co2Factor: 0.21,  tip: 'Try carpooling or public transport!' },
      { id: 'bike_km',      label: 'Motorcycle travel per day',   unit: 'km',   co2Factor: 0.11,  tip: 'Switch to cycling for short trips.' },
      { id: 'flight_hours', label: 'Air travel per year',         unit: 'hours',co2Factor: 90,    tip: 'One less flight saves hundreds of kg CO₂.' },
    ],
  },
  {
    category: '⚡ Energy',
    color: '#f59e0b',
    items: [
      { id: 'electricity',  label: 'Electricity used per month',  unit: 'kWh',  co2Factor: 0.82,  tip: 'Switch to LED bulbs and solar energy!' },
      { id: 'lpg',          label: 'LPG cylinders per month',     unit: 'cylinders', co2Factor: 11.6, tip: 'Use energy-efficient cookware.' },
    ],
  },
  {
    category: '🍽️ Food',
    color: '#22c55e',
    items: [
      { id: 'meat',         label: 'Meat meals per week',         unit: 'meals',co2Factor: 6.6,   tip: 'One meatless day/week = 330 kg CO₂/year less.' },
      { id: 'dairy',        label: 'Dairy servings per day',      unit: 'servings', co2Factor: 3.2, tip: 'Plant-based alternatives have lower footprint.' },
    ],
  },
  {
    category: '🗑️ Waste',
    color: '#00e5c4',
    items: [
      { id: 'waste_kg',     label: 'Waste generated per week',    unit: 'kg',   co2Factor: 0.8,   tip: 'Compost organic waste to reduce methane.' },
      { id: 'plastic',      label: 'Plastic bottles per week',    unit: 'bottles', co2Factor: 0.28, tip: 'Use a reusable water bottle!' },
    ],
  },
];

const INDIA_AVERAGE = 1.9; // tonnes CO2/year per capita
const GLOBAL_AVERAGE = 4.8;

function getRating(tonnes) {
  if (tonnes < 1)   return { label: '🌟 Eco Hero',    color: '#34d364', desc: 'Exceptional! You\'re well below India\'s average.' };
  if (tonnes < 1.9) return { label: '🌿 Eco Friendly', color: '#86efac', desc: 'Great! You\'re below India\'s average footprint.' };
  if (tonnes < 3)   return { label: '🌱 Average',      color: '#fbbf24', desc: 'At India\'s average. Small changes go a long way!' };
  if (tonnes < 5)   return { label: '⚠️ Above Average', color: '#f97316', desc: 'Above average. Consider eco-habits to reduce impact.' };
  return               { label: '🔴 High Impact',    color: '#ef4444', desc: 'High footprint. Please explore our lessons for tips!' };
}

export default function Calculator({ user, onUpdate }) {
  const [values, setValues] = useState({});
  const [result, setResult] = useState(null);
  const [awarded, setAwarded] = useState(false);

  const setValue = (id, val) => setValues(p => ({ ...p, [id]: parseFloat(val) || 0 }));

  const calculate = () => {
    let totalKgCO2PerYear = 0;
    ACTIVITIES.forEach(cat => {
      cat.items.forEach(item => {
        const v = values[item.id] || 0;
        const isYearly = item.unit === 'hours' || item.unit === 'cylinders' && false;
        const multiplier = item.unit === 'km' ? 365
          : item.unit === 'meals' ? 52
          : item.unit === 'servings' ? 365
          : item.unit === 'kg' ? 52
          : item.unit === 'bottles' ? 52
          : item.unit === 'kWh' ? 12
          : item.unit === 'cylinders' ? 12
          : 1; // hours = yearly already
        totalKgCO2PerYear += v * item.co2Factor * multiplier;
      });
    });
    const tonnes = totalKgCO2PerYear / 1000;
    setResult({ tonnes, kgPerDay: totalKgCO2PerYear / 365 });
  };

  const handleAward = () => {
    if (awarded || !user) return;
    fbAddEcoPoints(user.uid, 75).then(() => {
      setAwarded(true);
      onUpdate?.();
    });
  };

  const rating = result ? getRating(result.tonnes) : null;
  const indiaComparePct = result ? Math.min(((result.tonnes / INDIA_AVERAGE) * 100), 200).toFixed(0) : 0;

  const allTips = ACTIVITIES.flatMap(cat =>
    cat.items.filter(item => (values[item.id] || 0) > 0).map(item => item.tip)
  );

  return (
    <div className="calculator-page page">
      <div className="section">
        <div className="page-header">
          <h1 className="page-title">🌍 Carbon Footprint Calculator</h1>
          <p className="page-sub">Discover your environmental impact and get personalized eco-tips</p>
        </div>

        <div className="calc-layout">
          {/* Input panel */}
          <div className="calc-inputs">
            {ACTIVITIES.map((cat, ci) => (
              <div key={ci} className="calc-category glass-card" style={{ '--cat-color': cat.color }}>
                <div className="calc-cat-header">{cat.category}</div>
                {cat.items.map(item => (
                  <div key={item.id} className="calc-item">
                    <label className="calc-item-label">{item.label}</label>
                    <div className="calc-input-row">
                      <input
                        type="number"
                        className="form-input calc-input"
                        placeholder="0"
                        min="0"
                        id={`calc-${item.id}`}
                        value={values[item.id] || ''}
                        onChange={e => setValue(item.id, e.target.value)}
                      />
                      <span className="calc-unit">{item.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
            ))}

            <button className="btn-primary calc-submit" onClick={calculate} id="calc-submit-btn">
              🌍 Calculate My Footprint
            </button>
          </div>

          {/* Result panel */}
          <div className="calc-result-panel">
            {!result ? (
              <div className="calc-placeholder glass-card">
                <div className="calc-ph-icon">🌱</div>
                <h3>Fill in your activities</h3>
                <p>Enter your daily habits on the left to see your carbon footprint and personalized eco-tips!</p>
                <div className="calc-facts">
                  <div className="calc-fact-item">
                    <div className="cfi-val gradient-text">1.9 T</div>
                    <div className="cfi-label">India Average/Year</div>
                  </div>
                  <div className="calc-fact-item">
                    <div className="cfi-val" style={{color:'var(--color-warn)'}}>4.8 T</div>
                    <div className="cfi-label">Global Average/Year</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="calc-result-container">
                {/* Main result */}
                <div className="calc-main-result glass-card">
                  <div className="cmr-label">Your Annual Carbon Footprint</div>
                  <div className="cmr-value gradient-text">{result.tonnes.toFixed(2)}</div>
                  <div className="cmr-unit">tonnes CO₂ / year</div>
                  <div className="cmr-daily">({result.kgPerDay.toFixed(2)} kg per day)</div>

                  <div className="rating-badge" style={{ background: `${rating.color}18`, border: `1px solid ${rating.color}40`, color: rating.color }}>
                    {rating.label}
                  </div>
                  <p className="rating-desc">{rating.desc}</p>
                </div>

                {/* Comparison bars */}
                <div className="calc-compare glass-card">
                  <h3 className="cc-title">📊 How You Compare</h3>
                  <div className="cc-bars">
                    <div className="cc-bar-item">
                      <div className="cc-bar-label">
                        <span>You</span>
                        <span style={{ color: rating.color }}>{result.tonnes.toFixed(1)}T</span>
                      </div>
                      <div className="cc-bar-track">
                        <div className="cc-bar-fill" style={{ width: `${Math.min((result.tonnes / 8) * 100, 100)}%`, background: rating.color }} />
                      </div>
                    </div>
                    <div className="cc-bar-item">
                      <div className="cc-bar-label">
                        <span>🇮🇳 India Average</span>
                        <span style={{color:'var(--color-primary)'}}>1.9T</span>
                      </div>
                      <div className="cc-bar-track">
                        <div className="cc-bar-fill" style={{ width: `${(1.9 / 8) * 100}%`, background: 'var(--color-primary)' }} />
                      </div>
                    </div>
                    <div className="cc-bar-item">
                      <div className="cc-bar-label">
                        <span>🌍 Global Average</span>
                        <span style={{color:'var(--color-warn)'}}>4.8T</span>
                      </div>
                      <div className="cc-bar-track">
                        <div className="cc-bar-fill" style={{ width: `${(4.8 / 8) * 100}%`, background: 'var(--color-warn)' }} />
                      </div>
                    </div>
                    <div className="cc-bar-item">
                      <div className="cc-bar-label">
                        <span>🎯 Paris Agreement Goal</span>
                        <span style={{color:'var(--color-secondary)'}}>2.0T</span>
                      </div>
                      <div className="cc-bar-track">
                        <div className="cc-bar-fill" style={{ width: `${(2.0 / 8) * 100}%`, background: 'var(--color-secondary)' }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Trees needed */}
                <div className="calc-offset glass-card">
                  <h3 className="cc-title">🌳 To Offset Your Footprint</h3>
                  <div className="offset-stats">
                    <div className="offset-stat">
                      <div className="os-val gradient-text">{Math.ceil(result.tonnes * 40)}</div>
                      <div className="os-label">Trees needed / year</div>
                    </div>
                    <div className="offset-stat">
                      <div className="os-val" style={{color:'var(--color-secondary)'}}>{Math.ceil(result.tonnes * 2.4)}</div>
                      <div className="os-label">Months of avg. household electricity</div>
                    </div>
                  </div>
                </div>

                {/* Eco tips */}
                {allTips.length > 0 && (
                  <div className="calc-tips glass-card">
                    <h3 className="cc-title">💡 Your Personalised Eco Tips</h3>
                    <div className="tips-list">
                      {allTips.map((tip, i) => (
                        <div key={i} className="tip-item">
                          <span className="tip-icon">🌱</span>
                          <span>{tip}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Earn points CTA */}
                {!awarded ? (
                  <button className="btn-primary calc-earn-btn" onClick={handleAward} id="calc-earn-pts-btn">
                    ⚡ Claim 75 EcoPoints for Calculating!
                  </button>
                ) : (
                  <div className="calc-earned-msg">✅ +75 EcoPoints Earned! 🎉</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
