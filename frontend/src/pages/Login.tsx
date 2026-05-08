import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      alert("Please enter your username and password.");
      return;
    }

    setLoading(true);
    // Simulate network delay for effect
    setTimeout(() => {
      setLoading(false);
      console.log("Login with:", username, password);
      navigate("/dashboard");
    }, 1200);
  };

  return (
    <div className="login-wrapper">
      <div className="login-split-container">

        {/* Left Panel: Brand Showcase */}
        <div className="login-left-panel">
          <div className="left-panel-content">
            <div className="brand-hero">
              <img src="/LOGO.png" alt="GXBank Logo" className="hero-logo" />
              <h2 className="hero-title">Behavioral Defense System</h2>
              <p className="hero-subtitle">
                Protecting your financial future through intelligent friction and contextual awareness.
              </p>
            </div>
          </div>
        </div>

        {/* Right Panel: Interactive Login Area */}
        <div className="login-right-panel">
          <div className="login-form-container">
            <div className="form-header">
              <h3>Welcome Back</h3>
              <p>Sign in to access your GX-Sentinel dashboard</p>
            </div>

            <form className="login-form" onSubmit={handleLogin}>
              <div className="input-group">
                <input
                  type="text"
                  className="input-field"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
                <svg className={`input-icon ${username ? 'active' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>

              <div className="input-group">
                <input
                  type="password"
                  className="input-field"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <svg className={`input-icon ${password ? 'active' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>

              <button type="submit" className="login-button" disabled={loading}>
                {loading ? "Authenticating..." : "Login"}
              </button>
            </form>

            <div className="footer-text">
              Protected by GX-Sentinel <br />
              <span>Forgot password?</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
