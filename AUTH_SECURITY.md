# Authentication Security Implementation

## Overview
This document outlines the comprehensive security architecture for the multi-chain authentication system (Solana + EVM/BSC + OAuth placeholders).

## Authentication Flows

### 1. Solana (SIWS - Sign In With Solana)

**Flow:**
```
User → GET /api/auth/challenge → Server generates nonce
     → Wallet signs nonce with private key
     → POST /api/auth/verify → Server verifies signature
     → Session created (iron-session httpOnly cookie)
```

**Security Measures:**
- **Nonce Validation**: Each challenge is unique and one-time use only
- **Replay Attack Prevention**: Nonce is stored in session and cleared after verification
- **Signature Verification**: Uses NaCl cryptographic verification with wallet's public key
- **Rate Limiting**: 10 attempts per minute per IP (configurable in `lib/rate-limit.ts`)
- **Origin Checking**: CSRF protection via `assertTrustedOrigin()` middleware
- **Secure Storage**: Session data encrypted with `iron-session` and stored in httpOnly cookie

### 2. EVM/BSC (SIWB - Sign In With Blockchain)

**Flow:**
```
User → GET /api/auth/challenge-evm → Server builds SIWB message with nonce
     → Wallet signs message with private key
     → POST /api/auth/verify-evm → Server recovers address from signature
     → Session created (iron-session httpOnly cookie)
```

**SIWB Message Format:**
```
{domain} wants you to sign in with your Ethereum account:
{walletAddress}

{statement}

URI: {uri}
Version: 1
Chain ID: {chainId}
Nonce: {nonce}
```

**Security Measures:**
- **Address Recovery**: Uses ethers.js `verifyMessage()` to recover signing address
- **Checksum Verification**: Addresses normalized to checksummed format
- **Nonce Inclusion**: Nonce embedded in message to prevent replay attacks
- **Chain ID Validation**: Chain ID specified in message for network isolation
- **Message Integrity**: Full message structure prevents tampering
- **Rate Limiting**: Same 10 attempts per minute per IP limit
- **Origin Checking**: CSRF protection applies to all auth endpoints

## Database Integration

### User Persistence
```sql
-- Simplified user table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  session_version INT DEFAULT 1
);
```

**Features:**
- **Wallet Address Uniqueness**: One user per wallet (prevents duplicate accounts)
- **Session Versioning**: Allows invalidating all sessions for a user (security feature)
- **Admin Operations**: Using admin Supabase client for secure server-side upserts
- **Graceful Degradation**: Auth still works if database is unavailable (optional feature)

## Rate Limiting

**Configuration** (`lib/rate-limit.ts`):
- **Window**: 60 seconds (1 minute)
- **Limit**: 10 attempts per window per IP
- **Storage**: In-memory Map (can be swapped for Redis in production)

**Headers Returned**:
```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 8
X-RateLimit-Reset: 45
```

**Attack Prevention**:
- Brute force protection
- Prevents signature verification hammering
- IP-based (works on Vercel, Cloudflare, direct connections)

## CSRF Protection

**Implementation** (`lib/request-security.ts`):
- **Origin Checking**: Validates request origin against expected origin
- **Protocol Support**: Works with x-forwarded-proto header (Vercel, Cloudflare)
- **Host Validation**: Validates against x-forwarded-host header
- **Same-Origin Only**: All auth mutations require matching origin

## Session Management

**Configuration** (`lib/session.ts`):
- **Encryption**: AES-256 via iron-session
- **Storage**: httpOnly cookie (immune to XSS)
- **Secure Flag**: Cookie sent only over HTTPS in production
- **SameSite**: Strict same-site policy

**Session Data**:
```typescript
interface SessionData {
  walletAddress: string;      // Normalized wallet address
  walletKind: "solana" | "evm"; // Auth method used
  isLoggedIn: boolean;        // Login state
  v: number;                  // Session version (for revocation)
}
```

## Component Architecture

### SignInModal (`components/signin-modal.tsx`)
- **State Management**: Tracks which auth method user selected
- **Error Handling**: Toast notifications for all failures
- **Loading States**: Visual feedback during connection
- **Auto-closing**: Modal closes on successful sign-in

### WalletButton (`components/wallet-button.tsx`)
- **Three States**:
  1. **Not Connected**: Shows "Sign In" button (opens modal)
  2. **Connected but Not Signed**: Shows "Sign In" button (triggers auth flow)
  3. **Signed In**: Shows wallet address with disconnect option
- **Loading Indicators**: Shows spinner during operations
- **Error Recovery**: Can retry failed attempts

### useAuth Hook (`hooks/use-auth.tsx`)
- **Methods Available**:
  - `signIn()`: Auto-detects wallet and signs
  - `signInWithSolana()`: Solana-specific flow
  - `signInWithEvm()`: EVM/BSC-specific flow
  - `connectEvmWallet()`: Just connects without signing
  - `signOut()`: Destroys session and disconnects
- **State Tracking**: Maintains auth state and session info
- **Error Handling**: Comprehensive error messages and logging

## API Endpoints

### `GET /api/auth/challenge`
- **Security**: Rate limited, CORS safe
- **Response**: `{ nonce: string }`
- **Storage**: Nonce stored in session cookie

### `POST /api/auth/verify`
- **Security**: Rate limited, origin checked, nonce validated
- **Request**: `{ walletAddress: string, signature: string }`
- **Validation**:
  1. Check nonce exists
  2. Verify signature against public key
  3. Create/update user in database
  4. Set authenticated session
- **Response**: `{ ok: true, walletAddress: string }`

### `GET /api/auth/challenge-evm`
- **Security**: Rate limited, CORS safe
- **Response**: `{ nonce: string, chainId: number, domain: string, uri: string, statement: string }`
- **Storage**: Nonce stored in session cookie (different key: evmNonce)

### `POST /api/auth/verify-evm`
- **Security**: Rate limited, origin checked, nonce validated
- **Request**: `{ walletAddress: string, message: string, signature: string }`
- **Validation**:
  1. Check nonce in message
  2. Recover address from signature
  3. Verify recovered address matches submitted address
  4. Create/update user in database
  5. Set authenticated session
- **Response**: `{ ok: true, walletAddress: string, walletKind: string }`

### `GET /api/auth/session`
- **Security**: No rate limit (read-only)
- **Response**: Current session data or default empty session

### `DELETE /api/auth/session`
- **Security**: Rate limited, origin checked
- **Effect**: Destroys session cookie and clears client state

## Threat Model & Mitigations

### Threat: Signature Replay Attack
- **Mitigation**: One-time nonces stored in session
- **Validation**: Nonce must match stored value and is cleared after use

### Threat: Message Tampering
- **Mitigation**: SIWB message includes all relevant data; any tampering invalidates signature
- **Validation**: Signature verification requires exact message match

### Threat: Phishing/MITM
- **Mitigation**: Origin checking ensures requests come from legitimate domain
- **Validation**: Blockchain signature proves user control of private key
- **Additional**: User must approve transaction in wallet UI

### Threat: Brute Force
- **Mitigation**: Rate limiting on auth endpoints
- **Config**: 10 attempts per minute per IP
- **Monitoring**: Rate limit headers inform client of remaining attempts

### Threat: Session Hijacking
- **Mitigation**: httpOnly cookies immune to XSS
- **Config**: Secure flag (HTTPS-only in production)
- **Additional**: SameSite strict policy prevents CSRF

### Threat: Account Takeover
- **Mitigation**: Only wallet private key holder can sign
- **Recovery**: No password reset needed (wallet is the recovery mechanism)

### Threat: Cross-Chain Confusion
- **Mitigation**: Chain ID embedded in SIWB message
- **Validation**: Chain ID must match expected network

## OAuth Placeholder Implementation

Google and X OAuth endpoints are currently placeholders:
```typescript
// These will be implemented with full PKCEflow:
1. Authorization Code Request
2. PKCE challenge/verifier
3. Secure token exchange
4. User info retrieval
5. Account linking/creation
```

## Production Checklist

- [ ] Replace in-memory rate limiter with Redis
- [ ] Enable HTTPS/TLS for all endpoints
- [ ] Set httpOnly, Secure, SameSite flags on cookies
- [ ] Implement OAuth flows (Google, X)
- [ ] Set up database connection pooling
- [ ] Configure CORS properly for production domain
- [ ] Add WAF rules for auth endpoints
- [ ] Monitor rate limit usage and adjust as needed
- [ ] Set up session invalidation on password change (when applicable)
- [ ] Implement audit logging for auth events
- [ ] Add MFA support (optional for enhanced security)
- [ ] Implement IP whitelisting for admin operations

## Dependencies

- **@solana/web3.js**: Solana signature verification (NaCl)
- **ethers**: EVM signature verification and address recovery
- **iron-session**: Session encryption and storage
- **sonner**: Toast notifications for user feedback
- **framer-motion**: Smooth modal animations
- **lucide-react**: UI icons

## Testing Recommendations

1. **Unit Tests**: Verify signature validation logic
2. **Integration Tests**: Full auth flow from UI to session
3. **Security Tests**:
   - Replay attack attempts
   - Modified message attacks
   - Rate limit enforcement
   - CSRF protection
   - Session hijacking attempts
4. **Performance Tests**: Concurrent auth attempts
5. **Edge Cases**:
   - Missing nonce
   - Expired challenge
   - Invalid signature
   - User not found
   - Database errors

## Monitoring & Logging

Currently logs to console. For production:
1. Centralized logging (e.g., Datadog, Sentry)
2. Alert on repeated failures from same IP
3. Track unusual auth patterns
4. Monitor rate limit violations
5. Audit trail for successful logins
