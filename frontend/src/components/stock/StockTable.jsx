import StockRow from "./StockRow";
import { COLORS } from "../../utils/constants";

export default function StockTable({
  currentPage = 1,
  loading = false,
  onPageChange = () => {},
  onSelect,
  onToggleTrack,
  stocks,
  totalPages = 1,
  trackedSymbols
}) {
  return (
    <div
      style={{
        background: COLORS.bg2,
        borderRadius: 12,
        padding: 16,
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
        <h3 style={{ margin: 0, color: COLORS.textPrimary }}>Market</h3>
        <div style={{ fontSize: 12, color: COLORS.textMuted }}>
          Page {currentPage} of {Math.max(totalPages, 1)}
        </div>
      </div>

      <table
        style={{
          width: "100%",
          tableLayout: "fixed",
          borderCollapse: "collapse",
          color: COLORS.textSecondary
        }}
      >
        <colgroup>
          <col style={{ width: "34%" }} />
          <col style={{ width: "16%" }} />
          <col style={{ width: "14%" }} />
          <col style={{ width: "12%" }} />
          <col style={{ width: "16%" }} />
          <col style={{ width: "8%" }} />
        </colgroup>
        <thead>
          <tr>
            <th style={headerCellStyle("left")}>Symbol</th>
            <th style={headerCellStyle("right")}>Price</th>
            <th style={headerCellStyle("right")}>Change</th>
            <th style={headerCellStyle("right")}>Percent</th>
            <th style={headerCellStyle("center")}>Trend</th>
            <th style={headerCellStyle("center")}>Track</th>
          </tr>
        </thead>

        <tbody>
          {stocks.length === 0 && (
            <tr>
              <td colSpan={6} style={{ padding: 16, color: COLORS.textMuted }}>
                {loading ? "Loading stocks..." : "No stocks available right now."}
              </td>
            </tr>
          )}

          {stocks.map((stock) => (
            <StockRow
              key={stock.symbol}
              onSelect={onSelect}
              onToggleTrack={onToggleTrack}
              stock={stock}
              tracked={trackedSymbols.includes(stock.symbol)}
            />
          ))}
        </tbody>
      </table>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 14
        }}
      >
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1 || loading}
          style={pageButtonStyle(currentPage <= 1 || loading)}
        >
          Previous
        </button>

        <div style={{ color: COLORS.textMuted, fontSize: 12 }}>
          Live list powered by Yahoo market data
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages || loading}
          style={pageButtonStyle(currentPage >= totalPages || loading)}
        >
          Next
        </button>
      </div>
    </div>
  );
}

function pageButtonStyle(disabled) {
  return {
    padding: "8px 12px",
    borderRadius: 8,
    border: `1px solid ${COLORS.border}`,
    background: disabled ? COLORS.bg3 : COLORS.bg0,
    color: disabled ? COLORS.textMuted : COLORS.textPrimary,
    cursor: disabled ? "not-allowed" : "pointer"
  };
}

function headerCellStyle(align) {
  return {
    textAlign: align,
    padding: "0 16px 10px",
    fontSize: 11,
    color: COLORS.textMuted,
    letterSpacing: "0.06em",
    textTransform: "uppercase"
  };
}
