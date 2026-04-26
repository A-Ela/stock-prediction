import API from "./api";

export const getStock = (symbol, options = {}) => {
  const params = new URLSearchParams();

  if (options.range) {
    params.set("range", options.range);
  }

  if (options.interval) {
    params.set("interval", options.interval);
  }

  const query = params.toString();
  return API.get(`/stock/${symbol}${query ? `?${query}` : ""}`);
};

export const getStockList = (page = 1, pageSize = 12) =>
  API.get(`/stocks?page=${page}&pageSize=${pageSize}`);

export const searchStocks = (query) =>
  API.get(`/stock/search?q=${encodeURIComponent(query)}`);

export const getTracked = () =>
  API.get("/tracked");

export const addTracked = (data) =>
  API.post("/tracked", data);

export const removeTracked = (symbol) =>
  API.delete(`/tracked/${symbol}`);

export const getNotifications = () =>
  API.get("/notifications");

export const markNotificationRead = (id) =>
  API.patch(`/notifications/${id}`);

export const runPrediction = (data) =>
  API.post("/predict", data);
