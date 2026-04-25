import { useEffect, useState } from "react";
import { getStock, getTracked, removeTracked } from "../../api/stocks";
import MiniChart from "../charts/MiniChart";
import { COLORS } from "../../utils/constants";

export default function TrackedPanel({ refreshTracked = () => {} }) {
  const [tracked, setTracked] = useState([]);

  const loadTracked = async () => {
    const res = await getTracked();
    const enriched = await Promise.all(
      res.data.map(async (item) => {
        try {
          const stockRes = await getStock(item.symbol);
          return { ...item, live: stockRes.data };
        } catch {
          return { ...item, live: null };
        }
      })
    );
    setTracked(enriched);
  };

  useEffect(() => {
    (async () => {
      await loadTracked();
    })();
  }, []);

  const handleRemove = async (symbol) => {
    await removeTracked(symbol);
    await loadTracked();
    refreshTracked();
  };

  return (
    <div style={{
      background: COLORS.bg2,
      borderRadius: 12,
      padding: 16,
      border: `1px solid ${COLORS.border}`
    }}>
      <h3 style={{ color: COLORS.textPrimary }}>Tracked</h3>

      {tracked.map(t => (
        <div key={t.symbol} style={{
          padding: 10,
          borderBottom: `1px solid ${COLORS.border}`
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <span style={{ fontFamily: "'Space Mono', monospace", color: COLORS.cyan }}>{t.symbol}</span>
            <button onClick={() => handleRemove(t.symbol)} style={{ background: "transparent", border: `1px solid ${COLORS.border}`, color: COLORS.textMuted, borderRadius: 6, cursor: "pointer" }}>Remove</button>
          </div>
          <div style={{ fontSize: 12, color: COLORS.textSecondary, marginBottom: 8 }}>
            {typeof t.live?.price === "number" ? `Current: ${t.live.price.toFixed(2)}` : "Live price unavailable"}
          </div>
          <MiniChart data={t.live?.history || []} />
        </div>
      ))}
      {tracked.length === 0 && (
        <div style={{ color: COLORS.textMuted, fontSize: 12 }}>No tracked stocks yet.</div>
      )}
    </div>
  );
}