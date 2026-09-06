# Multipu — X-Agent AI MCP Hackathon 2026 Submission

**Track:** OlaXBT × X-Agent Trading Challenge & General MCP Innovation  
**Team / Builder:** wisdomnova  
**Project Slug:** `wisdomnova-multipu`  
**Live URL:** [https://multipu.fun](https://multipu.fun)  
**Public Health & Verification Endpoint:** [https://multipu.fun/api/health](https://multipu.fun/api/health)  
**GitHub Repository:** [https://github.com/wisdomnova/multipu](https://github.com/wisdomnova/multipu)  

---

## 1. Project Overview

**Multipu** is an AI-orchestrated multi-chain token launch orchestrator and DEX trading terminal spanning **Solana, BNB Chain, and Robinhood**. It integrates with the **OlaXBT Nexus MCP** protocol to evaluate real-time market momentum, algorithmic trading strategies, and bonding curve liquidity.

Through its native **Model Context Protocol (MCP)** server, any AI agent (Claude, ChatGPT, X-Agent, Cursor) can autonomously discover active meme tokens, query live multi-chain wallet balances, execute instant bonding curve swaps, and generate strategy-driven trade decisions.

---

## 2. Capabilities & MCP Tools

The Multipu MCP Server (`multipu-mcp`) implements the standard Model Context Protocol (version `2024-11-05`) and exposes 5 tools:

| MCP Tool | Description |
| :--- | :--- |
| `multipu_get_live_memes` | Queries live token bonding curves across Solana, BNB Chain, and Robinhood with pagination and search. |
| `multipu_get_wallet_balances` | Fetches real-time multi-chain wallet balances (`SOL`, `BNB`, `ETH`). |
| `multipu_swap_tokens` | Executes bonding curve buy/sell swaps and 1-click snipes against active launch pools. |
| `olaxbt_get_strategy_signals` | Queries OlaXBT Nexus market analysis, momentum scores (0-100), and strategy recommendations. |
| `multipu_generate_api_key` | Programmatically generates developer access keys for automated agent workflows. |

---

## 3. OlaXBT Nexus Integration

Multipu utilizes OlaXBT Nexus market data to surface AI Alpha metrics directly in the terminal:
- **Momentum Score (0–100)**: Evaluates volume surge and bonding curve velocity.
- **Strategy Classifier**: Identifies high-conviction momentum breakouts, liquidity surges, and whale accumulation.
- **Trade Recommendation**: Categorizes tokens as `Strong Buy`, `Accumulate`, `Neutral`, or `Caution`.

---

## 4. Quick Verification & Operating Instructions

### Health Check (Public Verification)
```bash
curl -s https://multipu.fun/api/health
```

**Expected JSON Response:**
```json
{
  "status": "ok",
  "service": "multipu",
  "version": "1.0.0",
  "supportedChains": [
    { "id": "solana", "name": "Solana", "gas": "SOL" },
    { "id": "bsc", "name": "BNB Smart Chain", "gas": "BNB" },
    { "id": "robinhood", "name": "Robinhood Chain", "gas": "ETH" }
  ],
  "mcp": {
    "enabled": true,
    "protocol": "2024-11-05",
    "server": "multipu-mcp"
  }
}
```

### Query OlaXBT Nexus Signal
```bash
curl -s "https://multipu.fun/api/olaxbt/signals?symbol=GPU"
```

### Run MCP Server Locally
```bash
node .agents/plugins/multipu/server.js
```
Send JSON-RPC initialization:
```json
{"jsonrpc":"2.0","id":1,"method":"tools/list"}
```

---

## 5. Security & Non-Custodial Architecture

- Non-custodial Web3 Authentication: Sign-In with Solana (SIWS) and Sign-In with Binance/EVM (SIWB).
- End-to-end client-signed transactions with on-chain verification.
- HTTP-only encrypted session cookies with iron-session.
- Zero custodial user deposits.
