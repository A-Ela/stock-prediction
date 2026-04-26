import Tag from "../common/Tag";
import Sparkline from "../charts/Sparkline";
import { COLORS } from "../../utils/constants";
import {
  formatChange,
  formatPercent,
  formatPrice
} from "../../utils/helpers";

const FILLED_STAR = "\u2605";
const EMPTY_STAR = "\u2606";

export default function StockRow({
  onSelect = () => {},
  onToggleTrack = async () => {},
  stock,
  tracked = false
}) {
  const positive = (stock.change || 0) >= 0;

  const toggleTrack = async (event) => {
    event.stopPropagation();
    await onToggleTrack(stock);
  };

  return (
    <tr
      onClick={() => onSelect(stock)}
      style={{ cursor: "pointer", transition: "background 0.12s", height: 74 }}
      onMouseEnter={(event) => {
        event.currentTarget.style.background = COLORS.surfaceHover;
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.background = "transparent";
      }}
    >
      <td style={{ padding: "12px 16px", verticalAlign: "middle" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
          <div
            style={{
              flexShrink: 0,
              width: 36,
              height: 36,
              borderRadius: 8,
              background: `linear-gradient(135deg, ${COLORS.bg0}, ${COLORS.bg3})`,
              border: `1px solid ${COLORS.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 10,
              fontWeight: 700,
              color: COLORS.cyan,
              fontFamily: "'Space Mono', monospace"
            }}
          >
            {(stock.symbol || "").slice(0, 3)}
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                color: COLORS.textPrimary,
                fontSize: 13,
                fontWeight: 600,
                whiteSpace: "nowrap"
              }}
            >
              {stock.symbol}
            </div>
            <div
              style={{
                color: COLORS.textMuted,
                fontSize: 11,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap"
              }}
            >
              {stock.name}
            </div>
          </div>
        </div>
      </td>

      <td style={{ padding: "12px 16px", textAlign: "right", verticalAlign: "middle" }}>
        <span
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: 13,
            color: COLORS.textPrimary
          }}
        >
          {formatPrice(stock.price, stock.currency)}
        </span>
      </td>

      <td style={{ padding: "12px 16px", textAlign: "right", verticalAlign: "middle" }}>
        <span
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: 12,
            color: positive ? COLORS.green : COLORS.red
          }}
        >
          {formatChange(stock.change)}
        </span>
      </td>

      <td style={{ padding: "12px 16px", textAlign: "right", verticalAlign: "middle" }}>
        <Tag color={positive ? COLORS.green : COLORS.red}>
          {formatPercent(stock.pct, 1)}
        </Tag>
      </td>

      <td style={{ padding: "12px 16px", textAlign: "center", verticalAlign: "middle" }}>
        <Sparkline data={stock.history || []} />
      </td>

      <td style={{ padding: "12px 16px", textAlign: "center", verticalAlign: "middle" }}>
        <button
          onClick={toggleTrack}
          style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            background: tracked ? `${COLORS.cyan}20` : "transparent",
            border: `1px solid ${tracked ? COLORS.cyan : COLORS.border}`,
            color: tracked ? COLORS.cyan : COLORS.textMuted,
            cursor: "pointer"
          }}
        >
          {tracked ? FILLED_STAR : EMPTY_STAR}
        </button>
      </td>
    </tr>
  );
}
