import { useState } from "react";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";

export default function App() {
  const [auth, setAuth] = useState(Boolean(localStorage.getItem("token")));

  return auth
    ? <DashboardPage onLogout={() => setAuth(false)} />
    : <LoginPage onLogin={() => setAuth(true)} />;
}