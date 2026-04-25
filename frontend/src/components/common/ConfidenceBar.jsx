// components/common/ConfidenceBar.jsx
import { COLORS } from "../../utils/constants";

export default function ConfidenceBar({ value }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ flex: 1, height: 6, background: COLORS.bg0, borderRadius: 3, overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${value * 100}%`,
          background: `linear-gradient(90deg, ${COLORS.cyan}, ${COLORS.green})`,
          borderRadius: 3, transition: "width 0.6s ease",
          boxShadow: `0 0 8px ${COLORS.cyan}22`
        }} />
      </div>
      <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, color: COLORS.cyan, minWidth: 44 }}>{(value * 100).toFixed(1)}%</span>
    </div>
  );
}