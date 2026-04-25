export default function StockTable({
  stocks,
  onSelect,
  trackedSymbols,
  refreshTracked
}) {
  return (
    <div style={{
      background: "#101828",
      borderRadius: 12,
      padding: 16
    }}>
      <h3 style={{ marginBottom: 10 }}>Market</h3>

      <table>
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Price</th>
            <th>Change</th>
            <th></th>
          </tr>
        </thead>

        <tbody>
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