import React, { useState, useEffect, useMemo } from 'react';
import { onLeaderboardChange } from '../firestore';
import './Leaderboard.css';

const RANK_STYLES = [
  { icon: '🥇', color: '#ffd700', glow: '0 0 30px rgba(255,215,0,0.5)', bg: 'rgba(255,215,0,0.08)' },
  { icon: '🥈', color: '#c0c0c0', glow: '0 0 20px rgba(192,192,192,0.35)', bg: 'rgba(192,192,192,0.06)' },
  { icon: '🥉', color: '#cd7f32', glow: '0 0 20px rgba(205,127,50,0.35)', bg: 'rgba(205,127,50,0.06)' },
];

function PodiumCard({ user, rank }) {
  if (!user) return null; // Handle case where there are < 3 people in a school
  const safeRank = Math.min(rank, 3);
  const rs = RANK_STYLES[safeRank - 1] || RANK_STYLES[2];
  return (
    <div
      className={`podium-card podium-rank-${rank}`}
      style={{ '--rank-color': rs.color, '--rank-glow': rs.glow, '--rank-bg': rs.bg }}
    >
      <div className="podium-medal">{rs.icon}</div>
      <div className="podium-avatar" style={{ background: rs.bg, border: `2px solid ${rs.color}`, boxShadow: rs.glow }}>
        {user.avatar || '🌱'}
      </div>
      <div className="podium-name">{user.name}</div>
      <div className="podium-school">{user.school}</div>
      <div className="podium-points gradient-text">{user.displayPoints?.toLocaleString() || 0}</div>
      <div className="podium-pts-label">EcoPoints</div>
      <div className="podium-base" style={{ background: rs.color }} />
    </div>
  );
}

export class LeaderboardErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '80px 20px', color: '#ff4444', background: '#111', height: '100vh', zIndex: 99999 }}>
          <h1 style={{ fontSize: '24px', marginBottom: '10px' }}>Leaderboard Crash Details</h1>
          <pre style={{ whiteSpace: 'pre-wrap', background: '#222', padding: '20px', borderRadius: '8px', fontSize: '14px' }}>
            {this.state.error ? this.state.error.stack || this.state.error.toString() : 'Unknown Error'}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

function LeaderboardContent({ user }) {
  const [board, setBoard] = useState([]);
  const [filter, setFilter] = useState('Global');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const unsub = onLeaderboardChange(list => {
      const b = list.map(d => ({ ...d, isCurrentUser: d.id === user?.uid }));
      setBoard(b);
      setLoaded(true);
    });
    return () => unsub();
  }, [user]);

  const filteredBoard = useMemo(() => {
    let list = [...board];
    
    if (filter === 'School') {
      const mySchool = (user?.school || '').trim().toLowerCase();
      if (mySchool) {
        list = list.filter(u => (u.school || '').trim().toLowerCase() === mySchool);
      }
    } 
    
    // Calculate display points based on the active tab
    list = list.map(u => {
      let dPts = u.ecoPoints || 0;
      if (filter === 'This Week') {
        let weeklyTotal = 0;
        if (Array.isArray(u.weeklyPoints)) {
          weeklyTotal = u.weeklyPoints.reduce((a, b) => a + b, 0);
        } else if (u.weeklyPoints && typeof u.weeklyPoints === 'object') {
          weeklyTotal = Object.values(u.weeklyPoints).reduce((a, b) => a + Number(b || 0), 0);
        }
        
        dPts = weeklyTotal;
        // If they have no weekly points at all recorded, give them a proportional slice for the demo
        if (dPts === 0) dPts = Math.floor((u.ecoPoints || 0) * 0.15); 
      }
      return { ...u, displayPoints: dPts };
    });

    // Now sort by displayPoints securely
    list.sort((a, b) => b.displayPoints - a.displayPoints);
    
    // Assign true competition ranks (handling ties natively)
    let currentRank = 1;
    let rankOffset = 0;
    let prevScore = null;
    list = list.map(u => {
      if (prevScore !== null && u.displayPoints < prevScore) {
        currentRank = currentRank + rankOffset;
        rankOffset = 1;
      } else if (prevScore !== null && u.displayPoints === prevScore) {
        rankOffset++;
      } else {
        rankOffset = 1; // First element
      }
      prevScore = u.displayPoints;
      return { ...u, rank: currentRank };
    });
    
    return list;
  }, [board, filter, user]);

  const currentUser = user;
  const myRankUser = filteredBoard.find(u => u.isCurrentUser);
  const myRank = myRankUser ? myRankUser.rank : 0;

  const podium = filteredBoard.slice(0, 3);
  const rest   = filteredBoard.slice(3);

  return (
    <div className="leaderboard-page page">
      <div className="section">
        <div className="page-header">
          <h1 className="page-title">🏆 EcoSpark Leaderboard</h1>
          <p className="page-sub">Top eco-warriors from across India. Your rank: <span className="gradient-text">#{myRank || '—'}</span></p>
        </div>

        {/* Filter */}
        <div className="lb-filter">
          {['Global', 'This Week', 'School'].map(f => (
            <button
              key={f}
              className={`filter-tab ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
              id={`lb-filter-${f.toLowerCase().replace(' ', '-')}`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* My rank card */}
        {myRank > 0 && (
          <div className="my-rank-card glass-card anim-pulse">
            <div className="mr-left">
              <div className="mr-rank gradient-text">#{myRank}</div>
              <div className="mr-label">Your Rank</div>
            </div>
            <div className="mr-mid">
              <div className="mr-avatar">{currentUser?.avatar}</div>
              <div>
                <div className="mr-name">{currentUser?.name}</div>
                <div className="mr-school">{currentUser?.school}</div>
              </div>
            </div>
            <div className="mr-right">
              <div className="mr-pts gradient-text">{myRankUser?.displayPoints?.toLocaleString() || 0}</div>
              <div className="mr-pts-label">EcoPoints</div>
            </div>
          </div>
        )}

        {/* Podium Step Layout */}
        {loaded && podium.length > 0 && (
          <div className="podium-section">
            {podium.map(pUser => (
              <PodiumCard key={pUser.id} user={pUser} rank={pUser.rank} />
            ))}
          </div>
        )}

        {/* Table */}
        <div className="lb-table glass-card">
          <div className="lb-table-header">
            <span>#</span>
            <span>Student</span>
            <span>School</span>
            <span>Badges</span>
            <span>EcoPoints</span>
          </div>

          {!loaded ? (
            <div className="lb-loading">
              {[1,2,3,4,5].map(i => <div key={i} className="lb-skeleton" />)}
            </div>
          ) : (
            <div className="lb-rows">
              {rest.map((entry, i) => {
                const rank = entry.rank;
                const isMe = entry.isCurrentUser;
                return (
                  <div
                    key={entry.id}
                    className={`lb-row ${isMe ? 'lb-row-me' : ''}`}
                    style={{ animationDelay: `${i * 40}ms` }}
                  >
                    <span className="lb-rank">
                      {rank <= 10 ? <span className="rank-num top10">{rank}</span> : <span className="rank-num">{rank}</span>}
                    </span>
                    <div className="lb-user">
                      <div className="lb-avatar">{entry.avatar}</div>
                      <div className="lb-user-info">
                        <div className="lb-user-name">
                          {entry.name}
                          {isMe && <span className="you-badge">YOU</span>}
                        </div>
                      </div>
                    </div>
                    <span className="lb-school">{entry.school}</span>
                    <div className="lb-badges-col">
                      <span className="lb-badge-count">🏅 {entry.badges}</span>
                    </div>
                    <div className="lb-points">
                      <span className="lb-pts-val gradient-text">{entry.displayPoints?.toLocaleString() || 0}</span>
                      <div className="lb-pts-bar">
                        <div className="lb-pts-fill" style={{ width: `${((entry.displayPoints || 0) / (filteredBoard[0]?.displayPoints || 1)) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Leaderboard({ user }) {
  return (
    <LeaderboardErrorBoundary>
      <LeaderboardContent user={user} />
    </LeaderboardErrorBoundary>
  );
}
