import { useEffect, useState } from "react";
import { getNotifications, markNotificationRead } from "../api/stocks";
import { COLORS } from "../utils/constants";

export default function NotificationsPage() {
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    getNotifications().then(res => setNotes(res.data)).catch(() => setNotes([]));
  }, []);

  const handleMarkRead = async (id, isRead) => {
    if (isRead) return;
    try {
      await markNotificationRead(id);
      setNotes((prev) => prev.map((item) => (item._id === id ? { ...item, isRead: true } : item)));
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }
  };

  return (
    <div>
      <h2 style={{ margin: "0 0 24px", fontSize: 20, color: COLORS.textPrimary }}>Notifications & Alerts</h2>

      {notes.map((n, i) => {
        const type =
          n.type === "daily"
            ? "daily"
            : n.message?.toLowerCase().includes("fell") ||
                n.message?.toLowerCase().includes("below") ||
                n.message?.toLowerCase().includes("dropped")
              ? "down"
              : "up";
        return (
        <button
          key={i}
          onClick={() => handleMarkRead(n._id, n.isRead)}
          style={{ width: "100%", padding: 18, borderRadius: 10, marginBottom: 12, background: n.isRead ? COLORS.bg2 : `linear-gradient(90deg, ${type === "daily" ? COLORS.cyan + "0A" : type === "up" ? COLORS.green + "0A" : COLORS.red + "0A"}, ${COLORS.bg2})`, border: `1px solid ${n.isRead ? COLORS.border : type === "daily" ? COLORS.cyan + "33" : type === "up" ? COLORS.green + "33" : COLORS.red + "33"}`, display: "flex", alignItems: "flex-start", gap: 14, textAlign: "left", cursor: n.isRead ? "default" : "pointer" }}
        >
          <div style={{ width: 36, height: 36, borderRadius: 8, flexShrink: 0, background: type === "daily" ? `${COLORS.cyan}20` : type === "up" ? `${COLORS.green}20` : `${COLORS.red}20`, border: `1px solid ${type === "daily" ? COLORS.cyan + "44" : type === "up" ? COLORS.green + "44" : COLORS.red + "44"}`, display: "flex", alignItems: "center", justifyContent: "center", color: type === "daily" ? COLORS.cyan : type === "up" ? COLORS.green : COLORS.red, fontSize: 14 }}>{type === "daily" ? "◎" : type === "up" ? "▲" : "▼"}</div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 13, color: COLORS.cyan }}>{n.stockSymbol}</span>
              <span style={{ fontSize: 11, color: COLORS.textMuted }}>{new Date(n.createdAt).toLocaleString()}</span>
            </div>
            <div style={{ fontSize: 13, color: n.isRead ? COLORS.textSecondary : COLORS.textPrimary }}>{n.message}</div>
          </div>
          {!n.isRead && <div style={{ width: 7, height: 7, borderRadius: "50%", background: COLORS.cyan, flexShrink: 0, marginTop: 6 }} />}
        </button>
      );
      })}

      {notes.length === 0 && (
        <div style={{ color: COLORS.textMuted, fontSize: 12 }}>No notifications yet.</div>
      )}
    </div>
  );
}

///old logic

//import { useEffect, useState } from "react";
//import { getNotifications } from "../api/stocks";

// export default function NotificationsPage() {
//   const [notes, setNotes] = useState([]);

//   useEffect(() => {
//     getNotifications().then(res => setNotes(res.data));
//   }, []);

//   return (
//     <div>
//       {notes.map(n => (
//         <div key={n._id}>
//           <b>{n.stockSymbol}</b> — {n.message}
//         </div>
//       ))}
//     </div>
//   );
//}