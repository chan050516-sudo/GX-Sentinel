import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Hand } from "lucide-react";
import "./CheckoutDemo.css";

type InterceptorLevel = "none" | "level1" | "level2" | "level3";

export default function CheckoutDemo() {
  const navigate = useNavigate();
  const [interceptorState, setInterceptorState] = useState<InterceptorLevel>("none");
  const [countdown, setCountdown] = useState(5);
  const [justification, setJustification] = useState("");

  const handlePlaceOrder = () => {
    // Start the intervention sequence
    setInterceptorState("level1");
  };

  useEffect(() => {
    let timer: any;
    if (interceptorState === "level1") {
      // Show soft notification for 3 seconds, then escalate to Level 2
      timer = setTimeout(() => {
        setInterceptorState("level2");
      }, 3000);
    } else if (interceptorState === "level2") {
      // Countdown for 5 seconds, then escalate to Level 3
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
        message: "Great job resisting! Resilience Score ↑ 2.5" 
      } 
    });
  };

  const handleConfirm = () => {
    if (justification.trim().length < 10) {
      alert("Please provide a valid reason (at least 10 characters).");
      return;
    }
    // Simulate AI audit
    navigate("/dashboard", { 
      state: { 
        nudgeType: "negative", 
        message: "This purchase reduced your financial runway by 14 days. Resilience Score ↓ 1.3" 
      } 
    });
  };

  return (
    <div className="checkout-container">
      {/* Fake Shopee/Lazada Header */}
      <header className="checkout-header">
        <div className="ecommerce-logo">E-Commerce App</div>
        <button className="back-to-dash" onClick={() => navigate("/dashboard")}>Exit Demo</button>
      </header>

      {/* Fake Checkout Content */}
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

          <button className="place-order-btn" onClick={handlePlaceOrder}>
            Place Order
          </button>
        </div>
      </main>

      {/* =========================================
          MODULE 2: INTERCEPTOR OVERLAYS
          ========================================= */}

      {/* Level 1: Soft Notification */}
      <div className={`toast-notification ${interceptorState === 'level1' ? 'show' : ''}`}>
        <div className="toast-icon"><AlertTriangle size={24} /></div>
        <div className="toast-content">
          <strong>Context Recall</strong>
          <p>High Impulse Score detected. We noticed repetition in purchasing similar products at night.</p>
        </div>
      </div>

      {/* Level 2 & 3: Friction Injection Background */}
      {(interceptorState === "level2" || interceptorState === "level3") && (
        <div className="friction-overlay">
          
          {/* Level 2: Friction Delay Text */}
          {interceptorState === "level2" && (
            <div className="friction-content">
              <h2><Hand size={32} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} /> Wait.</h2>
              <div className="future-projection-tag">Future Projection</div>
              <p>This purchase will drop your Financial Runway by <strong>14 Days</strong>.</p>
              <div className="countdown-circle">
                {countdown}
              </div>
              <p className="compound-loss">If invested, this RM 455 could be RM 600 in 5 years.</p>
            </div>
          )}

          {/* Level 3: Critical Interception Modal */}
          {interceptorState === "level3" && (
            <div className="critical-modal">
              <div className="modal-header">
                <h3>System Audit Required</h3>
              </div>
              <div className="modal-body">
                <div className="ai-feedback">
                  <strong>AI Audit:</strong>
                  <p>This transaction contradicts your "Buy a Car" savings goal. Please provide your self-justification for this purchase.</p>
                </div>
                
                <textarea 
                  className="justification-input" 
                  placeholder="I am buying this because..."
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                />
              </div>
              <div className="modal-footer">
                <button className="cancel-purchase-btn" onClick={handleAbort}>
                  Cancel Purchase (+2.5 Score)
                </button>
                <button 
                  className="confirm-purchase-btn" 
                  onClick={handleConfirm}
                  disabled={justification.trim().length < 10}
                >
                  Confirm Purchase
                </button>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
