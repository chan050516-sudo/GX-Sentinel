import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  Shield, Home, Calendar as CalendarIcon, Utensils, Wallet, 
  Hourglass, Plus, ScanLine, ArrowRight, Eye, ChevronDown, 
  ChevronRight, ArrowDownLeft, CheckCircle2, Info, Target, Film, Ticket
} from "lucide-react";
import "./Dashboard.css";

// Types
type Transaction = { id: string; type: "income" | "expense"; amount: number; date: string; description: string; };
type Section = { id: string; name: string; amount: number; iconType: "shield" | "home" | "calendar" | "utensils" | "wallet"; };
type PendingAllocation = { id: string; amount: number; method: string; description: string; date: string; };

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();

  const [runwayDays, setRunwayDays] = useState(45.2);
  const [totalBalance, setTotalBalance] = useState(12500);
  const [nudgeMessage, setNudgeMessage] = useState<string | null>(null);
  const [nudgeType, setNudgeType] = useState<"positive" | "negative" | null>(null);

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

  const [pendingAllocations, setPendingAllocations] = useState<PendingAllocation[]>([]);

  // Simulation Modal State
  const [showSimulateModal, setShowSimulateModal] = useState(false);
  const [simAmount, setSimAmount] = useState<number | "">("");
  const [simMethod, setSimMethod] = useState<string>("GX Bank");
  const [simDesc, setSimDesc] = useState<string>("");

  // Mini Allocator Modal State (for <= 300)
  const [showMiniAllocModal, setShowMiniAllocModal] = useState(false);
  const [miniAllocSectionId, setMiniAllocSectionId] = useState<string>(sections[0].id);

  // Future Planning: Goals State
  const [goals, setGoals] = useState([{ id: "g1", name: "Buy a Car", target: 20000, saved: 7000, date: "Dec 2027" }]);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [newGoal, setNewGoal] = useState({ name: "", target: "", date: "" });

  // Future Planning: Calendar Logic
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0 is Sunday
  const startOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1; // Align to Mon-Sun
  
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const currentMonthName = monthNames[currentMonth];
  const weekDaysHeader = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const calendarDays = [];
  for (let i = 0; i < startOffset; i++) calendarDays.push(null);
  for (let i = 1; i <= daysInMonth; i++) calendarDays.push(i);
  while (calendarDays.length % 7 !== 0) calendarDays.push(null);

  const [selectedDate, setSelectedDate] = useState<string>(`${currentDate.getDate()} ${currentMonthName.substring(0,3)}`);

  const [expenses, setExpenses] = useState([
    { id: "e1", name: "Movie Date", date: `16 ${currentMonthName.substring(0,3)}`, amount: 85, iconType: "ticket" },
    { id: "e2", name: "Netflix Subscription", date: `13 ${currentMonthName.substring(0,3)}`, amount: 55, iconType: "film" },
  ]);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [newExpense, setNewExpense] = useState({ name: "", amount: "" });

  const pendingTotal = pendingAllocations.reduce((sum, item) => sum + item.amount, 0);

  useEffect(() => {
    // If returning from Smart Allocator successfully
    if (location.state && location.state.allocated) {
      setPendingAllocations([]);
      setTotalBalance(prev => prev + location.state.allocatedAmount);
      window.history.replaceState({}, document.title);
    }

    // Micro-Nudge interceptor feedback
    if (location.state && location.state.nudgeType) {
      setNudgeMessage(location.state.message);
      setNudgeType(location.state.nudgeType);
      if (location.state.runwayDrop) {
        setRunwayDays(prev => +(Math.max(0, prev - location.state.runwayDrop)).toFixed(1));
      }
      const timer = setTimeout(() => {
        setNudgeMessage(null);
        setNudgeType(null);
        window.history.replaceState({}, document.title);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [location.state]);

  const handleSimulateInflow = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(simAmount);
    if (isNaN(amount) || amount <= 0) return;

    const newPending: PendingAllocation = {
      id: Date.now().toString(),
      amount,
      method: simMethod,
      description: simDesc || "Inbound Transfer",
      date: "Just now"
    };

    setPendingAllocations(prev => [newPending, ...prev]);
    setShowSimulateModal(false);
    setSimAmount("");
    setSimDesc("");
  };

  const handleAllocatePending = () => {
    if (pendingTotal === 0) return;

    if (pendingTotal <= 300) {
      // Trigger mini allocation modal
      setShowMiniAllocModal(true);
    } else {
      // Trigger smart allocator module for high amounts
      navigate("/allocator", { state: { amount: pendingTotal } });
    }
  };

  const handleConfirmMiniAlloc = () => {
    const selectedSection = sections.find(s => s.id === miniAllocSectionId);
    if (!selectedSection) return;

    setSections(prev => prev.map(sec =>
      sec.id === miniAllocSectionId ? { ...sec, amount: sec.amount + pendingTotal } : sec
    ));
    setTotalBalance(prev => prev + pendingTotal);

    setTransactions(prev => [
      {
        id: Date.now().toString(),
        type: "income",
        amount: pendingTotal,
        date: "Just now",
        description: `Allocated to ${selectedSection.name}`
      },
      ...prev
    ]);

    setPendingAllocations([]);
    setShowMiniAllocModal(false);
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
    if (!newExpense.name || !newExpense.amount) return;
    setExpenses(prev => [...prev, {
      id: Date.now().toString(),
      name: newExpense.name,
      date: selectedDate,
      amount: Number(newExpense.amount),
      iconType: "ticket"
    }]);
    setShowAddExpense(false);
    setNewExpense({ name: "", amount: "" });
  };

  // SVG Gauge Calculations
  const radius = 100;
  const circumference = 2 * Math.PI * radius;
  const maxDays = 90;
  const strokeDashoffset = circumference - (Math.min(runwayDays, maxDays) / maxDays) * circumference;

  const renderIcon = (type: string) => {
    switch (type) {
      case "shield": return <Shield size={20} />;
      case "home": return <Home size={20} />;
      case "calendar": return <CalendarIcon size={20} />;
      case "utensils": return <Utensils size={20} />;
      case "wallet": return <Wallet size={20} />;
      default: return null;
    }
  };

  return (
    <div className="dashboard-container gx-theme">

      {/* GXBank Style Header */}
      <header className="gx-header">
        <div className="gx-top-row">
          <div className="gx-user-badge">
            <span className="badge-tag">Personal</span>
            <div className="user-name-dropdown">
              <h3>David Ooi Yuan Leong</h3>
              <ChevronDown size={16} />
            </div>
          </div>
          <div className="dev-tools">
            <button className="simulate-btn" onClick={() => setShowSimulateModal(true)}>
              Simulate Inflow
            </button>
            <button className="demo-btn" onClick={() => navigate("/checkout-demo")}>
              🛒 Test Interceptor
            </button>
          </div>
        </div>

        <div className="gx-balance-area">
          <div className="balance-label">
            Total balance <Shield size={14} className="shield-icon" />
          </div>
          <div className="balance-amount-row">
            <h1>RM{totalBalance.toFixed(2)}</h1>
            <Eye size={20} className="eye-icon" />
          </div>
          <div className="balance-info-link">
            Balance info <ChevronRight size={16} />
          </div>
        </div>

        <div className="gx-actions-row">
          <button className="gx-action-btn">
            <div className="icon-circle"><Plus size={24} /></div>
            <span>Add money</span>
          </button>
          <button className="gx-action-btn">
            <div className="icon-circle"><ScanLine size={24} /></div>
            <span>Scan QR</span>
          </button>
          <button className="gx-action-btn">
            <div className="icon-circle"><ArrowRight size={24} /></div>
            <span>Send money</span>
          </button>
        </div>
      </header>

      {/* Global Toast Nudge */}
      {nudgeMessage && (
        <div className={`global-toast ${nudgeType}`}>
          <div className="toast-icon">
            {nudgeType === "positive" ? <CheckCircle2 size={24} /> : <Shield size={24} />}
          </div>
          <p>{nudgeMessage}</p>
        </div>
      )}

      <main className="dashboard-main gx-main">

        {/* Pending Allocations Section */}
        {pendingAllocations.length > 0 && (
          <section className="pending-section">
            <div className="section-title-row">
              <h3>Pending Allocation</h3>
              <span className="pending-badge">{pendingAllocations.length} items</span>
            </div>

            <div className="pending-card">
              <div className="pending-list">
                {pendingAllocations.map(item => (
                  <div key={item.id} className="pending-item">
                    <div className="pending-icon"><ArrowDownLeft size={18} /></div>
                    <div className="pending-details">
                      <div className="pending-title-row">
                        <strong>{item.description}</strong>
                        <span className="txn-id">TXN-{item.id.slice(-6)}</span>
                      </div>
                      <span>{item.method} • {item.date}</span>
                    </div>
                    <div className="pending-amount">+ RM{item.amount.toFixed(2)}</div>
                  </div>
                ))}
              </div>

              <div className="pending-action-area">
                <div className="pending-total">
                  <span>Total Unallocated</span>
                  <strong>RM {pendingTotal.toFixed(2)}</strong>
                </div>
                <button className="gx-primary-btn" onClick={handleAllocatePending}>
                  Allocate Funds
                </button>
              </div>

              <div className="allocation-hint">
                <Info size={14} />
                {pendingTotal > 300
                  ? "Total exceeds RM300. Smart Allocator will be engaged."
                  : "Total is under RM300. Manual direct allocation allowed."}
              </div>
            </div>
          </section>
        )}

        <h3 className="section-title">Your Everyday Account</h3>

        {/* Core C-Level Focus: The Gauge & Sections */}
        <section className="account-overview">
          <div className="main-account-card">
            <div className="gauge-wrapper modern-gauge">
              <svg className="gauge-svg" viewBox="0 0 240 240">
                <defs>
                  <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#771FFF" />
                    <stop offset="100%" stopColor="#F8326D" />
                  </linearGradient>
                </defs>
                <circle cx="120" cy="120" r={radius} className="gauge-bg" />
                <circle
                  cx="120" cy="120" r={radius}
                  className="gauge-progress"
                  style={{ strokeDasharray: circumference, strokeDashoffset: strokeDashoffset }}
                />
              </svg>
              <div className="gauge-content">
                <Hourglass className="gauge-icon" size={28} />
                <div className="gauge-value-wrapper">
                  <span className="gauge-value">{runwayDays}</span>
                  <span className="gauge-unit">Days</span>
                </div>
                <p className="gauge-label">Financial Runway</p>
              </div>
            </div>
            <div className="view-tx-link">View runway projections</div>
          </div>

          <div className="pockets-card">
            <h4>Pockets</h4>
            <p className="pocket-subtitle">Sentinel Managed Allocations</p>
            <div className="pockets-grid">
              {sections.map(sec => (
                <div key={sec.id} className="pocket-item">
                  <div className="pocket-icon">{renderIcon(sec.iconType)}</div>
                  <div className="pocket-info">
                    <span className="pocket-name">{sec.name}</span>
                    <span className="pocket-amount">RM {sec.amount.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <h3 className="section-title">Future Planning</h3>
        
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
              <h3 className="flex-align"><CalendarIcon size={20} /> {currentMonthName} {currentYear}</h3>
              <button className="add-btn-small" onClick={() => setShowAddExpense(!showAddExpense)}><Plus size={16}/></button>
            </div>

            {/* Full Month Calendar Grid */}
            <div className="month-calendar">
              <div className="calendar-weekdays">
                {weekDaysHeader.map(d => <span key={d}>{d}</span>)}
              </div>
              <div className="calendar-grid">
                {calendarDays.map((d, idx) => {
                  if (!d) return <div key={`empty-${idx}`} className="calendar-cell empty"></div>;
                  
                  const fullDate = `${d} ${currentMonthName.substring(0,3)}`;
                  const hasExpense = expenses.some(e => e.date === fullDate);
                  
                  return (
                    <div 
                      key={d} 
                      className={`calendar-cell ${selectedDate === fullDate ? 'active' : ''}`}
                      onClick={() => setSelectedDate(fullDate)}
                    >
                      <span className="cell-number">{d}</span>
                      {hasExpense && <div className="expense-dot"></div>}
                    </div>
                  );
                })}
              </div>
            </div>

            {showAddExpense && (
              <div className="inline-add-form">
                <input type="text" placeholder="Expense Name" value={newExpense.name} onChange={e => setNewExpense({...newExpense, name: e.target.value})} />
                <input type="number" placeholder="Amount (RM)" value={newExpense.amount} onChange={e => setNewExpense({...newExpense, amount: e.target.value})} />
                <button onClick={handleAddExpense}>Add to {selectedDate}</button>
              </div>
            )}

            <div className="expense-list">
              {expenses.filter(e => e.date === selectedDate).length === 0 && !showAddExpense && (
                <div className="empty-state">No planned expenses for {selectedDate}.</div>
              )}
              {expenses.filter(e => e.date === selectedDate).map(exp => (
                <div key={exp.id} className="expense-item">
                  <div className="expense-icon">
                    {exp.iconType === "film" ? <Film size={20} /> : <Ticket size={20} />}
                  </div>
                  <div className="expense-info">
                    <strong>{exp.name}</strong>
                  </div>
                  <span className="expense-amount">RM {exp.amount}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <h3 className="section-title">Recent Transactions</h3>
        <section className="transactions-section">
          {transactions.map(tx => (
            <div key={tx.id} className="transaction-item">
              <div className={`tx-icon ${tx.type}`}>
                {tx.type === "income" ? <ArrowDownLeft size={20} /> : <Home size={20} />}
              </div>
              <div className="tx-details">
                <span className="tx-desc">{tx.description}</span>
                <span className="tx-date">{tx.date}</span>
              </div>
              <div className={`tx-amount ${tx.type}`}>
                {tx.type === "income" ? "+" : "-"} RM{tx.amount.toFixed(2)}
              </div>
            </div>
          ))}
        </section>

      </main>

      {/* Simulate Inflow Modal */}
      {showSimulateModal && (
        <div className="modal-overlay">
          <div className="modal-content gx-modal">
            <div className="modal-header">
              <h3>Simulate Inflow</h3>
              <p>Simulate an external transfer into your account.</p>
            </div>
            <form onSubmit={handleSimulateInflow} className="modal-form">
              <div className="input-group">
                <label>Amount (RM)</label>
                <input
                  type="number"
                  value={simAmount}
                  onChange={e => setSimAmount(Number(e.target.value) || "")}
                  placeholder="e.g. 150"
                  autoFocus
                />
              </div>
              <div className="input-group">
                <label>Payment Method</label>
                <select value={simMethod} onChange={e => setSimMethod(e.target.value)}>
                  <option>TNG eWallet</option>
                  <option>Maybank</option>
                  <option>CIMB Bank</option>
                  <option>Public Bank</option>
                  <option>GX Bank</option>
                </select>
              </div>
              <div className="input-group">
                <label>What's the transfer for?</label>
                <input
                  type="text"
                  value={simDesc}
                  onChange={e => setSimDesc(e.target.value)}
                  placeholder="e.g. Dinner split, Salary"
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowSimulateModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary gx-primary-btn">Simulate Transfer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mini Allocator Modal (<= 300) */}
      {showMiniAllocModal && (
        <div className="modal-overlay">
          <div className="modal-content gx-modal">
            <div className="modal-header">
              <h3>Manual Allocation</h3>
              <p>Total pending is RM {pendingTotal.toFixed(2)} (≤ RM 300). You may allocate this directly.</p>
            </div>
            <div className="modal-form">
              <div className="input-group">
                <label>Select Destination Pocket</label>
                <select value={miniAllocSectionId} onChange={e => setMiniAllocSectionId(e.target.value)}>
                  {sections.map(sec => (
                    <option key={sec.id} value={sec.id}>{sec.name}</option>
                  ))}
                </select>
              </div>
              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setShowMiniAllocModal(false)}>Cancel</button>
                <button className="btn-primary gx-primary-btn" onClick={handleConfirmMiniAlloc}>Confirm Allocation</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
