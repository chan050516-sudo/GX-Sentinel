import { useState, useRef, useEffect } from "react";
import { Bot, Target, AlertTriangle, Send } from "lucide-react";
import "./ChatAssistant.css";

type Message = { id: string; role: "user" | "assistant"; content: string; timestamp: string };

export default function ChatAssistant() {
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
                <span className="message-time">{msg.timestamp}</span>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

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
