import { COLORS } from "../../utils/constants";

function MoverColumn({ title, items, positive }) {
  return (
    <div style={{ background: COLORS.bg2, borderRadius: 12, border: `1px solid ${COLORS.border}`, padding: 14 }}>
      <div style={{ fontSize: 12, marginBottom: 10, color: positive ? COLORS.green : COLORS.red, fontFamily: "'Space Mono', monospace" }}>{title}</div>
      {items.map((item) => (
        <div key={item.symbol} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderTop: `1px solid ${COLORS.border}` }}>
          <div>
            <div style={{ color: COLORS.textPrimary, fontSize: 13, fontWeight: 600 }}>{item.symbol}</div>
            <div style={{ color: COLORS.textMuted, fontSize: 11 }}>{item.name}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: COLORS.textPrimary, fontFamily: "'Space Mono', monospace", fontSize: 12 }}>{item.price?.toFixed(2)}</div>
            <div style={{ color: positive ? COLORS.green : COLORS.red, fontFamily: "'Space Mono', monospace", fontSize: 11 }}>
              {item.pct >= 0 ? "+" : ""}{item.pct?.toFixed(2)}%
            </div>
          </div>
        </div>
      ))}
      {items.length === 0 && <div style={{ color: COLORS.textMuted, fontSize: 12 }}>No data</div>}
    </div>
  );
}

export default function TopMovers({ gainers = [], losers = [] }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
      <MoverColumn title="Top 3 Gainers Today" items={gainers} positive />
      <MoverColumn title="Top 3 Losers Today" items={losers} positive={false} />
    </div>
  );
}
