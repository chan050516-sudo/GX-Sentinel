// ==========================================
// 1. 动态注入 CSS (规避额外打包配置)
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
  
  /* 赛博核心 (The Sentinel Core) */
  .gx-core {
    position: relative;
    width: 60px;
    height: 60px;
    display: flex;
    justify-content: center;
    align-items: center;
    pointer-events: all;
    cursor: pointer;
    transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .gx-core:hover { transform: scale(1.1); }
  
  .gx-core-inner {
    position: absolute;
    width: 24px;
    height: 24px;
    background: #fff;
    border-radius: 50%;
    box-shadow: 0 0 15px #fff;
    z-index: 10;
    transition: all 0.5s ease;
  }
  
  .gx-core-glow {
    position: absolute;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: radial-gradient(circle, #771FFF 0%, transparent 70%);
    opacity: 0.8;
    filter: blur(8px);
    animation: gxPulseGlow 3s infinite alternate;
    transition: background 0.5s ease;
  }
  
  .gx-core-ring {
    position: absolute;
    border-radius: 50%;
    border: 1px solid rgba(255, 255, 255, 0.2);
    top: 50%; left: 50%; transform: translate(-50%, -50%);
  }
  .gx-ring-1 { width: 100%; height: 100%; animation: gxSpinRight 8s linear infinite; }
  .gx-ring-2 { width: 140%; height: 140%; border-style: dashed; animation: gxSpinLeft 12s linear infinite; opacity: 0.5; }
  
  /* 核心状态机映射 */
  .gx-core.analyzing .gx-core-inner { animation: gxHeartbeat 0.8s infinite; background: #771FFF; box-shadow: 0 0 20px #771FFF;}
  .gx-core.warning .gx-core-inner { background: #f59e0b; box-shadow: 0 0 20px #f59e0b; }
  .gx-core.warning .gx-core-glow { background: radial-gradient(circle, rgba(245, 158, 11, 0.8) 0%, transparent 70%); animation: gxPulseRapid 1s infinite; }
  .gx-core.suggesting .gx-core-inner { background: #10b981; box-shadow: 0 0 20px #10b981; }
  .gx-core.suggesting .gx-core-glow { background: radial-gradient(circle, rgba(16, 185, 129, 0.8) 0%, transparent 70%); }
  
  /* 信息面板 (The Mentor Bubble) */
  #gx-bubble {
    background: rgba(12, 1, 33, 0.95);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    padding: 1.2rem;
    border-radius: 16px 16px 4px 16px;
    width: 320px;
    color: white;
    pointer-events: all;
    transform-origin: bottom right;
    animation: gxPopIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    box-shadow: 0 15px 35px rgba(0,0,0,0.5);
    display: none; 
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
  .gx-alt-box:hover { background: rgba(16,185,129,0.2); }
  
  /* 动画组 */
  @keyframes gxPopIn { 0% { opacity: 0; transform: scale(0.8); } 100% { opacity: 1; transform: scale(1); } }
  @keyframes gxPulseGlow { 0% { transform: scale(0.9); } 100% { transform: scale(1.2); } }
  @keyframes gxPulseRapid { 0% { transform: scale(0.8); opacity: 0.5; } 100% { transform: scale(1.3); opacity: 1; } }
  @keyframes gxHeartbeat { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.5); } }
  @keyframes gxSpinRight { 100% { transform: translate(-50%, -50%) rotate(360deg); } }
  @keyframes gxSpinLeft { 100% { transform: translate(-50%, -50%) rotate(-360deg); } }
`;
document.head.appendChild(style);

// ==========================================
// 2. 构建 DOM 结构
// ==========================================
const wrapper = document.createElement('div');
wrapper.id = 'gx-ambient-wrapper';

const bubble = document.createElement('div');
bubble.id = 'gx-bubble';

const core = document.createElement('div');
core.id = 'gx-core';
core.className = 'gx-core idle';
core.innerHTML = `
  <div class="gx-core-glow"></div>
  <div class="gx-core-inner"></div>
  <div class="gx-core-ring gx-ring-1"></div>
  <div class="gx-core-ring gx-ring-2"></div>
`;

wrapper.appendChild(bubble);
wrapper.appendChild(core);
document.body.appendChild(wrapper);

// ==========================================
// 3. Mock 场景字典与核心逻辑
// ==========================================
const scenarios = {
    xiaohongshu: {
        state: "warning",
        html: `
            <div class="gx-msg-header warning">⚠️ 语义审计: 营销高危词</div>
            <p>当前上下文匹配『商业合作』概率 85%。提取 Google 真实评分为 <strong style="color:white">3.2/5</strong>。</p>
            <div class="gx-v-index">理性价值指数 (V-Index): <strong style="color:#f43f5e">0.34</strong></div>
            <p style="color:#94a3b8; font-size:11px;">建议动作: 放入 72 小时冷静期。节省的资金可直接填补你的 4.0 GPA 奖励基金缺口。</p>
        `
    },
    agoda: {
        state: "suggesting",
        html: `
            <div class="gx-msg-header success">🎯 动态预算拦截</div>
            <p>当前目标酒店将导致生存跑道缩短 <strong style="color:white">6.5 天</strong>。</p>
            <div class="gx-alt-box">
                <div style="flex:1">
                    <span style="font-size:11px; color:#10b981">寻找到最优解: 距离 500m</span><br/>
                    <strong style="color:white">RM 450/晚 (评分 4.7)</strong>
                </div>
                <span style="color:#10b981">➔</span>
            </div>
            <p style="color:#94a3b8; font-size:11px;">替换此项可挽回 3.5 天跑道，维持现有 Resilience Score。</p>
        `
    },
    coding: {
        state: "analyzing",
        html: `
            <div class="gx-msg-header neutral">✨ 效用判定: 极高</div>
            <p>检测到核心技能进阶（Software Engineering）投资意图。此支出属于高杠杆行为，完全符合你冲击 RM 6,000 起薪的底层逻辑。</p>
            <p style="color:#94a3b8; font-size:11px;">系统已预授权。可从『Future Expenses』中免摩擦划扣。</p>
        `
    }
};

let analysisTimeout: number | undefined;

function triggerScenario(scenarioKey: 'xiaohongshu' | 'agoda' | 'coding') {
    clearTimeout(analysisTimeout);
    
    wrapper.classList.add('visible');
    core.className = 'gx-core analyzing';
    bubble.className = 'show analyzing';
    bubble.innerHTML = `
        <div class="gx-msg-header neutral">🔄 正在解析当前语境...</div>
    `;

    analysisTimeout = window.setTimeout(() => {
        const data = scenarios[scenarioKey];
        core.className = `gx-core ${data.state}`;
        bubble.className = `show ${data.state}`;
        bubble.innerHTML = data.html;
    }, 1500);
}

function hideSentinel() {
    clearTimeout(analysisTimeout);
    wrapper.classList.remove('visible');
    setTimeout(() => {
        bubble.classList.remove('show');
        core.className = 'gx-core idle';
    }, 300);
}

// ==========================================
// 4. 全局快捷键劫持 (现场演示控制器)
// ==========================================
window.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.altKey && e.key === '0') {
        hideSentinel();
    }
    if (e.altKey && e.key === '1') {
        triggerScenario('xiaohongshu');
    }
    if (e.altKey && e.key === '2') {
        triggerScenario('agoda');
    }
    if (e.altKey && e.key === '3') {
        triggerScenario('coding');
    }
});

console.log("GX-Sentinel Ambient Mentor 已装载。使用 Alt+1, Alt+2, Alt+3 触发演示场景，Alt+0 隐藏。");