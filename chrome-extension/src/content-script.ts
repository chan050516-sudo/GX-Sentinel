// --- 核心修复：强行定义 exports 解决浏览器报错 ---
var exports = window.exports || {};

(function() {
    "use strict";

    // --- 1. UI 逻辑 ---
    function showGXAlert(message, triggerLevel, delay, auditId) {
        if (document.getElementById('gx-sentinel-overlay')) return;

        const overlay = document.createElement('div');
        overlay.id = 'gx-sentinel-overlay';
        const isHard = triggerLevel === 'critical' || triggerLevel === 'friction';
        
        overlay.style.cssText = isHard 
            ? `position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.95); display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 9999999; color: #fff; font-family: sans-serif;`
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
                const btn = document.getElementById('gx-close-btn');
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

    function isCheckoutPage() {
        const textToSearch = ['check out', 'place order', 'buy now', '结账', '下单'];
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.some(btn => {
            const content = btn.textContent?.toLowerCase() || "";
            return textToSearch.some(t => content.includes(t));
        });
    }

    // --- 3. 发送逻辑 (核心修正：使用 127.0.0.1) ---
    async function sendToAnalyze() {
        console.log("GX-Sentinel: 正在连接后端分析...");
        const product = getProductInfo();
        const payload = {
            platform: "shopee", 
            products: [{ name: product.name, price: product.price }],
            totalAmount: product.price,
            isCheckoutPage: isCheckoutPage()
        };

        try {
            // 这里统一使用 127.0.0.1 避免 localhost 域名解析问题
            const response = await fetch('http://127.0.0.1:8000/interceptor/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-user-id': 'demo_user_01' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) throw new Error("Server response not OK");
            const result = await response.json();
            showGXAlert(result.softMessage, result.triggerLevel, result.delaySeconds || 0, result.auditId || "");
        } catch (e) {
            console.error("Backend offline:", e);
            // 只有真正连不上时才显示 demo
            showGXAlert("Backend Offline: AI 引擎连接失败，请检查 Python 后端是否运行在 127.0.0.1:8000", "friction", 5, "demo");
        }
    }

    // --- 4. 监控逻辑 ---
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

})();