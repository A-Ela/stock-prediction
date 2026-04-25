// components/layout/Topbar.jsx
import { COLORS } from "../../utils/constants";

export default function Topbar({ onNotifications = () => {}, onSignOut = () => {} }) {
  return (
    <div style={{
      padding: 16,
      borderBottom: `1px solid ${COLORS.border}`,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    }}>
      <div style={{ fontSize: 12, color: COLORS.textMuted, fontFamily: "'Space Mono', monospace" }}>{new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</div>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={onNotifications} style={{ width: 34, height: 34, borderRadius: 7, background: COLORS.bg3, border: `1px solid ${COLORS.border}`, color: COLORS.textSecondary, cursor: "pointer", fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
          ◎
          <span style={{ position: "absolute", top: 4, right: 4, width: 7, height: 7, borderRadius: "50%", background: COLORS.red }} />
        </button>

        <button onClick={onSignOut} style={{ padding: "7px 14px", borderRadius: 6, background: "transparent", border: `1px solid ${COLORS.border}`, color: COLORS.textMuted, cursor: "pointer", fontSize: 12 }}>Sign out</button>
      </div>
    </div>
  );
}