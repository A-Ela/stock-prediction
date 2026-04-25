import { useState, useEffect, useRef } from "react";

const COLORS = {
  bg0: "#060A12",
  bg1: "#0B1120",
  bg2: "#101828",
  bg3: "#162035",
  surface: "#1A2640",
  surfaceHover: "#1F2E4A",
  border: "#1E3050",
  borderLight: "#243855",
  cyan: "#00D4FF",
  cyanDim: "#00A8CC",
  cyanGlow: "rgba(0,212,255,0.15)",
  green: "#00E5A0",
  greenDim: "#00B87D",
  red: "#FF4D6A",
  redDim: "#CC3A53",
  amber: "#F5A623",
  textPrimary: "#E8F0FF",
  textSecondary: "#7A9CC8",
  textMuted: "#3D5A80",
};

const mockStocks = [
  { symbol: "ARAMCO", name: "Saudi Aramco", price: 32.15, change: +1.82, pct: +6.0, volume: "142M", mktCap: "7.1T" },
  { symbol: "STC", name: "Saudi Telecom Co.", price: 48.70, change: +2.10, pct: +4.5, volume: "8.4M", mktCap: "97B" },
  { symbol: "SNB", name: "Saudi National Bank", price: 26.40, change: -0.90, pct: -3.3, volume: "12.1M", mktCap: "157B" },
  { symbol: "TADAWUL", name: "Saudi Exchange", price: 187.00, change: +4.50, pct: +2.5, volume: "3.2M", mktCap: "23B" },
  { symbol: "ACWA", name: "ACWA Power", price: 198.20, change: -6.80, pct: -3.3, volume: "5.7M", mktCap: "52B" },
  { symbol: "SABIC", name: "Saudi Basic Indust.", price: 74.10, change: +1.30, pct: +1.8, volume: "9.1M", mktCap: "222B" },
];

const generateSparkline = (base, positive, points = 28) => {
  const data = [];
  let val = base * 0.94;
  for (let i = 0; i < points; i++) {
    const drift = positive ? 0.003 : -0.003;
    val += val * (drift + (Math.random() - 0.48) * 0.025);
    data.push(val);
  }
  data[data.length - 1] = base;
  return data;
};

const Sparkline = ({ data, positive, width = 90, height = 32 }) => {
  const min = Math.min(...data), max = Math.max(...data);
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / (max - min + 0.001)) * height;
    return `${x},${y}`;
  }).join(" ");
  const color = positive ? COLORS.green : COLORS.red;
  const fillPts = `0,${height} ${pts} ${width},${height}`;
  return (
    <svg width={width} height={height} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={`sg-${positive}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={fillPts} fill={`url(#sg-${positive})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const generateChart = (base, days = 90) => {
  const pts = [];
  let v = base * 0.88;
  const now = new Date();
  for (let i = days; i >= 0; i--) {
    v += v * ((Math.random() - 0.47) * 0.03);
    const d = new Date(now); d.setDate(now.getDate() - i);
    pts.push({ date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }), price: v });
  }
  pts[pts.length - 1].price = base;
  return pts;
};

const MiniChart = ({ data, positive }) => {
  const w = 540, h = 140;
  const min = Math.min(...data.map(d => d.price));
  const max = Math.max(...data.map(d => d.price));
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((d.price - min) / (max - min + 0.001)) * h;
    return `${x},${y}`;
  }).join(" ");
  const color = positive ? COLORS.green : COLORS.red;
  const fillPts = `0,${h} ${pts} ${w},${h}`;
  const labels = [0, Math.floor(data.length / 3), Math.floor(data.length * 2 / 3), data.length - 1].map(i => ({
    x: (i / (data.length - 1)) * w, label: data[i]?.date
  }));

  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h + 28}`} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      {[0.25, 0.5, 0.75].map(t => (
        <line key={t} x1="0" y1={h * (1 - t)} x2={w} y2={h * (1 - t)}
          stroke={COLORS.border} strokeWidth="1" strokeDasharray="4,6" />
      ))}
      <polygon points={fillPts} fill="url(#chartFill)" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" filter="url(#glow)" />
      {labels.map(({ x, label }) => (
        <text key={label} x={x} y={h + 20} textAnchor="middle" fill={COLORS.textMuted} fontSize="10" fontFamily="'Space Mono', monospace">{label}</text>
      ))}
    </svg>
  );
};

const ConfidenceBar = ({ value }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
    <div style={{ flex: 1, height: 6, background: COLORS.bg0, borderRadius: 3, overflow: "hidden" }}>
      <div style={{
        height: "100%", width: `${value * 100}%`,
        background: `linear-gradient(90deg, ${COLORS.cyan}, ${COLORS.green})`,
        borderRadius: 3, transition: "width 1s ease",
        boxShadow: `0 0 10px ${COLORS.cyanGlow}`,
      }} />
    </div>
    <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, color: COLORS.cyan, minWidth: 38 }}>
      {(value * 100).toFixed(1)}%
    </span>
  </div>
);

const Tag = ({ children, color }) => (
  <span style={{
    display: "inline-block", padding: "2px 8px", borderRadius: 3,
    border: `1px solid ${color}33`, background: `${color}15`,
    color, fontSize: 10, fontFamily: "'Space Mono', monospace",
    letterSpacing: "0.08em", textTransform: "uppercase",
  }}>{children}</span>
);

const NavItem = ({ label, active, onClick, icon }) => (
  <button onClick={onClick} style={{
    display: "flex", alignItems: "center", gap: 10,
    padding: "10px 16px", borderRadius: 6, width: "100%", textAlign: "left",
    background: active ? `linear-gradient(90deg, ${COLORS.cyanGlow}, transparent)` : "transparent",
    border: active ? `1px solid ${COLORS.cyan}33` : "1px solid transparent",
    color: active ? COLORS.cyan : COLORS.textSecondary,
    cursor: "pointer", fontSize: 13, fontFamily: "'DM Sans', sans-serif",
    transition: "all 0.15s ease",
  }}>
    <span style={{ fontSize: 15 }}>{icon}</span>
    <span>{label}</span>
    {active && <span style={{ marginLeft: "auto", width: 4, height: 4, borderRadius: "50%", background: COLORS.cyan }} />}
  </button>
);

const StockRow = ({ stock, onSelect, tracked }) => {
  const positive = stock.change >= 0;
  const sparkData = generateSparkline(stock.price, positive);
  return (
    <tr onClick={() => onSelect(stock)} style={{
      cursor: "pointer", transition: "background 0.12s",
    }}
      onMouseEnter={e => e.currentTarget.style.background = COLORS.surfaceHover}
      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
    >
      <td style={{ padding: "13px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: `linear-gradient(135deg, ${COLORS.bg0}, ${COLORS.bg3})`,
            border: `1px solid ${COLORS.border}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 10, fontWeight: 700, color: COLORS.cyan,
            fontFamily: "'Space Mono', monospace", letterSpacing: "0.05em",
          }}>{stock.symbol.slice(0, 3)}</div>
          <div>
            <div style={{ color: COLORS.textPrimary, fontSize: 13, fontWeight: 600 }}>{stock.symbol}</div>
            <div style={{ color: COLORS.textMuted, fontSize: 11 }}>{stock.name}</div>
          </div>
        </div>
      </td>
      <td style={{ padding: "13px 16px", textAlign: "right" }}>
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 13, color: COLORS.textPrimary }}>
          {stock.price.toFixed(2)}
        </span>
      </td>
      <td style={{ padding: "13px 16px", textAlign: "right" }}>
        <span style={{
          fontFamily: "'Space Mono', monospace", fontSize: 12,
          color: positive ? COLORS.green : COLORS.red,
        }}>
          {positive ? "+" : ""}{stock.change.toFixed(2)}
        </span>
      </td>
      <td style={{ padding: "13px 16px", textAlign: "right" }}>
        <Tag color={positive ? COLORS.green : COLORS.red}>
          {positive ? "▲" : "▼"} {Math.abs(stock.pct).toFixed(1)}%
        </Tag>
      </td>
      <td style={{ padding: "13px 16px", textAlign: "right" }}>
        <Sparkline data={sparkData} positive={positive} />
      </td>
      <td style={{ padding: "13px 16px", textAlign: "center" }}>
        <button
          onClick={e => { e.stopPropagation(); }}
          style={{
            width: 28, height: 28, borderRadius: 6,
            background: tracked ? `${COLORS.cyan}20` : "transparent",
            border: `1px solid ${tracked ? COLORS.cyan : COLORS.border}`,
            color: tracked ? COLORS.cyan : COLORS.textMuted,
            cursor: "pointer", fontSize: 13, display: "flex",
            alignItems: "center", justifyContent: "center",
          }}>{tracked ? "★" : "☆"}</button>
      </td>
    </tr>
  );
};

const LoginPage = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);

  const handle = () => {
    setLoading(true);
    setTimeout(() => { setLoading(false); onLogin(); }, 1200);
  };

  return (
    <div style={{
      minHeight: "100vh", background: COLORS.bg0,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'DM Sans', sans-serif", position: "relative", overflow: "hidden",
    }}>
      {/* Background grid */}
      <div style={{
        position: "absolute", inset: 0, opacity: 0.04,
        backgroundImage: `linear-gradient(${COLORS.cyan} 1px, transparent 1px), linear-gradient(90deg, ${COLORS.cyan} 1px, transparent 1px)`,
        backgroundSize: "40px 40px",
      }} />
      {/* Glow orbs */}
      <div style={{
        position: "absolute", top: "15%", left: "15%", width: 400, height: 400,
        background: `radial-gradient(circle, ${COLORS.cyan}12 0%, transparent 70%)`,
        borderRadius: "50%", pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", bottom: "10%", right: "10%", width: 350, height: 350,
        background: `radial-gradient(circle, ${COLORS.green}0D 0%, transparent 70%)`,
        borderRadius: "50%", pointerEvents: "none",
      }} />

      <div style={{
        width: 420, padding: 48,
        background: `linear-gradient(160deg, ${COLORS.bg2}, ${COLORS.bg1})`,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 16, position: "relative",
        boxShadow: `0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px ${COLORS.border}, inset 0 1px 0 ${COLORS.borderLight}20`,
      }}>
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 8,
              background: `linear-gradient(135deg, ${COLORS.cyan}, ${COLORS.cyanDim})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16, boxShadow: `0 0 20px ${COLORS.cyanGlow}`,
            }}>◈</div>
            <span style={{
              fontFamily: "'Space Mono', monospace", fontSize: 13,
              color: COLORS.cyan, letterSpacing: "0.12em", textTransform: "uppercase",
            }}>StockSight</span>
          </div>
          <h1 style={{
            fontSize: 28, fontWeight: 700, color: COLORS.textPrimary,
            margin: "0 0 8px", lineHeight: 1.2,
          }}>Welcome back</h1>
          <p style={{ fontSize: 13, color: COLORS.textSecondary, margin: 0 }}>
            Sign in to your trading dashboard
          </p>
        </div>

        {["Email address", "Password"].map((label, i) => (
          <div key={label} style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 11, color: COLORS.textSecondary, marginBottom: 7, letterSpacing: "0.07em", textTransform: "uppercase" }}>{label}</label>
            <input
              type={i === 1 ? "password" : "email"}
              placeholder={i === 0 ? "trader@example.com" : "••••••••"}
              value={i === 0 ? email : pass}
              onChange={e => i === 0 ? setEmail(e.target.value) : setPass(e.target.value)}
              style={{
                width: "100%", padding: "11px 14px", borderRadius: 8,
                background: COLORS.bg0, border: `1px solid ${COLORS.border}`,
                color: COLORS.textPrimary, fontSize: 13, outline: "none",
                boxSizing: "border-box", fontFamily: "'DM Sans', sans-serif",
                transition: "border-color 0.15s",
              }}
              onFocus={e => e.target.style.borderColor = COLORS.cyan}
              onBlur={e => e.target.style.borderColor = COLORS.border}
            />
          </div>
        ))}

        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 24 }}>
          <span style={{ fontSize: 12, color: COLORS.cyan, cursor: "pointer" }}>Forgot password?</span>
        </div>

        <button onClick={handle} style={{
          width: "100%", padding: "13px 0", borderRadius: 8,
          background: loading
            ? COLORS.bg3
            : `linear-gradient(90deg, ${COLORS.cyan}, ${COLORS.cyanDim})`,
          border: "none", color: loading ? COLORS.textMuted : COLORS.bg0,
          fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
          letterSpacing: "0.05em", transition: "all 0.2s",
          boxShadow: loading ? "none" : `0 0 24px ${COLORS.cyanGlow}`,
        }}>
          {loading ? "Authenticating..." : "Sign In"}
        </button>

        <p style={{ textAlign: "center", fontSize: 12, color: COLORS.textMuted, marginTop: 24, marginBottom: 0 }}>
          Don't have an account?{" "}
          <span style={{ color: COLORS.cyan, cursor: "pointer" }}>Create one →</span>
        </p>
      </div>
    </div>
  );
};

const PredictionModal = ({ stock, onClose }) => {
  const [timeframe, setTimeframe] = useState(7);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const chartData = generateChart(stock.price);

  const runPrediction = () => {
    setRunning(true);
    setResult(null);
    setTimeout(() => {
      const positive = stock.change >= 0;
      const factor = positive ? 1 + Math.random() * 0.07 : 1 - Math.random() * 0.05;
      setResult({
        price: stock.price * factor,
        confidence: 0.6 + Math.random() * 0.3,
        trend: positive ? "BULLISH" : "BEARISH",
      });
      setRunning(false);
    }, 2200);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(6,10,18,0.85)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 100, backdropFilter: "blur(6px)",
    }} onClick={onClose}>
      <div style={{
        width: 620, background: COLORS.bg2,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 16, overflow: "hidden",
        boxShadow: `0 40px 100px rgba(0,0,0,0.7), 0 0 0 1px ${COLORS.border}`,
      }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{
          padding: "20px 24px", borderBottom: `1px solid ${COLORS.border}`,
          display: "flex", justifyContent: "space-between", alignItems: "center",
          background: `linear-gradient(90deg, ${COLORS.bg3}, ${COLORS.bg2})`,
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontFamily: "'Space Mono', monospace", color: COLORS.cyan, fontSize: 14, fontWeight: 700 }}>{stock.symbol}</span>
              <Tag color={COLORS.cyan}>AI FORECAST</Tag>
            </div>
            <div style={{ color: COLORS.textSecondary, fontSize: 12, marginTop: 2 }}>{stock.name}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: `1px solid ${COLORS.border}`, color: COLORS.textMuted, cursor: "pointer", width: 32, height: 32, borderRadius: 6, fontSize: 16 }}>✕</button>
        </div>

        <div style={{ padding: 24 }}>
          {/* Chart */}
          <div style={{ marginBottom: 20 }}>
            <MiniChart data={chartData} positive={stock.change >= 0} />
          </div>

          {/* Timeframe selector */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, color: COLORS.textSecondary, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 10 }}>Prediction Timeframe</div>
            <div style={{ display: "flex", gap: 8 }}>
              {[7, 14, 30].map(d => (
                <button key={d} onClick={() => setTimeframe(d)} style={{
                  padding: "8px 18px", borderRadius: 6, cursor: "pointer",
                  background: timeframe === d ? `${COLORS.cyan}20` : COLORS.bg0,
                  border: `1px solid ${timeframe === d ? COLORS.cyan : COLORS.border}`,
                  color: timeframe === d ? COLORS.cyan : COLORS.textSecondary,
                  fontSize: 12, fontFamily: "'Space Mono', monospace",
                }}>+{d}D</button>
              ))}
            </div>
          </div>

          {/* Result */}
          {result && (
            <div style={{
              padding: 20, borderRadius: 10,
              background: `linear-gradient(135deg, ${COLORS.bg0}, ${COLORS.bg3})`,
              border: `1px solid ${result.trend === "BULLISH" ? COLORS.green + "44" : COLORS.red + "44"}`,
              marginBottom: 20,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 11, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Predicted Price ({timeframe}-day)</div>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 28, fontWeight: 700, color: result.trend === "BULLISH" ? COLORS.green : COLORS.red }}>
                    SAR {result.price.toFixed(2)}
                  </div>
                </div>
                <Tag color={result.trend === "BULLISH" ? COLORS.green : COLORS.red}>
                  {result.trend === "BULLISH" ? "▲" : "▼"} {result.trend}
                </Tag>
              </div>
              <div>
                <div style={{ fontSize: 11, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Model Confidence</div>
                <ConfidenceBar value={result.confidence} />
              </div>
            </div>
          )}

          <button onClick={runPrediction} disabled={running} style={{
            width: "100%", padding: "13px 0", borderRadius: 8,
            background: running
              ? COLORS.bg3
              : `linear-gradient(90deg, ${COLORS.cyan}CC, ${COLORS.green}CC)`,
            border: running ? `1px solid ${COLORS.border}` : "none",
            color: running ? COLORS.textMuted : COLORS.bg0,
            fontSize: 14, fontWeight: 700, cursor: running ? "wait" : "pointer",
            letterSpacing: "0.05em", transition: "all 0.2s",
            boxShadow: running ? "none" : `0 0 30px ${COLORS.cyanGlow}`,
          }}>
            {running ? "◈  Running FinGPT Model..." : "◈  Generate AI Prediction"}
          </button>
        </div>
      </div>
    </div>
  );
};

const PredictPage = () => {
  const [selected, setSelected] = useState(null);
  const [timeframe, setTimeframe] = useState(7);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);

  const runPrediction = () => {
    setRunning(true);
    setResult(null);
    setTimeout(() => {
      const positive = selected.change >= 0;
      const factor = positive ? 1 + Math.random() * 0.07 : 1 - Math.random() * 0.05;
      setResult({
        price: selected.price * factor,
        confidence: 0.6 + Math.random() * 0.3,
        trend: positive ? "BULLISH" : "BEARISH",
      });
      setRunning(false);
    }, 2200);
  };

  const chartData = selected ? generateChart(selected.price) : [];

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 700, color: COLORS.textPrimary }}>AI Predictions</h1>
        <p style={{ margin: 0, fontSize: 13, color: COLORS.textSecondary }}>
          Powered by FinGPT · Select a stock to generate a short-term forecast
        </p>
      </div>

      {/* Stock selector grid */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 11, color: COLORS.textSecondary, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 14 }}>
          Select Stock
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {mockStocks.map(s => {
            const pos = s.change >= 0;
            const isActive = selected?.symbol === s.symbol;
            return (
              <div key={s.symbol} onClick={() => { setSelected(s); setResult(null); }} style={{
                padding: "16px 18px", borderRadius: 10, cursor: "pointer",
                background: isActive
                  ? `linear-gradient(135deg, ${COLORS.cyan}15, ${COLORS.bg3})`
                  : COLORS.surface,
                border: `1px solid ${isActive ? COLORS.cyan : COLORS.border}`,
                transition: "all 0.15s",
                boxShadow: isActive ? `0 0 20px ${COLORS.cyanGlow}` : "none",
              }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.borderColor = COLORS.cyanDim; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.borderColor = COLORS.border; }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 8,
                    background: isActive ? `${COLORS.cyan}22` : COLORS.bg0,
                    border: `1px solid ${isActive ? COLORS.cyan + "55" : COLORS.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 10, fontWeight: 700, color: isActive ? COLORS.cyan : COLORS.textMuted,
                    fontFamily: "'Space Mono', monospace",
                  }}>{s.symbol.slice(0, 3)}</div>
                  <Tag color={pos ? COLORS.green : COLORS.red}>{pos ? "▲" : "▼"} {Math.abs(s.pct).toFixed(1)}%</Tag>
                </div>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 16, fontWeight: 700, color: COLORS.textPrimary, marginBottom: 2 }}>{s.symbol}</div>
                <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 6 }}>{s.name}</div>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 13, color: pos ? COLORS.green : COLORS.red }}>
                  SAR {s.price.toFixed(2)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Prediction panel — only shown when a stock is selected */}
      {selected && (
        <div style={{
          borderRadius: 14, overflow: "hidden",
          border: `1px solid ${COLORS.border}`,
          background: COLORS.bg2,
        }}>
          {/* Panel header */}
          <div style={{
            padding: "18px 24px", borderBottom: `1px solid ${COLORS.border}`,
            background: `linear-gradient(90deg, ${COLORS.bg3}, ${COLORS.bg2})`,
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontFamily: "'Space Mono', monospace", color: COLORS.cyan, fontSize: 15, fontWeight: 700 }}>{selected.symbol}</span>
              <span style={{ fontSize: 13, color: COLORS.textSecondary }}>{selected.name}</span>
              <Tag color={COLORS.cyan}>FinGPT FORECAST</Tag>
            </div>
            <button onClick={() => { setSelected(null); setResult(null); }} style={{
              background: "none", border: `1px solid ${COLORS.border}`,
              color: COLORS.textMuted, cursor: "pointer",
              width: 30, height: 30, borderRadius: 6, fontSize: 14,
            }}>✕</button>
          </div>

          <div style={{ padding: 24 }}>
            {/* Chart */}
            <div style={{
              padding: 20, borderRadius: 10, marginBottom: 24,
              background: COLORS.bg0, border: `1px solid ${COLORS.border}`,
            }}>
              <div style={{ fontSize: 11, color: COLORS.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 14 }}>
                90-Day Historical · OHLC Source: Yahoo Finance
              </div>
              <MiniChart data={chartData} positive={selected.change >= 0} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              {/* Left: controls */}
              <div>
                <div style={{ fontSize: 11, color: COLORS.textSecondary, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 12 }}>Prediction Timeframe</div>
                <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
                  {[7, 14, 30].map(d => (
                    <button key={d} onClick={() => { setTimeframe(d); setResult(null); }} style={{
                      flex: 1, padding: "10px 0", borderRadius: 7, cursor: "pointer",
                      background: timeframe === d ? `${COLORS.cyan}20` : COLORS.bg0,
                      border: `1px solid ${timeframe === d ? COLORS.cyan : COLORS.border}`,
                      color: timeframe === d ? COLORS.cyan : COLORS.textSecondary,
                      fontSize: 13, fontFamily: "'Space Mono', monospace",
                      transition: "all 0.15s",
                    }}>+{d}D</button>
                  ))}
                </div>

                {/* Current stats */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
                  {[
                    { label: "Current Price", value: `SAR ${selected.price.toFixed(2)}`, color: COLORS.textPrimary },
                    { label: "24H Change", value: `${selected.change >= 0 ? "+" : ""}${selected.change.toFixed(2)}`, color: selected.change >= 0 ? COLORS.green : COLORS.red },
                    { label: "Volume", value: selected.volume, color: COLORS.textPrimary },
                    { label: "Mkt Cap", value: `SAR ${selected.mktCap}`, color: COLORS.textPrimary },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{
                      padding: "12px 14px", borderRadius: 8,
                      background: COLORS.bg0, border: `1px solid ${COLORS.border}`,
                    }}>
                      <div style={{ fontSize: 10, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>{label}</div>
                      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 13, color }}>{value}</div>
                    </div>
                  ))}
                </div>

                <button onClick={runPrediction} disabled={running} style={{
                  width: "100%", padding: "14px 0", borderRadius: 8,
                  background: running
                    ? COLORS.bg3
                    : `linear-gradient(90deg, ${COLORS.cyan}, ${COLORS.green}CC)`,
                  border: running ? `1px solid ${COLORS.border}` : "none",
                  color: running ? COLORS.textMuted : COLORS.bg0,
                  fontSize: 14, fontWeight: 700, cursor: running ? "wait" : "pointer",
                  letterSpacing: "0.05em", transition: "all 0.2s",
                  boxShadow: running ? "none" : `0 0 28px ${COLORS.cyanGlow}`,
                }}>
                  {running ? "◈  Running FinGPT Model..." : "◈  Generate AI Prediction"}
                </button>
              </div>

              {/* Right: result */}
              <div>
                {!result && !running && (
                  <div style={{
                    height: "100%", minHeight: 200,
                    display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center",
                    border: `1px dashed ${COLORS.border}`, borderRadius: 10,
                    color: COLORS.textMuted, fontSize: 13, gap: 10,
                  }}>
                    <span style={{ fontSize: 28, opacity: 0.4 }}>◈</span>
                    <span>Select timeframe &amp; run prediction</span>
                  </div>
                )}
                {running && (
                  <div style={{
                    height: "100%", minHeight: 200,
                    display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center",
                    border: `1px solid ${COLORS.cyan}33`, borderRadius: 10,
                    background: `${COLORS.cyan}08`, gap: 14,
                  }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: "50%",
                      border: `2px solid ${COLORS.border}`,
                      borderTop: `2px solid ${COLORS.cyan}`,
                      animation: "spin 0.9s linear infinite",
                    }} />
                    <div style={{ color: COLORS.cyan, fontSize: 12, fontFamily: "'Space Mono', monospace" }}>Analyzing {timeframe}-day window...</div>
                    <div style={{ color: COLORS.textMuted, fontSize: 11 }}>FinGPT processing OHLC data</div>
                  </div>
                )}
                {result && (
                  <div style={{
                    padding: 22, borderRadius: 10, height: "100%",
                    background: `linear-gradient(135deg, ${COLORS.bg0}, ${COLORS.bg3})`,
                    border: `1px solid ${result.trend === "BULLISH" ? COLORS.green + "55" : COLORS.red + "55"}`,
                    boxShadow: result.trend === "BULLISH" ? `0 0 30px ${COLORS.green}10` : `0 0 30px ${COLORS.red}10`,
                  }}>
                    <div style={{ fontSize: 10, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
                      FinGPT Forecast · {timeframe}-Day Outlook
                    </div>
                    <div style={{ display: "flex", alignItems: "flex-end", gap: 12, marginBottom: 18 }}>
                      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 32, fontWeight: 700, color: result.trend === "BULLISH" ? COLORS.green : COLORS.red, lineHeight: 1 }}>
                        {result.price.toFixed(2)}
                      </div>
                      <div style={{ paddingBottom: 4 }}>
                        <div style={{ fontSize: 11, color: COLORS.textMuted }}>SAR</div>
                        <Tag color={result.trend === "BULLISH" ? COLORS.green : COLORS.red}>
                          {result.trend === "BULLISH" ? "▲" : "▼"} {result.trend}
                        </Tag>
                      </div>
                    </div>

                    <div style={{ marginBottom: 18 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ fontSize: 11, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>Model Confidence</span>
                        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: COLORS.cyan }}>{(result.confidence * 100).toFixed(1)}%</span>
                      </div>
                      <ConfidenceBar value={result.confidence} />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      {[
                        { label: "Entry Signal", value: result.trend === "BULLISH" ? "BUY" : "SELL", color: result.trend === "BULLISH" ? COLORS.green : COLORS.red },
                        { label: "Expected Δ", value: `${((result.price / selected.price - 1) * 100).toFixed(2)}%`, color: result.trend === "BULLISH" ? COLORS.green : COLORS.red },
                      ].map(({ label, value, color }) => (
                        <div key={label} style={{
                          padding: "10px 12px", borderRadius: 7,
                          background: COLORS.bg0, border: `1px solid ${COLORS.border}`,
                        }}>
                          <div style={{ fontSize: 10, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>{label}</div>
                          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 14, fontWeight: 700, color }}>{value}</div>
                        </div>
                      ))}
                    </div>

                    <div style={{ marginTop: 14, padding: "10px 12px", borderRadius: 7, background: `${COLORS.amber}10`, border: `1px solid ${COLORS.amber}33` }}>
                      <div style={{ fontSize: 10, color: COLORS.amber }}>⚠ Not financial advice. AI predictions carry inherent uncertainty.</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Dashboard = ({ page }) => {
  const [tracked, setTracked] = useState(new Set(["ARAMCO", "STC"]));
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [notification, setNotification] = useState(null);

  const filtered = mockStocks.filter(s =>
    s.symbol.toLowerCase().includes(search.toLowerCase()) ||
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const gainers = [...mockStocks].sort((a, b) => b.pct - a.pct).slice(0, 3);
  const losers = [...mockStocks].sort((a, b) => a.pct - b.pct).slice(0, 3);
  const trackedList = mockStocks.filter(s => tracked.has(s.symbol));

  const toggleTrack = (symbol) => {
    setTracked(prev => {
      const n = new Set(prev);
      if (n.has(symbol)) { n.delete(symbol); setNotification(`Unpinned ${symbol}`); }
      else { n.add(symbol); setNotification(`Now tracking ${symbol}`); }
      setTimeout(() => setNotification(null), 2500);
      return n;
    });
  };

  // No modal redirect for predict page — handled inline below

  return (
    <div style={{ color: COLORS.textPrimary }}>
      {/* Toast */}
      {notification && (
        <div style={{
          position: "fixed", top: 24, right: 24,
          background: COLORS.bg3, border: `1px solid ${COLORS.cyan}44`,
          padding: "12px 20px", borderRadius: 8,
          color: COLORS.cyan, fontSize: 13, fontFamily: "'Space Mono', monospace",
          zIndex: 200, boxShadow: `0 8px 30px rgba(0,0,0,0.5)`,
          animation: "slideIn 0.3s ease",
        }}>
          ✓ {notification}
        </div>
      )}

      {page === "dashboard" && (
        <>
          {/* Header */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h1 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 700, color: COLORS.textPrimary }}>Market Overview</h1>
                <p style={{ margin: 0, fontSize: 13, color: COLORS.textSecondary }}>
                  Tadawul Exchange · <span style={{ fontFamily: "'Space Mono', monospace", color: COLORS.cyan }}>LIVE</span>
                  <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: COLORS.green, marginLeft: 6, marginBottom: -1 }} />
                </p>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                {[{ label: "TASI", value: "11,842", chg: "+0.8%" }, { label: "VOL", value: "142M", chg: "SAR" }].map(m => (
                  <div key={m.label} style={{
                    padding: "10px 16px", borderRadius: 8,
                    background: COLORS.surface, border: `1px solid ${COLORS.border}`,
                    textAlign: "right",
                  }}>
                    <div style={{ fontSize: 10, color: COLORS.textMuted, letterSpacing: "0.1em", textTransform: "uppercase" }}>{m.label}</div>
                    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 15, color: COLORS.textPrimary, marginTop: 2 }}>{m.value}</div>
                    <div style={{ fontSize: 10, color: COLORS.green }}>{m.chg}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Gainers / Losers */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 28 }}>
            {[{ title: "Top Gainers", data: gainers, color: COLORS.green }, { title: "Top Losers", data: losers, color: COLORS.red }].map(({ title, data, color }) => (
              <div key={title} style={{
                padding: 20, borderRadius: 12,
                background: COLORS.surface, border: `1px solid ${COLORS.border}`,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  <div style={{ width: 3, height: 14, borderRadius: 2, background: color }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, letterSpacing: "0.07em", textTransform: "uppercase" }}>{title}</span>
                </div>
                {data.map(s => (
                  <div key={s.symbol} onClick={() => setSelected(s)} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "9px 0", borderBottom: `1px solid ${COLORS.border}`,
                    cursor: "pointer",
                  }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.textPrimary }}>{s.symbol}</div>
                      <div style={{ fontSize: 11, color: COLORS.textMuted }}>{s.name.split(" ").slice(0, 2).join(" ")}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, color: COLORS.textPrimary }}>{s.price.toFixed(2)}</div>
                      <Tag color={color}>{s.pct > 0 ? "+" : ""}{s.pct.toFixed(1)}%</Tag>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Tracked Stocks */}
          {trackedList.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 12, color: COLORS.textSecondary, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                <span>★</span> Tracked Stocks
              </div>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                {trackedList.map(s => {
                  const pos = s.change >= 0;
                  return (
                    <div key={s.symbol} onClick={() => setSelected(s)} style={{
                      padding: "14px 18px", borderRadius: 10, cursor: "pointer",
                      background: COLORS.surface, border: `1px solid ${COLORS.border}`,
                      minWidth: 160, transition: "border-color 0.15s",
                    }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = COLORS.cyanDim}
                      onMouseLeave={e => e.currentTarget.style.borderColor = COLORS.border}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, color: COLORS.cyan }}>{s.symbol}</span>
                        <Tag color={pos ? COLORS.green : COLORS.red}>{pos ? "▲" : "▼"} {Math.abs(s.pct).toFixed(1)}%</Tag>
                      </div>
                      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 20, fontWeight: 700, color: COLORS.textPrimary }}>{s.price.toFixed(2)}</div>
                      <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 4 }}>{s.name}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* All Stocks Table */}
          <div style={{
            borderRadius: 12, overflow: "hidden",
            border: `1px solid ${COLORS.border}`,
            background: COLORS.surface,
          }}>
            <div style={{
              padding: "16px 16px 12px",
              borderBottom: `1px solid ${COLORS.border}`,
              display: "flex", justifyContent: "space-between", alignItems: "center",
              background: `linear-gradient(90deg, ${COLORS.bg3}, ${COLORS.surface})`,
            }}>
              <span style={{ fontSize: 12, color: COLORS.textSecondary, letterSpacing: "0.08em", textTransform: "uppercase" }}>All Stocks</span>
              <input
                placeholder="Search symbol or name..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  padding: "7px 12px", borderRadius: 6, width: 220,
                  background: COLORS.bg0, border: `1px solid ${COLORS.border}`,
                  color: COLORS.textPrimary, fontSize: 12, outline: "none",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              />
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                  {["Stock", "Price (SAR)", "Change", "24H", "7D Trend", "Track"].map(h => (
                    <th key={h} style={{
                      padding: "10px 16px", fontSize: 10, color: COLORS.textMuted,
                      textTransform: "uppercase", letterSpacing: "0.1em",
                      textAlign: h === "Stock" ? "left" : h === "Track" ? "center" : "right",
                      fontFamily: "'Space Mono', monospace", fontWeight: 500,
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => (
                  <StockRow key={s.symbol} stock={s}
                    onSelect={stock => { setSelected(stock); }}
                    tracked={tracked.has(s.symbol)} />
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Selected stock detail */}
      {selected && page === "dashboard" && (
        <PredictionModal stock={selected} onClose={() => setSelected(null)} />
      )}

      {page === "predict" && (
        <PredictPage />
      )}

      {page === "notifications" && (
        <div>
          <h2 style={{ margin: "0 0 24px", fontSize: 20, color: COLORS.textPrimary }}>Notifications & Alerts</h2>
          {[
            { stock: "ARAMCO", msg: "Price crossed above threshold of SAR 32.00", time: "2 min ago", read: false, type: "up" },
            { stock: "SNB", msg: "Price dropped below SAR 27.00 alert level", time: "1 hr ago", read: false, type: "down" },
            { stock: "STC", msg: "7-day high reached — SAR 49.20", time: "3 hrs ago", read: true, type: "up" },
            { stock: "ACWA", msg: "Threshold alert: fell below SAR 200.00", time: "Yesterday", read: true, type: "down" },
          ].map((n, i) => (
            <div key={i} style={{
              padding: 18, borderRadius: 10, marginBottom: 12,
              background: n.read ? COLORS.bg2 : `linear-gradient(90deg, ${n.type === "up" ? COLORS.green + "0A" : COLORS.red + "0A"}, ${COLORS.bg2})`,
              border: `1px solid ${n.read ? COLORS.border : n.type === "up" ? COLORS.green + "33" : COLORS.red + "33"}`,
              display: "flex", alignItems: "flex-start", gap: 14,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                background: n.type === "up" ? `${COLORS.green}20` : `${COLORS.red}20`,
                border: `1px solid ${n.type === "up" ? COLORS.green + "44" : COLORS.red + "44"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: n.type === "up" ? COLORS.green : COLORS.red, fontSize: 14,
              }}>{n.type === "up" ? "▲" : "▼"}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 13, color: COLORS.cyan }}>{n.stock}</span>
                  <span style={{ fontSize: 11, color: COLORS.textMuted }}>{n.time}</span>
                </div>
                <div style={{ fontSize: 13, color: n.read ? COLORS.textSecondary : COLORS.textPrimary }}>{n.msg}</div>
              </div>
              {!n.read && <div style={{ width: 7, height: 7, borderRadius: "50%", background: COLORS.cyan, flexShrink: 0, marginTop: 6 }} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default function App() {
  const [view, setView] = useState("login");
  const [page, setPage] = useState("dashboard");

  if (view === "login") {
    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Sans:wght@400;500;600;700&display=swap');
          * { box-sizing: border-box; }
          body { margin: 0; }
          input::placeholder { color: ${COLORS.textMuted}; }
        `}</style>
        <LoginPage onLogin={() => setView("app")} />
      </>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { margin: 0; background: ${COLORS.bg0}; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: ${COLORS.bg0}; }
        ::-webkit-scrollbar-thumb { background: ${COLORS.border}; border-radius: 2px; }
        input::placeholder { color: ${COLORS.textMuted}; }
        @keyframes slideIn { from { opacity: 0; transform: translateX(16px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
      <div style={{
        display: "flex", minHeight: "100vh",
        background: COLORS.bg0, fontFamily: "'DM Sans', sans-serif",
      }}>
        {/* Sidebar */}
        <div style={{
          width: 220, flexShrink: 0,
          background: `linear-gradient(180deg, ${COLORS.bg1}, ${COLORS.bg0})`,
          borderRight: `1px solid ${COLORS.border}`,
          padding: "20px 12px",
          display: "flex", flexDirection: "column",
          position: "sticky", top: 0, height: "100vh",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 8px 20px", borderBottom: `1px solid ${COLORS.border}`, marginBottom: 20 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 7,
              background: `linear-gradient(135deg, ${COLORS.cyan}, ${COLORS.cyanDim})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14, boxShadow: `0 0 16px ${COLORS.cyanGlow}`,
            }}>◈</div>
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, color: COLORS.cyan, letterSpacing: "0.1em" }}>STOCKSIGHT</span>
          </div>

          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ fontSize: 9, color: COLORS.textMuted, letterSpacing: "0.12em", textTransform: "uppercase", padding: "0 8px", marginBottom: 6 }}>Main</div>
            <NavItem label="Dashboard" active={page === "dashboard"} onClick={() => setPage("dashboard")} icon="▦" />
            <NavItem label="AI Predictions" active={page === "predict"} onClick={() => setPage("predict")} icon="◈" />
            <NavItem label="Notifications" active={page === "notifications"} onClick={() => setPage("notifications")} icon="◎" />

            <div style={{ fontSize: 9, color: COLORS.textMuted, letterSpacing: "0.12em", textTransform: "uppercase", padding: "16px 8px 6px" }}>Account</div>
            <NavItem label="Settings" active={false} onClick={() => {}} icon="⊙" />
          </div>

          <div style={{
            padding: 12, borderRadius: 8, marginTop: "auto",
            background: COLORS.bg3, border: `1px solid ${COLORS.border}`,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 30, height: 30, borderRadius: "50%",
                background: `linear-gradient(135deg, ${COLORS.cyan}44, ${COLORS.bg0})`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, border: `1px solid ${COLORS.cyanDim}44`, color: COLORS.cyan,
              }}>F</div>
              <div>
                <div style={{ fontSize: 12, color: COLORS.textPrimary, fontWeight: 600 }}>Fonda User</div>
                <div style={{ fontSize: 10, color: COLORS.textMuted }}>trader@fonda.sa</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div style={{ flex: 1, padding: 32, overflowY: "auto", minWidth: 0 }}>
          {/* Top bar */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            marginBottom: 28, paddingBottom: 20,
            borderBottom: `1px solid ${COLORS.border}`,
          }}>
            <div style={{ fontSize: 12, color: COLORS.textMuted, fontFamily: "'Space Mono', monospace" }}>
              {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button onClick={() => setPage("notifications")} style={{
                width: 34, height: 34, borderRadius: 7,
                background: COLORS.bg3, border: `1px solid ${COLORS.border}`,
                color: COLORS.textSecondary, cursor: "pointer", fontSize: 15,
                display: "flex", alignItems: "center", justifyContent: "center",
                position: "relative",
              }}>
                ◎
                <span style={{
                  position: "absolute", top: 4, right: 4, width: 7, height: 7,
                  borderRadius: "50%", background: COLORS.red,
                }} />
              </button>
              <button onClick={() => setView("login")} style={{
                padding: "7px 14px", borderRadius: 6,
                background: "transparent", border: `1px solid ${COLORS.border}`,
                color: COLORS.textMuted, cursor: "pointer", fontSize: 12,
              }}>Sign out</button>
            </div>
          </div>

          <Dashboard page={page} />
        </div>
      </div>
    </>
  );
}
