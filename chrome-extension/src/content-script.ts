// ==========================================
// 1. 动态注入 CSS (引入生物运动学图层)
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
  
  /* 基础外壳 */
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

  /* 图层 1: 躯干层 (负责全局呼吸与挤压拉伸) */
  .gx-pet-breather {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8px;
    transform-origin: bottom center; /* 呼吸的重心在底部 */
  }

  /* 图层 2: 眼眶层 (负责视线位移与情绪旋转) */
  .gx-eye-wrap {
    display: flex;
    justify-content: center;
    align-items: center;
    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  }

  /* 图层 3: 眼球层 (负责形态与眨眼) */
  .gx-eye-inner {
    width: 14px;
    height: 32px;
    background: #e2e8f0;
    border-radius: 10px;
    box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
    transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    transform-origin: center;
  }

  /* =========================================
     生物学核心动画定义
     ========================================= */
  
  /* 深呼吸 (Squash & Stretch) */
  @keyframes bioBreathe {
    0%, 100% { transform: scale(1, 1) translateY(0); }
    50% { transform: scale(1.04, 0.94) translateY(2px); }
  }
  
  /* 快速心跳/急促呼吸 */
  @keyframes bioBreatheFast {
    0%, 100% { transform: scale(1, 1) translateY(0); }
    50% { transform: scale(1.06, 0.92) translateY(3px); }
  }

  /* 生物级随机眨眼 (含连眨机制) */
  @keyframes bioBlink {
    0%, 88%, 100% { transform: scaleY(1); }
    90% { transform: scaleY(0.1); }
    92% { transform: scaleY(1); }
    94% { transform: scaleY(0.1); }
    96% { transform: scaleY(1); }
  }

  /* 环境巡视 (眼球转动) */
  @keyframes bioLookAround {
    0%, 100% { transform: translate(0, 0); }
    15%, 25% { transform: translate(-6px, 2px); }
    45%, 55% { transform: translate(6px, 0); }
    75%, 85% { transform: translate(0, -4px); } /* 抬头看 */
  }

  /* 震动 (警报状态) */
  @keyframes bioShake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-3px); }
    75% { transform: translateX(3px); }
  }


  /* =========================================
     情绪状态机调度
     ========================================= */

  /* --- 状态 0: Idle (闲置巡视) --- */
  .gx-pet-container.idle .gx-pet-breather { animation: bioBreathe 4s infinite ease-in-out; }
  .gx-pet-container.idle .gx-eye-wrap { animation: bioLookAround 8s infinite; }
  .gx-pet-container.idle .gx-eye-inner { animation: bioBlink 6s infinite; }

  /* --- 状态 1: Analyzing (锁定/思考) --- */
  .gx-pet-container.analyzing {
    border-color: #771FFF;
    box-shadow: 0 0 30px rgba(119, 31, 255, 0.6), inset 0 0 20px rgba(119, 31, 255, 0.5);
  }
  .gx-pet-container.analyzing .gx-pet-breather { animation: bioBreatheFast 1s infinite ease-in-out; }
  .gx-pet-container.analyzing .gx-eye-wrap { transform: scale(1.15); }
  .gx-pet-container.analyzing .gx-eye-inner {
    width: 22px; height: 22px; border-radius: 50%;
    background: #a78bfa; box-shadow: 0 0 15px #771FFF;
    animation: bioBlink 4s infinite; /* 思考时也会眨眼 */
  }

  /* --- 状态 2: Warning (毒舌/嫌弃) --- */
  .gx-pet-container.warning {
    border-color: #f43f5e;
    box-shadow: 0 0 30px rgba(244, 63, 94, 0.4), inset 0 0 20px rgba(244, 63, 94, 0.3);
  }
  .gx-pet-container.warning .gx-pet-breather { animation: bioBreathe 3s infinite ease-in-out, bioShake 0.5s ease; }
  .gx-pet-container.warning .gx-eye-wrap:nth-child(1) { transform: rotate(15deg) translateY(4px); } /* 倒八字 */
  .gx-pet-container.warning .gx-eye-wrap:nth-child(2) { transform: rotate(-15deg) translateY(4px); }
  .gx-pet-container.warning .gx-eye-inner {
    height: 12px;
    background: #f43f5e;
    box-shadow: 0 0 15px #f43f5e;
    border-radius: 4px;
    animation: bioBlink 5s infinite;
  }

  /* --- 状态 3: Suggesting (赞赏/月牙眼) --- */
  .gx-pet-container.suggesting {
    border-color: #10b981;
    box-shadow: 0 0 30px rgba(16, 185, 129, 0.4), inset 0 0 20px rgba(16, 185, 129, 0.2);
  }
  .gx-pet-container.suggesting .gx-pet-breather { animation: bioBreathe 4s infinite ease-in-out; }
  .gx-pet-container.suggesting .gx-eye-inner {
    height: 16px;
    background: #10b981;
    box-shadow: 0 0 15px #10b981;
    border-radius: 20px 20px 4px 4px; 
    transform: translateY(-4px);
    animation: bioBlink 7s infinite;
  }

  /* 信息气泡样式保持不变 */
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
  
  @keyframes gxPopIn { 0% { opacity: 0; transform: scale(0.8); } 100% { opacity: 1; transform: scale(1); } }
`;
document.head.appendChild(style);

// ==========================================
// 2. 构建 DOM 结构 (分离的物理图层)
// ==========================================
const wrapper = document.createElement('div');
wrapper.id = 'gx-ambient-wrapper';

const bubble = document.createElement('div');
bubble.id = 'gx-bubble';

const petContainer = document.createElement('div');
petContainer.id = 'gx-pet';
petContainer.className = 'gx-pet-container idle';

// 将控制位移的包裹层和控制形变的内层分离
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
    petContainer.className = 'gx-pet-container analyzing';
    bubble.className = 'show analyzing';
    bubble.innerHTML = `
        <div class="gx-msg-header neutral">🔄 正在解析当前语境...</div>
    `;

    analysisTimeout = window.setTimeout(() => {
        const data = scenarios[scenarioKey];
        petContainer.className = `gx-pet-container ${data.state}`;
        bubble.className = `show ${data.state}`;
        bubble.innerHTML = data.html;
    }, 1500);
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
// 4. 全局快捷键劫持 (现场演示控制器)
// ==========================================
window.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.altKey && e.key === '0') hideSentinel();
    if (e.altKey && e.key === '1') triggerScenario('xiaohongshu');
    if (e.altKey && e.key === '2') triggerScenario('agoda');
    if (e.altKey && e.key === '3') triggerScenario('coding');
});