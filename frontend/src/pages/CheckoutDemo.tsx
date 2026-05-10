import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Hand } from "lucide-react";
import "./CheckoutDemo.css";

type InterceptorLevel = "none" | "level1" | "level2" | "level3";

// 宠物自我介绍对话数据
type IntroStep = {
  text: string;
  petState: "idle" | "analyzing" | "warning" | "suggesting";
};

const introSteps: IntroStep[] = [
  {
    text: "👋 Hello! I'm your GX-Sentinel Companion AI. I watch over your spending decisions.",
    petState: "idle",
  },
  {
    text: "🧘 When you're shopping normally, I stay calm and idle. See my relaxed eyes?",
    petState: "idle",
  },
  {
    text: "⚠️ If you're about to make a risky purchase (late night, luxury item, low balance), I turn red and warn you.",
    petState: "warning",
  },
  {
    text: "⚙️ While I'm analyzing your transaction, my eyes glow purple and I breathe faster.",
    petState: "analyzing",
  },
  {
    text: "💚 When you make a good decision (like cancelling an impulse), I turn green and smile. That's my 'suggesting' state!",
    petState: "suggesting",
  },
  {
    text: "✅ That's all! Now you can test the Interceptor. Click 'Place Order' above to experience friction.",
    petState: "idle",
  },
];

export default function CheckoutDemo() {
  const navigate = useNavigate();

  // 拦截器原有状态
  const [interceptorState, setInterceptorState] = useState<InterceptorLevel>("none");
  const [countdown, setCountdown] = useState(5);
  const [justification, setJustification] = useState("");

  // 宠物介绍相关状态
  const [introActive, setIntroActive] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [petVisible, setPetVisible] = useState(true);
  const [showBubble, setShowBubble] = useState(true);
  const petContainerRef = useRef<HTMLDivElement>(null);

  // 当前介绍的宠物状态
  const currentPetState = introSteps[currentStep].petState;

  // 当介绍步骤变化时，更新宠物的状态类
  useEffect(() => {
    if (!introActive) return;
    const petElem = petContainerRef.current;
    if (!petElem) return;
    // 移除所有状态类
    petElem.classList.remove("idle", "analyzing", "warning", "suggesting");
    // 添加当前状态类
    petElem.classList.add(currentPetState);
  }, [currentStep, introActive, currentPetState]);

  // 眼睛跟随鼠标（完全照抄 content-script）
  useEffect(() => {
    if (!petVisible || !introActive) return;
    const petContainer = petContainerRef.current;
    if (!petContainer) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = petContainer.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
      const distance = Math.min(6, Math.hypot(e.clientX - centerX, e.clientY - centerY) / 25);
      const eyeX = Math.cos(angle) * distance;
      const eyeY = Math.sin(angle) * distance;
      petContainer.style.setProperty('--eye-x', `${eyeX}px`);
      petContainer.style.setProperty('--eye-y', `${eyeY}px`);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [petVisible, introActive]);

  // 处理宠物点击：下一句或结束介绍
  const handlePetClick = () => {
    if (!introActive) return;
    if (currentStep + 1 < introSteps.length) {
      setCurrentStep(prev => prev + 1);
    } else {
      setIntroActive(false);
      setShowBubble(false);
      setTimeout(() => setPetVisible(false), 500);
    }
  };

  // 拦截器逻辑（保持不变）
  const handlePlaceOrder = () => {
    if (introActive) {
      setIntroActive(false);
      setShowBubble(false);
      setPetVisible(false);
    }
    setInterceptorState("level1");
  };

  useEffect(() => {
    let timer: any;
    if (interceptorState === "level1") {
      timer = setTimeout(() => setInterceptorState("level2"), 3000);
    } else if (interceptorState === "level2") {
      if (countdown > 0) {
        timer = setTimeout(() => setCountdown(prev => prev - 1), 1000);
      } else {
        setInterceptorState("level3");
      }
    }
    return () => clearTimeout(timer);
  }, [interceptorState, countdown]);

  const handleAbort = () => {
    navigate("/dashboard", {
      state: {
        nudgeType: "positive",
        message: "Great job resisting! Resilience Score ↑ 2.5",
      },
    });
  };

  const handleConfirm = () => {
    if (justification.trim().length < 10) {
      alert("Please provide a valid reason (at least 10 characters).");
      return;
    }
    navigate("/dashboard", {
      state: {
        nudgeType: "negative",
        message: "This purchase reduced your financial runway by 14 days. Resilience Score ↓ 1.3",
      },
    });
  };

  return (
    <div className="checkout-container">
      {/* 假电商头部 */}
      <header className="checkout-header">
        <div className="ecommerce-logo">E-Commerce App</div>
        <button className="back-to-dash" onClick={() => navigate("/dashboard")}>Exit Demo</button>
      </header>

      {/* 假结算内容 */}
      <main className="checkout-main">
        <div className="checkout-card">
          <h2>Checkout</h2>
          <div className="product-item">
            <div className="product-img"></div>
            <div className="product-details">
              <h4>Mechanical Keyboard (RGB)</h4>
              <p>Variation: Blue Switch</p>
              <span className="product-price">RM 450.00</span>
            </div>
          </div>
          <div className="checkout-summary">
            <div className="summary-row">
              <span>Subtotal</span>
              <span>RM 450.00</span>
            </div>
            <div className="summary-row">
              <span>Shipping Fee</span>
              <span>RM 5.00</span>
            </div>
            <div className="summary-row total">
              <span>Total Payment</span>
              <span>RM 455.00</span>
            </div>
          </div>
          <button className="place-order-btn" onClick={handlePlaceOrder}>Place Order</button>
        </div>
      </main>

      {/* 宠物介绍模块 - 结构完全复制 content-script */}
      {petVisible && (
        <div id="gx-ambient-wrapper" className="visible">
          {/* 气泡 */}
          {showBubble && introActive && (
            <div id="gx-bubble" className={`show ${currentPetState}`}>
              <div className={`gx-msg-header ${
                currentPetState === "warning" ? "warning" :
                currentPetState === "suggesting" ? "success" : "neutral"
              }`}>
                {currentPetState === "warning" ? "⚠️" : currentPetState === "suggesting" ? "💚" : "🤖"} Companion AI
              </div>
              <p>{introSteps[currentStep].text}</p>
              <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "8px", textAlign: "right" }}>
                Click me to continue →
              </div>
            </div>
          )}
          {/* 宠物容器 - 结构与 content-script 完全一致 */}
          <div
            ref={petContainerRef}
            id="gx-pet"
            className={`gx-pet-container ${introActive ? currentPetState : "idle"}`}
            onClick={handlePetClick}
          >
            <div className="gx-pet-breather">
              <div className="gx-eye-wrap">
                <div className="gx-eye-inner"></div>
              </div>
              <div className="gx-eye-wrap">
                <div className="gx-eye-inner"></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 拦截器原有 Overlay */}
      {(interceptorState === "level2" || interceptorState === "level3") && (
        <div className="friction-overlay">
          {interceptorState === "level2" && (
            <div className="friction-content">
              <h2><Hand size={32} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} /> Wait.</h2>
              <div className="future-projection-tag">Future Projection</div>
              <p>This purchase will drop your Financial Runway by <strong>14 Days</strong>.</p>
              <div className="countdown-circle">{countdown}</div>
              <p className="compound-loss">If invested, this RM 455 could be RM 600 in 5 years.</p>
            </div>
          )}
          {interceptorState === "level3" && (
            <div className="critical-modal">
              <div className="modal-header"><h3>System Audit Required</h3></div>
              <div className="modal-body">
                <div className="ai-feedback">
                  <strong>AI Audit:</strong>
                  <p>This transaction contradicts your "Buy a Car" savings goal. Please provide your self-justification for this purchase.</p>
                </div>
                <textarea className="justification-input" placeholder="I am buying this because..." value={justification} onChange={(e) => setJustification(e.target.value)} />
              </div>
              <div className="modal-footer">
                <button className="cancel-purchase-btn" onClick={handleAbort}>Cancel Purchase (+2.5 Score)</button>
                <button className="confirm-purchase-btn" onClick={handleConfirm} disabled={justification.trim().length < 10}>Confirm Purchase</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}