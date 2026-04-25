// components/layout/Sidebar.jsx
import { COLORS } from "../../utils/constants";

const NavItem = ({ label, active, onClick, icon }) => (
  <button onClick={onClick} style={{
    display: "flex", alignItems: "center", gap: 10,
    padding: "10px 16px", borderRadius: 6, width: "100%", textAlign: "left",
    background: active ? `linear-gradient(90deg, ${COLORS.cyan}22, transparent)` : "transparent",
    border: active ? `1px solid ${COLORS.cyan}33` : "1px solid transparent",
    color: active ? COLORS.cyan : COLORS.textSecondary,
    cursor: "pointer", fontSize: 13, fontFamily: "'DM Sans', sans-serif",
  }}>
    <span style={{ fontSize: 14 }}>{icon}</span>
    <span>{label}</span>
    {active && <span style={{ marginLeft: "auto", width: 4, height: 4, borderRadius: "50%", background: COLORS.cyan }} />}
  </button>
);

export default function Sidebar({ page = "dashboard", setPage = () => {} }) {
  return (
    <div style={{
      width: 220,
      background: `linear-gradient(180deg, ${COLORS.bg1}, ${COLORS.bg0})`,
      padding: 20,
      height: "100vh",
      borderRight: `1px solid ${COLORS.border}`,
      display: "flex",
      flexDirection: "column",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 8px 20px", borderBottom: `1px solid ${COLORS.border}`, marginBottom: 20 }}>
        <div style={{ width: 30, height: 30, borderRadius: 7, background: `linear-gradient(135deg, ${COLORS.cyan}, ${COLORS.cyanDim})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, boxShadow: `0 0 16px ${COLORS.cyan}33` }}>◈</div>
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, color: COLORS.cyan, letterSpacing: "0.1em" }}>STOCKSIGHT</span>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>

        <div style={{ fontSize: 9, color: COLORS.textMuted, letterSpacing: "0.12em", textTransform: "uppercase", padding: "0 8px", marginBottom: 6 }}>Main</div>

        <NavItem label="Dashboard" active={page === "dashboard"} onClick={() => setPage("dashboard")} icon="▦" />

        <NavItem label="AI Predictions" active={page === "predict"} onClick={() => setPage("predict")} icon="◈" />

        <NavItem label="Notifications" active={page === "notifications"} onClick={() => setPage("notifications")} icon="◎" />

        <div style={{ fontSize: 9, color: COLORS.textMuted, letterSpacing: "0.12em", textTransform: "uppercase", padding: "16px 8px 6px" }}>Account</div>

        <NavItem label="Settings" active={false} onClick={() => {}} icon="⊙" />
      </div>

      <div style={{ padding: 12, borderRadius: 8, marginTop: "auto", background: COLORS.bg3, border: `1px solid ${COLORS.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>

          <div style={{ width: 30, height: 30, borderRadius: "50%", background: `linear-gradient(135deg, ${COLORS.cyan}44, ${COLORS.bg0})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, border: `1px solid ${COLORS.cyan}44`, color: COLORS.cyan }}>F</div>

          <div>
            <div style={{ fontSize: 12, color: COLORS.textPrimary, fontWeight: 600 }}>Fonda User</div>

            <div style={{ fontSize: 10, color: COLORS.textMuted }}>trader@fonda.sa</div>
          </div>

        </div>
      </div>
    </div>
  );
}