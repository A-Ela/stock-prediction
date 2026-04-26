import { useEffect, useMemo, useState } from "react";
import MiniChart from "../components/charts/MiniChart";
import Tag from "../components/common/Tag";
import TimeframeSelector from "../components/prediction/TimeFrameSelector";
import { getStock, getStockList, getTracked, runPrediction as requestPrediction } from "../api/stocks";
import { COLORS } from "../utils/constants";
import {
  formatChange,
  formatPercent,
  formatPrice
} from "../utils/helpers";

export default function PredictPage() {
  const [selected, setSelected] = useState(null);
  const [stocks, setStocks] = useState([]);
  const [timeframe, setTimeframe] = useState(null);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loadingStocks, setLoadingStocks] = useState(false);

  useEffect(() => {
    const loadStocks = async () => {
      setLoadingStocks(true);

      try {
        const trackedRes = await getTracked();
        const trackedLive = (trackedRes.data || [])
          .map((item) => item.live)
          .filter(Boolean);

        if (trackedLive.length > 0) {
          setStocks(trackedLive.slice(0, 9));
          return;
        }

        const marketRes = await getStockList(1, 9);
        setStocks(marketRes.data.items || []);
      } catch (err) {
        console.error("Prediction stock load error:", err);
        setStocks([]);
      } finally {
        setLoadingStocks(false);
      }
    };

    loadStocks();
  }, []);

  useEffect(() => {
    setTimeframe(null);
    setResult(null);
    setError("");
  }, [selected?.symbol]);

  const handleSelectStock = async (stock) => {
    setSelected(stock);

    try {
      const res = await getStock(stock.symbol, { range: "3mo", interval: "1d" });
      setSelected(res.data);
      setStocks((prev) =>
        prev.map((item) => (item.symbol === res.data.symbol ? res.data : item))
      );
    } catch (err) {
      console.error("Prediction detail load error:", err);
    }
  };

  const runPrediction = async () => {
    if (!selected || timeframe === null) {
      return;
    }

    setError("");
    setRunning(true);
    setResult(null);

    try {
      const res = await requestPrediction({
        symbol: selected.symbol,
        timeframe
      });
      const trend =
        res.data.predictedPrice >= res.data.currentPrice ? "BULLISH" : "BEARISH";

      setResult({
        price: res.data.predictedPrice,
        confidence: res.data.confidence,
        currentPrice: res.data.currentPrice,
        timeframe,
        trend
      });
    } catch (err) {
      setError(err.response?.data?.msg || "Prediction service is unavailable");
    } finally {
      setRunning(false);
    }
  };

  const projectionData = useMemo(() => {
    if (!result || !selected?.history?.length) {
      return selected?.history || [];
    }

    return [
      ...selected.history,
      {
        date: new Date(),
        price: result.price
      }
    ];
  }, [result, selected?.history]);

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1
          style={{
            margin: "0 0 6px",
            fontSize: 22,
            fontWeight: 700,
            color: COLORS.textPrimary
          }}
        >
          AI Predictions
        </h1>
        <p style={{ margin: 0, fontSize: 13, color: COLORS.textSecondary }}>
          Select a live stock, choose the prediction time span, and run a forecast.
        </p>
      </div>

      <div style={{ marginBottom: 28 }}>
        <div
          style={{
            fontSize: 11,
            color: COLORS.textSecondary,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom: 14
          }}
        >
          Select Stock
        </div>

        {loadingStocks && (
          <div style={{ color: COLORS.textMuted, fontSize: 12 }}>
            Loading live market stocks...
          </div>
        )}

        {!loadingStocks && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 12
            }}
          >
            {stocks.map((stock) => {
              const positive = (stock.change || 0) >= 0;
              const isActive = selected?.symbol === stock.symbol;

              return (
                <div
                  key={stock.symbol}
                  onClick={() => handleSelectStock(stock)}
                  style={{
                    padding: "16px 18px",
                    borderRadius: 10,
                    cursor: "pointer",
                    background: isActive ? `${COLORS.cyan}15` : COLORS.surface,
                    border: `1px solid ${isActive ? COLORS.cyan : COLORS.border}`,
                    boxShadow: isActive ? `0 0 20px ${COLORS.cyan}22` : "none"
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: 10
                    }}
                  >
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 8,
                        background: isActive ? `${COLORS.cyan}22` : COLORS.bg0,
                        border: `1px solid ${isActive ? `${COLORS.cyan}55` : COLORS.border}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 10,
                        fontWeight: 700,
                        color: isActive ? COLORS.cyan : COLORS.textMuted,
                        fontFamily: "'Space Mono', monospace"
                      }}
                    >
                      {stock.symbol.slice(0, 3)}
                    </div>
                    <Tag color={positive ? COLORS.green : COLORS.red}>
                      {formatPercent(stock.pct, 1)}
                    </Tag>
                  </div>

                  <div
                    style={{
                      fontFamily: "'Space Mono', monospace",
                      fontSize: 16,
                      fontWeight: 700,
                      color: COLORS.textPrimary,
                      marginBottom: 2
                    }}
                  >
                    {stock.symbol}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: COLORS.textMuted,
                      marginBottom: 6
                    }}
                  >
                    {stock.name}
                  </div>
                  <div
                    style={{
                      fontFamily: "'Space Mono', monospace",
                      fontSize: 13,
                      color: positive ? COLORS.green : COLORS.red
                    }}
                  >
                    {formatPrice(stock.price, stock.currency)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selected && (
        <div
          style={{
            borderRadius: 14,
            overflow: "hidden",
            border: `1px solid ${COLORS.border}`,
            background: COLORS.bg2
          }}
        >
          <div
            style={{
              padding: "18px 24px",
              borderBottom: `1px solid ${COLORS.border}`,
              background: `linear-gradient(90deg, ${COLORS.bg3}, ${COLORS.bg2})`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span
                style={{
                  fontFamily: "'Space Mono', monospace",
                  color: COLORS.cyan,
                  fontSize: 15,
                  fontWeight: 700
                }}
              >
                {selected.symbol}
              </span>
              <span style={{ fontSize: 13, color: COLORS.textSecondary }}>
                {selected.name}
              </span>
              <Tag color={COLORS.cyan}>Forecast</Tag>
            </div>
            <button
              onClick={() => {
                setSelected(null);
                setResult(null);
              }}
              style={{
                background: "none",
                border: `1px solid ${COLORS.border}`,
                color: COLORS.textMuted,
                cursor: "pointer",
                width: 30,
                height: 30,
                borderRadius: 6
              }}
            >
              X
            </button>
          </div>

          <div style={{ padding: 24 }}>
            <div
              style={{
                padding: 20,
                borderRadius: 10,
                marginBottom: 24,
                background: COLORS.bg0,
                border: `1px solid ${COLORS.border}`
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: COLORS.textMuted,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  marginBottom: 14
                }}
              >
                Recent price history
              </div>
              <MiniChart data={selected.history || []} positive={selected.change >= 0} />
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: 20
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 11,
                    color: COLORS.textSecondary,
                    letterSpacing: "0.07em",
                    textTransform: "uppercase",
                    marginBottom: 12
                  }}
                >
                  Prediction Time Span
                </div>
                <div style={{ marginBottom: 12 }}>
                  <TimeframeSelector timeframe={timeframe} setTimeframe={setTimeframe} />
                </div>
                {timeframe === null && (
                  <div style={{ marginBottom: 20, fontSize: 11, color: COLORS.textMuted }}>
                    Choose the time span before generating a prediction.
                  </div>
                )}

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                    gap: 10,
                    marginBottom: 24
                  }}
                >
                  {[
                    {
                      label: "Current Price",
                      value: formatPrice(selected.price, selected.currency)
                    },
                    {
                      label: "Change",
                      value: formatChange(selected.change)
                    },
                    {
                      label: "Change %",
                      value: formatPercent(selected.pct)
                    },
                    {
                      label: "Volume",
                      value: selected.volume?.toLocaleString?.() || "--"
                    }
                  ].map(({ label, value }) => (
                    <div
                      key={label}
                      style={{
                        padding: "12px 14px",
                        borderRadius: 8,
                        background: COLORS.bg0,
                        border: `1px solid ${COLORS.border}`
                      }}
                    >
                      <div
                        style={{
                          fontSize: 10,
                          color: COLORS.textMuted,
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                          marginBottom: 4
                        }}
                      >
                        {label}
                      </div>
                      <div
                        style={{
                          fontFamily: "'Space Mono', monospace",
                          fontSize: 13,
                          color: COLORS.textPrimary
                        }}
                      >
                        {value}
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={runPrediction}
                  disabled={running || timeframe === null}
                  style={{
                    width: "100%",
                    padding: "14px 0",
                    borderRadius: 8,
                    background:
                      running || timeframe === null
                        ? COLORS.bg3
                        : `linear-gradient(90deg, ${COLORS.cyan}, ${COLORS.green}CC)`,
                    border:
                      running || timeframe === null
                        ? `1px solid ${COLORS.border}`
                        : "none",
                    color:
                      running || timeframe === null
                        ? COLORS.textMuted
                        : COLORS.bg0,
                    fontSize: 14,
                    fontWeight: 700,
                    cursor:
                      running || timeframe === null ? "not-allowed" : "pointer"
                  }}
                >
                  {running ? "Running Model..." : "Generate AI Prediction"}
                </button>
                {error && (
                  <div style={{ marginTop: 10, fontSize: 12, color: COLORS.red }}>
                    {error}
                  </div>
                )}
              </div>

              <div>
                {!result && !running && (
                  <div
                    style={{
                      height: "100%",
                      minHeight: 200,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      border: `1px dashed ${COLORS.border}`,
                      borderRadius: 10,
                      color: COLORS.textMuted,
                      fontSize: 13,
                      gap: 10
                    }}
                  >
                    <span>Pick a time span and run the prediction.</span>
                  </div>
                )}

                {running && (
                  <div
                    style={{
                      height: "100%",
                      minHeight: 200,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      border: `1px solid ${COLORS.cyan}33`,
                      borderRadius: 10,
                      background: `${COLORS.cyan}08`,
                      gap: 14
                    }}
                  >
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: "50%",
                        border: `2px solid ${COLORS.border}`,
                        borderTop: `2px solid ${COLORS.cyan}`,
                        animation: "spin 0.9s linear infinite"
                      }}
                    />
                    <div
                      style={{
                        color: COLORS.cyan,
                        fontSize: 12,
                        fontFamily: "'Space Mono', monospace"
                      }}
                    >
                      Analyzing {timeframe}-day window...
                    </div>
                  </div>
                )}

                {result && (
                  <div
                    style={{
                      padding: 22,
                      borderRadius: 10,
                      height: "100%",
                      background: `linear-gradient(135deg, ${COLORS.bg0}, ${COLORS.bg3})`,
                      border: `1px solid ${
                        result.trend === "BULLISH"
                          ? `${COLORS.green}55`
                          : `${COLORS.red}55`
                      }`
                    }}
                  >
                    <div
                      style={{
                        fontSize: 10,
                        color: COLORS.textMuted,
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        marginBottom: 8
                      }}
                    >
                      AI Forecast · {result.timeframe}-Day Outlook
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-end",
                        gap: 12,
                        marginBottom: 18
                      }}
                    >
                      <div
                        style={{
                          fontFamily: "'Space Mono', monospace",
                          fontSize: 32,
                          fontWeight: 700,
                          color:
                            result.trend === "BULLISH"
                              ? COLORS.green
                              : COLORS.red,
                          lineHeight: 1
                        }}
                      >
                        {formatPrice(result.price, selected.currency)}
                      </div>
                      <div style={{ paddingBottom: 4 }}>
                        <Tag
                          color={
                            result.trend === "BULLISH"
                              ? COLORS.green
                              : COLORS.red
                          }
                        >
                          {result.trend}
                        </Tag>
                      </div>
                    </div>

                    <div style={{ marginBottom: 18 }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: 6
                        }}
                      >
                        <span
                          style={{
                            fontSize: 11,
                            color: COLORS.textMuted,
                            textTransform: "uppercase",
                            letterSpacing: "0.08em"
                          }}
                        >
                          Model Confidence
                        </span>
                        <span
                          style={{
                            fontFamily: "'Space Mono', monospace",
                            fontSize: 11,
                            color: COLORS.cyan
                          }}
                        >
                          {`${((result.confidence || 0) * 100).toFixed(1)}%`}
                        </span>
                      </div>
                      <MiniChart data={projectionData} positive={result.trend === "BULLISH"} />
                    </div>

                    <div
                      style={{
                        marginTop: 14,
                        padding: "10px 12px",
                        borderRadius: 7,
                        background: `${COLORS.amber}10`,
                        border: `1px solid ${COLORS.amber}33`
                      }}
                    >
                      <div style={{ fontSize: 10, color: COLORS.amber }}>
                        Not financial advice. AI predictions carry uncertainty.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
