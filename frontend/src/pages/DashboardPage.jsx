import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import StockTable from "../components/stock/StockTable";
import { getTracked, getStockList } from "../api/stocks";
import Sidebar from "../components/layout/Sidebar";
import Topbar from "../components/layout/Topbar";
import TrackedPanel from "../components/stock/TrackedPanel";
import TopMovers from "../components/stock/TopMovers";
import PredictPage from "./PredictPage";
import NotificationsPage from "./NotificationsPage";
import { COLORS } from "../utils/constants";

export default function DashboardPage({ onLogout }) {
  const [page, setPage] = useState("dashboard");
  const [stocks, setStocks] = useState([]);
  const [trackedSymbols, setTrackedSymbols] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingStocks, setLoadingStocks] = useState(false);
  const sentinelRef = useRef(null);

  const loadTracked = async () => {
    try {
      const res = await getTracked();
      setTrackedSymbols(res.data.map(s => s.symbol));
    } catch (err) {
      console.error("Tracked load error:", err);
    }
  };

  const loadStocks = useCallback(async (pageToLoad = 1) => {
    if (loadingStocks) return;
    setLoadingStocks(true);
    try {
      const res = await getStockList(pageToLoad, 12);
      const items = res.data.items || [];
      setStocks((prev) => {
        const merged = [...prev, ...items];
        const unique = [];
        const seen = new Set();
        for (const item of merged) {
          if (!seen.has(item.symbol)) {
            unique.push(item);
            seen.add(item.symbol);
          }
        }
        return unique;
      });
      setHasMore(Boolean(res.data.hasMore));
      setCurrentPage(pageToLoad);
    } catch (err) {
      console.error("Stock load error:", err);
    } finally {
      setLoadingStocks(false);
    }
  }, [loadingStocks]);

  useEffect(() => {
    (async () => {
      await Promise.all([loadTracked(), loadStocks(1)]);
    })();
  }, []);

  useEffect(() => {
    if (page !== "dashboard") return;
    if (!sentinelRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !loadingStocks) {
          loadStocks(currentPage + 1);
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [page, hasMore, loadingStocks, currentPage, loadStocks]);

  const topGainers = useMemo(
    () => [...stocks].sort((a, b) => (b.pct || 0) - (a.pct || 0)).slice(0, 3),
    [stocks]
  );
  const topLosers = useMemo(
    () => [...stocks].sort((a, b) => (a.pct || 0) - (b.pct || 0)).slice(0, 3),
    [stocks]
  );

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
        <div style={{ display: "grid", gap: 16 }}>
          <TopMovers gainers={topGainers} losers={topLosers} />
          <StockTable
            stocks={stocks}
            onSelect={handleSelect}
            trackedSymbols={trackedSymbols}
            refreshTracked={loadTracked}
          />
          <div ref={sentinelRef} />
          {loadingStocks && (
            <div style={{ color: COLORS.textMuted, fontSize: 12 }}>Loading more stocks...</div>
          )}
          {!hasMore && stocks.length > 0 && (
            <div style={{ color: COLORS.textMuted, fontSize: 12 }}>All stocks loaded.</div>
          )}
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