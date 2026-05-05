import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Allocator.css";

// Same section types
type Section = { id: string; name: string; amount: number; aiRecommended: number; min: number; max: number };

export default function Allocator() {
  const navigate = useNavigate();
  const [incomeAmount, setIncomeAmount] = useState<number>(2500);
  
  const [sections, setSections] = useState<Section[]>([
    { id: "s1", name: "Emergency Fund", amount: 0, aiRecommended: 500, min: 200, max: 1000 },
    { id: "s2", name: "Fixed Expenses", amount: 0, aiRecommended: 1000, min: 800, max: 1500 },
    { id: "s3", name: "Expected Future", amount: 0, aiRecommended: 300, min: 100, max: 800 },
    { id: "s4", name: "Variable Budget", amount: 0, aiRecommended: 400, min: 200, max: 800 },
    { id: "s5", name: "Savings Pocket", amount: 0, aiRecommended: 300, min: 100, max: 1000 },
  ]);

  // If incomeAmount changes drastically, we'd normally recalculate AI values.
  // For the hackathon mockup, we'll assume the AI values scale or are fixed.

  const totalAllocated = sections.reduce((sum, sec) => sum + sec.amount, 0);
  const remaining = incomeAmount - totalAllocated;

  const handleSliderChange = (id: string, value: number) => {
    setSections(prev => prev.map(sec => sec.id === id ? { ...sec, amount: value } : sec));
  };

  const handle1ClickAccept = () => {
    // Fill all sliders with AI recommended values
    setSections(prev => prev.map(sec => ({ ...sec, amount: sec.aiRecommended })));
  };

  const handleConfirm = () => {
    if (remaining !== 0) {
      alert("Please allocate exactly the injected income amount.");
      return;
    }
    // TODO: Send to backend
    alert("Allocation Confirmed and Applied.");
    navigate("/dashboard");
  };

  return (
    <div className="allocator-container">
      <header className="allocator-header">
        <button className="back-btn" onClick={() => navigate("/dashboard")}>← Back</button>
        <h2>Smart Allocator</h2>
        <div style={{ width: '80px' }}></div> {/* Spacer to keep title centered */}
      </header>

      <main className="allocator-main">
        {/* Top Section: Smart Allocator */}
        <section className="allocator-card">
          <div className="income-input-group">
            <label>Injected Income (RM)</label>
            <input 
              type="number" 
              value={incomeAmount} 
              onChange={(e) => setIncomeAmount(Number(e.target.value))}
              className="income-input"
            />
          </div>

          <div className="ai-recommendation-banner">
            <div className="ai-info">
              <span className="ai-icon">✨</span>
              <div>
                <h4>AI Optimal Distribution</h4>
                <p>Based on your 45-day runway deficit and upcoming goals.</p>
              </div>
            </div>
            <button className="one-click-btn" onClick={handle1ClickAccept}>1-Click Accept</button>
          </div>

          <div className="sliders-container">
            {sections.map(sec => (
              <div key={sec.id} className="slider-group">
                <div className="slider-header">
                  <span className="slider-name">{sec.name}</span>
                  <span className="slider-value">RM {sec.amount}</span>
                </div>
                <input 
                  type="range" 
                  min={0} 
                  max={incomeAmount} 
                  value={sec.amount}
                  onChange={(e) => handleSliderChange(sec.id, Number(e.target.value))}
                  className="custom-slider"
                />
                <div className="slider-hints">
                  <span className="hint-ai">AI Rec: RM {sec.aiRecommended}</span>
                  <span className="hint-range">Allowed Range: {sec.min} - {sec.max}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="total-check-section">
            <div className="total-check-info">
              <span>Unallocated Funds:</span>
              <h3 className={`remaining-amount ${remaining === 0 ? "balanced" : remaining < 0 ? "over" : "under"}`}>
                RM {remaining}
              </h3>
            </div>
            <button 
              className="confirm-btn" 
              onClick={handleConfirm}
              disabled={remaining !== 0}
            >
              Confirm Allocation
            </button>
          </div>
        </section>

        <div className="divider">
          <span>Future Planning</span>
        </div>

        {/* Bottom Section: Goals & Planned Expenses */}
        <div className="bottom-layout">
          <section className="bottom-card goals-card">
            <div className="card-header">
              <h3>🎯 Long-term Goals</h3>
              <button className="add-btn-small">+</button>
            </div>
            <div className="goal-item">
              <div className="goal-header">
                <strong>Buy a Car</strong>
                <span>RM 20,000</span>
              </div>
              <div className="progress-bar-bg">
                <div className="progress-bar-fill" style={{ width: '35%' }}></div>
              </div>
              <div className="goal-footer">
                <span className="goal-saved">RM 7,000 Saved</span>
                <span className="goal-date">Target: Dec 2027</span>
              </div>
            </div>
          </section>

          <section className="bottom-card expenses-card">
            <div className="card-header">
              <h3>📅 Planned Expenses</h3>
              <button className="add-btn-small">+</button>
            </div>
            <div className="expense-list">
              <div className="expense-item">
                <div className="expense-icon">🍿</div>
                <div className="expense-info">
                  <strong>Movie Date</strong>
                  <span>Next Friday</span>
                </div>
                <span className="expense-amount">RM 85</span>
              </div>
              <div className="expense-item">
                <div className="expense-icon">🎬</div>
                <div className="expense-info">
                  <strong>Netflix Subscription</strong>
                  <span>28th May</span>
                </div>
                <span className="expense-amount">RM 55</span>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
