import API from "./api";

export const getStock = (symbol) =>
  API.get(`/stock/${symbol}`);

export const getTracked = () =>
  API.get("/tracked");

export const addTracked = (data) =>
  API.post("/tracked", data);

export const removeTracked = (symbol) =>
  API.delete(`/tracked/${symbol}`);

export const getNotifications = () =>
  API.get("/notifications");