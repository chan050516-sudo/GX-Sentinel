import { useState } from "react";
import { Users, Gift, Sparkles, Flame, ShieldAlert, Ticket, ShoppingBag } from "lucide-react";
import "./SocialCircle.css";

type SquadMember = {
  id: string;
  handle: string;
  score: number;
  status: "safe" | "warning";
  isCurrentUser?: boolean;
};

/* --- NEW TYPE --- */
type Reward = {
  id: string;
  title: string;
  cost: number;
  icon: string;
  type: string;
};

export default function SocialCircle() {
  const [showBonusAnimation, setShowBonusAnimation] = useState(false);
  const [pinged, setPinged] = useState(false);
  
  /* --- NEW STATE: Point Management --- */
  const [points, setPoints] = useState(150); 
  const [rewards] = useState<Reward[]>([
    { id: "r1", title: "Premium Focus Mode", cost: 100, icon: "⚡", type: "Digital" },
    { id: "r2", title: "$5 Coffee Voucher", cost: 300, icon: "☕", type: "Gift Card" },
    { id: "r3", title: "Squad Badge Pack", cost: 50, icon: "🛡️", type: "Social" },
  ]);

  // 3人小队，EchoFox 处于危险边缘
  const [squad] = useState<SquadMember[]>([
    { id: "1", handle: "NovaKey", score: 92.5, status: "safe" },
    { id: "2", handle: "LunaByte", score: 88.1, status: "safe", isCurrentUser: true },
    { id: "3", handle: "EchoFox", score: 81.2, status: "warning" },
  ]);

  const handlePing = () => {
    setPinged(true);
    setTimeout(() => setPinged(false), 3000);
  };

  const handleClaimBonus = () => {
    setShowBonusAnimation(true);
    // --- NEW LOGIC: Add points when claiming weekly bonus ---
    setTimeout(() => {
      setPoints(prev => prev + 250); 
      setShowBonusAnimation(false);
    }, 3500);
  };

  /* --- NEW LOGIC: Redeem Reward --- */
  const handleRedeem = (cost: number) => {
    if (points >= cost) {
      setPoints(prev => prev - cost);
      alert("Reward Redeemed Successfully!");
    } else {
      alert("Not enough points! Complete the weekly streak to earn more.");
    }
  };

  return (
    <div className="social-container gx-theme">
      <header className="social-header">
        <h2>Social Resilience Circle</h2>
        <p>Discipline is no longer individual. It's socially reinforced.</p>
      </header>

      <main className="social-main">
        {/* Left Side: Cooperative Squad */}
        <div className="squad-card">
          <div className="card-header">
            <h3><Users size={20} className="header-icon" /> Your Accountability Squad</h3>
            <span className="squad-status">Status: <strong className="warning-text">At Risk</strong></span>
          </div>

          <div className="squad-list">
            {squad.map(user => (
              <div key={user.id} className={`squad-member ${user.isCurrentUser ? 'current-user' : ''} ${user.status === 'warning' ? 'warning-state' : ''}`}>

                <div className="member-avatar">
                  {user.handle.charAt(0)}
                </div>

                <div className="member-info">
                  <div className="member-name-row">
                    <span className="handle">{user.handle}</span>
                    {user.isCurrentUser && <span className="you-badge">YOU</span>}
                    {user.status === 'warning' && <ShieldAlert size={14} className="warning-icon" />}
                  </div>
                  <span className="member-status-text">
                    {user.status === 'warning' ? 'Close to losing the streak' : 'Maintaining discipline'}
                  </span>
                </div>

                <div className="member-action-area">
                  <div className="score-display">
                    <span className={`score-value ${user.status === 'warning' ? 'warning-text' : ''}`}>
                      {user.score.toFixed(1)}
                    </span>
                    <span className="score-label">pts</span>
                  </div>

                  {/* 如果队友处于危险边缘，显示 Support Ping 按钮 */}
                  {!user.isCurrentUser && user.status === 'warning' && (
                    <button
                      className={`support-ping-btn ${pinged ? 'pinged' : ''}`}
                      onClick={handlePing}
                      disabled={pinged}
                    >
                      {pinged ? 'Encouragement Sent!' : <><Flame size={16} /> Send Support</>}
                    </button>
                  )}
                </div>

              </div>
            ))}
          </div>

          {/* 系统 Nudge 提示 */}
          <div className="system-nudge-box">
            <ShieldAlert size={20} className="warning-text" />
            <p><strong>System Alert:</strong> EchoFox's score dropped to 81.2. If any member drops below 80, the entire squad loses the weekly bonus.</p>
          </div>
        </div>

        {/* Right Side: Bonus, Stats & Rewards */}
        <div className="bonus-stats-column">

          <div className="bonus-card">
            <div className="bonus-header">
               <h3><Gift size={20} className="header-icon" /> Weekly Squad Bonus</h3>
               {/* --- NEW: Points Display --- */}
               <div className="points-pill">
                  <Sparkles size={14} /> {points} PTS
               </div>
            </div>
            
            <p>If <strong>ALL 3 members</strong> maintain a score above 80.0 for 7 consecutive days, the whole squad unlocks a bonus packet.</p>

            <div className="bonus-progress">
              <div className="progress-text">
                <span>Squad Streak: Day 6 / 7</span>
              </div>
              <div className="progress-bar-bg">
                <div className="progress-bar-fill" style={{ width: '85%' }}></div>
              </div>
            </div>

            <button
              className={`claim-btn ${showBonusAnimation ? 'animating' : ''}`}
              onClick={handleClaimBonus}
            >
              {showBonusAnimation ? 'Syncing...' : 'Simulate Day 7 Win (Unlock Bonus)'}
            </button>

            {showBonusAnimation && (
              <div className="confetti-overlay">
                <div className="confetti-particles">
                  {[...Array(30)].map((_, i) => {
                    const seed = i * 12345 % 10000;
                    const delay = (seed % 200) / 1000;
                    const x = ((seed * 7 % 300) - 150);
                    const y = ((seed * 11 % 300) - 150);
                    return (
                    <div
                      key={i}
                      className="particle"
                      style={{
                        '--delay': `${delay}s`,
                        '--x': `${x}px`,
                        '--y': `${y}px`,
                        '--color': i % 3 === 0 ? '#10b981' : i % 3 === 1 ? '#F8326D' : '#771FFF'
                      } as React.CSSProperties}
                    ></div>
                    );
                  })}
                </div>
                <div className="voucher-popup">
                  <div className="voucher-glow"></div>
                  <Gift size={50} className="voucher-icon" />
                  <h4>SQUAD SURVIVED</h4>
                  <p className="voucher-text"><Sparkles size={18} /> +250 Points Added to Vault! <Sparkles size={18} /></p>
                </div>
              </div>
            )}
          </div>

          {/* --- NEW SECTION: Reward Redemption Vault --- */}
          <div className="stats-card reward-vault">
            <div className="card-header-row">
                <h3><ShoppingBag size={18} className="header-icon" /> Reward Vault</h3>
            </div>
            <div className="reward-list">
              {rewards.map(reward => (
                <div key={reward.id} className="reward-item">
                  <div className="reward-icon-box">{reward.icon}</div>
                  <div className="reward-info">
                    <span className="reward-title">{reward.title}</span>
                    <span className="reward-type">{reward.type}</span>
                  </div>
                  <button 
                    className="redeem-small-btn"
                    onClick={() => handleRedeem(reward.cost)}
                    disabled={points < reward.cost}
                  >
                    {reward.cost} <Ticket size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="stats-card">
            <h3>Circle Impact</h3>
            <div className="stat-grid">
              <div className="stat-box">
                <span className="stat-value top">3</span>
                <span className="stat-label">Support Pings Sent</span>
              </div>
              <div className="stat-box">
                <span className="stat-value warning-text">1</span>
                <span className="stat-label">Day from failure</span>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}