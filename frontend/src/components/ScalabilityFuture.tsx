// ScalabilityFuture.tsx
import React from 'react';
import './ScalabilityFuture.css';

const ScalabilityFuture: React.FC = () => {
  return (
    <div className="gx-scalability-container">
      <h2 className="scalability-title">Scalability & Integration Roadmap</h2>
      
      {/* Core narrative */}
      <div className="scalability-quote">
        <div className="quote-icon">⚡</div>
        <div className="quote-text">
          "GX‑Sentinel transforms banking data into real‑time behavioural intervention."
        </div>
      </div>

      {/* Bank‑grade context advantage (这个是最关键的护城河说明) */}
      <div className="bank-advantage">
        <div className="advantage-text">
          🏦 <strong>Bank‑grade context awareness</strong> — Real balance, salary cycle, recurring payments, 
          debt exposure, savings goals. Data that no standalone browser extension can access.
        </div>
      </div>

      {/* Three pillars */}
      <div className="scalability-grid">
        
        <div className="scalability-card">
          <div className="card-icon">🏦</div>
          <h3>GX Bank API Ready</h3>
          <div className="badge-api">Integration Ready</div>
          <ul>
            <li>Real‑time transaction ingestion</li>
            <li>OAuth 2.0 authorization flow</li>
            <li>DuitNow QR friction layer</li>
          </ul>
        </div>

        <div className="scalability-card">
          <div className="card-icon">🌐</div>
          <h3>Cross‑Platform Interception</h3>
          <div className="badge-api">DOM‑based</div>
          <ul>
            <li>Shopee, Lazada, TikTok Shop ready</li>
            <li>Rapid adaptation to any e‑commerce site</li>
            <li>Mobile companion (2026 Q4)</li>
          </ul>
          <div className="future-tag">Write once, intercept anywhere</div>
        </div>

        <div className="scalability-card">
          <div className="card-icon">🤖</div>
          <h3>AI Agent Modularity</h3>
          <div className="badge-api">LangGraph Native</div>
          <ul>
            <li>Flexible AI orchestration (Gemini, GPT‑4o, Claude)</li>
            <li>Plug‑in new agents without core changes</li>
            <li>Rule‑based + LLM hybrid decision layer</li>
          </ul>
        </div>
      </div>

      {/* Roadmap */}
      <div className="roadmap-section">
        <h3>🗓️ Realistic Roadmap</h3>
        <div className="timeline">
          <div className="timeline-item">
            <div className="timeline-dot"></div>
            <div className="timeline-content">
              <span className="timeline-date">Q3 2026</span>
              <strong>GXBank transaction sync</strong>
              <p>Real payment interception, DuitNow QR friction, account sync</p>
            </div>
          </div>
          <div className="timeline-item">
            <div className="timeline-dot"></div>
            <div className="timeline-content">
              <span className="timeline-date">Q4 2026</span>
              <strong>Campus resilience challenges</strong>
              <p>Squad accountability, streak‑based rewards, group goals</p>
            </div>
          </div>
          <div className="timeline-item">
            <div className="timeline-dot"></div>
            <div className="timeline-content">
              <span className="timeline-date">2027</span>
              <strong>Anonymous campus‑level analytics</strong>
              <p>Benchmark behavioural patterns across university cohorts</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScalabilityFuture;