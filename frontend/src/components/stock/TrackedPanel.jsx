import { useEffect, useState } from "react";
import MiniChart from "../charts/MiniChart";
import { updateTracked } from "../../api/stocks";
import { COLORS } from "../../utils/constants";
import { formatPrice } from "../../utils/helpers";

export default function TrackedPanel({
  items = [],
  loading = false,
  onRemoveTracked = async () => {},
  onSelect = () => {},
  onThresholdsUpdated = async () => {}
}) {
  const [editingSymbol, setEditingSymbol] = useState(null);
  const [thresholdHigh, setThresholdHigh] = useState("");
  const [thresholdLow, setThresholdLow] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!editingSymbol) return;
    const item = items.find((entry) => entry.symbol === editingSymbol);
    if (!item) return;
    setThresholdHigh(
      typeof item.thresholdHigh === "number" ? String(item.thresholdHigh) : ""
    );
    setThresholdLow(
      typeof item.thresholdLow === "number" ? String(item.thresholdLow) : ""
    );
    setError("");
  }, [editingSymbol, items]);

  const handleRemove = async (event, symbol) => {
    event.stopPropagation();
    await onRemoveTracked(symbol);
    if (editingSymbol === symbol) {
      setEditingSymbol(null);
    }
  };

  const handleSaveThresholds = async (event, symbol) => {
    event.stopPropagation();
    setSaving(true);
    setError("");

    try {
      await updateTracked(symbol, {
        thresholdHigh: Number(thresholdHigh),
        thresholdLow: Number(thresholdLow)
      });
      setEditingSymbol(null);
      await onThresholdsUpdated();
    } catch (err) {
      setError(
        err.response?.data?.msg || "Failed to save alert thresholds"
      );
    } finally {
      setSaving(false);
    }
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
      <p style={{ margin: "0 0 12px", fontSize: 11, color: COLORS.textMuted }}>
        Daily price emails and threshold alerts are sent to your account email.
      </p>

      {error && (
        <div
          style={{
            marginBottom: 10,
            padding: "8px 10px",
            borderRadius: 8,
            background: `${COLORS.red}14`,
            border: `1px solid ${COLORS.red}33`,
            color: COLORS.red,
            fontSize: 11
          }}
        >
          {error}
        </div>
      )}

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
        const isEditing = editingSymbol === item.symbol;

        return (
          <div
            key={item.symbol}
            onClick={() => canOpen && !isEditing && onSelect(live)}
            style={{
              width: "100%",
              background: COLORS.bg0,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 10,
              padding: 12,
              marginBottom: 10,
              cursor: canOpen && !isEditing ? "pointer" : "default"
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
              <div style={{ fontSize: 12, color: COLORS.textSecondary }}>
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

            {!isEditing && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 8,
                  fontSize: 11,
                  color: COLORS.textMuted
                }}
              >
                <span>
                  Alert above:{" "}
                  {typeof item.thresholdHigh === "number"
                    ? formatPrice(item.thresholdHigh, live.currency)
                    : "—"}
                </span>
                <span>
                  Alert below:{" "}
                  {typeof item.thresholdLow === "number"
                    ? formatPrice(item.thresholdLow, live.currency)
                    : "—"}
                </span>
              </div>
            )}

            {isEditing ? (
              <div onClick={(event) => event.stopPropagation()}>
                <div style={{ display: "grid", gap: 8, marginBottom: 8 }}>
                  <label style={{ fontSize: 10, color: COLORS.textMuted }}>
                    Alert above ($)
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={thresholdHigh}
                      onChange={(e) => setThresholdHigh(e.target.value)}
                      style={{
                        display: "block",
                        width: "100%",
                        marginTop: 4,
                        padding: "8px 10px",
                        borderRadius: 6,
                        border: `1px solid ${COLORS.border}`,
                        background: COLORS.bg2,
                        color: COLORS.textPrimary
                      }}
                    />
                  </label>
                  <label style={{ fontSize: 10, color: COLORS.textMuted }}>
                    Alert below ($)
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={thresholdLow}
                      onChange={(e) => setThresholdLow(e.target.value)}
                      style={{
                        display: "block",
                        width: "100%",
                        marginTop: 4,
                        padding: "8px 10px",
                        borderRadius: 6,
                        border: `1px solid ${COLORS.border}`,
                        background: COLORS.bg2,
                        color: COLORS.textPrimary
                      }}
                    />
                  </label>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    disabled={saving}
                    onClick={(event) => handleSaveThresholds(event, item.symbol)}
                    style={{
                      flex: 1,
                      padding: "8px 0",
                      borderRadius: 6,
                      border: "none",
                      background: COLORS.cyan,
                      color: COLORS.bg0,
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: saving ? "not-allowed" : "pointer"
                    }}
                  >
                    {saving ? "Saving..." : "Save alerts"}
                  </button>
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      setEditingSymbol(null);
                    }}
                    style={{
                      padding: "8px 12px",
                      borderRadius: 6,
                      border: `1px solid ${COLORS.border}`,
                      background: "transparent",
                      color: COLORS.textMuted,
                      fontSize: 11,
                      cursor: "pointer"
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  setEditingSymbol(item.symbol);
                }}
                style={{
                  width: "100%",
                  marginBottom: 8,
                  padding: "7px 0",
                  borderRadius: 6,
                  border: `1px solid ${COLORS.border}`,
                  background: "transparent",
                  color: COLORS.cyan,
                  fontSize: 11,
                  cursor: "pointer"
                }}
              >
                Edit alert thresholds
              </button>
            )}

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
