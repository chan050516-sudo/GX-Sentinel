import { useState } from "react";
import "./Login.css";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) {
            alert("Please enter your credentials.");
            return;
        }

        setLoading(true);
        // Simulate network delay for effect
        setTimeout(() => {
            setLoading(false);
            console.log("Login with:", email, password);
            // TODO: navigate("/dashboard")
            alert("Protocol Initialized. Welcome to GX-Sentinel.");
        }, 1200);
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="brand-section">
                    <div className="logo-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        </svg>
                    </div>
                    <h1 className="brand-title">GX-Sentinel</h1>
                    <p className="brand-subtitle">Behavioral Defense System</p>
                </div>

                <form className="login-form" onSubmit={handleLogin}>
                    <div className="input-group">
                        <input
                            type="email"
                            className="input-field"
                            placeholder="System ID (Email)"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <svg className={`input-icon ${email ? 'active' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect width="20" height="16" x="2" y="4" rx="2" />
                            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                        </svg>
                    </div>

                    <div className="input-group">
                        <input
                            type="password"
                            className="input-field"
                            placeholder="Passcode"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <svg className={`input-icon ${password ? 'active' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                    </div>

                    <button type="submit" className="login-button" disabled={loading}>
                        {loading ? "Authenticating..." : "Initialize Protocol"}
                    </button>
                </form>

                <div className="footer-text">
                    Unauthorized access is strictly prohibited. <br />
                    Need an access code? <span>Contact Admin</span>
                </div>
            </div>
        </div>
    );
}
