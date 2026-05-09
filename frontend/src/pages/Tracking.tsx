import "./Tracking.css";

export default function Tracking() {
  // SVG Radar Chart logic for hackathon demo
  // 4 Dimensions: Runway Stability, Impulse Control, Savings Consistency, Spending Volatility
  const center = 150;
  const radius = 100;

  // Values from 0 to 1
  const metrics = [
    { label: "Runway Stability", value: 0.8 },
    { label: "Impulse Control", value: 0.9 },
    { label: "Savings Discipline", value: 0.7 },
    { label: "Spending Volatility", value: 0.85 }
  ];

  const getCoordinatesForAngle = (angle: number, value: number) => {
    const x = center + radius * value * Math.cos(angle - Math.PI / 2);
    const y = center + radius * value * Math.sin(angle - Math.PI / 2);
    return `${x},${y}`;
  };

  const polygonPoints = metrics.map((m, i) => {
    const angle = (Math.PI * 2 * i) / metrics.length;
    return getCoordinatesForAngle(angle, m.value);
  }).join(" ");

  // Grid lines
  const levels = [0.25, 0.5, 0.75, 1];

  // 💥 新增：7-Day Behavioral Stability 数据与曲线计算
  const trendData = [
    { day: "Mon", score: 76 },
    { day: "Tue", score: 62, event: "Impulse purchase", type: "negative" },
    { day: "Wed", score: 70 },
    { day: "Thu", score: 82, event: "Runway stabilized", type: "positive" },
    { day: "Fri", score: 85 },
    { day: "Sat", score: 81 },
    { day: "Sun", score: 84.2, event: "Current state", type: "neutral" },
  ];

  const chartWidth = 800;
  const chartHeight = 250;
  const paddingX = 40;
  const paddingY = 40;
  const minScore = 50; // Y轴最低分
  const maxScore = 100; // Y轴最高分

  const getX = (index: number) => paddingX + (index * (chartWidth - paddingX * 2)) / (trendData.length - 1);
  const getY = (score: number) => chartHeight - paddingY - ((score - minScore) / (maxScore - minScore)) * (chartHeight - paddingY * 2);

  // 自动生成平滑的贝塞尔曲线 (Smooth Bezier Curve)
  let trendPath = `M ${getX(0)},${getY(trendData[0].score)}`;
  for (let i = 0; i < trendData.length - 1; i++) {
    const x0 = getX(i);
    const y0 = getY(trendData[i].score);
    const x1 = getX(i + 1);
    const y1 = getY(trendData[i + 1].score);
    // 控制点计算
    const cpX1 = x0 + (x1 - x0) / 2;
    const cpX2 = x0 + (x1 - x0) / 2;
    trendPath += ` C ${cpX1},${y0} ${cpX2},${y1} ${x1},${y1}`;
  }

  // 用于底部的渐变填充区域
  const trendArea = `${trendPath} L ${getX(trendData.length - 1)},${chartHeight - paddingY} L ${getX(0)},${chartHeight - paddingY} Z`;

  return (
    <div className="tracking-container">
      <header className="tracking-header">
        <h2>Risk Profile & Behavioral Analysis</h2>
        <p>Monitor your behavioral discipline and time survivability.</p>
      </header>

      <main className="tracking-main">
        {/* 💥 主视觉：中心发光大圆环 */}
        <div className="score-hero-section">
          <div className="glowing-ring-container">
            <svg viewBox="0 0 200 200" className="score-ring-svg">
              <defs>
                <linearGradient id="score-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#771FFF" />
                  <stop offset="100%" stopColor="#F8326D" />
                </linearGradient>
                <filter id="glow-effect" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* 暗色底环 */}
              <circle cx="100" cy="100" r="85" className="ring-bg" />

              {/* 进度亮环 (84.2% 进度) */}
              <circle
                cx="100" cy="100" r="85"
                className="ring-fill"
              />
            </svg>

            {/* 内部文字 */}
            <div className="ring-content">
              <span className="ring-score">84.2</span>
              <span className="ring-status">BEHAVIORALLY STABLE</span>
            </div>
          </div>
          <p className="hero-subtitle">
            You have effectively defended against <strong>3 impulse transactions</strong> this month.
          </p>
        </div>

        {/* 💥 AI Behavioral Insight Panel */}
        <div className="ai-insight-panel">
          <div className="insight-header">
            <div className="ai-status-indicator">
              <div className="status-dot"></div>
              <span>AI BEHAVIORAL AUDIT ACTIVE</span>
            </div>
            <h3>AI Behavioral Insight</h3>
          </div>

          <div className="insight-content">
            <div className="insight-item">
              <span className="bullet"></span>
              <p>Impulse resistance <strong>improved by 12%</strong> compared to last window.</p>
            </div>
            <div className="insight-item">
              <span className="bullet warning"></span>
              <p>Night-time spending remains <strong>elevated</strong>; risk of 02:00 AM fatigue purchases.</p>
            </div>
            <div className="insight-item">
              <span className="bullet"></span>
              <p>Runway stability <strong>recovered</strong> after reduction in discretionary subscriptions.</p>
            </div>
          </div>

          {/* 装饰性扫描线 */}
          <div className="panel-scanner"></div>
        </div>

        {/* 💥 NEW: 7-Day Behavioral Stability (Resilience Trend) */}
        <div className="trend-card">
          <div className="trend-header">
            <h3>7-Day Behavioral Stability</h3>
            <span className="trend-badge">LIVE TRACKING</span>
          </div>

          <div className="trend-chart-wrapper">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="trend-svg">
              <defs>
                {/* 发光滤镜 */}
                <filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                {/* 底部渐变填充 */}
                <linearGradient id="area-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="rgba(119, 31, 255, 0.4)" />
                  <stop offset="100%" stopColor="rgba(119, 31, 255, 0.0)" />
                </linearGradient>
              </defs>

              {/* 背景横向参考线 (网格感) */}
              {[60, 80, 100].map((score) => (
                <g key={score} className="grid-line-group">
                  <line x1={paddingX} y1={getY(score)} x2={chartWidth - paddingX} y2={getY(score)} className="trend-grid-line" />
                  <text x={paddingX - 10} y={getY(score) + 4} className="trend-grid-text">{score}</text>
                </g>
              ))}

              {/* 填充面积 */}
              <path d={trendArea} fill="url(#area-gradient)" />

              {/* 平滑的发光主线 */}
              <path d={trendPath} className="trend-main-line" filter="url(#neon-glow)" />

              {/* 数据点与事件标记 (Event Markers) */}
              {trendData.map((d, i) => {
                const cx = getX(i);
                const cy = getY(d.score);
                const hasEvent = !!d.event;

                return (
                  <g key={i}>
                    {/* 竖向定位线 */}
                    {hasEvent && (
                      <line x1={cx} y1={cy} x2={cx} y2={chartHeight - paddingY} className={`event-drop-line ${d.type}`} />
                    )}

                    {/* 数据点圆圈 */}
                    <circle
                      cx={cx} cy={cy}
                      r={hasEvent ? 6 : 4}
                      className={`trend-dot ${hasEvent ? d.type : 'normal'}`}
                    />

                    {/* 事件文字浮层 (只在有事件时显示) */}
                    {hasEvent && (
                      <g className="event-label-group" transform={`translate(${cx}, ${cy - 20})`}>
                        <rect x="-60" y="-20" width="120" height="24" rx="4" className={`event-label-bg ${d.type}`} />
                        <text x="0" y="-4" className="event-label-text">{d.event}</text>
                      </g>
                    )}

                    {/* 底部 X 轴文字 */}
                    <text x={cx} y={chartHeight - 15} className="trend-axis-text">{d.day}</text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* 下方数据拆解区 */}
        <div className="dashboard-bottom-grid">
          {/* 左侧：雷达图 */}
          <div className="radar-card">
            <h3>Resilience Index Radar</h3>
            <div className="radar-wrapper">
              <svg viewBox="0 0 300 300" className="radar-svg">
                {/* Draw Grid Polygons */}
                {levels.map((level, i) => {
                  const points = metrics.map((_, idx) => {
                    const angle = (Math.PI * 2 * idx) / metrics.length;
                    return getCoordinatesForAngle(angle, level);
                  }).join(" ");
                  return <polygon key={i} points={points} className="radar-grid" />;
                })}

                {/* Draw Axis Lines */}
                {metrics.map((_, i) => {
                  const angle = (Math.PI * 2 * i) / metrics.length;
                  const end = getCoordinatesForAngle(angle, 1);
                  const [ex, ey] = end.split(",");
                  return (
                    <line
                      key={i}
                      x1={center} y1={center}
                      x2={ex} y2={ey}
                      className="radar-axis"
                    />
                  );
                })}

                {/* Data Polygon */}
                <polygon points={polygonPoints} className="radar-data" />

                {/* Data Points */}
                {metrics.map((m, i) => {
                  const angle = (Math.PI * 2 * i) / metrics.length;
                  const coord = getCoordinatesForAngle(angle, m.value);
                  const [cx, cy] = coord.split(",");
                  return (
                    <circle key={i} cx={cx} cy={cy} r="5" className="radar-point" />
                  );
                })}
              </svg>

              {/* Labels overlay */}
              <div className="radar-labels">
                <div className="label top">
                  <span className="label-title">Runway Stability</span>
                  <span className="label-value">80%</span>
                </div>
                <div className="label right">
                  <span className="label-title">Impulse Control</span>
                  <span className="label-value">90%</span>
                </div>
                <div className="label bottom">
                  <span className="label-title">Savings Discipline</span>
                  <span className="label-value">70%</span>
                </div>
                <div className="label left">
                  <span className="label-title">Spending Volatility</span>
                  <span className="label-value">85%</span>
                </div>
              </div>
            </div>
          </div>

          {/* 右侧：加减分项明细 */}
          <div className="breakdown-card">
            <h3>Behavioral Drivers</h3>
            <div className="breakdown-list">
              {/* Runway Stability */}
              <div className="breakdown-item-wrapper">
                <div className="item-info">
                  <span>Runway Stability</span>
                  <strong>+ 32.0</strong>
                </div>
                <div className="progress-bar-container">
                  <div className="progress-bar-fill positive" style={{ "--fill-width": "80%" } as React.CSSProperties}></div>
                </div>
              </div>

              {/* Impulse Control */}
              <div className="breakdown-item-wrapper">
                <div className="item-info">
                  <span>Impulse Control</span>
                  <strong>+ 28.5</strong>
                </div>
                <div className="progress-bar-container">
                  <div className="progress-bar-fill positive" style={{ "--fill-width": "70%" } as React.CSSProperties}></div>
                </div>
              </div>

              {/* Savings Discipline */}
              <div className="breakdown-item-wrapper">
                <div className="item-info">
                  <span>Savings Discipline</span>
                  <strong>+ 25.1</strong>
                </div>
                <div className="progress-bar-container">
                  <div className="progress-bar-fill positive" style={{ "--fill-width": "62%" } as React.CSSProperties}></div>
                </div>
              </div>

              {/* Spending Stability - Negative (Threat State) */}
              <div className="breakdown-item-wrapper">
                <div className="item-info">
                  <span>
                    Spending Volatility
                    <span className="threat-badge">HIGH</span>
                  </span>
                  <strong className="neg-val">- 1.4</strong>
                </div>
                <div className="progress-bar-container danger-container">
                  <div className="progress-bar-fill negative" style={{ "--fill-width": "15%" } as React.CSSProperties}></div>
                </div>
              </div>

              {/* Total Score Footer */}
              <div className="breakdown-total">
                <span>Total Resilience Score</span>
                <strong>84.2</strong>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}