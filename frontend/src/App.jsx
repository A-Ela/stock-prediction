// App.jsx
import { useState } from "react";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";

export default function App() {
  const [auth, setAuth] = useState(false);

  return auth
    ? <DashboardPage />
    : <LoginPage onLogin={() => setAuth(true)} />;
}