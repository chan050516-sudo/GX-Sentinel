import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  Shield, Home, Calendar as CalendarIcon, Utensils, Wallet, 
  Hourglass, Plus, ScanLine, ArrowRight, Eye, ChevronDown, 
  ChevronRight, ArrowDownLeft, CheckCircle2, Info, Target, RefreshCw
} from "lucide-react";
import "./Dashboard.css";

const API_BASE = "http://localhost:8000";
const USER_ID = "demo_user_01";

// Types
type Transaction = { id: string; type: "income" | "expense"; amount: number; date: string; description: string; };
type Section = { id: string; name: string; amount: number; iconType: "shield" | "home" | "calendar" | "utensils" | "wallet"; };
type PendingAllocation = { id: string; amount: number; method: string; description: string; date: string; };
type Goal = { id: string; name: string; target: number; saved: number; deadline: string; };
type CalendarEvent = { id: string; title: string; category: string; estimatedCost: number; date: string; isRecurring: boolean; subscriptionDetection: boolean; };
type InterceptorTier = "idle" | "loading" | "soft" | "friction" | "critical" | "justify" | "verdict";
type InterceptorState = {
  tier: InterceptorTier;
  auditId: string;
  message: string;
  runwayDrop?: number;
  compoundLoss?: string;
  delaySeconds?: number;
  countdown?: number;
  justification: string;
  verdict?: string;
  reasoning?: string;
};

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

  // Add Money Modal (reuses simulate inflow)
  const [showAddMoneyModal, setShowAddMoneyModal] = useState(false);

  // Scan QR Modal
  const [showScanQRModal, setShowScanQRModal] = useState(false);
  const [qrAmount, setQrAmount] = useState<number | "">("");
  const [qrCategory, setQrCategory] = useState("");
  const [qrDesc, setQrDesc] = useState("");
  const [qrMerchantId] = useState(() => `MID-${Math.random().toString(36).slice(2,10).toUpperCase()}`);
  const [qrTraceId, setQrTraceId] = useState(() => `TRC-${Date.now().toString(36).toUpperCase()}`);

  // Send Money Modal
  const [showSendMoneyModal, setShowSendMoneyModal] = useState(false);
  const [sendBank, setSendBank] = useState("GX Bank");
  const [sendAccount, setSendAccount] = useState("");
  const [sendAmount, setSendAmount] = useState<number | "">("");
  const [sendDesc, setSendDesc] = useState("");
  const [sendMerchantId] = useState(() => `MID-${Math.random().toString(36).slice(2,10).toUpperCase()}`);
  const [sendTraceId, setSendTraceId] = useState(() => `TRC-${Date.now().toString(36).toUpperCase()}`);

  // Shared Interceptor State
  const [interceptor, setInterceptor] = useState<InterceptorState>({
    tier: "idle", auditId: "", message: "", justification: ""
  });
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Future Planning: Goals State
  const [goals, setGoals] = useState<Goal[]>([{ id: "g1", name: "Buy a Car", target: 20000, saved: 7000, deadline: "2027-12-31" }]);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [newGoal, setNewGoal] = useState({ name: "", target: "", deadline: "" });

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

  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([
    { id: "e1", title: "Movie Date", category: "movie", estimatedCost: 85, date: `${currentYear}-${String(currentMonth+1).padStart(2,'0')}-16`, isRecurring: false, subscriptionDetection: false },
    { id: "e2", title: "Netflix Subscription", category: "subscription", estimatedCost: 55, date: `${currentYear}-${String(currentMonth+1).padStart(2,'0')}-13`, isRecurring: true, subscriptionDetection: true },
  ]);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: "", category: "movie", estimatedCost: "", isRecurring: false, subscriptionDetection: false });

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
    if (!newGoal.name || !newGoal.target || !newGoal.deadline) return;
    setGoals(prev => [...prev, {
      id: Date.now().toString(),
      name: newGoal.name,
      target: Number(newGoal.target),
      saved: 0,
      deadline: newGoal.deadline
    }]);
    setShowAddGoal(false);
    setNewGoal({ name: "", target: "", deadline: "" });
  };

  const handleAddEvent = () => {
    if (!newEvent.title || !newEvent.estimatedCost) return;
    // Map selectedDate ("6 May") back to a date string for the current year/month
    const day = selectedDate.split(" ")[0].padStart(2, "0");
    const dateStr = `${currentYear}-${String(currentMonth+1).padStart(2,'0')}-${day}`;
    setCalendarEvents(prev => [...prev, {
      id: Date.now().toString(),
      title: newEvent.title,
      category: newEvent.category,
      estimatedCost: Number(newEvent.estimatedCost),
      date: dateStr,
      isRecurring: newEvent.isRecurring,
      subscriptionDetection: newEvent.subscriptionDetection
    }]);
    setShowAddEvent(false);
    setNewEvent({ title: "", category: "movie", estimatedCost: "", isRecurring: false, subscriptionDetection: false });
  };

  // --- Interceptor helpers ---
  const resetInterceptor = () => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    setInterceptor({ tier: "idle", auditId: "", message: "", justification: "" });
  };

  const runInterceptor = async (amount: number, productName: string, onAllow: () => void) => {
    setInterceptor(prev => ({ ...prev, tier: "loading", message: "" }));
    try {
      const res = await fetch(`${API_BASE}/interceptor/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": USER_ID },
        body: JSON.stringify({
          platform: "GX Sentinel Dashboard",
          products: [{ name: productName, price: amount, quantity: 1 }],
          totalAmount: amount
        })
      });
      const data = await res.json();
      const level = data.triggerLevel as string;

      if (level === "soft" && !data.softMessage?.startsWith("✅")) {
        // Tier 1 - warning toast but allow
        setInterceptor(prev => ({ ...prev, tier: "soft", auditId: data.auditId, message: data.softMessage || "" }));
      } else if (level === "friction") {
        let secs = data.delaySeconds || 5;
        setInterceptor(prev => ({
          ...prev, tier: "friction", auditId: data.auditId,
          message: data.softMessage || "",
          runwayDrop: data.runwayDropDays,
          compoundLoss: data.compoundLossExample,
          delaySeconds: secs, countdown: secs
        }));
        countdownRef.current = setInterval(() => {
          setInterceptor(prev => {
            if ((prev.countdown ?? 0) <= 1) {
              clearInterval(countdownRef.current!);
              return { ...prev, countdown: 0 };
            }
            return { ...prev, countdown: (prev.countdown ?? 1) - 1 };
          });
        }, 1000);
      } else if (level === "critical") {
        setInterceptor(prev => ({
          ...prev, tier: "critical", auditId: data.auditId,
          message: data.softMessage || "",
          runwayDrop: data.runwayDropDays,
          compoundLoss: data.compoundLossExample
        }));
      } else {
        // Tier 0 – allow silently
        onAllow();
        resetInterceptor();
      }

      // Store onAllow for later use
      (window as any).__interceptorOnAllow = onAllow;
    } catch {
      // If backend unreachable, allow with a note
      onAllow();
      resetInterceptor();
    }
  };

  const handleInterceptorAllow = () => {
    const fn = (window as any).__interceptorOnAllow;
    if (fn) fn();
    resetInterceptor();
  };

  const handleInterceptorAbort = () => resetInterceptor();

  const handleInterceptorJustify = async () => {
    if (!interceptor.justification.trim()) return;
    setInterceptor(prev => ({ ...prev, tier: "loading" }));
    try {
      const res = await fetch(`${API_BASE}/interceptor/justify`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": USER_ID },
        body: JSON.stringify({ auditId: interceptor.auditId, justification: interceptor.justification })
      });
      const data = await res.json();
      setInterceptor(prev => ({
        ...prev, tier: "verdict",
        verdict: data.verdict,
        reasoning: data.cognitiveMessage || data.reasoning
      }));
    } catch {
      setInterceptor(prev => ({ ...prev, tier: "verdict", verdict: "APPROVED", reasoning: "Backend unavailable. Transaction allowed." }));
    }
  };

  // --- Payment handlers ---
  const handleScanQRConfirm = async () => {
    const amount = Number(qrAmount);
    if (!amount || !qrDesc) return;
    await runInterceptor(amount, qrDesc, () => {
      setTotalBalance(prev => prev - amount);
      setTransactions(prev => [{ id: Date.now().toString(), type: "expense", amount, date: "Just now", description: `QR: ${qrDesc}` }, ...prev]);
      setShowScanQRModal(false);
      setQrAmount(""); setQrCategory(""); setQrDesc("");
      setQrTraceId(`TRC-${Date.now().toString(36).toUpperCase()}`);
    });
  };

  const handleSendMoneyConfirm = async () => {
    const amount = Number(sendAmount);
    if (!amount || !sendAccount || !sendDesc) return;
    await runInterceptor(amount, sendDesc, () => {
      setTotalBalance(prev => prev - amount);
      setTransactions(prev => [{ id: Date.now().toString(), type: "expense", amount, date: "Just now", description: `Transfer to ${sendBank}: ${sendDesc}` }, ...prev]);
      setShowSendMoneyModal(false);
      setSendAmount(""); setSendAccount(""); setSendDesc("");
      setSendTraceId(`TRC-${Date.now().toString(36).toUpperCase()}`);
    });
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
          <button className="gx-action-btn" onClick={() => setShowAddMoneyModal(true)}>
            <div className="icon-circle"><Plus size={24} /></div>
            <span>Add money</span>
          </button>
          <button className="gx-action-btn" onClick={() => setShowScanQRModal(true)}>
            <div className="icon-circle"><ScanLine size={24} /></div>
            <span>Scan QR</span>
          </button>
          <button className="gx-action-btn" onClick={() => setShowSendMoneyModal(true)}>
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
                <label style={{color:'#94a3b8',fontSize:'0.85rem'}}>Deadline</label>
                <input type="date" value={newGoal.deadline} onChange={e => setNewGoal({...newGoal, deadline: e.target.value})} />
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
                  <div className="progress-bar-fill" style={{ width: `${Math.min(100,(goal.saved / goal.target) * 100)}%` }}></div>
                </div>
                <div className="goal-footer">
                  <span className="goal-saved">RM {goal.saved.toLocaleString()} Saved</span>
                  <span className="goal-date">📅 {goal.deadline ? new Date(goal.deadline).toLocaleDateString('en-MY', {day:'numeric',month:'short',year:'numeric'}) : 'No deadline'}</span>
                </div>
              </div>
            ))}
          </section>

          <section className="bottom-card expenses-card">
            <div className="card-header">
              <h3 className="flex-align"><CalendarIcon size={20} /> {currentMonthName} {currentYear}</h3>
              <button className="add-btn-small" onClick={() => setShowAddEvent(!showAddEvent)}><Plus size={16}/></button>
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
                  const dayStr = String(d).padStart(2,'0');
                  const dateStr = `${currentYear}-${String(currentMonth+1).padStart(2,'0')}-${dayStr}`;
                  const hasEvent = calendarEvents.some(e => e.date === dateStr);
                  return (
                    <div key={d} className={`calendar-cell ${selectedDate === fullDate ? 'active' : ''}`} onClick={() => setSelectedDate(fullDate)}>
                      <span className="cell-number">{d}</span>
                      {hasEvent && <div className="expense-dot"></div>}
                    </div>
                  );
                })}
              </div>
            </div>

            {showAddEvent && (
              <div className="inline-add-form">
                <input type="text" placeholder="Title (e.g. Movie Night)" value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} />
                <select value={newEvent.category} onChange={e => setNewEvent({...newEvent, category: e.target.value})}>
                  <option value="movie">🎬 Movie</option>
                  <option value="dinner">🍽️ Dinner</option>
                  <option value="travel">✈️ Travel</option>
                  <option value="subscription">📱 Subscription</option>
                  <option value="other">📌 Other</option>
                </select>
                <input type="number" placeholder="Estimated Cost (RM)" value={newEvent.estimatedCost} onChange={e => setNewEvent({...newEvent, estimatedCost: e.target.value})} />
                <div className="toggle-row">
                  <label><input type="checkbox" checked={newEvent.isRecurring} onChange={e => setNewEvent({...newEvent, isRecurring: e.target.checked})} /> Recurring</label>
                  <label><input type="checkbox" checked={newEvent.subscriptionDetection} onChange={e => setNewEvent({...newEvent, subscriptionDetection: e.target.checked})} /> Subscription</label>
                </div>
                <button onClick={handleAddEvent}>Add to {selectedDate}</button>
              </div>
            )}

            <div className="expense-list">
              {(() => {
                const dayStr = selectedDate.split(" ")[0].padStart(2,'0');
                const dateStr = `${currentYear}-${String(currentMonth+1).padStart(2,'0')}-${dayStr}`;
                const dayEvents = calendarEvents.filter(e => e.date === dateStr);
                if (dayEvents.length === 0 && !showAddEvent) return <div className="empty-state">No events for {selectedDate}.</div>;
                return dayEvents.map(ev => (
                  <div key={ev.id} className="expense-item">
                    <div className="expense-icon">
                      {ev.category === 'movie' ? '🎬' : ev.category === 'dinner' ? '🍽️' : ev.category === 'travel' ? '✈️' : ev.category === 'subscription' ? '📱' : '📌'}
                    </div>
                    <div className="expense-info">
                      <strong>{ev.title}</strong>
                      <span>{ev.isRecurring ? '🔁 Recurring' : ''} {ev.subscriptionDetection ? '• AI Detected' : ''}</span>
                    </div>
                    <span className="expense-amount">RM {ev.estimatedCost}</span>
                  </div>
                ));
              })()}
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

      {/* Calendar add-event toggle */}
      {/* (button already rendered inline above with setShowAddEvent) */}

      {/* Shared Interceptor Overlay */}
      {(interceptor.tier !== "idle") && (
        <div className="modal-overlay">
          <div className="modal-content gx-modal interceptor-modal">
            {interceptor.tier === "loading" && (
              <div className="interceptor-loading">
                <RefreshCw size={32} className="spin-icon" />
                <p>AI Guardian is analyzing your transaction…</p>
              </div>
            )}
            {interceptor.tier === "soft" && (
              <>
                <div className="interceptor-header warning"><Shield size={28}/> <h3>Heads Up</h3></div>
                <p className="interceptor-msg">{interceptor.message}</p>
                <div className="modal-actions">
                  <button className="btn-secondary" onClick={handleInterceptorAbort}>Abort</button>
                  <button className="btn-primary gx-primary-btn" onClick={handleInterceptorAllow}>Proceed Anyway</button>
                </div>
              </>
            )}
            {interceptor.tier === "friction" && (
              <>
                <div className="interceptor-header friction"><Shield size={28}/> <h3>Financial Warning</h3></div>
                <p className="interceptor-msg">{interceptor.message}</p>
                {interceptor.runwayDrop && <div className="runway-drop-badge">📉 Runway -{interceptor.runwayDrop?.toFixed(1)} days</div>}
                {interceptor.compoundLoss && <div className="compound-loss">{interceptor.compoundLoss}</div>}
                <div className="modal-actions">
                  <button className="btn-secondary" onClick={handleInterceptorAbort}>Abort Transaction</button>
                  <button className="btn-primary gx-primary-btn" onClick={handleInterceptorAllow} disabled={(interceptor.countdown ?? 0) > 0}>
                    {(interceptor.countdown ?? 0) > 0 ? `Allow (${interceptor.countdown}s)` : "Allow"}
                  </button>
                </div>
              </>
            )}
            {interceptor.tier === "critical" && (
              <>
                <div className="interceptor-header critical"><Shield size={28}/> <h3>🛑 Transaction Frozen</h3></div>
                <p className="interceptor-msg">{interceptor.message}</p>
                {interceptor.runwayDrop && <div className="runway-drop-badge">📉 Runway -{interceptor.runwayDrop?.toFixed(1)} days</div>}
                <textarea className="justification-input" placeholder="Provide a rational justification for this purchase…" value={interceptor.justification} onChange={e => setInterceptor(prev => ({...prev, justification: e.target.value}))} rows={4} />
                <div className="modal-actions">
                  <button className="btn-secondary" onClick={handleInterceptorAbort}>Abort</button>
                  <button className="btn-primary gx-primary-btn" onClick={handleInterceptorJustify} disabled={!interceptor.justification.trim()}>Submit to AI</button>
                </div>
              </>
            )}
            {interceptor.tier === "verdict" && (
              <>
                <div className={`interceptor-header ${interceptor.verdict === "APPROVED" ? "warning" : "critical"}`}>
                  {interceptor.verdict === "APPROVED" ? <CheckCircle2 size={28}/> : <Shield size={28}/>}
                  <h3>AI Verdict: {interceptor.verdict}</h3>
                </div>
                <p className="interceptor-msg">{interceptor.reasoning}</p>
                <div className="modal-actions">
                  <button className="btn-secondary" onClick={handleInterceptorAbort}>Abort</button>
                  {interceptor.verdict === "APPROVED" && <button className="btn-primary gx-primary-btn" onClick={handleInterceptorAllow}>Proceed</button>}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Add Money Modal */}
      {showAddMoneyModal && (
        <div className="modal-overlay">
          <div className="modal-content gx-modal">
            <div className="modal-header">
              <h3>Add Money</h3>
              <p>Receive a transfer into your account.</p>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleSimulateInflow(e); setShowAddMoneyModal(false); setShowSimulateModal(false); }} className="modal-form">
              <div className="input-group">
                <label>Amount (RM)</label>
                <input type="number" value={simAmount} onChange={e => setSimAmount(Number(e.target.value) || "")} placeholder="e.g. 500" autoFocus />
              </div>
              <div className="input-group">
                <label>Payment Method</label>
                <select value={simMethod} onChange={e => setSimMethod(e.target.value)}>
                  <option>TNG eWallet</option><option>Maybank</option><option>CIMB Bank</option>
                  <option>Public Bank</option><option>RHB Bank</option><option>GX Bank</option>
                </select>
              </div>
              <div className="input-group">
                <label>What's the transfer for?</label>
                <input type="text" value={simDesc} onChange={e => setSimDesc(e.target.value)} placeholder="e.g. Salary, Freelance" />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowAddMoneyModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary gx-primary-btn">Confirm</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Scan QR Modal */}
      {showScanQRModal && interceptor.tier === "idle" && (
        <div className="modal-overlay">
          <div className="modal-content gx-modal">
            <div className="modal-header">
              <h3>Scan QR — DuitNow</h3>
              <p>Pay via DuitNow QR code.</p>
            </div>
            <div className="modal-form">
              <div className="auto-id-row">
                <span className="auto-id-label">Merchant ID</span><span className="auto-id-value">{qrMerchantId}</span>
              </div>
              <div className="auto-id-row">
                <span className="auto-id-label">Trace ID</span><span className="auto-id-value">{qrTraceId}</span>
              </div>
              <div className="input-group">
                <label>Amount (RM)</label>
                <input type="number" value={qrAmount} onChange={e => setQrAmount(Number(e.target.value)||"")} placeholder="e.g. 45.90" autoFocus />
              </div>
              <div className="input-group">
                <label>Category</label>
                <input type="text" value={qrCategory} onChange={e => setQrCategory(e.target.value)} placeholder="e.g. Food & Beverage" />
              </div>
              <div className="input-group">
                <label>Description (Product / Merchant)</label>
                <input type="text" value={qrDesc} onChange={e => setQrDesc(e.target.value)} placeholder="e.g. McDonald's Big Mac" />
              </div>
              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setShowScanQRModal(false)}>Cancel</button>
                <button className="btn-primary gx-primary-btn" onClick={handleScanQRConfirm} disabled={!qrAmount || !qrDesc}>Confirm Payment</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Send Money Modal */}
      {showSendMoneyModal && interceptor.tier === "idle" && (
        <div className="modal-overlay">
          <div className="modal-content gx-modal">
            <div className="modal-header">
              <h3>Send Money</h3>
              <p>Transfer to a bank or eWallet.</p>
            </div>
            <div className="modal-form">
              <div className="auto-id-row">
                <span className="auto-id-label">Merchant ID</span><span className="auto-id-value">{sendMerchantId}</span>
              </div>
              <div className="auto-id-row">
                <span className="auto-id-label">Trace ID</span><span className="auto-id-value">{sendTraceId}</span>
              </div>
              <div className="input-group">
                <label>Recipient Bank / eWallet</label>
                <select value={sendBank} onChange={e => setSendBank(e.target.value)}>
                  <option>GX Bank</option><option>TNG eWallet</option><option>Maybank</option>
                  <option>CIMB Bank</option><option>Public Bank</option><option>RHB Bank</option>
                  <option>Hong Leong Bank</option><option>AmBank</option><option>BSN</option>
                </select>
              </div>
              <div className="input-group">
                <label>Account Number</label>
                <input type="text" value={sendAccount} onChange={e => setSendAccount(e.target.value)} placeholder="e.g. 1234567890" />
              </div>
              <div className="input-group">
                <label>Amount (RM)</label>
                <input type="number" value={sendAmount} onChange={e => setSendAmount(Number(e.target.value)||"")} placeholder="e.g. 200" />
              </div>
              <div className="input-group">
                <label>Description</label>
                <input type="text" value={sendDesc} onChange={e => setSendDesc(e.target.value)} placeholder="e.g. Rent, Groceries" />
              </div>
              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setShowSendMoneyModal(false)}>Cancel</button>
                <button className="btn-primary gx-primary-btn" onClick={handleSendMoneyConfirm} disabled={!sendAmount || !sendAccount || !sendDesc}>Confirm Transfer</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Simulate Inflow Modal (dev tool) */}
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
