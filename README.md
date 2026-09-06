# Multipu

Multipu is a multi-chain token launch orchestrator and real-time DEX trading terminal: create a token once, launch across multiple platforms (Solana, BNB Chain, Robinhood), trade live meme tokens, and monitor multi-chain balances from a unified dashboard.

## Features

- **Multi-Chain Token Orchestrator**: One-click dispatch to launchpads across Solana (Pump.fun, Raydium, Meteora, Bags), BNB Chain (Four.meme), and Robinhood Chain (Pons).
- **Terminal Trading & Live Explorer**: Real-time DEX data, bonding curve progress tracker, candlestick charts, and instant snipes.
- **Unified Multi-Chain Balances**: Live balance monitoring for Solana (SOL), BNB Chain (BNB), and Robinhood Chain (ETH) directly on the dashboard header.
- **Developer API & Webhooks**: Programmatic token deployments, portfolio tracking, and analytics endpoints.
- **Web3 Wallet Sign-In**: Non-custodial authentication with Sign-In with Solana (SIWS) and Sign-In with EVM / Binance (SIWB).

## Supported Chains & Launchpads

| Chain | Native Gas | Supported Protocols |
| :--- | :--- | :--- |
| **Solana** | `SOL` | Pump.fun, Raydium, Meteora, Bags |
| **BNB Chain (BSC)** | `BNB` | Four.meme, PancakeSwap |
| **Robinhood Chain** | `ETH` | Pons DEX & Launchpad |

## Setup & Local Development

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env.local` and fill in secrets:

```bash
cp .env.example .env.local
```

3. Run `sql/schema.sql` in Supabase SQL Editor.

4. Start the development server:

```bash
npm run dev
```

## Environment Safety Controls

Multipu ships with a mainnet safety lock for testnet rollout phases:

- `NEXT_PUBLIC_SOLANA_NETWORK`: Solana cluster (`devnet`, `testnet`, `mainnet-beta`)
- `NEXT_PUBLIC_APP_PHASE`: deployment phase (`testnet` or `mainnet`)
- `NEXT_PUBLIC_ENABLE_MAINNET_LAUNCHES`: client-side gate for launch UI
- `ENABLE_MAINNET_LAUNCHES`: server-side hard gate for launch APIs
- `ENABLE_EVM_LAUNCH_ADAPTERS`: server-side gate for EVM launch verification paths
- `NEXT_PUBLIC_ENABLE_EVM_LAUNCH_ADAPTERS`: client-side gate for EVM launch execution
- `NEXT_PUBLIC_BSC_RPC_URL`: BNB Smart Chain RPC endpoint
- `NEXT_PUBLIC_ROBINHOOD_RPC_URL`: Robinhood Chain RPC endpoint
- `NEXT_PUBLIC_FOURMEME_LAUNCHER_ADDRESS`: launcher contract used by wallet tx for Four.meme
- `ADMIN_WALLETS`: comma-separated wallet addresses allowed to access admin controls

Mainnet launches are only allowed when both phase and gate flags are explicitly enabled.

## Environment Data Isolation

`tokens`, `launches`, and `earnings` are scoped by `network` and `app_phase`. API reads/writes are filtered by current runtime scope, so testnet and mainnet records stay separated.

## Admin Controls API

Use `GET` / `PATCH` on `/api/admin/settings` (admin wallets only) to manage launch controls:

- Global pause (`launchesPaused`)
- Allowlist mode (`allowlistMode`, `allowedWallets`)
- Per-launchpad enablement (`launchpadsEnabled`)

## Security Model

- Wallet signature authentication (nonce challenge + verification)
- SIWS (`/api/auth/challenge` + `/api/auth/verify`) and SIWB backend (`/api/auth/challenge-evm` + `/api/auth/verify-evm`)
- EVM launch verification (signer, target contract, and function selector)
- HttpOnly encrypted sessions (`iron-session`)
- Same-origin validation on mutating API routes
- IP rate limiting
- On-chain transaction verification before token/launch state is marked successful
