const fs = require("fs");
const path = require("path");
const readline = require("readline");

// Custom environment file loader to read config autonomously
function loadEnv() {
  const paths = [
    path.join(__dirname, ".env.local"),
    path.join(__dirname, ".env"),
    path.join(process.cwd(), ".env.local"),
    path.join(process.cwd(), ".env"),
    "/Users/user/multipu/.env.local",
    "/Users/user/multipu/.env"
  ];
  
  const env = { ...process.env };
  
  for (const p of paths) {
    if (fs.existsSync(p)) {
      try {
        const content = fs.readFileSync(p, "utf8");
        const lines = content.split("\n");
        for (const line of lines) {
          const match = line.trim().match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
          if (match) {
            const key = match[1];
            let value = match[2] || "";
            if (value.startsWith('"') && value.endsWith('"')) {
              value = value.substring(1, value.length - 1);
            } else if (value.startsWith("'") && value.endsWith("'")) {
              value = value.substring(1, value.length - 1);
            }
            if (!env[key]) {
              env[key] = value.trim();
            }
          }
        }
      } catch (err) {
        // ignore
      }
    }
  }
  return env;
}

const config = loadEnv();
const API_URL = config.MULTIPU_API_URL || "http://localhost:3001";
const API_KEY = config.MULTIPU_API_KEY || "mp_live_default_key";

// Stdout JSON-RPC sender helpers
function sendResponse(id, result) {
  process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id, result }) + "\n");
}

function sendError(id, code, message, data) {
  process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id, error: { code, message, data } }) + "\n");
}

// Multipu HTTP API caller
async function callApi(endpoint, method = "GET", body = null) {
  const url = `${API_URL}${endpoint}`;
  const headers = {
    "Content-Type": "application/json",
    "x-api-key": API_KEY,
  };
  
  const options = {
    method,
    headers,
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  const res = await fetch(url, options);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `HTTP error ${res.status}`);
  }
  return data;
}

// JSON-RPC message router
async function handleMessage(msg) {
  const { method, params, id } = msg;

  if (method === "initialize") {
    return sendResponse(id, {
      protocolVersion: "2024-11-05",
      capabilities: {
        tools: {}
      },
      serverInfo: {
        name: "multipu-mcp",
        version: "1.0.0"
      }
    });
  }

  if (method === "notifications/initialized") {
    // client completed handshakes
    return;
  }

  if (method === "tools/list") {
    return sendResponse(id, {
      tools: [
        {
          name: "multipu_get_live_memes",
          description: "Search and retrieve a paginated directory of active token launches on Multipu.",
          inputSchema: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "Optional query term (e.g. 'pepe') to filter tokens by name or symbol."
              },
              page: {
                type: "number",
                description: "Page number to fetch (default 1)."
              }
            }
          }
        },
        {
          name: "multipu_get_wallet_balance",
          description: "Get the current public key, chain network, and token balance of the active server developer wallet.",
          inputSchema: {
            type: "object",
            properties: {}
          }
        },
        {
          name: "multipu_swap_tokens",
          description: "Execute a swap trade (buy or sell) against an active token launch pool.",
          inputSchema: {
            type: "object",
            properties: {
              launchId: {
                type: "string",
                description: "The unique launch UUID of the token pool to trade."
              },
              action: {
                type: "string",
                enum: ["buy", "sell"],
                description: "The swap transaction type: 'buy' (spend SOL/BNB to receive meme token) or 'sell' (spend meme token to receive SOL/BNB)."
              },
              amount: {
                type: "number",
                description: "The amount of input asset to spend (base gas currency for buy, or token amount for sell)."
              }
            },
            required: ["launchId", "action", "amount"]
          }
        },
        {
          name: "multipu_generate_api_key",
          description: "Generate a new programmatic developer API Key label.",
          inputSchema: {
            type: "object",
            properties: {
              name: {
                type: "string",
                description: "The label description for the key (e.g. 'Arbitrage Bot')."
              }
            },
            required: ["name"]
          }
        }
      ]
    });
  }

  if (method === "tools/call") {
    const { name, arguments: args } = params;
    
    try {
      if (name === "multipu_get_live_memes") {
        const queryStr = args.query ? `q=${encodeURIComponent(args.query)}` : "";
        const pageStr = args.page ? `page=${args.page}` : "";
        const qs = [queryStr, pageStr].filter(Boolean).join("&");
        const endpoint = `/api/launches/explore${qs ? `?${qs}` : ""}`;
        
        const data = await callApi(endpoint);
        return sendResponse(id, {
          content: [
            {
              type: "text",
              text: JSON.stringify(data, null, 2)
            }
          ]
        });
      }

      if (name === "multipu_get_wallet_balance") {
        const data = await callApi("/api/developer/wallet");
        return sendResponse(id, {
          content: [
            {
              type: "text",
              text: JSON.stringify(data, null, 2)
            }
          ]
        });
      }

      if (name === "multipu_swap_tokens") {
        const exchangeRate = 1000000;
        const amountNum = Number(args.amount);
        const amountReceiveNum = args.action === "buy" ? amountNum * exchangeRate : amountNum / exchangeRate;
        
        const payload = {
          launchId: args.launchId,
          type: args.action,
          amountPay: amountNum,
          amountReceive: amountReceiveNum,
          txSignature: "mcp-tx-sig-" + Math.random().toString(36).substring(2, 11),
        };
        
        const data = await callApi("/api/trade/swap", "POST", payload);
        return sendResponse(id, {
          content: [
            {
              type: "text",
              text: `Swap executed successfully!\nDetails: ${JSON.stringify(data, null, 2)}`
            }
          ]
        });
      }

      if (name === "multipu_generate_api_key") {
        const data = await callApi("/api/developer/api-keys", "POST", { name: args.name });
        return sendResponse(id, {
          content: [
            {
              type: "text",
              text: `Developer API Key created successfully!\nKey: ${data.key?.api_key || "Masked"}\nDetails: ${JSON.stringify(data, null, 2)}`
            }
          ]
        });
      }

      return sendError(id, -32601, `Method not found: ${name}`);
    } catch (apiErr) {
      return sendResponse(id, {
        content: [
          {
            type: "text",
            text: `Error calling Multipu API: ${apiErr.message}`
          }
        ],
        isError: true
      });
    }
  }

  sendError(id, -32601, `Method not found: ${method}`);
}

// Listen to stdin
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

rl.on("line", async (line) => {
  if (!line.trim()) return;
  try {
    const msg = JSON.parse(line);
    await handleMessage(msg);
  } catch (err) {
    sendError(null, -32700, "Parse error: " + err.message);
  }
});
