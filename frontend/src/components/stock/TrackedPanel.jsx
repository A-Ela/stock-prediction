import MiniChart from "../charts/MiniChart";
import { COLORS } from "../../utils/constants";
import { formatPrice } from "../../utils/helpers";

export default function TrackedPanel({
  items = [],
  loading = false,
  onRemoveTracked = async () => {},
  onSelect = () => {}
}) {
  const handleRemove = async (event, symbol) => {
    event.stopPropagation();
    await onRemoveTracked(symbol);
  };

  return (
    <div
      style={{
        background: COLORS.bg2,
        borderRadius: 12,
        padding: 16,
        border: `1px solid ${COLORS.border}`,
        maxHeight: "calc(100vh - 140px)",
        overflowY: "auto"
      }}
    >
      <h3 style={{ color: COLORS.textPrimary, marginTop: 0 }}>Tracked</h3>

      {loading && items.length === 0 && (
        <div style={{ color: COLORS.textMuted, fontSize: 12 }}>
          Loading tracked stocks...
        </div>
      )}

      {items.map((item) => {
        const live = item.live || {
          symbol: item.symbol,
          name: item.symbol,
          price: item.lastKnownPrice,
          currency: "USD",
          pct: null,
          history: []
        };
        const canOpen = Boolean(item.symbol);

        return (
          <div
            key={item.symbol}
            onClick={() => canOpen && onSelect(live)}
            style={{
              width: "100%",
              background: COLORS.bg0,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 10,
              padding: 12,
              marginBottom: 10,
              cursor: canOpen ? "pointer" : "default"
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 8,
                marginBottom: 8
              }}
            >
              <div style={{ minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    fontFamily: "'Space Mono', monospace",
                    color: COLORS.cyan,
                    fontSize: 13,
                    marginBottom: 4
                  }}
                >
                  {item.symbol}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: COLORS.textMuted,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap"
                  }}
                >
                  {live?.name || item.symbol}
                </div>
              </div>
              <button
                onClick={(event) => handleRemove(event, item.symbol)}
                style={{
                  flexShrink: 0,
                  background: "transparent",
                  border: `1px solid ${COLORS.border}`,
                  color: COLORS.textMuted,
                  borderRadius: 6,
                  cursor: "pointer",
                  padding: "6px 8px",
                  fontSize: 11
                }}
              >
                Remove
              </button>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 8,
                marginBottom: 8
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  color: COLORS.textSecondary
                }}
              >
                {typeof live?.price === "number"
                  ? `Current: ${formatPrice(live.price, live.currency)}`
                  : item.liveStatus === "stale"
                    ? "Using cached quote"
                    : "Refreshing live quote..."}
              </div>
              {live?.pct !== undefined && live?.pct !== null && (
                <div
                  style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 11,
                    color: live.pct >= 0 ? COLORS.green : COLORS.red
                  }}
                >
                  {live.pct >= 0 ? "+" : ""}
                  {live.pct.toFixed(2)}%
                </div>
              )}
            </div>
            <div style={{ overflow: "hidden" }}>
              <MiniChart data={live?.history || []} />
            </div>
          </div>
        );
      })}

      {!loading && items.length === 0 && (
        <div style={{ color: COLORS.textMuted, fontSize: 12 }}>
          No tracked stocks yet.
        </div>
      )}
    </div>
  );
}
