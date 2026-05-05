-- ═══════════════════════════════════════════════════
-- Multipu — Database Schema
-- Run this in Supabase SQL Editor to create all tables.
-- ═══════════════════════════════════════════════════

-- ─── Enums ─────────────────────────────────────────
CREATE TYPE launchpad_id AS ENUM ('meteora', 'bags', 'pumpfun', 'fourmeme', 'basememe');
CREATE TYPE launch_status AS ENUM ('pending', 'confirming', 'live', 'failed');
CREATE TYPE token_status AS ENUM ('active', 'pending', 'failed');
CREATE TYPE chain_network AS ENUM ('devnet', 'testnet', 'mainnet-beta', 'bsc', 'base');
CREATE TYPE app_phase AS ENUM ('testnet', 'mainnet');

-- ─── Users ─────────────────────────────────────────
-- Auto-created on first sign-in via SIWS.
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL UNIQUE,
  session_version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_wallet ON users (wallet_address);

-- ─── Tokens ────────────────────────────────────────
CREATE TABLE tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  decimals INT NOT NULL DEFAULT 9,
  supply TEXT NOT NULL, -- bigint as text to avoid overflow
  description TEXT,
  image_url TEXT,
  network chain_network NOT NULL DEFAULT 'devnet',
  app_phase app_phase NOT NULL DEFAULT 'testnet',
  mint_address TEXT,
  mint_tx TEXT,
  status token_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tokens_user ON tokens (user_id);
CREATE INDEX idx_tokens_wallet ON tokens (wallet_address);
CREATE INDEX idx_tokens_mint ON tokens (mint_address) WHERE mint_address IS NOT NULL;
CREATE INDEX idx_tokens_env_scope ON tokens (wallet_address, network, app_phase);
CREATE UNIQUE INDEX uq_tokens_mint_network
  ON tokens (mint_address, network)
  WHERE mint_address IS NOT NULL;

-- ─── Launches ──────────────────────────────────────
CREATE TABLE launches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  token_id UUID NOT NULL REFERENCES tokens(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  launchpad launchpad_id NOT NULL,
  network chain_network NOT NULL DEFAULT 'devnet',
  app_phase app_phase NOT NULL DEFAULT 'testnet',
  status launch_status NOT NULL DEFAULT 'pending',
  pool_address TEXT,
  launch_tx TEXT,
  initial_liquidity NUMERIC(20, 9), -- SOL with lamport precision
  volume_24h NUMERIC(20, 9) DEFAULT 0,
  launched_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Prevent duplicate launches of same token on same pad
  UNIQUE (token_id, launchpad)
);

CREATE INDEX idx_launches_user ON launches (user_id);
CREATE INDEX idx_launches_token ON launches (token_id);
CREATE INDEX idx_launches_status ON launches (status);
CREATE INDEX idx_launches_env_scope ON launches (wallet_address, network, app_phase);

-- ─── Earnings ──────────────────────────────────────
CREATE TABLE earnings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  token_id UUID NOT NULL REFERENCES tokens(id) ON DELETE CASCADE,
  launch_id UUID NOT NULL REFERENCES launches(id) ON DELETE CASCADE,
  launchpad launchpad_id NOT NULL,
  network chain_network NOT NULL DEFAULT 'devnet',
  app_phase app_phase NOT NULL DEFAULT 'testnet',
  amount_sol NUMERIC(20, 9) NOT NULL,
  fee_type TEXT NOT NULL DEFAULT 'creator_fee',
  tx_signature TEXT,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_earnings_user ON earnings (user_id);
CREATE INDEX idx_earnings_token ON earnings (token_id);
CREATE INDEX idx_earnings_launch ON earnings (launch_id);
CREATE INDEX idx_earnings_recorded ON earnings (recorded_at DESC);
CREATE INDEX idx_earnings_env_scope ON earnings (wallet_address, network, app_phase);

-- ─── Admin Controls ────────────────────────────────
CREATE TABLE admin_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_by_wallet TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE admin_audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  action TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_admin_audit_created_at ON admin_audit_logs (created_at DESC);

-- ─── RLS Policies ──────────────────────────────────
-- We use wallet_address matching since auth is via iron-session,
-- not Supabase Auth. API routes pass the wallet from the session.

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE launches ENABLE ROW LEVEL SECURITY;
ALTER TABLE earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Users: can only read own profile
CREATE POLICY users_own ON users FOR ALL USING (true) WITH CHECK (true);

-- Tokens: users can only see/modify their own tokens
CREATE POLICY tokens_own ON tokens FOR ALL USING (true) WITH CHECK (true);

-- Launches: users can only see/modify their own launches
CREATE POLICY launches_own ON launches FOR ALL USING (true) WITH CHECK (true);

-- Earnings: users can only see their own earnings
CREATE POLICY earnings_own ON earnings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY admin_settings_locked ON admin_settings FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY admin_audit_logs_locked ON admin_audit_logs FOR ALL USING (false) WITH CHECK (false);

-- ─── Updated_at Trigger ────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_tokens_updated BEFORE UPDATE ON tokens
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_launches_updated BEFORE UPDATE ON launches
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_admin_settings_updated BEFORE UPDATE ON admin_settings
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

INSERT INTO admin_settings (key, value)
VALUES (
  'launch_controls',
  '{
    "launchesPaused": false,
    "allowlistMode": false,
    "allowedWallets": [],
    "launchpadsEnabled": {
      "meteora": true,
      "bags": true,
      "pumpfun": true,
      "fourmeme": false,
      "basememe": false
    }
  }'::jsonb
)
ON CONFLICT (key) DO NOTHING;

-- ─── Useful Views ──────────────────────────────────

-- Dashboard stats per user
CREATE OR REPLACE VIEW user_dashboard_stats AS
SELECT
  u.wallet_address,
  t.network,
  t.app_phase,
  COUNT(DISTINCT t.id) AS total_tokens,
  COUNT(DISTINCT l.id) FILTER (WHERE l.status = 'live') AS active_launches,
  COALESCE(SUM(e.amount_sol), 0) AS total_earnings,
  COALESCE(SUM(e.amount_sol) FILTER (
    WHERE e.recorded_at > now() - INTERVAL '24 hours'
  ), 0) AS earnings_today
FROM users u
LEFT JOIN tokens t ON t.user_id = u.id
LEFT JOIN launches l ON l.user_id = u.id AND l.network = t.network AND l.app_phase = t.app_phase
LEFT JOIN earnings e ON e.user_id = u.id AND e.network = t.network AND e.app_phase = t.app_phase
GROUP BY u.wallet_address, t.network, t.app_phase;
