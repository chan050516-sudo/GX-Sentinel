// src/components/BusinessModel.tsx
import React, { useState, useEffect } from 'react';
import './BusinessModel.css';

const BusinessModel: React.FC = () => {
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % 2);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="gx-deck-container">
      {/* 固定标题 */}
      <h2 className="deck-title">Business Model</h2>
      
      {/* 指示点 */}
      <div className="deck-indicators">
        <button
          className={`indicator ${activeSlide === 0 ? 'active' : ''}`}
          onClick={() => setActiveSlide(0)}
        />
        <button
          className={`indicator ${activeSlide === 1 ? 'active' : ''}`}
          onClick={() => setActiveSlide(1)}
        />
      </div>

      {/* Slide 1: Core Positioning + Capabilities */}
      <div className={`deck-slide ${activeSlide === 0 ? 'slide-active' : 'slide-hidden'}`}>
        {/* Core positioning */}
        <div className="slide-section quote-section">
          <div className="quote-icon">🏦</div>
          <div className="quote-text">
            "A behavioral banking layer — not a budgeting app."
          </div>
        </div>

        {/* Why GXBank? */}
        <div className="slide-section strategic-fit">
          <div className="fit-text">
            🎯 <strong>Strategic fit with GXBank</strong> — Digital‑native, young user base, high app engagement, 
            and an embedded ecosystem built for behavioral intervention.
          </div>
        </div>

        {/* Three core capabilities */}
        <h3 className="section-subtitle">What We've Built</h3>
        <div className="capabilities-grid">
          <div className="capability-card">
            <div className="cap-icon">⚡</div>
            <h4>Real‑time Intervention</h4>
            <p>Intercepts impulsive purchases before they happen. AI audits user justification.</p>
            <div className="cap-badge">Implemented</div>
          </div>
          <div className="capability-card">
            <div className="cap-icon">🤖</div>
            <h4>Smart Income Allocation</h4>
            <p>Automatically splits incoming funds into survival, goals, and spending.</p>
            <div className="cap-badge">Implemented</div>
          </div>
          <div className="capability-card">
            <div className="cap-icon">👥</div>
            <h4>Social Accountability</h4>
            <p>Streak‑based rewards, squad bonuses, and peer support.</p>
            <div className="cap-badge">Implemented</div>
          </div>
        </div>
      </div>

      {/* Slide 2: Revenue Model */}
      <div className={`deck-slide ${activeSlide === 1 ? 'slide-active' : 'slide-hidden'}`}>
        
        {/* For GXBank */}
        <h3 className="section-subtitle">🏦 For GXBank</h3>
        <div className="revenue-grid">
          <div className="revenue-card">
            <div className="revenue-icon">📈</div>
            <h4>CASA Growth</h4>
            <p>Redirects impulse spending into savings — increasing deposit retention.</p>
            <div className="revenue-tag">Performance-based fee</div>
          </div>
          <div className="revenue-card">
            <div className="revenue-icon">📱</div>
            <h4>Daily Engagement</h4>
            <p>Turns banking from monthly to daily — higher LTV, lower churn.</p>
            <div className="revenue-tag">Built into retention</div>
          </div>
          <div className="revenue-card">
            <div className="revenue-icon">🎯</div>
            <h4>Smarter Targeting</h4>
            <p>Resilience Score enables behavioural segmentation.</p>
            <div className="revenue-tag">Data insight value</div>
          </div>
        </div>

        {/* For GX-Sentinel */}
        <h3 className="section-subtitle">🚀 For GX‑Sentinel</h3>
        <div className="revenue-grid">
          <div className="revenue-card">
            <div className="revenue-icon">💸</div>
            <h4>Performance Fee</h4>
            <p>Share of incremental deposit retention — outcome‑based.</p>
            <div className="revenue-tag">Aligned incentives</div>
          </div>
          <div className="revenue-card">
            <div className="revenue-icon">📊</div>
            <h4>Premium Analytics</h4>
            <p>Behavioural reports for institutions (campus benchmarks).</p>
            <div className="revenue-tag">B2B SaaS</div>
          </div>
          <div className="revenue-card">
            <div className="revenue-icon">🔌</div>
            <h4>API Licensing</h4>
            <p>White‑label intervention engine for other digital banks.</p>
            <div className="revenue-tag">Southeast Asia ready</div>
          </div>
        </div>

        {/* Footer alignment statement */}
        <div className="alignment-footer">
          <span>We make money when GXBank keeps more deposits and users stay engaged.</span>
        </div>
      </div>
    </div>
  );
};

export default BusinessModel;