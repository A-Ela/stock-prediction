import { useCallback, useEffect, useMemo, useState } from "react";
import Sidebar from "../components/layout/Sidebar";
import Topbar from "../components/layout/Topbar";
import StockTable from "../components/stock/StockTable";
import StockDetailModal from "../components/stock/StockDetailModal";
import TopMovers from "../components/stock/TopMovers";
import TrackedPanel from "../components/stock/TrackedPanel";
import NotificationsPage from "./NotificationsPage";
import PredictPage from "./PredictPage";
import {
  addTracked,
  getStock,
  getStockList,
  getTracked,
  removeTracked
} from "../api/stocks";
import { COLORS } from "../utils/constants";

const PAGE_SIZE = 12;
const LIVE_REFRESH_INTERVAL_MS = 30000;

export default function DashboardPage({ onLogout }) {
  const [page, setPage] = useState("dashboard");
  const [stocks, setStocks] = useState([]);
  const [trackedItems, setTrackedItems] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingStocks, setLoadingStocks] = useState(false);
  const [loadingTracked, setLoadingTracked] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [stockModalLoading, setStockModalLoading] = useState(false);
  const [trackError, setTrackError] = useState("");

  const trackedSymbols = useMemo(
    () => trackedItems.map((item) => item.symbol),
    [trackedItems]
  );

  const loadTracked = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setLoadingTracked(true);
    }

    try {
      const res = await getTracked();
      const items = Array.isArray(res.data) ? res.data : [];
      setTrackedItems(items);
      return items;
    } catch (err) {
      console.error("Tracked load error:", err);
      return null;
    } finally {
      if (!silent) {
        setLoadingTracked(false);
      }
    }
  }, []);

  const loadStocks = useCallback(async (pageToLoad = 1, { silent = false } = {}) => {
    if (pageToLoad < 1) {
      return;
    }

    if (!silent) {
      setLoadingStocks(true);
    }

    try {
      const res = await getStockList(pageToLoad, PAGE_SIZE);
      setStocks(res.data.items || []);
      setCurrentPage(res.data.page || pageToLoad);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      console.error("Stock load error:", err);
    } finally {
      if (!silent) {
        setLoadingStocks(false);
      }
    }
  }, []);

  const openStockModal = useCallback(async (stockOrSymbol) => {
    const symbol =
      typeof stockOrSymbol === "string" ? stockOrSymbol : stockOrSymbol?.symbol;

    if (!symbol) {
      return;
    }

    setStockModalOpen(true);
    setStockModalLoading(true);

    setSelectedStock(
      typeof stockOrSymbol === "object"
        ? stockOrSymbol
        : { symbol }
    );

    try {
      const res = await getStock(symbol, { range: "3mo", interval: "1d" });
      setSelectedStock(res.data);
    } catch (err) {
      console.error("Stock detail load error:", err);
    } finally {
      setStockModalLoading(false);
    }
  }, []);

  const refreshSelectedStock = useCallback(async () => {
    if (!stockModalOpen || !selectedStock?.symbol) {
      return;
    }

    try {
      const res = await getStock(selectedStock.symbol, {
        range: "3mo",
        interval: "1d"
      });
      setSelectedStock(res.data);
    } catch (err) {
      console.error("Selected stock refresh error:", err);
    }
  }, [selectedStock?.symbol, stockModalOpen]);

  useEffect(() => {
    (async () => {
      await Promise.all([loadTracked(), loadStocks(1)]);
    })();
  }, [loadStocks, loadTracked]);

  useEffect(() => {
    if (page !== "dashboard") {
      return;
    }

    const intervalId = window.setInterval(() => {
      loadStocks(currentPage, { silent: true });
      loadTracked({ silent: true });
      refreshSelectedStock();
    }, LIVE_REFRESH_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [currentPage, loadStocks, loadTracked, page, refreshSelectedStock]);

  const topGainers = useMemo(
    () => [...stocks].sort((a, b) => (b.pct || 0) - (a.pct || 0)).slice(0, 3),
    [stocks]
  );

  const topLosers = useMemo(
    () => [...stocks].sort((a, b) => (a.pct || 0) - (b.pct || 0)).slice(0, 3),
    [stocks]
  );

  const handleToggleTrack = useCallback(
    async (stock) => {
      if (!stock?.symbol) {
        return;
      }

      setTrackError("");
      const isTracked = trackedSymbols.includes(stock.symbol);
      const optimisticId = `temp-${stock.symbol}`;

      setTrackedItems((prev) => {
        if (isTracked) {
          return prev.filter((item) => item.symbol !== stock.symbol);
        }

        return [
          {
            _id: optimisticId,
            symbol: stock.symbol,
            live: stock
          },
          ...prev
        ];
      });

      try {
        if (isTracked) {
          await removeTracked(stock.symbol);
        } else {
          const res = await addTracked({
            symbol: stock.symbol,
            thresholdHigh: stock.price * 1.05,
            thresholdLow: stock.price * 0.95,
            lastKnownPrice: stock.price
          });

          setTrackedItems((prev) =>
            prev.map((item) =>
              item._id === optimisticId
                ? { ...res.data, live: stock }
                : item
            )
          );
        }

        const refreshedItems = await loadTracked({ silent: true });

        if (
          !isTracked &&
          Array.isArray(refreshedItems) &&
          !refreshedItems.some((item) => item.symbol === stock.symbol)
        ) {
          setTrackedItems((prev) =>
            prev.some((item) => item.symbol === stock.symbol)
              ? prev
              : [
                  {
                    _id: optimisticId,
                    symbol: stock.symbol,
                    live: stock
                  },
                  ...prev
                ]
          );
        }
      } catch (err) {
        console.error("Track toggle error:", err);
        setTrackError(err.response?.data?.msg || "Failed to update tracked stock");

        if (isTracked) {
          setTrackedItems((prev) => [
            {
              _id: optimisticId,
              symbol: stock.symbol,
              live: stock
            },
            ...prev.filter((item) => item.symbol !== stock.symbol)
          ]);
        } else {
          setTrackedItems((prev) =>
            prev.filter((item) => item.symbol !== stock.symbol)
          );
        }

        await loadTracked({ silent: true });
      }
    },
    [loadTracked, trackedSymbols]
  );

  const handleRemoveTracked = useCallback(
    async (symbol) => {
      setTrackedItems((prev) => prev.filter((item) => item.symbol !== symbol));

      try {
        await removeTracked(symbol);
        await loadTracked({ silent: true });
      } catch (err) {
        console.error("Tracked remove error:", err);
        await loadTracked({ silent: true });
      }
    },
    [loadTracked]
  );

  const handleSignOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    onLogout();
  };

  const closeStockModal = () => {
    setStockModalOpen(false);
    setSelectedStock(null);
    setStockModalLoading(false);
  };

  const renderPage = () => {
    if (page === "predict") {
      return <PredictPage />;
    }

    if (page === "notifications") {
      return <NotificationsPage />;
    }

    return (
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "flex-start",
          gap: 20,
          padding: 20
        }}
      >
        <div style={{ display: "grid", gap: 16, flex: "1 1 760px", minWidth: 0 }}>
          <TopMovers gainers={topGainers} losers={topLosers} />
          <StockTable
            currentPage={currentPage}
            loading={loadingStocks}
            onPageChange={loadStocks}
            onSelect={openStockModal}
            onToggleTrack={handleToggleTrack}
            stocks={stocks}
            totalPages={totalPages}
            trackedSymbols={trackedSymbols}
          />
        </div>

        <div style={{ flex: "0 0 280px", width: 280, maxWidth: "100%" }}>
          {trackError && (
            <div
              style={{
                marginBottom: 10,
                padding: "10px 12px",
                borderRadius: 8,
                background: `${COLORS.red}14`,
                border: `1px solid ${COLORS.red}33`,
                color: COLORS.red,
                fontSize: 12
              }}
            >
              {trackError}
            </div>
          )}
          <TrackedPanel
            items={trackedItems}
            loading={loadingTracked}
            onRemoveTracked={handleRemoveTracked}
            onSelect={openStockModal}
            onThresholdsUpdated={() => loadTracked({ silent: true })}
          />
        </div>
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
          onStockSelect={openStockModal}
        />
        {renderPage()}
      </div>

      <StockDetailModal
        loading={stockModalLoading}
        onClose={closeStockModal}
        onToggleTrack={handleToggleTrack}
        open={stockModalOpen}
        stock={selectedStock}
        tracked={trackedSymbols.includes(selectedStock?.symbol || "")}
      />
    </div>
  );
}
