# Multipu

Multipu is a Solana launch orchestrator: create a token once, launch across multiple platforms, and monitor activity from one dashboard.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env.local` and fill in secrets.
3. Run `sql/schema.sql` in Supabase SQL Editor.
4. Start the app:

```bash
npm run dev
```

## Environment Safety Controls

Multipu ships with a mainnet safety lock for testnet rollout phases.

- `NEXT_PUBLIC_SOLANA_NETWORK`: Solana cluster (`devnet`, `testnet`, `mainnet-beta`)
- `NEXT_PUBLIC_APP_PHASE`: deployment phase (`testnet` or `mainnet`)
- `NEXT_PUBLIC_ENABLE_MAINNET_LAUNCHES`: client-side gate for launch UI
- `ENABLE_MAINNET_LAUNCHES`: server-side hard gate for launch APIs
- `NEXT_PUBLIC_BASE_CHAIN_ID`: EVM chain ID for SIWB challenge defaults (Base mainnet = `8453`)
- `ENABLE_EVM_LAUNCH_ADAPTERS`: server-side gate for EVM launch verification paths
- `NEXT_PUBLIC_ENABLE_EVM_LAUNCH_ADAPTERS`: client-side gate for EVM launch execution
- `BSC_RPC_URL`: BNB Smart Chain RPC for `four.meme` adapter verification
- `NEXT_PUBLIC_FOURMEME_LAUNCHER_ADDRESS`: launcher contract used by wallet tx for four.meme
- `NEXT_PUBLIC_FOURMEME_LAUNCH_FUNCTION_SIGNATURE`: ABI signature to encode and verify (e.g. `createToken(string,string,string,string)`)
- `NEXT_PUBLIC_FOURMEME_LAUNCH_ARG_TEMPLATE`: JSON array template for function args (`$name`, `$symbol`, `$description`, `$imageUrl`, `$supply`, `$decimals`, `$supplyWei`)
- `ADMIN_WALLETS`: comma-separated wallet addresses allowed to change admin controls

Mainnet launches are only allowed when both phase and gate flags are explicitly enabled.

## Environment Data Isolation

`tokens`, `launches`, and `earnings` are scoped by `network` and `app_phase`.
API reads/writes are filtered by current runtime scope, so testnet and mainnet records stay separated.

If you already have a deployed database from an older schema, apply equivalent migrations before deploying this app version.

## Admin Controls API

Use `GET` / `PATCH` on `/api/admin/settings` (admin wallets only) to manage launch controls:

- global pause (`launchesPaused`)
- allowlist mode (`allowlistMode`, `allowedWallets`)
- per-launchpad enablement (`launchpadsEnabled`)

## Launch Policy Health

Use `GET /api/health/launch-policies` (admin wallets only) to inspect effective launch readiness:

- environment scope (phase/network)
- env flags (`ENABLE_MAINNET_LAUNCHES`, `ENABLE_EVM_LAUNCH_ADAPTERS`)
- admin controls (`launchesPaused`, allowlist mode, per-launchpad toggles)
- effective per-launchpad status + reason

## Launchpad Network Mapping (verified)

- `Meteora`, `Bags`, `Pump.fun`: Solana
- `Four.meme`: BNB Smart Chain (BSC)

`Four.meme` is fully integrated in launch flows and remains protected by env/admin safety gates.

EVM adapter verification framework is now in place and guarded by `ENABLE_EVM_LAUNCH_ADAPTERS`.

## Security Model

- Wallet signature auth (nonce challenge + verification)
- SIWS (`/api/auth/challenge` + `/api/auth/verify`) and SIWB backend (`/api/auth/challenge-evm` + `/api/auth/verify-evm`)
- `/launch` now supports SIWS (Solana) and SIWB (EVM) execution paths behind env and admin gates
- EVM launch verification now checks signer, target contract, and function selector (from configured ABI signature)
- HttpOnly encrypted sessions (`iron-session`)
- Same-origin checks on mutating API routes
- Rate limiting by client IP
- On-chain transaction verification before token/launch state is marked successful
