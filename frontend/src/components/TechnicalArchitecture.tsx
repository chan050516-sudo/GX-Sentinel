// src/components/TechnicalArchitecture.tsx
import React, { useState, useEffect } from 'react';
import './TechnicalArchitecture.css';

const TechnicalArchitecture: React.FC = () => {
  const [activeLayer, setActiveLayer] = useState(0);
  
  const layers = [
    {
      id: 'client',
      title: '🌐 Client',
      cards: [
        {
          title: 'Web Dashboard',
          desc: 'React + TypeScript + Vite',
          badge: { text: 'Implemented', type: 'done' },
          items: ['Dashboard / Allocator / Tracking', 'SocialCircle / LocationRadar', 'FloatingMentor, GeoNotification']
        },
        {
          title: 'Chrome Extension',
          desc: 'Content Script + Overlay UI',
          badge: { text: 'Half-Implemented Backend', type: 'mock' },
          futureHint: '🔜 Backend plan: Real interception API integration – extract product info, call /interceptor/analyze, manage audit logs, and return real-time friction layers.'
        },
        {
          title: 'GeoRadar (Location Radar)',
          desc: 'Google Maps API + Mock zone data',
          badge: { text: 'Frontend Mock', type: 'mock' },
          futureHint: '🔜 Backend plan: Fetch real POI, average spend, runway impact, and alternative recommendations based on user location.'
        }
      ]
    },
    {
      id: 'backend',
      title: '⚙️ Backend Services',
      cards: [
        {
          title: 'API Routers (FastAPI)',
          items: ['/interceptor/* – core interception', '/allocator/* – AI allocation', '/chat/*, /social/*, /transaction/*'],
          badge: { text: 'Implemented', type: 'done' }
        },
        {
          title: 'Rules Engine & Services',
          items: [
            '5‑factor impulse scoring (necessity, night, amount, liquidity, frequency) ✅',
            'DeBERTa zero‑shot classification (essential/luxury) ✅',
            'Runway calculation / goal conflict detection ✅',
            'Social simulation / transaction simulation ⚠️ Mock'
          ]
        },
        {
          title: 'LangGraph Agents',
          items: [
            'Allocator Agent – Gemini allocation suggestion ✅',
            'Guardian Agent – Gemini justification audit ✅',
            'Mentor Agent – simple keyword matching (Mock) ⚠️'
          ]
        }
      ]
    },
    {
      id: 'data',
      title: '🗄️ Data & AI',
      cards: [
        {
          title: 'Firestore (Planned)',
          desc: 'User, transaction, audit, social collections',
          badge: { text: 'Mock / Under construction', type: 'plan' },
          futureHint: '🔜 Full CRUD, composite indexes, real‑time listeners'
        },
        {
          title: 'External AI Models',
          items: ['Google Gemini 2.0 Flash – real calls ✅', 'Hugging Face DeBERTa – local inference ✅']
        }
      ]
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveLayer((prev) => (prev + 1) % layers.length);
    }, 10000);
    return () => clearInterval(interval);
  }, [layers.length]);

  const currentLayer = layers[activeLayer];

  return (
    <div className="gx-arch-container">
      <h2 className="arch-title">GX‑Sentinel Technical Architecture</h2>
      
      <div className="arch-carousel">
        {/* 层级标题 */}
        <div className="layer-title-wrapper">
          <div className="layer-title-icon">{currentLayer.title}</div>
          <div className="layer-indicators">
            {layers.map((_, idx) => (
              <button
                key={idx}
                className={`indicator-dot ${idx === activeLayer ? 'active' : ''}`}
                onClick={() => setActiveLayer(idx)}
              />
            ))}
          </div>
        </div>

        {/* 卡片容器 - 带滑动动画 */}
        <div className="layer-cards-container">
          <div 
            className="layer-cards" 
            key={activeLayer}
            style={{ animation: 'slideUpFade 0.5s ease-out' }}
          >
            {currentLayer.cards.map((card, idx) => (
              <div key={idx} className="card">
                <div className="card-title">{card.title}</div>
                {card.desc && <div className="card-desc">{card.desc}</div>}
                {card.badge && (
                  <div className={`badge ${card.badge.type === 'done' ? 'badge-done' : card.badge.type === 'mock' ? 'badge-mock' : 'badge-plan'}`}>
                    {card.badge.text}
                  </div>
                )}
                {card.items && (
                  <ul>
                    {card.items.map((item, i) => (
                      <li key={i} dangerouslySetInnerHTML={{ __html: item }} />
                    ))}
                  </ul>
                )}
                {card.futureHint && (
                  <div className="future-hint">{card.futureHint}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 固定数据流 (不轮播) */}
      <div className="arch-flow">
        <div className="flow-title">📌 Key Data Flows</div>
        <ul>
          <li>Income → <code>/allocator/analyze</code> → Gemini → frontend allocation → localStorage (mock persistence)</li>
          <li>Expense → <code>/interceptor/analyze</code> → rules engine + DeBERTa → returns tier 0‑3</li>
          <li>Tier 2‑3 → user justification → <code>/justify</code> → Guardian Agent → verdict</li>
          <li>Resilience / runway → backend calculates, currently only mock storage (Firestore planned)</li>
          <li>Social / weekly report → mock data responses</li>
        </ul>
      </div>
    </div>
  );
};

export default TechnicalArchitecture;