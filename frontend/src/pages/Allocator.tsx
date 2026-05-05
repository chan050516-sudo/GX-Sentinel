import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Sparkles, Target, Calendar, Plus, Film, ArrowLeft, Ticket } from "lucide-react";
import "./Allocator.css";

// Same section types
type Section = { id: string; name: string; amount: number; aiRecommended: number; min: number; max: number };

export default function Allocator() {
  const navigate = useNavigate();
  const location = useLocation();
  const initialAmount = location.state?.amount || 2500;
  const [incomeAmount, setIncomeAmount] = useState<number>(initialAmount);
  
  const [sections, setSections] = useState<Section[]>([
    { id: "s1", name: "Emergency Fund", amount: 0, aiRecommended: 500, min: 200, max: 1000 },
    { id: "s2", name: "Fixed Expenses", amount: 0, aiRecommended: 1000, min: 800, max: 1500 },
    { id: "s3", name: "Expected Future", amount: 0, aiRecommended: 300, min: 100, max: 800 },
    { id: "s4", name: "Variable Budget", amount: 0, aiRecommended: 400, min: 200, max: 800 },
    { id: "s5", name: "Savings Pocket", amount: 0, aiRecommended: 300, min: 100, max: 1000 },
  ]);

  // Interactive Goal State
  const [goals, setGoals] = useState([{ id: "g1", name: "Buy a Car", target: 20000, saved: 7000, date: "Dec 2027" }]);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [newGoal, setNewGoal] = useState({ name: "", target: "", date: "" });

  // Interactive Calendar State
  const [expenses, setExpenses] = useState([
    { id: "e1", name: "Movie Date", date: "Next Friday", amount: 85, iconType: "ticket" },
    { id: "e2", name: "Netflix Subscription", date: "28th May", amount: 55, iconType: "film" },
  ]);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [newExpense, setNewExpense] = useState({ name: "", date: "", amount: "" });

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

  const handleAddGoal = () => {
    if (!newGoal.name || !newGoal.target || !newGoal.date) return;
    setGoals(prev => [...prev, {
      id: Date.now().toString(),
      name: newGoal.name,
      target: Number(newGoal.target),
      saved: 0,
      date: newGoal.date
    }]);
    setShowAddGoal(false);
    setNewGoal({ name: "", target: "", date: "" });
  };

  const handleAddExpense = () => {
    if (!newExpense.name || !newExpense.date || !newExpense.amount) return;
    setExpenses(prev => [...prev, {
      id: Date.now().toString(),
      name: newExpense.name,
      date: newExpense.date,
      amount: Number(newExpense.amount),
      iconType: "ticket"
    }]);
    setShowAddExpense(false);
    setNewExpense({ name: "", date: "", amount: "" });
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

        <div className="divider">
          <span>Future Planning</span>
        </div>

        {/* Bottom Section: Goals & Planned Expenses */}
        <div className="bottom-layout">
          <section className="bottom-card goals-card">
            <div className="card-header">
              <h3 className="flex-align"><Target size={20} /> Long-term Goals</h3>
              <button className="add-btn-small" onClick={() => setShowAddGoal(!showAddGoal)}><Plus size={16}/></button>
            </div>
            
            {showAddGoal && (
              <div className="inline-add-form">
                <input type="text" placeholder="Goal Name" value={newGoal.name} onChange={e => setNewGoal({...newGoal, name: e.target.value})} />
                <input type="number" placeholder="Target Amount (RM)" value={newGoal.target} onChange={e => setNewGoal({...newGoal, target: e.target.value})} />
                <input type="text" placeholder="Target Date (e.g. Dec 2027)" value={newGoal.date} onChange={e => setNewGoal({...newGoal, date: e.target.value})} />
                <button onClick={handleAddGoal}>Save Goal</button>
              </div>
            )}

            {goals.map(goal => (
              <div key={goal.id} className="goal-item">
                <div className="goal-header">
                  <strong>{goal.name}</strong>
                  <span>RM {goal.target.toLocaleString()}</span>
                </div>
                <div className="progress-bar-bg">
                  <div className="progress-bar-fill" style={{ width: `${(goal.saved / goal.target) * 100}%` }}></div>
                </div>
                <div className="goal-footer">
                  <span className="goal-saved">RM {goal.saved.toLocaleString()} Saved</span>
                  <span className="goal-date">Target: {goal.date}</span>
                </div>
              </div>
            ))}
          </section>

          <section className="bottom-card expenses-card">
            <div className="card-header">
              <h3 className="flex-align"><Calendar size={20} /> Planned Expenses</h3>
              <button className="add-btn-small" onClick={() => setShowAddExpense(!showAddExpense)}><Plus size={16}/></button>
            </div>

            {showAddExpense && (
              <div className="inline-add-form">
                <input type="text" placeholder="Expense Name" value={newExpense.name} onChange={e => setNewExpense({...newExpense, name: e.target.value})} />
                <input type="number" placeholder="Amount (RM)" value={newExpense.amount} onChange={e => setNewExpense({...newExpense, amount: e.target.value})} />
                <input type="text" placeholder="Date (e.g. Next Friday)" value={newExpense.date} onChange={e => setNewExpense({...newExpense, date: e.target.value})} />
                <button onClick={handleAddExpense}>Save Expense</button>
              </div>
            )}

            <div className="expense-list">
              {expenses.map(exp => (
                <div key={exp.id} className="expense-item">
                  <div className="expense-icon">
                    {exp.iconType === "film" ? <Film size={20} /> : <Ticket size={20} />}
                  </div>
                  <div className="expense-info">
                    <strong>{exp.name}</strong>
                    <span>{exp.date}</span>
                  </div>
                  <span className="expense-amount">RM {exp.amount}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
