import { z } from "zod";

// ─── Solana Address Validator ──────────────────────
const solanaAddress = z
  .string()
  .regex(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/, "Invalid Solana address");

// ─── Token Creation ────────────────────────────────
export const createTokenSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(32, "Name must be 32 chars or less")
    .trim(),
  symbol: z
    .string()
    .min(1, "Symbol is required")
    .max(10, "Symbol must be 10 chars or less")
    .toUpperCase()
    .trim(),
  supply: z
    .string()
    .regex(/^\d+$/, "Supply must be a whole number")
    .refine((s) => BigInt(s) > 0n, "Supply must be greater than 0")
    .refine(
      (s) => BigInt(s) <= 1_000_000_000_000_000n,
      "Supply exceeds maximum (1 quadrillion)"
    ),
  decimals: z.coerce.number().int().min(0).max(9).default(9),
  description: z.string().max(500, "Description too long").optional().default(""),
  imageUrl: z.string().url().optional().nullable(),
});

export type CreateTokenInput = z.infer<typeof createTokenSchema>;

// ─── Confirm Token Mint ────────────────────────────
export const confirmTokenSchema = z.object({
  tokenId: z.string().uuid(),
  mintAddress: solanaAddress,
  mintTx: z.string().min(1),
});

export type ConfirmTokenInput = z.infer<typeof confirmTokenSchema>;

// ─── Create Launch ─────────────────────────────────
export const createLaunchSchema = z.object({
  tokenId: z.string().uuid(),
  launchpad: z.enum(["meteora", "bags", "pumpfun"]),
  initialLiquidity: z.coerce.number().positive().optional(),
});

export type CreateLaunchInput = z.infer<typeof createLaunchSchema>;

// ─── Confirm Launch ────────────────────────────────
export const confirmLaunchSchema = z.object({
  launchId: z.string().uuid(),
  poolAddress: solanaAddress,
  launchTx: z.string().min(1),
  initialLiquidity: z.coerce.number().nonnegative().optional(),
});

export type ConfirmLaunchInput = z.infer<typeof confirmLaunchSchema>;

// ─── Record Earning ────────────────────────────────
export const recordEarningSchema = z.object({
  tokenId: z.string().uuid(),
  launchId: z.string().uuid(),
  launchpad: z.enum(["meteora", "bags", "pumpfun"]),
  amountSol: z.coerce.number().positive(),
  feeType: z.enum(["creator_fee", "lp_fee", "referral"]).default("creator_fee"),
  txSignature: z.string().optional(),
});

export type RecordEarningInput = z.infer<typeof recordEarningSchema>;

// ─── Image Upload ──────────────────────────────────
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;
