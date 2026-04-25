// pages/LoginPage.jsx
import { useState } from "react";
import API from "../api/api";
import { COLORS } from "../utils/constants";

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const res = await API.post("/auth/login", { email, password });
      localStorage.setItem("token", res.data.token);
      onLogin();
    } catch (err) {
      console.error("Login failed", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", background: COLORS.bg0,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'DM Sans', sans-serif", position: "relative",
    }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Sans:wght@400;500;600;700&display=swap');`}</style>

      <div style={{ width: 420, padding: 48, background: `linear-gradient(160deg, ${COLORS.bg2}, ${COLORS.bg1})`, border: `1px solid ${COLORS.border}`, borderRadius: 16 }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: `linear-gradient(135deg, ${COLORS.cyan}, ${COLORS.cyanDim})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>◈</div>

            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 13, color: COLORS.cyan, letterSpacing: "0.12em", textTransform: "uppercase" }}>StockSight</span>
          </div>

          <h1 style={{ fontSize: 24, margin: "0 0 6px", color: COLORS.textPrimary }}>Welcome back</h1>
          
          <p style={{ margin: 0, color: COLORS.textSecondary }}>Sign in to your trading dashboard</p>
        </div>

        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: COLORS.textSecondary, marginBottom: 6 }}>Email address</div>
          <input type="email" placeholder="trader@example.com" value={email} onChange={e => setEmail(e.target.value)} style={{ width: "100%", padding: 11, borderRadius: 8, background: COLORS.bg0, border: `1px solid ${COLORS.border}`, color: COLORS.textPrimary, fontSize: 13 }} />
        </div>

        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 11, color: COLORS.textSecondary, marginBottom: 6 }}>Password</div>
          <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} style={{ width: "100%", padding: 11, borderRadius: 8, background: COLORS.bg0, border: `1px solid ${COLORS.border}`, color: COLORS.textPrimary, fontSize: 13 }} />
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}><span style={{ fontSize: 12, color: COLORS.cyan }}>Forgot password?</span></div>

        <button onClick={handleLogin} disabled={loading} style={{ width: "100%", padding: "13px 0", borderRadius: 8, background: loading ? COLORS.bg3 : `linear-gradient(90deg, ${COLORS.cyan}, ${COLORS.cyanDim})`, border: "none", color: loading ? COLORS.textMuted : COLORS.bg0, fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer" }}>{loading ? "Authenticating..." : "Sign In"}</button>
      </div>
    </div>
  );
}