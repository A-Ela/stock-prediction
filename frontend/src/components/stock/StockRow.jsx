import Tag from "../common/Tag";
import { addTracked, removeTracked } from "../../api/stocks";
import Sparkline from "../charts/Sparkline";
import { COLORS } from "../../utils/constants";

export default function StockRow({ stock, onSelect = () => {}, tracked = false, refreshTracked = () => {} }) {
  const positive = stock.change >= 0;

  const toggleTrack = async (e) => {
    e.stopPropagation();
    try {
      if (tracked) await removeTracked(stock.symbol);
      else await addTracked({ symbol: stock.symbol, thresholdHigh: stock.price * 1.05, thresholdLow: stock.price * 0.95 });
    } catch (err) {
      console.error(err);
    }
    refreshTracked();
  };

  return (
    <tr onClick={() => onSelect(stock)} style={{ cursor: "pointer", transition: "background 0.12s" }}
      onMouseEnter={e => e.currentTarget.style.background = COLORS.surfaceHover}
      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
    >
      <td style={{ padding: "12px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: `linear-gradient(135deg, ${COLORS.bg0}, ${COLORS.bg3})`, border: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: COLORS.cyan, fontFamily: "'Space Mono', monospace" }}>{(stock.symbol || "").slice(0,3)}</div>
          <div>
            <div style={{ color: COLORS.textPrimary, fontSize: 13, fontWeight: 600 }}>{stock.symbol}</div>
            <div style={{ color: COLORS.textMuted, fontSize: 11 }}>{stock.name}</div>
          </div>
        </div>
      </td>

      <td style={{ padding: "12px 16px", textAlign: "right" }}>
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 13, color: COLORS.textPrimary }}>{stock.price?.toFixed(2)}</span>
      </td>

      <td style={{ padding: "12px 16px", textAlign: "right" }}>
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, color: positive ? COLORS.green : COLORS.red }}>{positive ? "+" : ""}{(stock.change || 0).toFixed(2)}</span>
      </td>

      <td style={{ padding: "12px 16px", textAlign: "right" }}>
        <Tag color={positive ? COLORS.green : COLORS.red}>{positive ? "▲" : "▼"} {Math.abs(stock.pct || 0).toFixed(1)}%</Tag>
      </td>

      <td style={{ padding: "12px 16px", textAlign: "right" }}>
        <Sparkline data={stock.history || []} positive={positive} />
      </td>

      <td style={{ padding: "12px 16px", textAlign: "center" }}>
        <button onClick={toggleTrack} style={{ width: 28, height: 28, borderRadius: 6, background: tracked ? `${COLORS.cyan}20` : "transparent", border: `1px solid ${tracked ? COLORS.cyan : COLORS.border}`, color: tracked ? COLORS.cyan : COLORS.textMuted, cursor: "pointer" }}>{tracked ? "★" : "☆"}</button>
      </td>
    </tr>
  );
}