# Verification Evidence & Test Suite

This document contains reproducible test calls and expected output for reviewers validating the Multipu Hackathon submission.

---

## 1. Public Health Check

```bash
curl -X GET https://multipu.fun/api/health \
  -H "Accept: application/json"
```

**Expected status code:** `200 OK`  
**Expected response contains:** `status: "ok"`, `service: "multipu"`, `mcp: { enabled: true }`.

---

## 2. OlaXBT Nexus Strategy Signal API

```bash
curl -X GET "https://multipu.fun/api/olaxbt/signals?symbol=GPU" \
  -H "Accept: application/json"
```

**Expected response contains:**
- `success: true`
- `protocol: "OlaXBT Nexus MCP"`
- `signal.momentumScore` (number between 15-99)
- `signal.trendDirection` (`bullish` / `bearish` / `neutral`)
- `signal.recommendation`

---

## 3. Multi-Chain Wallet Balances API

```bash
curl -X GET "https://multipu.fun/api/wallet/balances" \
  -H "Accept: application/json"
```

**Expected response contains:**
- `balances.solana.symbol`: `"SOL"`
- `balances.bsc.symbol`: `"BNB"`
- `balances.robinhood.symbol`: `"ETH"`

---

## 4. MCP JSON-RPC Server Test

Run the MCP server locally over standard I/O:

```bash
node .agents/plugins/multipu/server.js
```

### Request 1: Initialize
```json
{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test-client","version":"1.0.0"}}}
```

### Response 1:
```json
{"jsonrpc":"2.0","id":1,"result":{"protocolVersion":"2024-11-05","capabilities":{"tools":{}},"serverInfo":{"name":"multipu-mcp","version":"1.0.0"}}}
```

### Request 2: List Tools
```json
{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}
```

### Response 2:
Returns tool definitions for `multipu_get_live_memes`, `multipu_get_wallet_balances`, `multipu_swap_tokens`, `olaxbt_get_strategy_signals`, and `multipu_generate_api_key`.
