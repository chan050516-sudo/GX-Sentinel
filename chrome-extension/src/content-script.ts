// --- 1. 抓取信息的辅助函数 ---
function getProductInfo() {
    // 适配 Shopee 的常见类名（Demo 时如果抓不到，需根据页面实际 HTML 微调）
    const priceElement = document.querySelector('.Y_uSTn'); // Shopee 价格类名
    const nameElement = document.querySelector('.V_P69E');  // Shopee 商品名类名
    
    const priceText = priceElement?.textContent || "0";
    // 去掉 RM 符号和逗号，转成数字
    const numericPrice = parseFloat(priceText.replace(/[^\d.]/g, '')) || 0;

    return {
        name: nameElement?.textContent?.trim() || "Unknown Product",
        price: numericPrice
    };
}

function isCheckoutPage(): boolean {
    // 检测页面是否有 "place order" 或 "check out" 按钮文本
    const buttons = Array.from(document.querySelectorAll('button'));
    return buttons.some(btn => {
        const text = btn.textContent?.toLowerCase() || "";
        return text.includes('check out') || text.includes('place order');
    });
}

// --- 2. 发送数据到 FastAPI 后端 ---
async function sendToAnalyze(elapsedSeconds: number) {
    const product = getProductInfo();
    const checkoutStatus = isCheckoutPage();

    // 对应你照片里的 InterceptorAnalyzeRequest 结构
    const payload = {
        platform: "shopee", 
        products: [
            {
                name: product.name,
                price: product.price,
                quantity: 1
            }
        ],
        totalAmount: product.price,
        isCheckoutPage: checkoutStatus
    };

    console.log("GX-Sentinel: 正在发送数据到后端...", payload);

    try {
        const response = await fetch('http://localhost:8000/interceptor/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-user-id': 'demo_user_01' // 对应你图片里的 Header
            },
            body: JSON.stringify(payload)
        });
        const result = await response.json();
        console.log("后端返回结果:", result);
        
        // 这里可以根据返回的 triggerLevel (soft/hard) 来决定弹窗样式
        return result;
    } catch (error) {
        console.error("API 连接失败:", error);
    }
}

// --- 3. 核心监控逻辑 ---
const startTime = Date.now();
let hasAnalyzed = false;

setInterval(() => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const checkoutStatus = isCheckoutPage();

    // 触发条件：停留 > 10秒 OR 进入支付页面
    if ((elapsed >= 10 || checkoutStatus) && !hasAnalyzed) {
        hasAnalyzed = true;
        sendToAnalyze(elapsed).then(apiResult => {
            // 在这里调用你之前的 showOverlay 函数显示结果
            // showOverlay(0, elapsed, apiResult?.softMessage); 
        });
    }
}, 2000); // 每2秒检查一次