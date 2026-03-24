import { useState } from "react";
import Analyzer from "./components/Analyzer";
import Settings from "./components/Settings";
import { getConfig } from "./utils/config";
import "./App.css";

function App() {
  const [tab, setTab] = useState("analyzer");
  const [config, setConfig] = useState(getConfig());

  const keysConfigured = !!(config.etherscanApiKey && config.aiApiKey);

  return (
    <div className="app">
      <header className="header">
        <h1>AI Wallet Risk Analyzer</h1>
        <p className="subtitle">
          Analyze Ethereum wallet risk using AI-powered insights
        </p>
      </header>

      <nav className="tabs">
        <button
          className={`tab ${tab === "analyzer" ? "active" : ""}`}
          onClick={() => setTab("analyzer")}
        >
          Analyzer
        </button>
        <button
          className={`tab ${tab === "settings" ? "active" : ""}`}
          onClick={() => setTab("settings")}
        >
          Settings
          {!keysConfigured && <span className="dot" />}
        </button>
      </nav>

      <main className="content">
        {tab === "analyzer" ? (
          <Analyzer config={config} keysConfigured={keysConfigured} />
        ) : (
          <Settings
            config={config}
            onSave={(newConfig) => setConfig(newConfig)}
          />
        )}
      </main>
    </div>
  );
}

export default App;
