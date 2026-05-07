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
    { label: "Spending Stability", value: 0.85 }
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

  return (
    <div className="tracking-container">
      <header className="tracking-header">
        <h2>Risk Profile & Auditing</h2>
        <p>Monitor your behavioral discipline and time survivability.</p>
      </header>

      <main className="tracking-main">
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
                <span className="label-title">Spending Stability</span>
                <span className="label-value">85%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="metrics-column">
          <div className="metric-card highlight">
            <h3>Resilience Index</h3>
            <div className="index-value">84.2</div>
            <p>Your current index is <strong>Strong</strong>. You have effectively defended against 3 impulse transactions this month.</p>
          </div>

          <div className="breakdown-card">
            <h3>Score Contributors</h3>
            <div className="breakdown-list">
              <div className="breakdown-item">
                <span>Runway Stability</span>
                <strong>+ 32.0</strong>
              </div>
              <div className="breakdown-item">
                <span>Impulse Control</span>
                <strong>+ 28.5</strong>
              </div>
              <div className="breakdown-item">
                <span>Savings Discipline</span>
                <strong>+ 25.1</strong>
              </div>
              <div className="breakdown-item negative">
                <span>Spending Stability</span>
                <strong>- 1.4</strong>
              </div>
              <div className="breakdown-item total">
                <span>Total Score</span>
                <strong>84.2</strong>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
