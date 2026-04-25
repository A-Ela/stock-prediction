export default function TimeframeSelector({ timeframe, setTimeframe }) {
  return (
    <div>
      {[7,14,30].map(t => (
        <button key={t} onClick={() => setTimeframe(t)}>
          {t}D
        </button>
      ))}
    </div>
  );
}