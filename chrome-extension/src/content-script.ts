// --- 1. UI 逻辑 (原本在 overlay-ui 里) ---
function showGXAlert(message: string, triggerLevel: string, delay: number, auditId: string) {
    if (document.getElementById('gx-sentinel-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'gx-sentinel-overlay';
    const isHard = triggerLevel === 'critical' || triggerLevel === 'friction';
    
    overlay.style.cssText = isHard 
        ? `position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 9999999; color: #fff; font-family: sans-serif;`
        : `position: fixed; top: 20px; right: 20px; width: 320px; background: #1a1a1a; color: #fff; border: 2px solid #ff4d4f; padding: 20px; border-radius: 12px; z-index: 9999999; box-shadow: 0 4px 20px rgba(0,0,0,0.5); font-family: sans-serif;`;

    overlay.innerHTML = `
        <div style="text-align: center; padding: 20px;">
            <h2 style="color: #ff4d4f; margin: 0; font-size: 24px;">⚠️ GX-Sentinel</h2>
            <p style="font-size: 16px; margin: 20px 0; line-height: 1.6;">${message}</p>
            <div id="gx-timer-text" style="color: #faad14; margin-bottom: 10px;">${delay > 0 ? `Deep reflection required: ${delay}s` : ''}</div>
            <button id="gx-close-btn" ${delay > 0 ? 'disabled' : ''} style="width: 100%; background: ${delay > 0 ? '#444' : '#ff4d4f'}; color: white; border: none; padding: 12px; border-radius: 6px; cursor: ${delay > 0 ? 'not-allowed' : 'pointer'}; margin-top: 15px; font-weight: bold;">
                ${delay > 0 ? 'Wait...' : 'I understand'}
            </button>
        </div>
    `;

    document.body.appendChild(overlay);

    if (delay > 0) {
        let timeLeft = delay;
        const timer = setInterval(() => {
            timeLeft--;
            const timerDoc = document.getElementById('gx-timer-text');
            const btn = document.getElementById('gx-close-btn') as HTMLButtonElement;
            if (timerDoc) timerDoc.innerText = `Deep reflection required: ${timeLeft}s`;
            if (timeLeft <= 0) {
                clearInterval(timer);
                if (btn) {
                    btn.disabled = false;
                    btn.style.background = '#ff4d4f';
                    btn.style.cursor = 'pointer';
                    btn.innerText = "I have reflected";
                }
            }
        }, 1000);
    }

    document.getElementById('gx-close-btn')?.addEventListener('click', () => overlay.remove());
}

// --- 2. 抓取逻辑 ---
function getProductInfo() {
    const priceElement = document.querySelector('.Y_uSTn'); 
    const nameElement = document.querySelector('.V_P69E');  
    const priceText = priceElement?.textContent || "0";
    const numericPrice = parseFloat(priceText.replace(/[^\d.]/g, '')) || 0;
    return { name: nameElement?.textContent?.trim() || "Unknown", price: numericPrice };
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
    console.log("GX-Sentinel: 检测到下单或超时，正在分析...");
    const product = getProductInfo();
    const payload = {
        platform: "shopee", 
        products: [{ name: product.name, price: product.price }],
        totalAmount: product.price,
        isCheckoutPage: isCheckoutPage()
    };

    try {
        const response = await fetch('http://localhost:8000/interceptor/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-user-id': 'demo_user_01' },
            body: JSON.stringify(payload)
        });
        const result = await response.json();
        showGXAlert(result.softMessage, result.triggerLevel, result.delaySeconds || 0, result.auditId || "");
    } catch (e) {
        console.error("Backend offline, showing demo alert.");
        // 如果后端没开，显示一个假弹窗来测试 UI
        showGXAlert("Backend Offline: This is a demo of the 10s reflection timer.", "friction", 10, "demo");
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