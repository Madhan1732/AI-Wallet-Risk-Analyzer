import { useState } from "react";
import { saveConfig, clearConfig } from "../utils/config";

function Settings({ config, onSave }) {
  const [etherscanApiKey, setEtherscanApiKey] = useState(config.etherscanApiKey);
  const [aiApiKey, setAiApiKey] = useState(config.aiApiKey);
  const [saved, setSaved] = useState(false);

  function handleSave(e) {
    e.preventDefault();
    const newConfig = { etherscanApiKey, aiApiKey };
    saveConfig(newConfig);
    onSave(newConfig);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleReset() {
    clearConfig();
    setEtherscanApiKey("");
    setAiApiKey("");
    onSave({ etherscanApiKey: "", aiApiKey: "" });
  }

  return (
    <div className="card">
      <h2>API Configuration</h2>
      <p className="card-description">
        Enter your API keys to enable wallet analysis. Keys are stored locally
        in your browser.
      </p>

      <form onSubmit={handleSave} className="settings-form">
        <label>
          <span>Etherscan API Key</span>
          <input
            type="password"
            value={etherscanApiKey}
            onChange={(e) => setEtherscanApiKey(e.target.value)}
            placeholder="Enter your Etherscan API key"
          />
        </label>

        <label>
          <span>OpenAI API Key</span>
          <input
            type="password"
            value={aiApiKey}
            onChange={(e) => setAiApiKey(e.target.value)}
            placeholder="Enter your OpenAI API key"
          />
        </label>

        <div className="button-group">
          <button type="submit" className="btn btn-primary">
            Save Configuration
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleReset}
          >
            Reset API Keys
          </button>
        </div>

        {saved && <p className="success-msg">Configuration saved!</p>}
      </form>
    </div>
  );
}

export default Settings;
