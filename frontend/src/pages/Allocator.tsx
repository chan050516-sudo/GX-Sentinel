import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Sparkles, ArrowLeft } from "lucide-react";
import "./Allocator.css";

// Same section types
type Section = { id: string; name: string; amount: number; aiRecommended: number; min: number; max: number };

export default function Allocator() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Enforce access control: only via Dashboard pending > 300
  const initialAmount = location.state?.amount;

  useEffect(() => {
    if (!initialAmount || initialAmount <= 300) {
      navigate("/dashboard");
    }
  }, [initialAmount, navigate]);

  const [incomeAmount, setIncomeAmount] = useState<number>(initialAmount || 0);
  
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
    // Complete the allocation, send user back to Dashboard
    navigate("/dashboard", { state: { allocated: true, allocatedAmount: incomeAmount } });
  };



  return (
    <div className="allocator-container">
      <header className="allocator-header">
        <button className="back-btn" onClick={() => navigate("/dashboard")}><ArrowLeft size={20} /> Back</button>
        <h2>Smart Allocator</h2>
        <div style={{ width: '80px' }}></div> {/* Spacer to keep title centered */}
      </header>

      <main className="allocator-main">
        {/* Top Section: Smart Allocator */}
        <section className="allocator-card">
          <div className="income-input-group">
            <label>Total Unallocated Inflow</label>
            <div className="locked-income-display">
              <h2>RM {incomeAmount.toFixed(2)}</h2>
            </div>
          </div>

          <div className="ai-recommendation-banner">
            <div className="ai-info">
              <Sparkles className="ai-icon" size={24} />
              <div>
                <h4>AI Optimal Distribution</h4>
                <p>Based on your 45-day runway deficit and upcoming goals.</p>
              </div>
            </div>
            <button className="one-click-btn" onClick={handle1ClickAccept}>Accept</button>
          </div>

          <div className="sliders-container">
            {sections.map(sec => (
              <div key={sec.id} className="slider-group">
                <div className="slider-header">
                  <span className="slider-name">{sec.name}</span>
                  <div className="slider-input-wrapper">
                    <span>RM</span>
                    <input 
                      type="number" 
                      className="slider-number-input"
                      value={sec.amount}
                      onChange={(e) => handleSliderChange(sec.id, Number(e.target.value))}
                    />
                  </div>
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


      </main>
    </div>
  );
}
