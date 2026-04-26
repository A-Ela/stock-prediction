import { useEffect, useState } from "react";
import MiniChart from "../charts/MiniChart";
import Tag from "../common/Tag";
import TimeframeSelector from "../prediction/TimeFrameSelector";
import { runPrediction } from "../../api/stocks";
import { COLORS } from "../../utils/constants";
import {
  formatChange,
  formatCompactNumber,
  formatPercent,
  formatPrice
} from "../../utils/helpers";

export default function StockDetailModal({
  loading = false,
  onClose = () => {},
  onToggleTrack = async () => {},
  open = false,
  stock = null,
  tracked = false
}) {
  const [predictionLoading, setPredictionLoading] = useState(false);
  const [predictionResult, setPredictionResult] = useState(null);
  const [predictionError, setPredictionError] = useState("");
  const [timeframe, setTimeframe] = useState(null);
  const [tracking, setTracking] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    setPredictionLoading(false);
    setPredictionResult(null);
    setPredictionError("");
    setTimeframe(null);
  }, [open, stock?.symbol]);

  if (!open && !loading) {
    return null;
  }

  const positive = (stock?.change || 0) >= 0;

  const handlePredict = async () => {
    if (!stock?.symbol || timeframe === null) {
      return;
    }

    setPredictionError("");
    setPredictionResult(null);
    setPredictionLoading(true);

    try {
      const res = await runPrediction({
        symbol: stock.symbol,
        timeframe
      });

      setPredictionResult(res.data);
    } catch (err) {
      setPredictionError(
        err.response?.data?.msg || "Prediction service is unavailable"
      );
    } finally {
      setPredictionLoading(false);
    }
  };

  const handleToggleTrack = async () => {
    if (!stock || tracking) {
      return;
    }

    setTracking(true);
    try {
      await onToggleTrack(stock);
    } finally {
      setTracking(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "#00000088",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        zIndex: 60
      }}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        style={{
          width: 760,
          maxWidth: "96vw",
          maxHeight: "92vh",
          overflowY: "auto",
          background: COLORS.bg1,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 16,
          padding: 22
        }}
      >
        {loading && (
          <div style={{ color: COLORS.textSecondary }}>
            Loading live stock details...
          </div>
        )}

        {!loading && stock && (
          <>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 16,
                marginBottom: 18
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 22,
                    color: COLORS.cyan,
                    marginBottom: 6
                  }}
                >
                  {stock.symbol}
                </div>
                <div
                  style={{
                    fontSize: 14,
                    color: COLORS.textPrimary,
                    fontWeight: 600,
                    marginBottom: 4
                  }}
                >
                  {stock.name}
                </div>
                <div style={{ fontSize: 12, color: COLORS.textSecondary }}>
                  {stock.exchange} · {stock.type} · {stock.marketState}
                </div>
              </div>

              <button
                onClick={onClose}
                style={{
                  border: `1px solid ${COLORS.border}`,
                  background: "transparent",
                  color: COLORS.textMuted,
                  borderRadius: 8,
                  cursor: "pointer",
                  padding: "8px 12px"
                }}
              >
                Close
              </button>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: 16,
                marginBottom: 18
              }}
            >
              <div
                style={{
                  padding: 18,
                  borderRadius: 12,
                  background: COLORS.bg2,
                  border: `1px solid ${COLORS.border}`
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-end",
                    gap: 12,
                    marginBottom: 12
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontFamily: "'Space Mono', monospace",
                        fontSize: 28,
                        fontWeight: 700,
                        color: COLORS.textPrimary,
                        marginBottom: 6
                      }}
                    >
                      {formatPrice(stock.price, stock.currency)}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10
                      }}
                    >
                      <Tag color={positive ? COLORS.green : COLORS.red}>
                        {formatPercent(stock.pct)}
                      </Tag>
                      <span
                        style={{
                          color: positive ? COLORS.green : COLORS.red,
                          fontFamily: "'Space Mono', monospace",
                          fontSize: 12
                        }}
                      >
                        {formatChange(stock.change)}
                      </span>
                    </div>
                  </div>

                  <div
                    style={{
                      color: COLORS.textMuted,
                      fontSize: 11,
                      textAlign: "right"
                    }}
                  >
                    {stock.updatedAt
                      ? `Updated ${new Date(stock.updatedAt).toLocaleString()}`
                      : "Live update pending"}
                  </div>
                </div>

                <MiniChart data={stock.history || []} />
              </div>

              <div
                style={{
                  padding: 18,
                  borderRadius: 12,
                  background: COLORS.bg2,
                  border: `1px solid ${COLORS.border}`
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    color: COLORS.textSecondary,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    marginBottom: 12
                  }}
                >
                  Prediction Time Span
                </div>
                <TimeframeSelector
                  timeframe={timeframe}
                  setTimeframe={setTimeframe}
                />

                <div
                  style={{
                    display: "grid",
                    gap: 10,
                    marginTop: 16
                  }}
                >
                  <button
                    onClick={handleToggleTrack}
                    disabled={tracking}
                    style={buttonStyle(
                      tracked ? `${COLORS.cyan}22` : `${COLORS.green}18`,
                      tracked ? COLORS.cyan : COLORS.green
                    )}
                  >
                    {tracking
                      ? "Saving..."
                      : tracked
                        ? "Untrack Stock"
                        : "Track Stock"}
                  </button>

                  <button
                    onClick={handlePredict}
                    disabled={predictionLoading || timeframe === null}
                    style={buttonStyle(
                      predictionLoading || timeframe === null
                        ? COLORS.bg3
                        : `${COLORS.cyan}22`,
                      predictionLoading || timeframe === null
                        ? COLORS.textMuted
                        : COLORS.cyan,
                      predictionLoading || timeframe === null
                    )}
                  >
                    {predictionLoading ? "Running Prediction..." : "Predict Price"}
                  </button>
                </div>

                {timeframe === null && (
                  <div style={{ marginTop: 10, fontSize: 11, color: COLORS.textMuted }}>
                    Choose a time span before running a prediction.
                  </div>
                )}
                {predictionError && (
                  <div style={{ marginTop: 10, fontSize: 12, color: COLORS.red }}>
                    {predictionError}
                  </div>
                )}
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                gap: 12,
                marginBottom: 18
              }}
            >
              <Metric label="Open" value={formatPrice(stock.open, stock.currency)} />
              <Metric
                label="Previous Close"
                value={formatPrice(stock.previousClose, stock.currency)}
              />
              <Metric label="Day High" value={formatPrice(stock.dayHigh, stock.currency)} />
              <Metric label="Day Low" value={formatPrice(stock.dayLow, stock.currency)} />
              <Metric label="Volume" value={formatCompactNumber(stock.volume)} />
              <Metric
                label="Avg Volume"
                value={formatCompactNumber(stock.averageVolume)}
              />
              <Metric label="Market Cap" value={formatCompactNumber(stock.marketCap)} />
              <Metric
                label="52W Range"
                value={formatRange(
                  stock.fiftyTwoWeekLow,
                  stock.fiftyTwoWeekHigh,
                  stock.currency
                )}
              />
            </div>

            {predictionResult && (
              <div
                style={{
                  padding: 18,
                  borderRadius: 12,
                  background: COLORS.bg2,
                  border: `1px solid ${COLORS.border}`
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                    marginBottom: 10
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      color: COLORS.textSecondary,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em"
                    }}
                  >
                    Prediction Result
                  </div>
                  <Tag
                    color={
                      predictionResult.predictedPrice >= predictionResult.currentPrice
                        ? COLORS.green
                        : COLORS.red
                    }
                  >
                    {predictionResult.timeframe}D Outlook
                  </Tag>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                    gap: 12
                  }}
                >
                  <Metric
                    label="Predicted Price"
                    value={formatPrice(
                      predictionResult.predictedPrice,
                      stock.currency
                    )}
                  />
                  <Metric
                    label="Current Price"
                    value={formatPrice(
                      predictionResult.currentPrice,
                      stock.currency
                    )}
                  />
                  <Metric
                    label="Confidence"
                    value={`${((predictionResult.confidence || 0) * 100).toFixed(1)}%`}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div
      style={{
        background: COLORS.bg2,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 10,
        padding: 14
      }}
    >
      <div
        style={{
          fontSize: 10,
          color: COLORS.textMuted,
          textTransform: "uppercase",
          marginBottom: 6,
          letterSpacing: "0.08em"
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "'Space Mono', monospace",
          color: COLORS.textPrimary,
          fontSize: 13
        }}
      >
        {value || "--"}
      </div>
    </div>
  );
}

function buttonStyle(background, color, disabled = false) {
  return {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 10,
    border: `1px solid ${disabled ? COLORS.border : color}44`,
    background,
    color,
    fontWeight: 700,
    cursor: disabled ? "not-allowed" : "pointer"
  };
}

function formatRange(low, high, currency) {
  if (typeof low !== "number" || typeof high !== "number") {
    return "--";
  }

  return `${formatPrice(low, currency)} - ${formatPrice(high, currency)}`;
}
