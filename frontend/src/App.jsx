import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [message, setMessage] = useState("Loading backend message...");

  useEffect(() => {
    async function loadMessage() {
      try {
        const response = await fetch("/api/message");
        const data = await response.json();
        setMessage(data.message);
      } catch (_error) {
        setMessage("Backend is not reachable yet.");
      }
    }

    loadMessage();
  }, []);

  return (
    <main className="app-shell">
      <section className="hero">
        <p className="eyebrow">Devcontainer Monorepo</p>
        <h1>React frontend + Node backend</h1>
        <p className="lede">
          The frontend runs on Vite and proxies API calls to the backend service.
        </p>
        <div className="status-card">
          <span className="status-label">API message</span>
          <strong>{message}</strong>
        </div>
      </section>
    </main>
  );
}

export default App;
