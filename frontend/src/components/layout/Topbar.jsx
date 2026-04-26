import { useEffect, useRef, useState } from "react";
import { getStock, searchStocks } from "../../api/stocks";
import { COLORS } from "../../utils/constants";
import MiniChart from "../charts/MiniChart";

export default function Topbar({ onNotifications = () => {}, onSignOut = () => {} }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const boxRef = useRef(null);

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
    }, 220);

    return () => clearTimeout(id);
  }, [query]);

  useEffect(() => {
    const onDocClick = (event) => {
      if (boxRef.current && !boxRef.current.contains(event.target)) {
        setResults([]);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const openDetails = async (symbol) => {
    setResults([]);
    setQuery(symbol);
    try {
      setDetailLoading(true);
      const res = await getStock(symbol);
      setSelected(res.data);
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div style={{
      padding: 16,
      borderBottom: `1px solid ${COLORS.border}`,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 14
    }}>
      <div style={{ fontSize: 12, color: COLORS.textMuted, fontFamily: "'Space Mono', monospace" }}>{new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</div>

      <div ref={boxRef} style={{ position: "relative", flex: 1, maxWidth: 420 }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search stock by name or symbol..."
          style={{
            width: "100%",
            background: COLORS.bg2,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 8,
            padding: "10px 12px",
            color: COLORS.textPrimary,
            fontSize: 12
          }}
        />
        {(loading || results.length > 0) && (
          <div style={{ position: "absolute", top: 42, left: 0, right: 0, background: COLORS.bg1, border: `1px solid ${COLORS.border}`, borderRadius: 8, maxHeight: 240, overflowY: "auto", zIndex: 25 }}>
            {loading && <div style={{ padding: 10, color: COLORS.textMuted, fontSize: 12 }}>Searching...</div>}
            {!loading && results.map((item) => (
              <button key={`${item.symbol}-${item.exchange}`} onClick={() => openDetails(item.symbol)} style={{ width: "100%", textAlign: "left", background: "transparent", border: "none", borderBottom: `1px solid ${COLORS.border}`, padding: 10, color: COLORS.textPrimary, cursor: "pointer" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontFamily: "'Space Mono', monospace", color: COLORS.cyan }}>{item.symbol}</span>
                  <span style={{ fontSize: 11, color: COLORS.textMuted }}>{item.exchange}</span>
                </div>
                <div style={{ fontSize: 11, color: COLORS.textSecondary }}>{item.name}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginLeft: "auto" }}>
        <button onClick={onNotifications} style={{ width: 34, height: 34, borderRadius: 7, background: COLORS.bg3, border: `1px solid ${COLORS.border}`, color: COLORS.textSecondary, cursor: "pointer", fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
          ◎
          <span style={{ position: "absolute", top: 4, right: 4, width: 7, height: 7, borderRadius: "50%", background: COLORS.red }} />
        </button>

        <button onClick={onSignOut} style={{ padding: "7px 14px", borderRadius: 6, background: "transparent", border: `1px solid ${COLORS.border}`, color: COLORS.textMuted, cursor: "pointer", fontSize: 12 }}>Sign out</button>
      </div>

      {(detailLoading || selected) && (
        <div style={{ position: "fixed", inset: 0, background: "#00000088", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          <div style={{ width: 560, maxWidth: "90vw", background: COLORS.bg1, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 18 }}>
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