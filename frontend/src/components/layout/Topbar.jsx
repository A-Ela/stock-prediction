import { useEffect, useRef, useState } from "react";
import { searchStocks } from "../../api/stocks";
import { COLORS } from "../../utils/constants";

export default function Topbar({
  onNotifications = () => {},
  onSignOut = () => {},
  onStockSelect = () => {}
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const boxRef = useRef(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    const id = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await searchStocks(query);
        setResults(res.data);
        setHasSearched(true);
      } catch {
        setResults([]);
        setHasSearched(true);
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
        setHasSearched(false);
      }
    };

    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const openDetails = (stock) => {
    setResults([]);
    setHasSearched(false);
    setQuery(stock.symbol);
    onStockSelect(stock);
  };

  return (
    <div
      style={{
        padding: 16,
        borderBottom: `1px solid ${COLORS.border}`,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 14
      }}
    >
      <div
        style={{
          fontSize: 12,
          color: COLORS.textMuted,
          fontFamily: "'Space Mono', monospace"
        }}
      >
        {new Date().toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric"
        })}
      </div>

      <div ref={boxRef} style={{ position: "relative", flex: 1, maxWidth: 420 }}>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
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

        {(loading || results.length > 0 || (query.trim() && hasSearched)) && (
          <div
            style={{
              position: "absolute",
              top: 42,
              left: 0,
              right: 0,
              background: COLORS.bg1,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 8,
              maxHeight: 240,
              overflowY: "auto",
              zIndex: 25
            }}
          >
            {loading && (
              <div style={{ padding: 10, color: COLORS.textMuted, fontSize: 12 }}>
                Searching...
              </div>
            )}

            {!loading &&
              results.map((item) => (
                <button
                  key={`${item.symbol}-${item.exchange}`}
                  onClick={() => openDetails(item)}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    background: "transparent",
                    border: "none",
                    borderBottom: `1px solid ${COLORS.border}`,
                    padding: 10,
                    color: COLORS.textPrimary,
                    cursor: "pointer"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span
                      style={{
                        fontFamily: "'Space Mono', monospace",
                        color: COLORS.cyan
                      }}
                    >
                      {item.symbol}
                    </span>
                    <span style={{ fontSize: 11, color: COLORS.textMuted }}>
                      {item.exchange}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: COLORS.textSecondary }}>
                    {item.name}
                  </div>
                </button>
              ))}

            {!loading && query.trim() && results.length === 0 && (
              <div style={{ padding: 10, color: COLORS.textMuted, fontSize: 12 }}>
                No matching stocks found.
              </div>
            )}
          </div>
        )}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginLeft: "auto"
        }}
      >
        <button
          onClick={onNotifications}
          style={{
            width: 34,
            height: 34,
            borderRadius: 7,
            background: COLORS.bg3,
            border: `1px solid ${COLORS.border}`,
            color: COLORS.textSecondary,
            cursor: "pointer",
            fontSize: 15,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative"
          }}
        >
          O
          <span
            style={{
              position: "absolute",
              top: 4,
              right: 4,
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: COLORS.red
            }}
          />
        </button>

        <button
          onClick={onSignOut}
          style={{
            padding: "7px 14px",
            borderRadius: 6,
            background: "transparent",
            border: `1px solid ${COLORS.border}`,
            color: COLORS.textMuted,
            cursor: "pointer",
            fontSize: 12
          }}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
