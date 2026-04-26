import { COLORS } from "../../utils/constants";

const OPTIONS = [7, 14, 30];

export default function TimeframeSelector({ timeframe, setTimeframe }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
      {OPTIONS.map((value) => (
        <button
          key={value}
          onClick={() => setTimeframe(value)}
          style={{
            padding: "10px 0",
            borderRadius: 8,
            border: `1px solid ${timeframe === value ? COLORS.cyan : COLORS.border}`,
            background: timeframe === value ? `${COLORS.cyan}18` : COLORS.bg0,
            color: timeframe === value ? COLORS.cyan : COLORS.textSecondary,
            fontFamily: "'Space Mono', monospace",
            fontSize: 12,
            cursor: "pointer"
          }}
        >
          {value}D
        </button>
      ))}
    </div>
  );
}
