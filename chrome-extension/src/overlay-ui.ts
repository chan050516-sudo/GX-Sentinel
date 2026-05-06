export function createFrictionOverlay(minutes: number, seconds: number, onIgnore: () => void) {
    const overlay = document.createElement('div');
    overlay.id = 'gx-sentinel-overlay';
    overlay.style.cssText = `
        position: fixed; top: 20px; right: 20px; width: 320px; 
        background: #000; color: #fff; border: 2px solid #ff4d4f; 
        padding: 20px; border-radius: 12px; z-index: 999999; 
        box-shadow: 0 4px 15px rgba(0,0,0,0.3); font-family: sans-serif;
    `;
    
    overlay.innerHTML = `
        <h3 style="color: #ff4d4f; margin: 0;">GX-Sentinel Alert</h3>
        <p style="font-size: 14px; margin: 10px 0;">
            你已在此页面停留了 <b>${minutes}分 ${seconds}秒</b>。
        </p>
        <p style="font-size: 12px; color: #aaa;">"Financial mistakes happen at the moment of decision."</p>
        <button id="gx-close-btn" style="
            width: 100%; background: #ff4d4f; color: white; border: none; 
            padding: 10px; border-radius: 6px; cursor: pointer; margin-top: 10px;
        ">我再想想 (拦截冲动)</button>
    `;

    document.body.appendChild(overlay);

    document.getElementById('gx-close-btn')?.addEventListener('click', () => {
        overlay.remove();
        onIgnore();
    });
}