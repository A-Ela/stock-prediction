import { useEffect, useState } from "react";
import { getNotifications } from "../api/stocks";
import { COLORS } from "../utils/constants";

export default function NotificationsPage() {
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    getNotifications().then(res => setNotes(res.data)).catch(() => {
      setNotes([
        //{ stock: "ARAMCO", msg: "Price crossed above threshold of SAR 32.00", time: "2 min ago", read: false, type: "up" },
        //{ stock: "SNB", msg: "Price dropped below SAR 27.00 alert level", time: "1 hr ago", read: false, type: "down" },
        //{ stock: "STC", msg: "7-day high reached — SAR 49.20", time: "3 hrs ago", read: true, type: "up" },
      ]);
    });
  }, []);

  return (
    <div>
      <h2 style={{ margin: "0 0 24px", fontSize: 20, color: COLORS.textPrimary }}>Notifications & Alerts</h2>

      {notes.map((n, i) => (
        <div key={i} style={{ padding: 18, borderRadius: 10, marginBottom: 12, background: n.read ? COLORS.bg2 : `linear-gradient(90deg, ${n.type === "up" ? COLORS.green + "0A" : COLORS.red + "0A"}, ${COLORS.bg2})`, border: `1px solid ${n.read ? COLORS.border : n.type === "up" ? COLORS.green + "33" : COLORS.red + "33"}`, display: "flex", alignItems: "flex-start", gap: 14 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, flexShrink: 0, background: n.type === "up" ? `${COLORS.green}20` : `${COLORS.red}20`, border: `1px solid ${n.type === "up" ? COLORS.green + "44" : COLORS.red + "44"}`, display: "flex", alignItems: "center", justifyContent: "center", color: n.type === "up" ? COLORS.green : COLORS.red, fontSize: 14 }}>{n.type === "up" ? "▲" : "▼"}</div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 13, color: COLORS.cyan }}>{n.stock}</span>
              <span style={{ fontSize: 11, color: COLORS.textMuted }}>{n.time}</span>
            </div>
            <div style={{ fontSize: 13, color: n.read ? COLORS.textSecondary : COLORS.textPrimary }}>{n.msg}</div>
          </div>
          {!n.read && <div style={{ width: 7, height: 7, borderRadius: "50%", background: COLORS.cyan, flexShrink: 0, marginTop: 6 }} />}
        </div>
      ))}
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