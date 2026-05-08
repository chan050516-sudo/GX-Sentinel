import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Activity, Users, Menu, X, MapPin } from "lucide-react";
import "./Sidebar.css";
// 💥 步骤 1: 引入你的 Logo 图片资源
// 请确保 image_2.png 文件在对应的路径下 (例如 src/assets/logo.png)

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
    { path: "/location", icon: <MapPin size={20} />, label: "Geo-Radar" },
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
          {/* 💥 步骤 2: 将图标和 H2 文字替换为图片 */}
          <Link to="/dashboard" className="logo-image-container">
            <img src="./public/Name.png" alt="GX-Sentinel Logo" className="sidebar-logo-img" />
          </Link>

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