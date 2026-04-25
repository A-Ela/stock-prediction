import { useEffect, useState } from "react";
import { getTracked } from "../../api/stocks";

export default function TrackedPanel() {
  const [tracked, setTracked] = useState([]);

  useEffect(() => {
    getTracked().then(res => setTracked(res.data));
  }, []);

  return (
    <div style={{
      background: "#101828",
      borderRadius: 12,
      padding: 16
    }}>
      <h3>Tracked</h3>

      {tracked.map(t => (
        <div key={t.symbol} style={{
          padding: 10,
          borderBottom: "1px solid #1E3050"
        }}>
          {t.symbol}
          <MiniChart data={t.history || []} />
        </div>
      ))}
    </div>
  );
}