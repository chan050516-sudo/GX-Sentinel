import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  icon: string;
};

export default function Dashboard() {
  const navigate = useNavigate();
  // Mock State
  const [runwayDays, setRunwayDays] = useState(45.2);
  const [totalBalance, setTotalBalance] = useState(12500);
  
  const [sections, setSections] = useState<Section[]>([
    { id: "s1", name: "Emergency Fund", amount: 5000, icon: "🛡️" },
    { id: "s2", name: "Fixed Expenses", amount: 3500, icon: "🏠" },
    { id: "s3", name: "Expected Future", amount: 1500, icon: "📅" },
    { id: "s4", name: "Variable Budget", amount: 1500, icon: "🍔" },
    { id: "s5", name: "Savings Pocket", amount: 1000, icon: "💰" },
  ]);

  const [transactions, setTransactions] = useState<Transaction[]>([
    { id: "t1", type: "income", amount: 12500, date: "Just now", description: "Initial System Injection" }
  ]);

  const handleAllocateIncome = () => {
    navigate("/allocator");
  };

  const handleSpend = (sectionId: string, sectionName: string) => {
    const amount = Math.floor(Math.random() * 150) + 20; // Random spend between 20-170
    
    setSections(prev => prev.map(sec => {
      if (sec.id === sectionId && sec.amount >= amount) {
        return { ...sec, amount: sec.amount - amount };
      }
      return sec;
    }));

    setTotalBalance(prev => Math.max(0, prev - amount));
    setRunwayDays(prev => +(Math.max(0, prev - (amount / 100))).toFixed(1));

    setTransactions(prev => [{
      id: Date.now().toString(),
      type: "expense",
      amount,
      date: "Just now",
      description: `Spend from ${sectionName}`
    }, ...prev]);
  };

  // SVG Gauge Calculations
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const maxDays = 90; // Let's say 90 is 100% full
  const strokeDashoffset = circumference - (Math.min(runwayDays, maxDays) / maxDays) * circumference;

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="logo-icon-small">
          <span className="gx-text">GX</span>
        </div>
        <h2>Sentinel Dashboard</h2>
        <div className="user-profile">
          <div className="avatar"></div>
        </div>
      </header>

      <main className="dashboard-main">
        {/* Core C-Level Focus: The Gauge */}
        <section className="gauge-section">
          <div className="gauge-wrapper">
            <svg className="gauge-svg" viewBox="0 0 300 300">
              {/* Background circle */}
              <circle
                cx="150"
                cy="150"
                r={radius}
                className="gauge-bg"
              />
              {/* Progress circle */}
              <circle
                cx="150"
                cy="150"
                r={radius}
                className="gauge-progress"
                style={{
                  strokeDasharray: circumference,
                  strokeDashoffset: strokeDashoffset
                }}
              />
            </svg>
            <div className="gauge-content">
              <span className="gauge-icon">⏳</span>
              <h1 className="gauge-value">{runwayDays}</h1>
              <p className="gauge-label">Days Remaining</p>
            </div>
          </div>

          <div className="total-balance-card">
            <p>Total Protected Balance</p>
            <h3>RM {totalBalance.toLocaleString()}</h3>
            <button className="inject-btn" onClick={handleAllocateIncome}>
              <span className="btn-icon">⚡</span> Allocate Income
            </button>
          </div>
        </section>

        {/* The 5 Sections */}
        <section className="sections-grid">
          {sections.map(sec => (
            <div key={sec.id} className="section-card">
              <div className="section-header">
                <span className="section-icon">{sec.icon}</span>
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
    </div>
  );
}
