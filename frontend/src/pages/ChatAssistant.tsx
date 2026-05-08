import { useState, useRef, useEffect } from "react";
import { Bot, Target, AlertTriangle, Send, FileText, Download } from "lucide-react"; // 加入了 Download icon
import "./ChatAssistant.css";

// 增加 isReport 可选属性
type Message = { id: string; role: "user" | "assistant"; content: string; timestamp: string; isReport?: boolean };

export default function ChatAssistant({ isPopup = false }: { isPopup?: boolean }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hello! I am your GX-Sentinel Mentor Agent. I noticed you've maintained a great resilience score this week. How can I help you today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput("");

    // Simulate Mentor Agent response
    setTimeout(() => {
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I've analyzed your recent spending patterns. While your Fixed Expenses are well managed, your Variable Budget is draining 15% faster than last month. Consider reducing non-essential subscriptions.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMsg]);
    }, 1500);
  };

  const handleGenerateReport = () => {
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: "Generate Weekly Report",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, userMsg]);

    // 使用你提供的新报告内容
    const reportContent = `📊 WEEKLY RESILIENCE REPORT — GX-SENTINEL AI AUDIT
Resilience Index: 84.2 ↑ (+4.2%)
Behavioral Status: STABLE
━━━━━━━━━━━━━━━━━━
🧠 AI Behavioral Observations
━━━━━━━━━━━━━━━━━━
• Impulse resistance improved by 12% compared to last week.
• Two high-risk discretionary purchases were intercepted during late-night browsing sessions.
• Spending volatility decreased after reduced food delivery frequency.
• Financial runway increased from 41.3 days → 45.0 days.
• Savings discipline remains consistent, though entertainment spending is trending upward near weekends.
━━━━━━━━━━━━━━━━━━
⚠ Risk Signals Detected
━━━━━━━━━━━━━━━━━━
• Elevated purchase intent detected between 11:30 PM – 2:00 AM.
• Repeated exposure to high discretionary spending zones (cafés & lifestyle retail).
• One inactive subscription detected:
RM45/month — Streaming Service
━━━━━━━━━━━━━━━━━━
✅ Positive Behavioral Events
━━━━━━━━━━━━━━━━━━
• Aborted 3 impulse purchase attempts.
• Maintained daily spending within projected discretionary allowance for 5 consecutive days.
• Goal contribution streak maintained.
━━━━━━━━━━━━━━━━━━
🎯 AI Strategic Recommendation
━━━━━━━━━━━━━━━━━━
Your current financial behavior indicates strong recovery stability and improving impulse control.
However, recurring night-time discretionary activity remains your highest behavioral risk factor.

Recommended actions:
• Enable Night Spending Friction Mode after 11 PM
• Reduce food delivery frequency by 1–2 transactions/week
• Review inactive subscriptions before next billing cycle

Projected Outcome if maintained:
Estimated runway improvement:
+6.8 additional survivability days within 30 days.

GX-Sentinel Assessment:
Behavioral resilience trajectory remains positive.`;

    // Simulate Report Generation
    setTimeout(() => {
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: reportContent,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isReport: true // 标记这是一份报告
      };
      setMessages(prev => [...prev, aiMsg]);
    }, 1000);
  };

  return (
    <div className="chat-container">
      <div className="chat-layout">

        {/* Left Side: Weekly Report */}
        <div className="weekly-report-panel">
          <h2>Weekly Report</h2>
          <div className="report-card">
            <div className="report-header">
              <span className="week-label">Week of May 24th</span>
              <span className="trend positive">↑ 4.2%</span>
            </div>
            <div className="report-body">
              <p>Your <strong>Resilience Index</strong> improved this week primarily due to stopping 2 impulse purchases via the Interceptor.</p>

              <div className="insight-item">
                <span className="insight-icon"><Target size={24} /></span>
                <div className="insight-text">
                  <strong>Savings Goal on Track</strong>
                  <span>"Buy a Car" is projected to hit target by Dec 2027.</span>
                </div>
              </div>

              <div className="insight-item warning">
                <span className="insight-icon"><AlertTriangle size={24} /></span>
                <div className="insight-text">
                  <strong>Subscription Creep</strong>
                  <span>You have 3 inactive subscriptions costing RM 45/mo.</span>
                </div>
              </div>
            </div>
            <button className="download-btn">Download Full PDF</button>
          </div>
        </div>

        {/* Right Side: Chat Interface */}
        <div className="chat-interface">
          <div className="chat-header">
            <div className="mentor-avatar"><Bot size={28} color="white" /></div>
            <div>
              <h3>Mentor Agent</h3>
              <span className="status">Online</span>
            </div>
          </div>

          <div className="messages-area">
            {messages.map(msg => (
              <div key={msg.id} className={`message-wrapper ${msg.role}`}>
                <div className="message-bubble">
                  {msg.content}
                </div>
                {/* 动态渲染聊天框内的下载按钮 */}
                {msg.isReport && (
                  <button className="chat-download-btn" onClick={() => alert("Downloading Report...")}>
                    <Download size={16} />
                    <span>Download Report</span>
                  </button>
                )}
                <span className="message-time">{msg.timestamp}</span>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {isPopup && (
            <div className="quick-actions">
              <button className="quick-action-btn" onClick={handleGenerateReport}>
                <FileText size={16} />
                <span>Generate Weekly Report</span>
              </button>
            </div>
          )}

          <div className="input-area">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Ask about your financial health..."
            />
            <button className="send-btn" onClick={handleSend}>
              <Send size={20} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}