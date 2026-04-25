import { useEffect, useState } from "react";
import { getTracked, getStock, runPrediction as requestPrediction } from "../api/stocks";
import { COLORS } from "../utils/constants";
import Tag from "../components/common/Tag";
import MiniChart from "../components/charts/MiniChart";

const mockStocks = [
  { symbol: "ARAMCO", name: "Saudi Aramco", price: 32.15, change: 1.82, pct: 6.0 },
  { symbol: "STC", name: "Saudi Telecom Co.", price: 48.70, change: 2.10, pct: 4.5 },
  { symbol: "SNB", name: "Saudi National Bank", price: 26.40, change: -0.90, pct: -3.3 },
  { symbol: "TADAWUL", name: "Saudi Exchange", price: 187.00, change: 4.50, pct: 2.5 },
  { symbol: "ACWA", name: "ACWA Power", price: 198.20, change: -6.80, pct: -3.3 },
  { symbol: "SABIC", name: "Saudi Basic Indust.", price: 74.10, change: 1.30, pct: 1.8 },
];

export default function PredictPage() {
  const [selected, setSelected] = useState(null);
  const [stocks, setStocks] = useState([]);
  const [timeframe, setTimeframe] = useState(7);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const trackedRes = await getTracked();
        const symbols = trackedRes.data.length ? trackedRes.data.map((item) => item.symbol) : mockStocks.map((item) => item.symbol);
        const details = await Promise.all(
          symbols.map(async (symbol) => {
            try {
              const stockRes = await getStock(symbol);
              return stockRes.data;
            } catch {
              return mockStocks.find((item) => item.symbol === symbol);
            }
          })
        );
        setStocks(details.filter(Boolean));
      } catch {
        setStocks(mockStocks);
      }
    })();
  }, []);

  const runPrediction = async () => {
    if (!selected) return;
    setError("");
    setRunning(true);
    setResult(null);
    try {
      const res = await requestPrediction({ symbol: selected.symbol, timeframe });
      const trend = res.data.predictedPrice >= res.data.currentPrice ? "BULLISH" : "BEARISH";
      setResult({
        price: res.data.predictedPrice,
        confidence: res.data.confidence,
        trend,
        currentPrice: res.data.currentPrice
      });
    } catch (err) {
      setError(err.response?.data?.msg || "Prediction service is unavailable");
    } finally {
      setRunning(false);
    }
  };

  const projectionData = result && selected?.history?.length
    ? [
      ...selected.history.slice(-45),
      { date: new Date(), price: result.price }
    ]
    : selected?.history || [];

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 700, color: COLORS.textPrimary }}>AI Predictions</h1>
        <p style={{ margin: 0, fontSize: 13, color: COLORS.textSecondary }}>Powered by FinGPT · Select a stock to generate a short-term forecast</p>
      </div>

      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 11, color: COLORS.textSecondary, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 14 }}>Select Stock</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {stocks.map(s => {
            const pos = s.change >= 0;
            const isActive = selected?.symbol === s.symbol;
            return (
              <div key={s.symbol} onClick={() => { setSelected(s); setResult(null); }} style={{ padding: "16px 18px", borderRadius: 10, cursor: "pointer", background: isActive ? `${COLORS.cyan}15` : COLORS.surface, border: `1px solid ${isActive ? COLORS.cyan : COLORS.border}`, boxShadow: isActive ? `0 0 20px ${COLORS.cyan}22` : "none" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 8, background: isActive ? `${COLORS.cyan}22` : COLORS.bg0, border: `1px solid ${isActive ? COLORS.cyan + "55" : COLORS.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: isActive ? COLORS.cyan : COLORS.textMuted, fontFamily: "'Space Mono', monospace" }}>{s.symbol.slice(0,3)}</div>
                  <Tag color={pos ? COLORS.green : COLORS.red}>{pos ? "▲" : "▼"} {Math.abs(s.pct || 0).toFixed(1)}%</Tag>
                </div>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 16, fontWeight: 700, color: COLORS.textPrimary, marginBottom: 2 }}>{s.symbol}</div>
                <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 6 }}>{s.name}</div>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 13, color: pos ? COLORS.green : COLORS.red }}>SAR {s.price.toFixed(2)}</div>
              </div>
            );
          })}
        </div>
      </div>

      {selected && (
        <div style={{ borderRadius: 14, overflow: "hidden", border: `1px solid ${COLORS.border}`, background: COLORS.bg2 }}>
          <div style={{ padding: "18px 24px", borderBottom: `1px solid ${COLORS.border}`, background: `linear-gradient(90deg, ${COLORS.bg3}, ${COLORS.bg2})`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontFamily: "'Space Mono', monospace", color: COLORS.cyan, fontSize: 15, fontWeight: 700 }}>{selected.symbol}</span>
              <span style={{ fontSize: 13, color: COLORS.textSecondary }}>{selected.name}</span>
              <Tag color={COLORS.cyan}>FinGPT FORECAST</Tag>
            </div>
            <button onClick={() => { setSelected(null); setResult(null); }} style={{ background: "none", border: `1px solid ${COLORS.border}`, color: COLORS.textMuted, cursor: "pointer", width: 30, height: 30, borderRadius: 6 }}>✕</button>
          </div>

          <div style={{ padding: 24 }}>
            <div style={{ padding: 20, borderRadius: 10, marginBottom: 24, background: COLORS.bg0, border: `1px solid ${COLORS.border}` }}>
              <div style={{ fontSize: 11, color: COLORS.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 14 }}>90-Day Historical · OHLC Source: Yahoo Finance</div>
              <MiniChart data={selected.history || []} positive={selected.change >= 0} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div>
                <div style={{ fontSize: 11, color: COLORS.textSecondary, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 12 }}>Prediction Timeframe</div>
                <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
                  {[7,14,30].map(d => (
                    <button key={d} onClick={() => { setTimeframe(d); setResult(null); }} style={{ flex: 1, padding: "10px 0", borderRadius: 7, background: timeframe === d ? `${COLORS.cyan}20` : COLORS.bg0, border: `1px solid ${timeframe === d ? COLORS.cyan : COLORS.border}`, color: timeframe === d ? COLORS.cyan : COLORS.textSecondary, fontSize: 13, fontFamily: "'Space Mono', monospace" }}>+{d}D</button>
                  ))}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
                  {[{ label: "Current Price", value: `SAR ${selected.price.toFixed(2)}` }, { label: "24H Change", value: `${selected.change >= 0 ? "+" : ""}${selected.change?.toFixed(2)}` }, { label: "Volume", value: selected.volume || "—" }, { label: "Mkt Cap", value: selected.mktCap || "—" }].map(({label, value}) => (
                    <div key={label} style={{ padding: "12px 14px", borderRadius: 8, background: COLORS.bg0, border: `1px solid ${COLORS.border}` }}>
                      <div style={{ fontSize: 10, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>{label}</div>
                      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 13, color: COLORS.textPrimary }}>{value}</div>
                    </div>
                  ))}
                </div>

                <button onClick={runPrediction} disabled={running} style={{ width: "100%", padding: "14px 0", borderRadius: 8, background: running ? COLORS.bg3 : `linear-gradient(90deg, ${COLORS.cyan}, ${COLORS.green}CC)`, border: running ? `1px solid ${COLORS.border}` : "none", color: running ? COLORS.textMuted : COLORS.bg0, fontSize: 14, fontWeight: 700, cursor: running ? "wait" : "pointer", boxShadow: running ? "none" : `0 0 28px ${COLORS.cyan}22` }}>{running ? "◈ Running FinGPT Model..." : "◈ Generate AI Prediction"}</button>
                {error && <div style={{ marginTop: 10, fontSize: 12, color: COLORS.red }}>{error}</div>}
              </div>

              <div>
                {!result && !running && (
                  <div style={{ height: "100%", minHeight: 200, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: `1px dashed ${COLORS.border}`, borderRadius: 10, color: COLORS.textMuted, fontSize: 13, gap: 10 }}>
                    <span style={{ fontSize: 28, opacity: 0.4 }}>◈</span>
                    <span>Select timeframe & run prediction</span>
                  </div>
                )}
                {running && (
                  <div style={{ height: "100%", minHeight: 200, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: `1px solid ${COLORS.cyan}33`, borderRadius: 10, background: `${COLORS.cyan}08`, gap: 14 }}>
                    <div style={{ width: 48, height: 48, borderRadius: "50%", border: `2px solid ${COLORS.border}`, borderTop: `2px solid ${COLORS.cyan}`, animation: "spin 0.9s linear infinite" }} />
                    <div style={{ color: COLORS.cyan, fontSize: 12, fontFamily: "'Space Mono', monospace" }}>Analyzing {timeframe}-day window...</div>
                    <div style={{ color: COLORS.textMuted, fontSize: 11 }}>FinGPT processing OHLC data</div>
                  </div>
                )}
                {result && (
                  <div style={{ padding: 22, borderRadius: 10, height: "100%", background: `linear-gradient(135deg, ${COLORS.bg0}, ${COLORS.bg3})`, border: `1px solid ${result.trend === "BULLISH" ? COLORS.green + "55" : COLORS.red + "55"}`, boxShadow: result.trend === "BULLISH" ? `0 0 30px ${COLORS.green}10` : `0 0 30px ${COLORS.red}10` }}>
                    <div style={{ fontSize: 10, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>FinGPT Forecast · {timeframe}-Day Outlook</div>
                    <div style={{ display: "flex", alignItems: "flex-end", gap: 12, marginBottom: 18 }}>
                      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 32, fontWeight: 700, color: result.trend === "BULLISH" ? COLORS.green : COLORS.red, lineHeight: 1 }}>{result.price.toFixed(2)}</div>
                      <div style={{ paddingBottom: 4 }}>
                        <div style={{ fontSize: 11, color: COLORS.textMuted }}>SAR</div>
                        <Tag color={result.trend === "BULLISH" ? COLORS.green : COLORS.red}>{result.trend === "BULLISH" ? "▲" : "▼"} {result.trend}</Tag>
                      </div>
                    </div>

                    <div style={{ marginBottom: 18 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ fontSize: 11, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>Model Confidence</span>
                        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: COLORS.cyan }}>{(result.confidence * 100).toFixed(1)}%</span>
                      </div>
                      <div style={{ marginBottom: 0 }}><MiniChart data={projectionData} positive={result.trend === "BULLISH"} /></div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      <div style={{ padding: "10px 12px", borderRadius: 7, background: COLORS.bg0, border: `1px solid ${COLORS.border}` }}>
                        <div style={{ fontSize: 10, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Entry Signal</div>
                        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 14, fontWeight: 700, color: result.trend === "BULLISH" ? COLORS.green : COLORS.red }}>{result.trend === "BULLISH" ? "BUY" : "SELL"}</div>
                      </div>
                      <div style={{ padding: "10px 12px", borderRadius: 7, background: COLORS.bg0, border: `1px solid ${COLORS.border}` }}>
                        <div style={{ fontSize: 10, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Expected Δ</div>
                        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 14, fontWeight: 700, color: result.trend === "BULLISH" ? COLORS.green : COLORS.red }}>{((result.price / selected.price - 1) * 100).toFixed(2)}%</div>
                      </div>
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
}
