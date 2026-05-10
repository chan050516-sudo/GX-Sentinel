import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Sparkles, ArrowLeft } from "lucide-react";
import "./Allocator.css";

// Same section types
type Section = { id: string; name: string; amount: number; aiRecommended: number; min: number; max: number };

export default function Allocator({
  totalIncomingAmount,
  onConfirm,
  onCancel
}: {
  totalIncomingAmount?: number;
  onConfirm?: (allocatedMap: Record<string, number>) => void;
  onCancel?: () => void;
} = {}) {
  const navigate = useNavigate();
  const location = useLocation();

  // Enforce access control: only via Dashboard pending > 300
  const initialAmount = totalIncomingAmount || location.state?.amount;

  useEffect(() => {
    if (!initialAmount || initialAmount <= 300) {
      if (onCancel) {
        onCancel();
      } else {
        navigate("/dashboard");
      }
    }
  }, [initialAmount, navigate, onCancel]);

  const [incomeAmount] = useState<number>(initialAmount || 0);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const [showReasoning, setShowReasoning] = useState(false);
  const [displayedText, setDisplayedText] = useState("");

  const reasoningText = "Based on your recent spending behavior, the AI optimized your allocation to balance stability, flexibility, and future readiness. A lower percentage was assigned to Fixed Expenses due to consistent recurring payments, while Emergency Fund coverage was strengthened to improve financial resilience against unexpected situations. Moderate allocations for Expected Future and Variable Budget reflect planned commitments and active lifestyle spending patterns, ensuring flexibility without increasing overspending risk. A controlled Savings Pocket was recommended to support steady financial growth while maintaining accessible liquidity for daily financial activity.";

  useEffect(() => {
    if (showReasoning) {
      let i = 0;
      setDisplayedText("");
      const interval = setInterval(() => {
        setDisplayedText(reasoningText.slice(0, i));
        i += 3; // speed up typing
        if (i > reasoningText.length) {
          setDisplayedText(reasoningText);
          clearInterval(interval);
        }
      }, 20);
      return () => clearInterval(interval);
    }
  }, [showReasoning]);

  const [sections, setSections] = useState<Section[]>([]);
  useEffect(() => {
    if (incomeAmount > 0) {
      const eFund = Math.round(incomeAmount * 0.20);
      const fExp = Math.round(incomeAmount * 0.40);
      const eFut = Math.round(incomeAmount * 0.15);
      const vBud = Math.round(incomeAmount * 0.15);
      const sPoc = incomeAmount - eFund - fExp - eFut - vBud;

      setSections([
        { id: "s1", name: "Emergency Fund", amount: 0, aiRecommended: eFund, min: Math.round(incomeAmount * 0.10), max: Math.round(incomeAmount * 0.40) },
        { id: "s2", name: "Fixed Expenses", amount: 0, aiRecommended: fExp, min: Math.round(incomeAmount * 0.10), max: Math.round(incomeAmount * 0.50) },
        { id: "s3", name: "Expected Future", amount: 0, aiRecommended: eFut, min: Math.round(incomeAmount * 0.10), max: Math.round(incomeAmount * 0.25) },
        { id: "s4", name: "Variable Budget", amount: 0, aiRecommended: vBud, min: Math.round(incomeAmount * 0.10), max: Math.round(incomeAmount * 0.25) },
        { id: "s5", name: "Savings Pocket", amount: 0, aiRecommended: sPoc, min: Math.round(incomeAmount * 0.05), max: Math.round(incomeAmount * 0.40) },
      ]);
    }
  }, [incomeAmount]);



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
      setErrorMsg("Please allocate exactly the injected income amount.");
      return;
    }

    const invalidSection = sections.find(sec => sec.amount < sec.min || sec.amount > sec.max);
    if (invalidSection) {
      setErrorMsg(`Amount for ${invalidSection.name} must be between RM ${invalidSection.min} and RM ${invalidSection.max}.`);
      return;
    }

    setErrorMsg("");

    const allocatedMap: Record<string, number> = {};
    sections.forEach(sec => {
      allocatedMap[sec.name] = sec.amount;
    });

    if (onConfirm) {
      onConfirm(allocatedMap);
    } else {
      navigate("/dashboard", {
        state: {
          allocated: true,
          allocatedAmount: incomeAmount,
          allocatedMap: allocatedMap,
          transaction: location.state?.transaction // Pass the transaction back to persist it
        }
      });
    }
  };

  if (showReasoning) {
    return (
      <div className="allocator-container" style={{ animation: "fadeIn 0.5s ease" }}>
        <header className="allocator-header">
          <button className="back-btn" onClick={() => setShowReasoning(false)}><ArrowLeft size={20} /> Back</button>
          <h2 style={{ fontSize: "1.1rem" }}>AI Allocation Reasoning</h2>
          <div style={{ width: '80px' }}></div>
        </header>
        <main className="allocator-main" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ textAlign: "center", marginBottom: "5px" }}>
            <p style={{ color: "#94a3b8", fontSize: "0.85rem", lineHeight: "1.4" }}>Personalized analysis based on your recent transaction behavior</p>
          </div>

          <div style={{
            background: "rgba(30, 30, 40, 0.6)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(119, 31, 255, 0.3)",
            borderRadius: "16px",
            padding: "20px",
            boxShadow: "0 8px 32px rgba(119, 31, 255, 0.15)",
            position: "relative",
            overflow: "hidden"
          }}>
            <div style={{
              position: "absolute",
              top: "-50%", left: "-50%", width: "200%", height: "200%",
              background: "radial-gradient(circle, rgba(119,31,255,0.1) 0%, rgba(0,0,0,0) 60%)",
              zIndex: 0, pointerEvents: "none"
            }}></div>
            <p style={{ position: "relative", zIndex: 1, color: "#e2e8f0", lineHeight: "1.6", fontSize: "0.95rem" }}>
              {displayedText}
              <span style={{ display: "inline-block", width: "8px", height: "16px", background: "#771FFF", animation: "blink 1s step-end infinite", marginLeft: "4px", verticalAlign: "middle" }}></span>
            </p>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "5px" }}>
            {["Stable Spending Pattern", "Strong Emergency Readiness", "Balanced Lifestyle Spending", "Healthy Savings Strategy"].map(tag => (
              <span key={tag} style={{
                background: "rgba(119, 31, 255, 0.1)",
                border: "1px solid rgba(119, 31, 255, 0.4)",
                color: "#c4a7ff",
                padding: "6px 12px",
                borderRadius: "20px",
                fontSize: "0.75rem",
                fontWeight: "500"
              }}>
                ✨ {tag}
              </span>
            ))}
          </div>

          <div style={{ marginTop: "15px", display: "flex", flexDirection: "column", gap: "12px" }}>
            <h4 style={{ color: "#e2e8f0", marginBottom: "8px", fontSize: "1rem", fontWeight: "600" }}>AI Recommended Breakdown</h4>
            {sections.map(sec => {
              const percentage = incomeAmount > 0 ? ((sec.aiRecommended / incomeAmount) * 100).toFixed(0) : 0;
              return (
                <div key={sec.id} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "#cbd5e1" }}>
                    <span>{sec.name}</span>
                    <span style={{ color: "#c4a7ff", fontWeight: "bold" }}>{percentage}%</span>
                  </div>
                  <div style={{ width: "100%", height: "6px", background: "rgba(255,255,255,0.1)", borderRadius: "4px", overflow: "hidden" }}>
                    <div style={{
                      width: `${percentage}%`,
                      height: "100%",
                      background: "linear-gradient(90deg, #771FFF, #F8326D)",
                      boxShadow: "0 0 8px rgba(119, 31, 255, 0.8)",
                      borderRadius: "4px",
                      transition: "width 1s ease-out"
                    }}></div>
                  </div>
                </div>
              )
            })}
          </div>
        </main>
        <style>{`
          @keyframes blink { 50% { opacity: 0; } }
          @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        `}</style>
      </div>
    );
  }

  return (
    <div className="allocator-container">
      <header className="allocator-header">
        <button className="back-btn" onClick={() => onCancel ? onCancel() : navigate("/dashboard")}><ArrowLeft size={20} /> Back</button>
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
            {errorMsg && (
              <p style={{ color: "#F8326D", fontSize: "0.85rem", textAlign: "center", marginBottom: "12px", marginTop: "0" }}>
                {errorMsg}
              </p>
            )}
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                type="button"
                className="confirm-btn"
                onClick={() => setShowReasoning(true)}
                style={{ flex: 1, background: "rgba(119, 31, 255, 0.1)", border: "1px solid rgba(119, 31, 255, 0.5)", color: "#c4a7ff", display: "flex", justifyContent: "center", alignItems: "center", gap: "6px", padding: "12px 10px" }}
              >
                <Sparkles size={16} />
                <span style={{ fontSize: "0.85rem", whiteSpace: "nowrap" }}>AI Reasoning</span>
              </button>
              <button
                type="button"
                className="confirm-btn"
                onClick={handleConfirm}
                disabled={remaining !== 0}
                style={{ flex: 1.5, padding: "12px 10px", fontSize: "0.9rem" }}
              >
                Confirm Allocation
              </button>
            </div>
          </div>
        </section>


      </main>
    </div>
  );
}
