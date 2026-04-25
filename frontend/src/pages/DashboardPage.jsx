// pages/DashboardPage.jsx
import { useEffect, useState } from "react";
import StockTable from "../components/stock/StockTable";
import { getTracked, getStock } from "../api/stocks";
import Sidebar from "../components/layout/Sidebar";
import Topbar from "../components/layout/Topbar";
import TrackedPanel from "../components/stock/TrackedPanel";

export default function DashboardPage() {
  const [stocks, setStocks] = useState([]);
  const [trackedSymbols, setTrackedSymbols] = useState([]);

  // 🔄 Load tracked stocks from backend
  const loadTracked = async () => {
    try {
      const res = await getTracked();
      setTrackedSymbols(res.data.map(s => s.symbol));
    } catch (err) {
      console.error("Tracked load error:", err);
    }
  };

  // 📊 Load stock prices (Yahoo via backend)
  const loadStocks = async () => {
    const symbols = ["AAPL", "TSLA", "MSFT"];

    const results = await Promise.all(
      symbols.map(s => getStock(s))
    );

    setStocks(results.map(r => ({
      symbol: r.data.symbol,
      price: r.data.price,
      history: r.data.history
    })));
  };

  // 🚀 Initial load
  useEffect(() => {
    loadTracked();
    loadStocks();
  }, []);

  // 👇 Row click (e.g. open prediction modal later)
  const handleSelect = (stock) => {
    console.log("Selected:", stock);
  };

  return (
    <div style={{ display: "flex" }}>
      
      <Sidebar />

      <div style={{ flex: 1 }}>
        <Topbar />

        <div style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: 20,
          padding: 20
        }}>
          <StockTable />
          <TrackedPanel />
        </div>
      </div>

    </div>
  );
}