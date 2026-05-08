// overlay-ui.ts
// export function showGXAlert(message: string, triggerLevel: string, delay: number, auditId: string, onComplete: () => void) {
//     if (document.getElementById('gx-sentinel-overlay')) return;

//     const overlay = document.createElement('div');
//     overlay.id = 'gx-sentinel-overlay';
    
//     // Critical 模式用全屏，Soft 用右侧浮窗
//     const isHard = triggerLevel === 'critical' || triggerLevel === 'friction';
    
//     overlay.style.cssText = isHard 
//         ? `position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 999999; color: #fff; font-family: sans-serif;`
//         : `position: fixed; top: 20px; right: 20px; width: 320px; background: #1a1a1a; color: #fff; border: 2px solid #ff4d4f; padding: 20px; border-radius: 12px; z-index: 999999; box-shadow: 0 4px 20px rgba(0,0,0,0.5); font-family: sans-serif;`;

//     let actionContent = ``;
//     if (triggerLevel === 'critical') {
//         actionContent = `
//             <textarea id="gx-justify" placeholder="Why is this purchase necessary?" style="width: 80%; max-width: 400px; height: 80px; margin-top: 15px; padding: 10px; border-radius: 8px;"></textarea>
//             <button id="gx-submit-btn" disabled style="width: 200px; background: #555; color: white; border: none; padding: 12px; border-radius: 6px; cursor: not-allowed; margin-top: 15px; font-weight: bold;">Wait for timer...</button>
//         `;
//     } else {
//         actionContent = `
//             <button id="gx-close-btn" ${delay > 0 ? 'disabled' : ''} style="width: 100%; background: ${delay > 0 ? '#444' : '#ff4d4f'}; color: white; border: none; padding: 12px; border-radius: 6px; cursor: ${delay > 0 ? 'not-allowed' : 'pointer'}; margin-top: 15px; font-weight: bold;">
//                 ${delay > 0 ? `Reflect (${delay}s)` : 'I understand'}
//             </button>
//         `;
//     }

//     overlay.innerHTML = `
//         <div style="text-align: center; padding: 20px;">
//             <h2 style="color: #ff4d4f; margin: 0; font-size: 24px;">⚠️ GX-Sentinel</h2>
//             <p style="font-size: 16px; margin: 20px 0; line-height: 1.6;">${message}</p>
//             ${delay > 0 ? `<div id="gx-timer-text" style="color: #faad14; margin-bottom: 10px;">Deep reflection required: ${delay}s</div>` : ''}
//             ${actionContent}
//         </div>
//     `;

//     document.body.appendChild(overlay);

//     // 倒计时逻辑
//     if (delay > 0) {
//         let timeLeft = delay;
//         const timer = setInterval(() => {
//             timeLeft--;
//             const timerDoc = document.getElementById('gx-timer-text');
//             const closeBtn = document.getElementById('gx-close-btn') as HTMLButtonElement;
//             const submitBtn = document.getElementById('gx-submit-btn') as HTMLButtonElement;

//             if (timerDoc) timerDoc.innerText = `Deep reflection required: ${timeLeft}s`;
            
//             if (timeLeft <= 0) {
//                 clearInterval(timer);
//                 if (closeBtn) {
//                     closeBtn.disabled = false;
//                     closeBtn.style.background = '#ff4d4f';
//                     closeBtn.style.cursor = 'pointer';
//                     closeBtn.innerText = "I have reflected";
//                 }
//                 if (submitBtn) {
//                     submitBtn.disabled = false;
//                     submitBtn.style.background = '#1890ff';
//                     submitBtn.style.cursor = 'pointer';
//                     submitBtn.innerText = "Submit Justification";
//                 }
//             }
//         }, 1000);
//     }

//     // 绑定关闭/提交事件
//     document.getElementById('gx-close-btn')?.addEventListener('click', () => {
//         overlay.remove();
//         onComplete();
//     });

//     document.getElementById('gx-submit-btn')?.addEventListener('click', async () => {
//         const justification = (document.getElementById('gx-justify') as HTMLTextAreaElement).value;
//         if (!justification) return alert("Please enter a reason.");
        
//         // 调用 justify 接口
//         const res = await fetch('http://localhost:8000/interceptor/justify', {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({ auditId, justification })
//         });
//         const result = await res.json();
//         alert(`AI Verdict: ${result.verdict}\nReason: ${result.reasoning}`);
//         overlay.remove();
//         onComplete();
//     });
// }