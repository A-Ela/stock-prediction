import { useEffect, useState } from "react";
import { addTracked, getStock, searchStocks } from "../../api/stocks";
import { COLORS } from "../../utils/constants";
import MiniChart from "../charts/MiniChart";

export default function StockSearchPanel({ onTracked = () => {} }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const id = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await searchStocks(query);
        setResults(res.data);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(id);
  }, [query]);

  const openDetails = async (symbol) => {
    try {
      setDetailLoading(true);
      const res = await getStock(symbol);
      setSelected(res.data);
    } finally {
      setDetailLoading(false);
    }
  };

  const trackSelected = async () => {
    if (!selected) return;
    await addTracked({
      symbol: selected.symbol,
      thresholdHigh: selected.price * 1.05,
      thresholdLow: selected.price * 0.95
    });
    onTracked();
  };

  return (
    <div style={{ background: COLORS.bg2, borderRadius: 12, padding: 16, border: `1px solid ${COLORS.border}` }}>
      <h3 style={{ marginTop: 0, color: COLORS.textPrimary }}>Search Stocks</h3>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by symbol or name (e.g. AAPL, Tesla)"
        style={{
          width: "100%",
          padding: 12,
          borderRadius: 8,
          border: `1px solid ${COLORS.border}`,
          background: COLORS.bg0,
          color: COLORS.textPrimary,
          fontSize: 13
        }}
      />

      <div style={{ marginTop: 10, maxHeight: 220, overflowY: "auto" }}>
        {loading && <div style={{ fontSize: 12, color: COLORS.textMuted }}>Searching...</div>}
        {!loading && results.map((item) => (
          <button
            key={`${item.symbol}-${item.exchange}`}
            onClick={() => openDetails(item.symbol)}
            style={{
              width: "100%",
              textAlign: "left",
              background: COLORS.bg0,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 8,
              padding: "10px 12px",
              color: COLORS.textPrimary,
              marginBottom: 8,
              cursor: "pointer"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontFamily: "'Space Mono', monospace", color: COLORS.cyan }}>{item.symbol}</span>
              <span style={{ fontSize: 11, color: COLORS.textMuted }}>{item.exchange}</span>
            </div>
            <div style={{ fontSize: 12, color: COLORS.textSecondary }}>{item.name}</div>
          </button>
        ))}
        {!loading && query.trim() && results.length === 0 && (
          <div style={{ fontSize: 12, color: COLORS.textMuted }}>No matching symbols found.</div>
        )}
      </div>

      {(detailLoading || selected) && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "#00000088",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 50
        }}>
          <div style={{
            width: 560,
            maxWidth: "90vw",
            background: COLORS.bg1,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 12,
            padding: 18
          }}>
            {detailLoading && <div style={{ color: COLORS.textSecondary }}>Loading stock details...</div>}
            {!detailLoading && selected && (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div>
                    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 18, color: COLORS.cyan }}>{selected.symbol}</div>
                    <div style={{ fontSize: 13, color: COLORS.textSecondary }}>{selected.name}</div>
                  </div>
                  <button onClick={() => setSelected(null)} style={{ border: `1px solid ${COLORS.border}`, background: "transparent", color: COLORS.textMuted, borderRadius: 6, cursor: "pointer", padding: "6px 10px" }}>Close</button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 12 }}>
                  <Metric label="Price" value={selected.price?.toFixed(2)} />
                  <Metric label="Change" value={`${selected.change >= 0 ? "+" : ""}${selected.change?.toFixed(2)}`} color={selected.change >= 0 ? COLORS.green : COLORS.red} />
                  <Metric label="Change %" value={`${selected.pct >= 0 ? "+" : ""}${selected.pct?.toFixed(2)}%`} color={selected.pct >= 0 ? COLORS.green : COLORS.red} />
                </div>
                <MiniChart data={selected.history || []} />
                <button
                  onClick={trackSelected}
                  style={{ marginTop: 12, width: "100%", padding: "11px 0", borderRadius: 8, border: "none", background: `linear-gradient(90deg, ${COLORS.cyan}, ${COLORS.cyanDim})`, color: COLORS.bg0, fontWeight: 700, cursor: "pointer" }}
                >
                  Track this stock
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value, color }) {
  return (
    <div style={{ background: COLORS.bg0, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: 10 }}>
      <div style={{ fontSize: 10, color: COLORS.textMuted, textTransform: "uppercase", marginBottom: 4 }}>{label}</div>
      <div style={{ fontFamily: "'Space Mono', monospace", color: color || COLORS.textPrimary }}>{value || "—"}</div>
    </div>
  );
}
