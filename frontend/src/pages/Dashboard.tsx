import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Home, Calendar as CalendarIcon, Utensils, Wallet, Zap, TrendingDown, Hourglass, X } from "lucide-react";
import "./Dashboard.css";

// Types for our mock data
type Transaction = {
  id: string;
  type: "income" | "expense";
  amount: number;
  date: string;
  description: string;
};

type Section = {
  id: string;
  name: string;
  amount: number;
  iconType: "shield" | "home" | "calendar" | "utensils" | "wallet";
};

export default function Dashboard() {
  const navigate = useNavigate();
  // Mock State
  const [runwayDays, setRunwayDays] = useState(45.2);
  const [totalBalance, setTotalBalance] = useState(12500);
  const [nudgeMessage, setNudgeMessage] = useState<string | null>(null);
  
  // Custom Modal State
  const [showInjectModal, setShowInjectModal] = useState(false);
  const [injectAmount, setInjectAmount] = useState<number | "">("");
  const [injectSource, setInjectSource] = useState<string>("Salary");

  const [sections, setSections] = useState<Section[]>([
    { id: "s1", name: "Emergency Fund", amount: 5000, iconType: "shield" },
    { id: "s2", name: "Fixed Expenses", amount: 3500, iconType: "home" },
    { id: "s3", name: "Expected Future", amount: 1500, iconType: "calendar" },
    { id: "s4", name: "Variable Budget", amount: 1500, iconType: "utensils" },
    { id: "s5", name: "Savings Pocket", amount: 1000, iconType: "wallet" },
  ]);

  const [transactions, setTransactions] = useState<Transaction[]>([
    { id: "t1", type: "income", amount: 12500, date: "Just now", description: "Initial System Injection" }
  ]);

  const handleOpenInjectModal = () => setShowInjectModal(true);
  const handleCloseInjectModal = () => {
    setShowInjectModal(false);
    setInjectAmount("");
    setInjectSource("Salary");
  };

  const handleAllocateIncome = () => {
    const amount = Number(injectAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("Invalid amount.");
      return;
    }

    // Bypass allocation if amount is less than RM 500
    if (amount < 500) {
      setTotalBalance(prev => prev + amount);
      // Auto-allocate small amounts to Variable Budget for simplicity
      setSections(prev => prev.map(sec => 
        sec.name === "Variable Budget" ? { ...sec, amount: sec.amount + amount } : sec
      ));
      setTransactions(prev => [{
        id: Date.now().toString(),
        type: "income",
        amount,
        date: "Just now",
        description: `${injectSource} (Auto-Allocated)`
      }, ...prev]);
      
      handleCloseInjectModal();
      return;
    }

    // Navigate to allocator passing the amount and source
    navigate("/allocator", { state: { amount, source: injectSource } });
  };

  const handleSpend = (sectionId: string, sectionName: string) => {
    const amount = Math.floor(Math.random() * 150) + 20; // Random spend between 20-170
    
    setSections(prev => prev.map(sec => {
      if (sec.id === sectionId && sec.amount >= amount) {
        return { ...sec, amount: sec.amount - amount };
      }
      return sec;
    }));

    const runwayDrop = +(amount / 100).toFixed(1);
    setTotalBalance(prev => Math.max(0, prev - amount));
    setRunwayDays(prev => +(Math.max(0, prev - runwayDrop)).toFixed(1));

    setTransactions(prev => [{
      id: Date.now().toString(),
      type: "expense",
      amount,
      date: "Just now",
      description: `Spend from ${sectionName}`
    }, ...prev]);

    // Module 3: Micro-Nudge System
    setNudgeMessage(`This purchase reduced your runway by ${runwayDrop} days. Resilience Score ↓ 1.3`);
    setTimeout(() => setNudgeMessage(null), 4000);
  };

  // SVG Gauge Calculations
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const maxDays = 90; // Let's say 90 is 100% full
  const strokeDashoffset = circumference - (Math.min(runwayDays, maxDays) / maxDays) * circumference;

  // Helper to render lucide icons
  const renderIcon = (type: string) => {
    switch (type) {
      case "shield": return <Shield size={24} />;
      case "home": return <Home size={24} />;
      case "calendar": return <CalendarIcon size={24} />;
      case "utensils": return <Utensils size={24} />;
      case "wallet": return <Wallet size={24} />;
      default: return null;
    }
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="logo-icon-small">
          <span className="gx-text">GX</span>
        </div>
        <h2>Sentinel Dashboard</h2>
        <div className="header-actions">
          <button className="demo-btn" onClick={() => navigate("/checkout-demo")}>
            🛒 Test Interceptor
          </button>
          <div className="user-profile">
            <div className="avatar"></div>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        {/* Core C-Level Focus: The Gauge */}
        <section className="gauge-section">
          <div className="gauge-wrapper modern-gauge">
            <div className="gauge-glow-bg"></div>
            <svg className="gauge-svg" viewBox="0 0 300 300">
              <defs>
                <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#771FFF" />
                  <stop offset="100%" stopColor="#F8326D" />
                </linearGradient>
              </defs>
              <circle cx="150" cy="150" r={radius} className="gauge-bg" />
              <circle
                cx="150" cy="150" r={radius}
                className="gauge-progress"
                style={{ strokeDasharray: circumference, strokeDashoffset: strokeDashoffset }}
              />
            </svg>
            <div className="gauge-content">
              <Hourglass className="gauge-icon" size={32} />
              <div className="gauge-value-wrapper">
                <span className="gauge-value">{runwayDays}</span>
                <span className="gauge-unit">Days</span>
              </div>
              <p className="gauge-label">Financial Runway</p>
            </div>
          </div>

          <div className="total-balance-card">
            <p>Protected Liquidity</p>
            <h3>RM {totalBalance.toLocaleString()}</h3>
            <button className="inject-btn" onClick={handleOpenInjectModal}>
              <Zap size={20} className="btn-icon" /> Inject Income
            </button>
          </div>
        </section>

        {/* The 5 Sections */}
        <section className="sections-grid">
          {sections.map(sec => (
            <div key={sec.id} className="section-card">
              <div className="section-header">
                <span className="section-icon">{renderIcon(sec.iconType)}</span>
                <h4>{sec.name}</h4>
              </div>
              <div className="section-amount">
                RM {sec.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <button 
                className="spend-btn" 
                onClick={() => handleSpend(sec.id, sec.name)}
                disabled={sec.amount <= 0}
              >
                Simulate Spend
              </button>
            </div>
          ))}
        </section>

        {/* Recent Transactions */}
        <section className="transactions-section">
          <h3>Recent Operations</h3>
          <div className="transactions-list">
            {transactions.map(tx => (
              <div key={tx.id} className={`transaction-item ${tx.type}`}>
                <div className="tx-info">
                  <div className={`tx-icon ${tx.type}`}>
                    {tx.type === 'income' ? '↓' : '↑'}
                  </div>
                  <div className="tx-details">
                    <span className="tx-desc">{tx.description}</span>
                    <span className="tx-date">{tx.date}</span>
                  </div>
                </div>
                <div className={`tx-amount ${tx.type}`}>
                  {tx.type === 'income' ? '+' : '-'} RM {tx.amount.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* MODULE 3: MICRO-NUDGE SYSTEM */}
      <div className={`micro-nudge-toast ${nudgeMessage ? 'show' : ''}`}>
        <TrendingDown size={24} className="nudge-icon" />
        <p>{nudgeMessage}</p>
      </div>

      {/* CUSTOM INJECT INCOME MODAL */}
      {showInjectModal && (
        <div className="modal-overlay">
          <div className="inject-modal">
            <button className="close-modal-btn" onClick={handleCloseInjectModal}>
              <X size={24} />
            </button>
            
            <div className="modal-header">
              <div className="modal-icon-bg">
                <Zap size={28} className="modal-header-icon" />
              </div>
              <h2>Inject Income</h2>
              <p>Declare your incoming funds for system allocation.</p>
            </div>

            <div className="modal-body">
              <div className="input-group">
                <label>Amount (RM)</label>
                <input 
                  type="number" 
                  placeholder="e.g. 2500" 
                  value={injectAmount}
                  onChange={(e) => setInjectAmount(Number(e.target.value))}
                  autoFocus
                />
              </div>
              <div className="input-group">
                <label>Source of Income</label>
                <input 
                  type="text" 
                  placeholder="e.g. Salary, PTPTN, Freelance" 
                  value={injectSource}
                  onChange={(e) => setInjectSource(e.target.value)}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="confirm-inject-btn" 
                onClick={handleAllocateIncome}
                disabled={!injectAmount || injectAmount <= 0 || !injectSource.trim()}
              >
                Proceed to Allocation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
