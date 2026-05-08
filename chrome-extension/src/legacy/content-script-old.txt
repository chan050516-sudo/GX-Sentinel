// --- 1. 终极融合版 UI 逻辑 (合并了 overlay-ui 的功能) ---
function showGXAlert(message: string, triggerLevel: string, delay: number, auditId: string) {
    if (document.getElementById('gx-sentinel-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'gx-sentinel-overlay';
    
    // Critical 模式用全屏，Soft 用右侧浮窗
    const isHard = triggerLevel === 'critical' || triggerLevel === 'friction';
    
    overlay.style.cssText = isHard 
        ? `position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 9999999; color: #fff; font-family: sans-serif;`
        : `position: fixed; top: 20px; right: 20px; width: 320px; background: #1a1a1a; color: #fff; border: 2px solid #ff4d4f; padding: 20px; border-radius: 12px; z-index: 9999999; box-shadow: 0 4px 20px rgba(0,0,0,0.5); font-family: sans-serif;`;

    let actionContent = ``;
    if (triggerLevel === 'critical') {
        // Tier 3: 强制输入理由
        actionContent = `
            <textarea id="gx-justify" placeholder="Why is this purchase necessary?" style="width: 80%; max-width: 400px; height: 80px; margin-top: 15px; padding: 10px; border-radius: 8px; color: #000;"></textarea>
            <button id="gx-submit-btn" disabled style="width: 200px; background: #555; color: white; border: none; padding: 12px; border-radius: 6px; cursor: not-allowed; margin-top: 15px; font-weight: bold;">Wait for timer...</button>
        `;
    } else {
        // Tier 1 & 2: 仅需倒计时确认
        actionContent = `
            <button id="gx-close-btn" ${delay > 0 ? 'disabled' : ''} style="width: 100%; background: ${delay > 0 ? '#444' : '#ff4d4f'}; color: white; border: none; padding: 12px; border-radius: 6px; cursor: ${delay > 0 ? 'not-allowed' : 'pointer'}; margin-top: 15px; font-weight: bold;">
                ${delay > 0 ? `Wait...` : 'I understand'}
            </button>
        `;
    }

    overlay.innerHTML = `
        <div style="text-align: center; padding: 20px;">
            <h2 style="color: #ff4d4f; margin: 0; font-size: 24px;">⚠️ GX-Sentinel</h2>
            <p style="font-size: 16px; margin: 20px 0; line-height: 1.6; white-space: pre-wrap;">${message}</p>
            ${delay > 0 ? `<div id="gx-timer-text" style="color: #faad14; margin-bottom: 10px; font-weight: bold;">Deep reflection required: ${delay}s</div>` : ''}
            ${actionContent}
        </div>
    `;

    document.body.appendChild(overlay);

    // 倒计时解锁逻辑
    if (delay > 0) {
        let timeLeft = delay;
        const timer = setInterval(() => {
            timeLeft--;
            const timerDoc = document.getElementById('gx-timer-text');
            const closeBtn = document.getElementById('gx-close-btn') as HTMLButtonElement;
            const submitBtn = document.getElementById('gx-submit-btn') as HTMLButtonElement;

            if (timerDoc) timerDoc.innerText = `Deep reflection required: ${timeLeft}s`;
            
            if (timeLeft <= 0) {
                clearInterval(timer);
                if (timerDoc) timerDoc.innerText = "You may now proceed.";
                if (closeBtn) {
                    closeBtn.disabled = false;
                    closeBtn.style.background = '#ff4d4f';
                    closeBtn.style.cursor = 'pointer';
                    closeBtn.innerText = "I have reflected";
                }
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.style.background = '#1890ff';
                    submitBtn.style.cursor = 'pointer';
                    submitBtn.innerText = "Submit Justification";
                }
            }
        }, 1000);
    }

    // 事件绑定: 关闭
    document.getElementById('gx-close-btn')?.addEventListener('click', () => {
        overlay.remove();
        hasAnalyzed = false; // 允许下次继续监听
    });

    // 事件绑定: 提交 AI 审计
    document.getElementById('gx-submit-btn')?.addEventListener('click', async () => {
        const justification = (document.getElementById('gx-justify') as HTMLTextAreaElement).value;
        if (!justification) return alert("Please enter a reason.");
        
        const submitBtn = document.getElementById('gx-submit-btn') as HTMLButtonElement;
        submitBtn.innerText = "Auditing...";
        submitBtn.disabled = true;

        try {
            const res = await fetch('http://localhost:8000/interceptor/justify', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-user-id': 'demo_user_01' // [修复点] 补全 Header
                },
                body: JSON.stringify({ auditId, justification })
            });
            const result = await res.json();
            
            // 展示 AI 毒舌结果
            alert(`🛡️ Guardian Verdict: ${result.verdict.toUpperCase()}\n\n📝 Reasoning: ${result.reasoning}\n\n💡 Advice: ${result.cognitiveMessage}`);
            overlay.remove();
            hasAnalyzed = false; 
        } catch (error) {
            alert("Error communicating with AI Guardian.");
            submitBtn.innerText = "Submit Justification";
            submitBtn.disabled = false;
        }
    });
}

// --- 2. 抓取逻辑 ---
function getProductInfo() {
    // 🚀 尝试多个可能的 Shopee 价格选择器 (Shopee 经常更新这些类名)
    const priceSelectors = [
        '.Y_uSTn',          // 你原本的版本
        '.pq7uM9',          // 备选 1
        'div[data-testid="price"]', // 备选 2 (如果他们用了 data-test)
        '.G2777V'           // 备选 3
    ];
    
    let priceElement = null;
    for (const selector of priceSelectors) {
        priceElement = document.querySelector(selector);
        if (priceElement) break;
    }

    const nameElement = document.querySelector('.V_P69E') || document.querySelector('.flex-column > span');  
    
    const priceText = priceElement?.textContent || "0";
    // 增强正则：保留数字和小数点
    const numericPrice = parseFloat(priceText.replace(/[^\d.]/g, '')) || 0;
    
    console.log(`GX-Sentinel Debug: 抓取到价格文本: "${priceText}", 解析为: ${numericPrice}`);
    
    return { 
        name: nameElement?.textContent?.trim() || "Unknown Item", 
        price: numericPrice 
    };
}

function isCheckoutPage(): boolean {
    const textToSearch = ['check out', 'place order', 'buy now', '结账', '下单'];
    const buttons = Array.from(document.querySelectorAll('button'));
    return buttons.some(btn => {
        const content = btn.textContent?.toLowerCase() || "";
        return textToSearch.some(t => content.includes(t));
    });
}

// --- 3. 发送逻辑 ---
async function sendToAnalyze() {
    console.log("GX-Sentinel: 检测到下单，正在分析...");
    const product = getProductInfo();
    // if (product.price <= 0) {
    //     console.log("GX-Sentinel: 非商品页面或未检测到价格，跳过分析。");
    //     return; 
    // }
    console.log("GX-Sentinel: 检测到有效商品，正在分析...");
    const payload = {
        platform: "shopee", 
        products: [{ name: product.name, price: product.price }],
        totalAmount: product.price,
        isCheckoutPage: isCheckoutPage()
        // 故意不传 paymentSource，让后端默认为 variableBudget
    };

    try {
        const response = await fetch('http://localhost:8000/interceptor/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-user-id': 'demo_user_01' },
            body: JSON.stringify(payload)
        });
        const result = await response.json();
        
        // 即使是 Soft 级别，只要不是纯粹的 "放行"，就展示 UI
        if (result.triggerLevel !== 'soft' || result.softMessage.includes('⚠️')) {
            showGXAlert(result.softMessage, result.triggerLevel, result.delaySeconds || 0, result.auditId || "");
        }
    } catch (e) {
        console.error("Backend offline.");
    }
}

// --- 4. 10秒监控逻辑 ---
let hasAnalyzed = false;
const startTime = Date.now();

setInterval(() => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const checkout = isCheckoutPage();

    if (!hasAnalyzed && (checkout || elapsed >= 10)) {
        hasAnalyzed = true;
        sendToAnalyze();
    }
}, 2000);