import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Activity, Users, Menu, X } from "lucide-react";
import "./Sidebar.css";

export default function Sidebar() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Don't show sidebar on login page or checkout demo
  if (location.pathname === "/" || location.pathname === "/checkout-demo") {
    return null;
  }

  const navItems = [
    { path: "/dashboard", icon: <LayoutDashboard size={20} />, label: "Dashboard" },
    { path: "/tracking", icon: <Activity size={20} />, label: "Risk Profile" },
    { path: "/social", icon: <Users size={20} />, label: "Social Circle" },
  ];

  const handleNavClick = () => {
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        className="mobile-hamburger"
        onClick={() => setMobileOpen(true)}
        aria-label="Open navigation"
      >
        <Menu size={24} />
      </button>

      {/* Overlay backdrop for mobile */}
      {mobileOpen && (
        <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />
      )}

      <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-logo">
          <div className="logo-icon-small">
            <span className="gx-text">GX</span>
          </div>
          <h2>Sentinel</h2>
          <button
            className="mobile-close-btn"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${location.pathname === item.path ? "active" : ""}`}
              onClick={handleNavClick}
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
    </>
  );
}
