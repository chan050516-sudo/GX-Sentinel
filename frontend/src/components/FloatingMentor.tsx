import { useState } from "react";
import { Bot, X } from "lucide-react";
import { useLocation } from "react-router-dom";
import ChatAssistant from "../pages/ChatAssistant";
import "./FloatingMentor.css";

export default function FloatingMentor() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  // Don't show on login or checkout demo pages
  if (location.pathname === "/" || location.pathname === "/checkout-demo") {
    return null;
  }

  // Don't show the floating button on the dedicated /chat page
  if (location.pathname === "/chat") {
    return null;
  }

  return (
    <>
      {/* Floating trigger button */}
      <button
        className={`floating-mentor-btn ${isOpen ? "floating-mentor-btn-hidden" : ""}`}
        onClick={() => setIsOpen(true)}
        aria-label="Open AI Mentor"
      >
        <div className="floating-mentor-icon">
          <Bot size={26} />
        </div>
        <span className="floating-mentor-label">AI Mentor</span>
        <span className="floating-mentor-pulse" />
      </button>

      {/* Popup panel */}
      {isOpen && (
        <div className="mentor-popup-wrapper">
          <div className="mentor-popup-backdrop" onClick={() => setIsOpen(false)} />
          <div className="mentor-popup-panel">
            <button
              className="mentor-popup-close"
              onClick={() => setIsOpen(false)}
              aria-label="Close AI Mentor"
            >
              <X size={18} />
            </button>
            <ChatAssistant isPopup={true} />
          </div>
        </div>
      )}
    </>
  );
}
