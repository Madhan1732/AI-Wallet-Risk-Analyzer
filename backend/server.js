const express = require("express");
const cors = require("cors");
const { fetchTransactions, analyzeWithAI } = require("./services");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

app.post("/analyze-wallet", async (req, res) => {
  const walletAddress = (req.body.walletAddress || "").trim();
  const etherscanApiKey = (req.body.etherscanApiKey || "").trim();
  const aiApiKey = (req.body.aiApiKey || "").trim();

  if (!walletAddress || !etherscanApiKey || !aiApiKey) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  if (!aiApiKey.startsWith("sk-")) {
    return res.status(400).json({ error: "Invalid OpenAI API key format. Key should start with 'sk-'." });
  }

  // Basic Ethereum address validation
  if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
    return res.status(400).json({ error: "Invalid Ethereum address format." });
  }

  try {
    // 1. Fetch transactions from Etherscan
    const transactions = await fetchTransactions(walletAddress, etherscanApiKey);

    // 2. Compute summary stats
    const summary = computeSummary(transactions, walletAddress);

    // 3. Get AI risk analysis
    const aiAnalysis = await analyzeWithAI(summary, aiApiKey);

    return res.json({
      walletAddress,
      transactionCount: transactions.length,
      summary,
      riskScore: aiAnalysis.riskScore,
      explanation: aiAnalysis.explanation,
    });
  } catch (err) {
    console.error("Analysis error:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

function computeSummary(transactions, walletAddress) {
  if (transactions.length === 0) {
    return {
      totalTransactions: 0,
      totalValueETH: 0,
      uniqueAddresses: 0,
      avgValueETH: 0,
      incomingCount: 0,
      outgoingCount: 0,
      timeSpanDays: 0,
    };
  }

  const addr = walletAddress.toLowerCase();
  let totalValue = 0;
  let incomingCount = 0;
  let outgoingCount = 0;
  const uniqueAddresses = new Set();
  const timestamps = [];

  for (const tx of transactions) {
    const valueETH = parseInt(tx.value) / 1e18;
    totalValue += valueETH;
    timestamps.push(parseInt(tx.timeStamp));

    if (tx.to.toLowerCase() === addr) {
      incomingCount++;
      uniqueAddresses.add(tx.from.toLowerCase());
    } else {
      outgoingCount++;
      uniqueAddresses.add(tx.to.toLowerCase());
    }
  }

  const minTime = Math.min(...timestamps);
  const maxTime = Math.max(...timestamps);
  const timeSpanDays = Math.max(
    ((maxTime - minTime) / 86400).toFixed(1),
    0
  );

  return {
    totalTransactions: transactions.length,
    totalValueETH: parseFloat(totalValue.toFixed(4)),
    uniqueAddresses: uniqueAddresses.size,
    avgValueETH: parseFloat((totalValue / transactions.length).toFixed(4)),
    incomingCount,
    outgoingCount,
    timeSpanDays: parseFloat(timeSpanDays),
  };
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
