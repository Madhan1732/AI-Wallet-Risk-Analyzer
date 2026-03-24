const https = require("https");

/**
 * Fetch last 10 normal transactions for a wallet from Etherscan.
 */
async function fetchTransactions(walletAddress, apiKey) {
  const url =
    `https://api.etherscan.io/v2/api?chainid=1&module=account&action=txlist` +
    `&address=${encodeURIComponent(walletAddress)}` +
    `&startblock=0&endblock=99999999&page=1&offset=10` +
    `&sort=desc&apikey=${encodeURIComponent(apiKey)}`;

  const data = await httpGet(url);

  if (data.status !== "1" || !Array.isArray(data.result)) {
    if (data.message === "No transactions found") {
      return [];
    }
    throw new Error(data.result || "Failed to fetch transactions from Etherscan.");
  }

  return data.result;
}

/**
 * Send transaction summary to Claude API and get risk analysis.
 */
async function analyzeWithAI(summary, apiKey) {
  const prompt = buildPrompt(summary);

  const body = JSON.stringify({
    model: "gpt-4o-mini",
    max_tokens: 512,
    messages: [
      { role: "system", content: "You are a blockchain risk analyst." },
      { role: "user", content: prompt },
    ],
  });

  const options = {
    hostname: "api.openai.com",
    path: "/v1/chat/completions",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
  };

  const data = await httpRequest(options, body);
  console.log("OpenAI API response:", JSON.stringify(data, null, 2));

  if (data.error) {
    const errMsg = data.error.message || JSON.stringify(data.error);
    console.error("OpenAI API error:", errMsg);
    throw new Error(`AI API error: ${errMsg}`);
  }

  const text = data.choices?.[0]?.message?.content || "";
  return parseAIResponse(text);
}

function buildPrompt(summary) {
  return `You are a blockchain risk analyst. Analyze this Ethereum wallet's transaction summary and provide a risk assessment.

Transaction Summary:
- Total transactions: ${summary.totalTransactions}
- Total value: ${summary.totalValueETH} ETH
- Average value per tx: ${summary.avgValueETH} ETH
- Unique addresses interacted with: ${summary.uniqueAddresses}
- Incoming transactions: ${summary.incomingCount}
- Outgoing transactions: ${summary.outgoingCount}
- Activity time span: ${summary.timeSpanDays} days

Respond in EXACTLY this JSON format (no markdown, no code fences):
{
  "riskScore": "Low" or "Medium" or "High",
  "explanation": "2-3 sentence explanation of the risk assessment"
}`;
}

function parseAIResponse(text) {
  try {
    // Try parsing directly
    const parsed = JSON.parse(text.trim());
    return {
      riskScore: parsed.riskScore || "Unknown",
      explanation: parsed.explanation || "Unable to parse AI response.",
    };
  } catch {
    // Try extracting JSON from the response
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        const parsed = JSON.parse(match[0]);
        return {
          riskScore: parsed.riskScore || "Unknown",
          explanation: parsed.explanation || "Unable to parse AI response.",
        };
      } catch {
        // Fall through
      }
    }
    return {
      riskScore: "Unknown",
      explanation: text.slice(0, 300),
    };
  }
}

// Simple HTTPS GET using built-in https module (no axios needed)
function httpGet(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          try {
            resolve(JSON.parse(body));
          } catch {
            reject(new Error("Invalid JSON response from Etherscan."));
          }
        });
      })
      .on("error", reject);
  });
}

function httpRequest(options, postBody) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          resolve(JSON.parse(body));
        } catch {
          reject(new Error("Invalid JSON response from AI API."));
        }
      });
    });
    req.on("error", reject);
    req.write(postBody);
    req.end();
  });
}

module.exports = { fetchTransactions, analyzeWithAI };
