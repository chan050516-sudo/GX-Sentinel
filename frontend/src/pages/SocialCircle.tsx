import { useState } from "react";
import { Trophy, Gift, Sparkles } from "lucide-react";
import "./SocialCircle.css";

type LeaderboardEntry = { id: string; handle: string; score: number; rank: number; isCurrentUser?: boolean };

export default function SocialCircle() {
  const [showBonusAnimation, setShowBonusAnimation] = useState(false);

  const leaderboard: LeaderboardEntry[] = [
    { id: "1", handle: "@IronSaver", score: 92.5, rank: 1 },
    { id: "2", handle: "@ZenBudget", score: 88.1, rank: 2 },
    { id: "3", handle: "@You", score: 84.2, rank: 3, isCurrentUser: true },
    { id: "4", handle: "@FrugalNinja", score: 82.0, rank: 4 },
    { id: "5", handle: "@CryptoGuy", score: 65.4, rank: 5 },
  ];

  const handleClaimBonus = () => {
    setShowBonusAnimation(true);
    setTimeout(() => setShowBonusAnimation(false), 3500);
  };

  return (
    <div className="social-container">
      <header className="social-header">
        <h2>Social Resilience Circle</h2>
        <p>Leverage social comparison to reinforce your discipline.</p>
      </header>

      <main className="social-main">
        {/* Left Side: Leaderboard */}
        <div className="leaderboard-card">
          <div className="card-header">
            <h3><Trophy size={20} className="header-icon" /> Anonymous Leaderboard</h3>
            <select className="time-filter">
              <option>This Week</option>
              <option>This Month</option>
            </select>
          </div>
          
          <div className="leaderboard-list">
            {leaderboard.map(user => (
              <div key={user.id} className={`leaderboard-item ${user.isCurrentUser ? 'current-user' : ''}`}>
                <div className="rank-badge">#{user.rank}</div>
                <div className="user-info">
                  <span className="handle">{user.handle}</span>
                  {user.isCurrentUser && <span className="you-badge">YOU</span>}
                </div>
                <div className="score-display">
                  <span className="score-value">{user.score}</span>
                  <span className="score-label">pts</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Bonus Packet & Stats */}
        <div className="bonus-stats-column">
          
          <div className="bonus-card">
            <h3><Gift size={20} className="header-icon" /> Weekly Resilience Bonus</h3>
            <p>Maintain a score above 80.0 for 7 consecutive days to unlock a bonus packet.</p>
            
            <div className="bonus-progress">
              <div className="progress-text">
                <span>Streak: 5 / 7 Days</span>
              </div>
              <div className="progress-bar-bg">
                <div className="progress-bar-fill" style={{ width: '71%' }}></div>
              </div>
            </div>

            <button 
              className={`claim-btn ${showBonusAnimation ? 'animating' : ''}`} 
              onClick={handleClaimBonus}
            >
              {showBonusAnimation ? 'Syncing DB...' : 'Simulate DB Sync (Unlock Bonus)'}
            </button>
            
            {showBonusAnimation && (
              <div className="confetti-overlay">
                <div className="confetti-particles">
                  {[...Array(30)].map((_, i) => (
                    <div 
                      key={i} 
                      className="particle" 
                      style={{ 
                        '--delay': `${Math.random() * 0.2}s`, 
                        '--x': `${(Math.random() - 0.5) * 300}px`, 
                        '--y': `${(Math.random() - 0.5) * 300}px`,
                        '--color': i % 3 === 0 ? '#10b981' : i % 3 === 1 ? '#F8326D' : '#771FFF'
                      } as React.CSSProperties}
                    ></div>
                  ))}
                </div>
                <div className="voucher-popup">
                  <div className="voucher-glow"></div>
                  <Gift size={50} className="voucher-icon" />
                  <h4>DB SYNC COMPLETE</h4>
                  <p className="voucher-text"><Sparkles size={18} /> RM 10 Cash Voucher Unlocked! <Sparkles size={18} /></p>
                </div>
              </div>
            )}
          </div>

          <div className="stats-card">
            <h3>Your Standing</h3>
            <div className="stat-grid">
              <div className="stat-box">
                <span className="stat-value top">Top 15%</span>
                <span className="stat-label">In your age group</span>
              </div>
              <div className="stat-box">
                <span className="stat-value">+2.5</span>
                <span className="stat-label">Points this week</span>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
