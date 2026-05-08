// ==========================================
// 1. 动态注入 CSS (Looi-Style + WhatsApp Chat Style)
// ==========================================
const style = document.createElement('style');
style.textContent = `
  #gx-ambient-wrapper {
    position: fixed;
    bottom: 40px;
    right: 40px;
    display: flex;
    align-items: flex-end;
    gap: 20px;
    z-index: 2147483647;
    font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  #gx-ambient-wrapper.visible {
    opacity: 1;
  }
  
  /* Looi 风格的基础外壳 */
  .gx-pet-container {
    position: relative;
    width: 70px;
    height: 70px;
    background: #080112; 
    border: 2px solid rgba(119, 31, 255, 0.4);
    border-radius: 20px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.8), inset 0 0 15px rgba(119, 31, 255, 0.2);
    pointer-events: all;
    cursor: pointer;
    overflow: hidden;
    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .gx-pet-container:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 35px rgba(119, 31, 255, 0.4), inset 0 0 20px rgba(119, 31, 255, 0.4);
  }

  /* 生物图层 */
  .gx-pet-breather {
    width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; gap: 8px;
    transform-origin: bottom center;
  }
  .gx-eye-wrap { display: flex; justify-content: center; align-items: center; transition: all 0.4s ease; }
  .gx-eye-inner {
    width: 14px; height: 32px; background: #e2e8f0; border-radius: 10px;
    box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
    transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  }

  /* 动画组 */
  @keyframes bioBreathe { 0%, 100% { transform: scale(1, 1) translateY(0); } 50% { transform: scale(1.04, 0.94) translateY(2px); } }
  @keyframes bioBreatheFast { 0%, 100% { transform: scale(1, 1) translateY(0); } 50% { transform: scale(1.06, 0.92) translateY(3px); } }
  @keyframes bioBlink { 0%, 88%, 100% { transform: scaleY(1); } 90% { transform: scaleY(0.1); } 92% { transform: scaleY(1); } 94% { transform: scaleY(0.1); } 96% { transform: scaleY(1); } }
  @keyframes bioLookAround { 0%, 100% { transform: translate(0, 0); } 15%, 25% { transform: translate(-6px, 2px); } 45%, 55% { transform: translate(6px, 0); } 75%, 85% { transform: translate(0, -4px); } }
  @keyframes bioShake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-3px); } 75% { transform: translateX(3px); } }
  @keyframes gxPopIn { 0% { opacity: 0; transform: scale(0.8); } 100% { opacity: 1; transform: scale(1); } }

  /* 状态机 */
  .gx-pet-container.idle .gx-pet-breather { animation: bioBreathe 4s infinite ease-in-out; }
  .gx-pet-container.idle .gx-eye-wrap { animation: bioLookAround 8s infinite; }
  .gx-pet-container.idle .gx-eye-inner { animation: bioBlink 6s infinite; }

  .gx-pet-container.analyzing { border-color: #771FFF; box-shadow: 0 0 30px rgba(119, 31, 255, 0.6), inset 0 0 20px rgba(119, 31, 255, 0.5); }
  .gx-pet-container.analyzing .gx-pet-breather { animation: bioBreatheFast 1s infinite ease-in-out; }
  .gx-pet-container.analyzing .gx-eye-wrap { transform: scale(1.15); }
  .gx-pet-container.analyzing .gx-eye-inner { width: 22px; height: 22px; border-radius: 50%; background: #a78bfa; box-shadow: 0 0 15px #771FFF; animation: bioBlink 4s infinite; }

  .gx-pet-container.warning { border-color: #f43f5e; box-shadow: 0 0 30px rgba(244, 63, 94, 0.4), inset 0 0 20px rgba(244, 63, 94, 0.3); }
  .gx-pet-container.warning .gx-pet-breather { animation: bioBreathe 3s infinite ease-in-out, bioShake 0.5s ease; }
  .gx-pet-container.warning .gx-eye-wrap:nth-child(1) { transform: rotate(15deg) translateY(4px); } 
  .gx-pet-container.warning .gx-eye-wrap:nth-child(2) { transform: rotate(-15deg) translateY(4px); }
  .gx-pet-container.warning .gx-eye-inner { height: 12px; background: #f43f5e; box-shadow: 0 0 15px #f43f5e; border-radius: 4px; animation: bioBlink 5s infinite; }

  .gx-pet-container.suggesting { border-color: #10b981; box-shadow: 0 0 30px rgba(16, 185, 129, 0.4), inset 0 0 20px rgba(16, 185, 129, 0.2); }
  .gx-pet-container.suggesting .gx-pet-breather { animation: bioBreathe 4s infinite ease-in-out; }
  .gx-pet-container.suggesting .gx-eye-inner { height: 16px; background: #10b981; box-shadow: 0 0 15px #10b981; border-radius: 20px 20px 4px 4px; transform: translateY(-4px); animation: bioBlink 7s infinite; }

  /* 气泡样式 */
  #gx-bubble {
    background: rgba(12, 1, 33, 0.95); backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.1); padding: 1.2rem;
    border-radius: 16px 16px 4px 16px; width: 340px; color: white;
    pointer-events: all; transform-origin: bottom right;
    animation: gxPopIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    box-shadow: 0 15px 35px rgba(0,0,0,0.5); display: none; 
  }
  #gx-bubble.show { display: block; }
  #gx-bubble.analyzing { border-left: 3px solid #771FFF; }
  #gx-bubble.warning { border-left: 3px solid #f59e0b; }
  #gx-bubble.suggesting { border-left: 3px solid #10b981; }
  
  .gx-msg-header { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; font-weight: bold; font-size: 14px;}
  .gx-msg-header.neutral { color: #a78bfa; }
  .gx-msg-header.warning { color: #f59e0b; }
  .gx-msg-header.success { color: #10b981; }
  
  #gx-bubble p { margin: 0 0 10px 0; font-size: 13px; color: #cbd5e1; line-height: 1.5; }
  .gx-v-index { background: rgba(255,255,255,0.05); padding: 8px; border-radius: 6px; font-family: monospace; font-size: 12px; margin-bottom:10px;}
  .gx-alt-box { display: flex; align-items: center; gap: 10px; background: rgba(16,185,129,0.1); border: 1px dashed rgba(16,185,129,0.3); padding: 10px; border-radius: 8px; margin-bottom: 10px; cursor: pointer; }
  
  /* WhatsApp Style Chat UI */
  .gx-chat-container { display: flex; flex-direction: column; gap: 10px; margin-bottom: 12px; }
  .gx-chat-msg { padding: 8px 12px; border-radius: 12px; font-size: 13px; line-height: 1.4; max-width: 85%; animation: gxPopIn 0.3s ease; }
  .gx-chat-ai { align-self: flex-start; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.05); color: #e2e8f0; border-bottom-left-radius: 2px; }
  .gx-chat-user { align-self: flex-end; background: #10b981; color: white; border-bottom-right-radius: 2px; }
  
  .gx-chat-input-row { display: flex; gap: 8px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 10px; }
  .gx-chat-input { flex: 1; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; padding: 8px 10px; color: white; font-size: 13px; outline: none; }
  .gx-chat-input:focus { border-color: #771FFF; }
  .gx-chat-send { background: #771FFF; color: white; border: none; border-radius: 8px; padding: 0 15px; cursor: pointer; font-weight: bold; transition: 0.2s; }
  .gx-chat-send:hover { background: #6014d4; }
`;
document.head.appendChild(style);

// ==========================================
// 2. 构建 DOM 结构
// ==========================================
const wrapper = document.createElement('div');
wrapper.id = 'gx-ambient-wrapper';

const bubble = document.createElement('div');
bubble.id = 'gx-bubble';

const petContainer = document.createElement('div');
petContainer.id = 'gx-pet';
petContainer.className = 'gx-pet-container idle';

petContainer.innerHTML = `
  <div class="gx-pet-breather">
    <div class="gx-eye-wrap"><div class="gx-eye-inner"></div></div>
    <div class="gx-eye-wrap"><div class="gx-eye-inner"></div></div>
  </div>
`;

wrapper.appendChild(bubble);
wrapper.appendChild(petContainer);
document.body.appendChild(wrapper);

// ==========================================
// 3. 场景字典与核心逻辑 (全英文)
// ==========================================
const scenarios = {
    tiktok: {
        state: "warning",
        html: `
            <div class="gx-msg-header warning">⚠️ Semantic Audit: High-Risk Trigger</div>
            <p>Video context matches 'Sponsored Content' with 85% probability. Real Google Rating for this item is <strong style="color:white">3.2/5</strong>.</p>
            <div class="gx-v-index">Value Index (V-Index): <strong style="color:#f43f5e">0.34</strong></div>
            <p style="color:#94a3b8; font-size:11px;">Recommendation: Enforce a 72-hour cooling period. Save this fund to secure your '4.0 GPA Rewards' goal.</p>
        `
    },
    agoda: {
        state: "suggesting",
        html: `
            <div class="gx-msg-header success">🎯 Dynamic Budget Alert</div>
            <p>Target hotel (RM 800/night) reduces your financial runway by <strong style="color:white">6.5 Days</strong>.</p>
            <div class="gx-alt-box">
                <div style="flex:1">
                    <span style="font-size:11px; color:#10b981">Optimal Alternative Found: 500m away</span><br/>
                    <strong style="color:white">RM 450/night (Rating 4.7)</strong>
                </div>
                <span style="color:#10b981">➔</span>
            </div>
            <p style="color:#94a3b8; font-size:11px;">Switching saves 3.5 days of runway. Resilience Score maintained.</p>
        `
    },
    coding: {
        state: "analyzing",
        html: `
            <div class="gx-msg-header neutral">✨ High Utility Detected</div>
            <p>Software Engineering resource detected. This high-leverage investment strictly aligns with your RM 6,000 starting salary goal.</p>
            <p style="color:#94a3b8; font-size:11px;">System Pre-authorized. Frictionless checkout available via 'Future Expenses' pocket.</p>
        `
    }
};

let analysisTimeout: number | undefined;

function triggerStandardScenario(scenarioKey: 'tiktok' | 'agoda' | 'coding') {
    clearTimeout(analysisTimeout);
    wrapper.classList.add('visible');
    
    petContainer.className = 'gx-pet-container analyzing';
    bubble.className = 'show analyzing';
    bubble.innerHTML = `<div class="gx-msg-header neutral">🔄 Parsing Context...</div>`;

    analysisTimeout = window.setTimeout(() => {
        const data = scenarios[scenarioKey];
        petContainer.className = `gx-pet-container ${data.state}`;
        bubble.className = `show ${data.state}`;
        bubble.innerHTML = data.html;
    }, 1200);
}

// ==========================================
// 4. WhatsApp-Style 互动对话演示 (Alt + 4)
// ==========================================
function triggerDialogueScenario() {
    clearTimeout(analysisTimeout);
    wrapper.classList.add('visible');
    
    // Step 1: Initial Warning & Input Request
    petContainer.className = 'gx-pet-container warning';
    bubble.className = 'show warning';
    bubble.innerHTML = `
        <div class="gx-msg-header warning">🛑 Critical Interception</div>
        <div class="gx-chat-container">
            <div class="gx-chat-msg gx-chat-ai">This RM 850 sneaker purchase severely damages your runway. Provide a rational justification to proceed.</div>
        </div>
        <div class="gx-chat-input-row">
            <input type="text" id="gx-demo-input" class="gx-chat-input" value="It's limited edition, I can resell it." />
            <button id="gx-demo-send" class="gx-chat-send">Reply</button>
        </div>
    `;

    // Bind Event
    document.getElementById('gx-demo-send')!.onclick = () => {
        const userText = (document.getElementById('gx-demo-input') as HTMLInputElement).value;
        
        // Step 2: Show User Message & AI Thinking
        petContainer.className = 'gx-pet-container analyzing';
        bubble.className = 'show analyzing';
        bubble.innerHTML = `
            <div class="gx-msg-header neutral">🔄 AI Auditing...</div>
            <div class="gx-chat-container">
                <div class="gx-chat-msg gx-chat-user">${userText}</div>
            </div>
        `;

        // Step 3: AI Verdict Reply
        setTimeout(() => {
            petContainer.className = 'gx-pet-container warning';
            bubble.className = 'show warning';
            bubble.innerHTML = `
                <div class="gx-msg-header warning">❌ Audit Failed</div>
                <div class="gx-chat-container">
                    <div class="gx-chat-msg gx-chat-user">${userText}</div>
                    <div class="gx-chat-msg gx-chat-ai">
                        <strong>AI Verdict: REJECTED</strong><br/>
                        Historical data shows 0% resell success rate. This is emotional spending. Transaction BLOCKED.
                    </div>
                </div>
            `;
        }, 1500);
    };
}

function hideSentinel() {
    clearTimeout(analysisTimeout);
    wrapper.classList.remove('visible');
    setTimeout(() => {
        bubble.classList.remove('show');
        petContainer.className = 'gx-pet-container idle';
    }, 300);
}

// ==========================================
// 5. 全局快捷键劫持控制器
// ==========================================
window.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.altKey && e.key === '0') hideSentinel();
    if (e.altKey && e.key === '1') triggerStandardScenario('tiktok'); // TikTok
    if (e.altKey && e.key === '2') triggerStandardScenario('agoda');  // Agoda
    if (e.altKey && e.key === '3') triggerStandardScenario('coding'); // Utility
    if (e.altKey && e.key === '4') triggerDialogueScenario();         // Interactive Chat
});

console.log("GX-Sentinel (Looi x Chat Edition) active. Keys: Alt+1 (TikTok), Alt+2 (Agoda), Alt+3 (Utility), Alt+4 (Chat Demo), Alt+0 (Hide).");