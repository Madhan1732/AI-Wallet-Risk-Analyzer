import { useState } from "react";

const API_URL = "http://localhost:3001";

function Analyzer({ config, keysConfigured }) {
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  async function handleAnalyze(e) {
    e.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/analyze-wallet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: address.trim(),
          etherscanApiKey: config.etherscanApiKey,
          aiApiKey: config.aiApiKey,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed.");
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const riskColor = {
    Low: "#22c55e",
    Medium: "#f59e0b",
    High: "#ef4444",
    Unknown: "#6b7280",
  };

  return (
    <div>
      {!keysConfigured && (
        <div className="warning">
          API keys not configured. Go to Settings to add your keys.
        </div>
      )}

      <div className="card">
        <h2>Wallet Analysis</h2>
        <form onSubmit={handleAnalyze} className="analyzer-form">
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Enter Ethereum wallet address (0x...)"
            disabled={!keysConfigured}
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!keysConfigured || loading || !address.trim()}
          >
            {loading ? "Analyzing..." : "Analyze"}
          </button>
        </form>
      </div>

      {loading && (
        <div className="card loading-card">
          <div className="spinner" />
          <p>Fetching transactions and analyzing risk...</p>
        </div>
      )}

      {error && (
        <div className="card error-card">
          <h3>Error</h3>
          <p>{error}</p>
        </div>
      )}

      {result && (
        <>
          <div className="card risk-card">
            <h3>Risk Assessment</h3>
            <div
              className="risk-badge"
              style={{
                backgroundColor: riskColor[result.riskScore] || "#6b7280",
              }}
            >
              {result.riskScore} Risk
            </div>
            <p className="explanation">{result.explanation}</p>
          </div>

          <div className="card">
            <h3>Transaction Summary</h3>
            <div className="summary-grid">
              <SummaryItem
                label="Total Transactions"
                value={result.summary.totalTransactions}
              />
              <SummaryItem
                label="Total Value"
                value={`${result.summary.totalValueETH} ETH`}
              />
              <SummaryItem
                label="Avg Value/Tx"
                value={`${result.summary.avgValueETH} ETH`}
              />
              <SummaryItem
                label="Unique Addresses"
                value={result.summary.uniqueAddresses}
              />
              <SummaryItem
                label="Incoming"
                value={result.summary.incomingCount}
              />
              <SummaryItem
                label="Outgoing"
                value={result.summary.outgoingCount}
              />
              <SummaryItem
                label="Time Span"
                value={`${result.summary.timeSpanDays} days`}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function SummaryItem({ label, value }) {
  return (
    <div className="summary-item">
      <span className="summary-label">{label}</span>
      <span className="summary-value">{value}</span>
    </div>
  );
}

export default Analyzer;
