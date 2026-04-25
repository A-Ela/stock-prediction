import StockRow from "./StockRow";
import { COLORS } from "../../utils/constants";

export default function StockTable({
  stocks,
  onSelect,
  trackedSymbols,
  refreshTracked
}) {
  return (
    <div style={{
      background: COLORS.bg2,
      borderRadius: 12,
      padding: 16,
      border: `1px solid ${COLORS.border}`
    }}>
      <h3 style={{ marginBottom: 10, color: COLORS.textPrimary }}>Market</h3>

      <table style={{ width: "100%", borderCollapse: "collapse", color: COLORS.textSecondary }}>
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Price</th>
            <th>Change</th>
            <th></th>
          </tr>
        </thead>

        <tbody>
          {stocks.length === 0 && (
            <tr>
              <td colSpan={6} style={{ padding: 16, color: COLORS.textMuted }}>Loading stocks...</td>
            </tr>
          )}
          {stocks.map((s) => (
            <StockRow
              key={s.symbol}
              stock={s}
              onSelect={onSelect}
              tracked={trackedSymbols.includes(s.symbol)}
              refreshTracked={refreshTracked}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}