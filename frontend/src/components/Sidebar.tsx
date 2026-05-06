import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Coins, Activity, Bot, Users } from "lucide-react";
import "./Sidebar.css";

export default function Sidebar() {
  const location = useLocation();

  // Don't show sidebar on login page or checkout demo
  if (location.pathname === "/" || location.pathname === "/checkout-demo") {
    return null;
  }

  const navItems = [
    { path: "/dashboard", icon: <LayoutDashboard size={20} />, label: "Dashboard" },
    { path: "/tracking", icon: <Activity size={20} />, label: "Risk Profile" },
    { path: "/chat", icon: <Bot size={20} />, label: "AI Mentor" },
    { path: "/social", icon: <Users size={20} />, label: "Social Circle" },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon-small">
          <span className="gx-text">GX</span>
        </div>
        <h2>Sentinel</h2>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <Link 
            key={item.path} 
            to={item.path} 
            className={`nav-item ${location.pathname === item.path ? "active" : ""}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="resilience-score-mini">
          <span>Resilience Score</span>
          <strong>84.2</strong>
        </div>
      </div>
    </aside>
  );
}
