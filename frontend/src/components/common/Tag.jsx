// components/common/Tag.jsx
import { COLORS } from "../../utils/constants";

export default function Tag({ children, color }) {
  return (
    <span style={{
      display: "inline-block",
      padding: "2px 8px",
      borderRadius: 3,
      border: `1px solid ${color}33`,
      background: `${color}15`,
      color,
      fontSize: 10,
      fontFamily: "'Space Mono', monospace",
      letterSpacing: "0.06em",
      textTransform: "uppercase",
    }}>{children}</span>
  );
}