/**
 * TypeScript types representing the Supabase database schema.
 * Generated manually — run `npx supabase gen types` in production
 * to keep this in sync with your actual schema.
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type LaunchpadId =
  | "meteora"
  | "bags"
  | "pumpfun"
  | "fourmeme"
  | "basememe";
export type LaunchStatus = "pending" | "confirming" | "live" | "failed";
export type TokenStatus = "active" | "pending" | "failed";
export type ChainNetwork = "devnet" | "testnet" | "mainnet-beta" | "bsc" | "base";
export type AppPhase = "testnet" | "mainnet";

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          wallet_address: string;
          session_version: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          wallet_address: string;
          session_version?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          wallet_address?: string;
          session_version?: number;
          updated_at?: string;
        };
        Relationships: [];
      };

      tokens: {
        Row: {
          id: string;
          user_id: string;
          wallet_address: string;
          name: string;
          symbol: string;
          decimals: number;
          supply: string;
          description: string | null;
          image_url: string | null;
          network: ChainNetwork;
          app_phase: AppPhase;
          mint_address: string | null;
          mint_tx: string | null;
          status: TokenStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          wallet_address: string;
          name: string;
          symbol: string;
          decimals?: number;
          supply: string;
          description?: string | null;
          image_url?: string | null;
          network?: ChainNetwork;
          app_phase?: AppPhase;
          mint_address?: string | null;
          mint_tx?: string | null;
          status?: TokenStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          symbol?: string;
          decimals?: number;
          supply?: string;
          description?: string | null;
          image_url?: string | null;
          network?: ChainNetwork;
          app_phase?: AppPhase;
          mint_address?: string | null;
          mint_tx?: string | null;
          status?: TokenStatus;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tokens_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };

      launches: {
        Row: {
          id: string;
          token_id: string;
          user_id: string;
          wallet_address: string;
          launchpad: LaunchpadId;
          network: ChainNetwork;
          app_phase: AppPhase;
          status: LaunchStatus;
          pool_address: string | null;
          launch_tx: string | null;
          initial_liquidity: number | null;
          launched_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          token_id: string;
          user_id: string;
          wallet_address: string;
          launchpad: LaunchpadId;
          network?: ChainNetwork;
          app_phase?: AppPhase;
          status?: LaunchStatus;
          pool_address?: string | null;
          launch_tx?: string | null;
          initial_liquidity?: number | null;
          launched_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: LaunchStatus;
          network?: ChainNetwork;
          app_phase?: AppPhase;
          pool_address?: string | null;
          launch_tx?: string | null;
          initial_liquidity?: number | null;
          launched_at?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "launches_token_id_fkey";
            columns: ["token_id"];
            isOneToOne: false;
            referencedRelation: "tokens";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "launches_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };

      earnings: {
        Row: {
          id: string;
          user_id: string;
          wallet_address: string;
          token_id: string;
          launch_id: string;
          launchpad: LaunchpadId;
          network: ChainNetwork;
          app_phase: AppPhase;
          amount_sol: number;
          fee_type: string;
          tx_signature: string | null;
          recorded_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          wallet_address: string;
          token_id: string;
          launch_id: string;
          launchpad: LaunchpadId;
          network?: ChainNetwork;
          app_phase?: AppPhase;
          amount_sol: number;
          fee_type?: string;
          tx_signature?: string | null;
          recorded_at?: string;
          created_at?: string;
        };
        Update: {
          network?: ChainNetwork;
          app_phase?: AppPhase;
          amount_sol?: number;
          tx_signature?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "earnings_token_id_fkey";
            columns: ["token_id"];
            isOneToOne: false;
            referencedRelation: "tokens";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "earnings_launch_id_fkey";
            columns: ["launch_id"];
            isOneToOne: false;
            referencedRelation: "launches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "earnings_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      admin_settings: {
        Row: {
          key: string;
          value: Json;
          updated_by_wallet: string | null;
          updated_at: string;
        };
        Insert: {
          key: string;
          value?: Json;
          updated_by_wallet?: string | null;
          updated_at?: string;
        };
        Update: {
          value?: Json;
          updated_by_wallet?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      admin_audit_logs: {
        Row: {
          id: string;
          wallet_address: string;
          action: string;
          payload: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          wallet_address: string;
          action: string;
          payload?: Json;
          created_at?: string;
        };
        Update: {
          payload?: Json;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      launchpad_id: LaunchpadId;
      launch_status: LaunchStatus;
      token_status: TokenStatus;
      chain_network: ChainNetwork;
      app_phase: AppPhase;
    };
    CompositeTypes: Record<string, never>;
  };
}

// Convenience type aliases
export type User = Database["public"]["Tables"]["users"]["Row"];
export type Token = Database["public"]["Tables"]["tokens"]["Row"];
export type Launch = Database["public"]["Tables"]["launches"]["Row"];
export type Earning = Database["public"]["Tables"]["earnings"]["Row"];

export type TokenInsert = Database["public"]["Tables"]["tokens"]["Insert"];
export type LaunchInsert = Database["public"]["Tables"]["launches"]["Insert"];
export type EarningInsert = Database["public"]["Tables"]["earnings"]["Insert"];
