import { useEffect, useState } from "react";
import StockTable from "../components/stock/StockTable";
import { getTracked, getStock } from "../api/stocks";
import Sidebar from "../components/layout/Sidebar";
import Topbar from "../components/layout/Topbar";
import TrackedPanel from "../components/stock/TrackedPanel";
import StockSearchPanel from "../components/stock/StockSearchPanel";
import PredictPage from "./PredictPage";
import NotificationsPage from "./NotificationsPage";
import { COLORS } from "../utils/constants";

export default function DashboardPage({ onLogout }) {
  const [page, setPage] = useState("dashboard");
  const [stocks, setStocks] = useState([]);
  const [trackedSymbols, setTrackedSymbols] = useState([]);

  const loadTracked = async () => {
    try {
      const res = await getTracked();
      setTrackedSymbols(res.data.map(s => s.symbol));
    } catch (err) {
      console.error("Tracked load error:", err);
    }
  };

  const loadStocks = async () => {
    const symbols = ["AAPL", "TSLA", "MSFT"];
    try {
      const results = await Promise.all(symbols.map(s => getStock(s)));
      setStocks(results.map(r => ({
        symbol: r.data.symbol,
        name: r.data.name,
        price: r.data.price,
        change: r.data.change,
        pct: r.data.pct,
        history: r.data.history
      })));
    } catch (err) {
      console.error("Stock load error:", err);
    }
  };

  useEffect(() => {
    (async () => {
      await Promise.all([loadTracked(), loadStocks()]);
    })();
  }, []);

  const handleSelect = (stock) => {
    console.log("Selected:", stock);
  };

  const handleSignOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    onLogout();
  };

  const renderPage = () => {
    if (page === "predict") return <PredictPage />;
    if (page === "notifications") return <NotificationsPage />;

    return (
      <div style={{
        display: "grid",
        gridTemplateColumns: "2fr 1fr",
        gap: 20,
        padding: 20
      }}>
        <div style={{ display: "grid", gap: 20 }}>
          <StockSearchPanel onTracked={loadTracked} />
          <StockTable
            stocks={stocks}
            onSelect={handleSelect}
            trackedSymbols={trackedSymbols}
            refreshTracked={loadTracked}
          />
        </div>
        <TrackedPanel refreshTracked={loadTracked} />
      </div>
    );
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: COLORS.bg0 }}>
      <Sidebar page={page} setPage={setPage} />

      <div style={{ flex: 1 }}>
        <Topbar
          onNotifications={() => setPage("notifications")}
          onSignOut={handleSignOut}
        />
        {renderPage()}
      </div>
    </div>
  );
}