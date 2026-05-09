import { useState } from "react";
import { Users, Gift, Sparkles, Flame, ShieldAlert, Ticket, ShoppingBag, X, AlertTriangle } from "lucide-react";
import "./SocialCircle.css";

type SquadMember = {
  id: string;
  handle: string;
  score: number;
  status: "safe" | "warning";
  isCurrentUser?: boolean;
};

/* --- TYPE --- */
type Reward = {
  id: string;
  title: string;
  cost: number;
  image: string; 
  type: string;
  claimed: boolean; 
};

export default function SocialCircle() {
  const [showBonusAnimation, setShowBonusAnimation] = useState(false);
  const [pinged, setPinged] = useState(false);
  
  const [points, setPoints] = useState(150); 
  
  /* --- STATE: Dynamic Streak Tracking & Weekly Claim Status --- */
  const [streakDay, setStreakDay] = useState(6);
  const [isBonusClaimed, setIsBonusClaimed] = useState(false); 
  
  /* --- NEW STATE: Failure Tracking --- */
  const [streakFailed, setStreakFailed] = useState(false);
  const [showFailurePopup, setShowFailurePopup] = useState(false);
  
  const [claimedReward, setClaimedReward] = useState<Reward | null>(null);

  /* --- STATE: Rewards --- */
  const [rewards, setRewards] = useState<Reward[]>([
    { id: "r1", title: "Iphone 17 Pro Max", cost: 500, image: "/17promax.jpg", type: "Lucky Draw", claimed: false },
    { id: "r2", title: "Domino's Buy 1 Free 3", cost: 300, image: "/domino.jpg", type: "Voucher", claimed: false },
    { id: "r3", title: "KFC Free 1 Drumstick", cost: 100, image: "/kfc.png", type: "Voucher", claimed: false },
    { id: "r4", title: "RM10 Shopee Voucher", cost: 100, image: "/shopee.png", type: "Voucher", claimed: false },
    { id: "r5", title: "Starbucks 30% Off", cost: 70, image: "/starbuck.jpg", type: "Voucher", claimed: false },
    { id: "r6", title: "Zus 30% Off", cost: 70, image: "/zus.png", type: "Voucher", claimed: false },
  ]);

  const [squad, setSquad] = useState<SquadMember[]>([
    { id: "1", handle: "NovaKey", score: 92.5, status: "safe" },
    { id: "2", handle: "LunaByte", score: 88.1, status: "safe", isCurrentUser: true },
    { id: "3", handle: "EchoFox", score: 84.2, status: "warning" },
  ]);

  const handlePing = () => {
    setPinged(true);
    setTimeout(() => setPinged(false), 3000);
  };

  const handleClaimBonus = () => {
    setShowBonusAnimation(true);
  };

  const closePopup = () => {
    setShowBonusAnimation(false);
  };

  const handleConfirmClaim = () => {
    setPoints(prev => prev + 80); 
    setShowBonusAnimation(false);
    setIsBonusClaimed(true); 
  };

  const handleRedeem = (id: string, cost: number) => {
    if (points >= cost) {
      setPoints(prev => prev - cost);
      
      const redeemedItem = rewards.find(r => r.id === id);
      
      setRewards(prevRewards => 
        prevRewards.map(reward => 
          reward.id === id ? { ...reward, claimed: true } : reward
        )
      );
      
      if(redeemedItem) {
        setClaimedReward(redeemedItem);
      }
    } else {
      alert("Not enough points! Complete the weekly streak to earn more.");
    }
  };

  const handleAddDay = () => {
    if (!streakFailed) {
      setStreakDay(prev => (prev < 7 ? prev + 1 : 7));
    }
  };

  const handleNextWeek = () => {
    setStreakDay(1); 
    setIsBonusClaimed(false); 
    setStreakFailed(false);
    setShowFailurePopup(false);
    setRewards(prevRewards => 
      prevRewards.map(reward => ({ ...reward, claimed: false })) 
    );
    setSquad([
      { id: "1", handle: "NovaKey", score: 92.5, status: "safe" },
      { id: "2", handle: "LunaByte", score: 88.1, status: "safe", isCurrentUser: true },
      { id: "3", handle: "EchoFox", score: 84.2, status: "warning" },
    ]);
  };

  const handleAddPoints = () => {
    setPoints(prev => prev + 100);
  };

  const handleAdjustScore = (id: string, delta: number) => {
    setSquad(prevSquad => {
      let breached = false;
      const newSquad = prevSquad.map(member => {
        if (member.id === id) {
          const newScore = Math.max(0, member.score + delta);
          const newStatus: "safe" | "warning" = newScore < 85 ? "warning" : "safe";
          
          if (newScore < 80) breached = true;
          return { ...member, score: newScore, status: newStatus };
        }
        if (member.score < 80) breached = true;
        return member;
      });

      if (breached && !streakFailed) {
        setStreakFailed(true);
        setShowFailurePopup(true);
      }

      return newSquad;
    });
  };

  /* --- MODIFIED LOGIC: Calculate Squad Status (Safe requires >85 individual & >=88 average) --- */
  const averageScore = squad.reduce((sum, member) => sum + member.score, 0) / squad.length;
  const allMembersSafe = squad.every(member => member.score >= 85);

  let squadStatusText = "At Risk";
  let squadStatusClass = "warning-text";

  if (streakFailed) {
    squadStatusText = "Failed";
    squadStatusClass = "error-text";
  } else if (isBonusClaimed) {
    squadStatusText = "Success";
    squadStatusClass = "success-text";
  } else if (averageScore >= 88 && allMembersSafe) {
    squadStatusText = "Safe";
    squadStatusClass = "safe-text";
  }

  return (
    <div className="social-container gx-theme">
      {/* --- Main Header: Buttons Removed from here --- */}
      <header className="social-header">
        <div>
          <h2>Social Resilience Circle</h2>
          <p>Discipline is no longer individual. It&apos;s socially reinforced.</p>
        </div>
      </header>

      <main className="social-main">
        {/* Left Side: Cooperative Squad */}
        <div className="squad-card">
          <div className="card-header">
            <h3><Users size={20} className="header-icon" /> Your Accountability Squad</h3>
            
            <span className="squad-status">
              Status: <strong className={squadStatusClass}>{squadStatusText}</strong>
            </span>

          </div>

          <div className="squad-list">
            {squad.map(user => (
              <div key={user.id} className={`squad-member ${user.isCurrentUser ? 'current-user' : ''} ${user.status === 'warning' ? 'warning-state' : ''} ${user.score < 80 ? 'failed-state' : ''}`}>
                <div className="member-avatar">{user.handle.charAt(0)}</div>
                <div className="member-info">
                  <div className="member-name-row">
                    <span className="handle">{user.handle}</span>
                    {user.isCurrentUser && <span className="you-badge">YOU</span>}
                    {user.status === 'warning' && user.score >= 80 && <ShieldAlert size={14} className="warning-icon" />}
                    {user.score < 80 && <AlertTriangle size={14} className="error-icon" />}
                  </div>
                  <span className="member-status-text">
                    {user.score < 80 ? 'Breached threshold' : user.status === 'warning' ? 'Close to losing the streak' : 'Maintaining discipline'}
                  </span>
                </div>
                <div className="member-action-area">
                  <div className="score-display">
                    <span className={`score-value ${user.score < 80 ? 'error-text' : user.status === 'warning' ? 'warning-text' : ''}`}>{user.score.toFixed(1)}</span>
                    <span className="score-label">pts</span>
                  </div>
                  {!user.isCurrentUser && user.status === 'warning' && user.score >= 80 && (
                    <button className={`support-ping-btn ${pinged ? 'pinged' : ''}`} onClick={handlePing} disabled={pinged}>
                      {pinged ? 'Encouragement Sent!' : <><Flame size={16} /> Send Support</>}
                    </button>
                  )}
                </div>
                <div className="score-adjust-mock">
                  <button onClick={() => handleAdjustScore(user.id, 1)} className="adjust-btn">+</button>
                  <button onClick={() => handleAdjustScore(user.id, -1)} className="adjust-btn">-</button>
                </div>
              </div>
            ))}
          </div>

          <div className="system-nudge-box">
            <ShieldAlert size={20} className="warning-text" />
            <p><strong>System Alert:</strong> If any member drops below 80, the entire squad loses the weekly bonus.</p>
          </div>
        </div>

        {/* Right Side: Bonus, Stats & Rewards */}
        <div className="bonus-stats-column">
          <div className="bonus-card">
            
            {/* --- MODIFIED: Weekly Squad Bonus Header --- */}
            {/* Moved "Add Day" and "Next Week" buttons here, vertically stacked */}
            <div className="bonus-header" style={{ alignItems: 'flex-start' }}>
               <h3><Gift size={20} className="header-icon" /> Weekly Squad Bonus</h3>
               
               <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                 <button 
                   onClick={handleAddDay} 
                   style={{ padding: '0.4rem 0.8rem', borderRadius: '8px', border: '1px solid #10b981', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
                 >
                   + Add Day
                 </button>
                 <button 
                   onClick={handleNextWeek} 
                   style={{ padding: '0.4rem 0.8rem', borderRadius: '8px', border: '1px solid #771FFF', background: 'rgba(119, 31, 255, 0.1)', color: '#fff', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
                 >
                   ⏩ Next Week
                 </button>
               </div>
            </div>
            
            <p>If <strong>ALL 3 members</strong> maintain a score above 80.0 for 7 consecutive days, the whole squad unlocks a bonus packet.</p>

            <div className="bonus-progress">
              <div className="progress-text">
                <span>Squad Streak: Day {streakDay} / 7</span>
              </div>
              <div className="progress-bar-bg">
                <div className={`progress-bar-fill ${streakFailed ? 'failed-bar' : ''}`} style={{ width: `${(streakDay / 7) * 100}%` }}></div>
              </div>
            </div>

            <button
              className={`claim-btn ${showBonusAnimation ? 'animating' : ''} ${streakFailed ? 'failed-btn-state' : ''}`}
              onClick={handleClaimBonus}
              disabled={streakDay < 7 || isBonusClaimed || streakFailed}
            >
              {streakFailed 
                ? "Streak Broken. Try Again Next Week."
                : isBonusClaimed 
                ? "Weekly Reward Claimed. Please Wait for Next Week." 
                : streakDay < 7 
                ? "Complete 7-Day Streak to Unlock Bonus" 
                : "Unlock Weekly Squad Bonus"}
            </button>

            {showBonusAnimation && (
              <div className="confetti-overlay massive-overlay">
                <div className="confetti-particles">
                  {[...Array(50)].map((_, i) => {
                    const seed = i * 12345 % 10000;
                    const delay = (seed % 200) / 1000;
                    const x = ((seed * 7 % 600) - 300); 
                    const y = ((seed * 11 % 600) - 300);
                    return (
                    <div key={i} className="particle" style={{'--delay': `${delay}s`, '--x': `${x}px`, '--y': `${y}px`, '--color': i % 3 === 0 ? '#10b981' : i % 3 === 1 ? '#F8326D' : '#771FFF'} as React.CSSProperties}></div>
                    );
                  })}
                </div>
                
                <div className="voucher-popup massive">
                  <button className="close-popup-btn" onClick={closePopup}>
                    <X size={28} />
                  </button>
                  <div className="voucher-glow massive-glow"></div>
                  <h3 className="congrats-text">CONGRATULATIONS!</h3>
                  <div className="icon-wrap">
                     <Sparkles size={40} className="sparkle-float-left" />
                     <Gift size={100} className="voucher-icon-massive" />
                     <Sparkles size={40} className="sparkle-float-right" />
                  </div>
                  <h2>SQUAD SURVIVED</h2>
                  <p className="voucher-text massive-text">
                    <Sparkles size={24} /> 80 Bonus Points Available! <Sparkles size={24} />
                  </p>
                  <button className="claim-now-btn" onClick={handleConfirmClaim}>
                    Claim 80 Points
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Reward Redemption Vault */}
          <div className="stats-card reward-vault">
            
            {/* --- MODIFIED: GX Reward Header --- */}
            {/* Moved "+ 100 PTS" and "Points Pill" here, aligned to the right side */}
            <div className="card-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0 }}><ShoppingBag size={18} className="header-icon" /> GX Reward</h3>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button 
                    onClick={handleAddPoints} 
                    style={{ padding: '0.4rem 0.6rem', borderRadius: '8px', border: '1px solid #fbbf24', background: 'rgba(251, 191, 36, 0.1)', color: '#fbbf24', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
                  >
                    + 100 PTS
                  </button>
                  <div className="points-pill" style={{ margin: 0 }}>
                    <Sparkles size={14} /> {points} PTS
                  </div>
                </div>
            </div>
            
            <div className="reward-list-scrollable">
              {rewards.map(reward => (
                <div key={reward.id} className={`reward-item ${reward.claimed ? 'is-claimed' : ''}`}>
                  <div className="reward-image-container">
                    <img src={reward.image} alt={reward.title} className="reward-custom-img" />
                  </div>
                  <div className="reward-info">
                    <span className="reward-title">{reward.title}</span>
                    <span className="reward-type">{reward.type}</span>
                  </div>
                  <button 
                    className={`redeem-small-btn ${reward.claimed ? 'claimed-btn-state' : ''}`}
                    onClick={() => handleRedeem(reward.id, reward.cost)}
                    disabled={points < reward.cost || reward.claimed}
                  >
                    {reward.claimed ? "Fully Redeemed" : <>{reward.cost} <Ticket size={12} /></>}
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

        {/* --- STREAK FAILED POPUP --- */}
        {showFailurePopup && (
          <div className="confetti-overlay massive-overlay" style={{ background: 'rgba(20, 0, 5, 0.9)' }}>
            <div className="voucher-popup massive reward-success-popup" style={{ borderColor: 'rgba(244, 63, 94, 0.5)' }}>
              <button className="close-popup-btn right-middle" onClick={() => setShowFailurePopup(false)}><X size={28} /></button>
              <div className="voucher-glow massive-glow" style={{ background: 'radial-gradient(circle, rgba(244, 63, 94, 0.3) 0%, transparent 70%)' }}></div>
              <AlertTriangle size={80} color="#f43f5e" style={{ marginBottom: '1rem', animation: 'heartBeat 1.5s infinite' }} />
              <h2 style={{ color: '#f43f5e', fontSize: '2.5rem', margin: '0' }}>STREAK BROKEN</h2>
              <p className="voucher-text massive-text" style={{ color: '#94a3b8', fontSize: '1.2rem', marginTop: '1.5rem', textAlign: 'center', lineHeight: '1.6' }}>
                A squad member's discipline score dropped below 80.0.<br/>
                The weekly squad bonus has been forfeited.
              </p>
              <button className="claim-now-btn" onClick={() => setShowFailurePopup(false)} style={{ background: 'linear-gradient(135deg, #475569, #334155)', marginTop: '2rem' }}>
                Acknowledge
              </button>
            </div>
          </div>
        )}

        {/* REWARD CLAIMED SUCCESS POPUP */}
        {claimedReward && (
          <div className="confetti-overlay massive-overlay">
            <div className="voucher-popup massive reward-success-popup">
              
              <button className="close-popup-btn right-middle" onClick={() => setClaimedReward(null)}>
                <X size={28} />
              </button>

              <div className="voucher-glow massive-glow"></div>
              
              <h3 className="congrats-text" style={{ color: '#10b981' }}>SUCCESSFULLY REDEEMED</h3>

              <div className="popup-reward-image-box">
                <img src={claimedReward.image} alt={claimedReward.title} />
              </div>
              
              <h2>{claimedReward.title}</h2>
              
              <p className="voucher-text massive-text" style={{ color: '#94a3b8', fontSize: '1.2rem', marginTop: '1rem' }}>
                Limit: 1 per week. Check your email for details!
              </p>

            </div>
          </div>
        )}``

      </main>
    </div>
  );
}