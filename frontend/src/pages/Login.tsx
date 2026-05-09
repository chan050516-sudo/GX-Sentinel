import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isLogin) {
      if (!username || !password) {
        alert("Please enter your username and password.");
        return;
      }
      console.log("Login with:", username, password);
    } else {
      if (!username || !email || !password || !confirmPassword) {
        alert("Please fill in all fields.");
        return;
      }
      if (password !== confirmPassword) {
        alert("Passwords do not match.");
        return;
      }
      console.log("Sign up with:", username, email, password);
    }

    setLoading(true);
    // Simulate network delay for effect
    setTimeout(() => {
      setLoading(false);
      navigate("/dashboard");
    }, 1200);
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    // Reset fields when switching modes
    setUsername("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">

        {/* Brand Section (Left on Desktop, Top on Mobile) */}
        <div className="brand-section">
          <div className="brand-content">
            <img src="/LOGO.png" alt="GXBank Logo" className="hero-logo" />
            <h2 className="hero-title">Behavioral Defense System</h2>
            <p className="hero-subtitle">
              Protecting your financial future through intelligent friction and contextual awareness.
            </p>
          </div>
        </div>

        {/* Form Section (Right on Desktop, Bottom on Mobile) */}
        <div className="form-section">
          <div className="form-header">
            <h3>{isLogin ? "Welcome Back" : "Create Account"}</h3>
            <p>{isLogin ? "Sign in to access your GX-Sentinel dashboard" : "Join GX-Sentinel to secure your assets"}</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
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

            {!isLogin && (
              <div className="input-group">
                <input
                  type="email"
                  className="input-field"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <svg className={`input-icon ${email ? 'active' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
              </div>
            )}

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

            {!isLogin && (
              <div className="input-group">
                <input
                  type="password"
                  className="input-field"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <svg className={`input-icon ${confirmPassword ? 'active' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
              </div>
            )}

            <button type="submit" className="submit-button" disabled={loading}>
              {loading ? "Authenticating..." : (isLogin ? "Login" : "Sign Up")}
            </button>
          </form>

          <div className="footer-area">
            <p className="toggle-text">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <span onClick={toggleMode}>{isLogin ? "Sign up here" : "Log in instead"}</span>
            </p>
            {isLogin && <p className="forgot-password"><span>Forgot password?</span></p>}
            <div className="security-badge">Protected by GX-Sentinel</div>
          </div>
        </div>

      </div>
    </div>
  );
}