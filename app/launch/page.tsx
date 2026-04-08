"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { fadeUp, stagger, scaleIn } from "@/components/motion";
import {
  ArrowLeft,
  ArrowRight,
  Upload,
  Check,
  Loader2,
  Rocket,
  ExternalLink,
  Copy,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { WalletButton } from "@/components/wallet-button";
import { createMintTransaction } from "@/lib/solana/token";
import { LAUNCHPAD_META, getLaunchpad } from "@/lib/solana/launchpad";
import { toast } from "sonner";

type Step = "connect" | "create" | "launchpads" | "confirm" | "success";

const stepsMeta: { id: Step; label: string; number: string }[] = [
  { id: "connect", label: "Connect", number: "01" },
  { id: "create", label: "Create Token", number: "02" },
  { id: "launchpads", label: "Launchpads", number: "03" },
  { id: "confirm", label: "Confirm", number: "04" },
];

export default function LaunchPage() {
  const { connection } = useConnection();
  const { publicKey, signTransaction, connected } = useWallet();
  const { session } = useAuth();

  const [currentStep, setCurrentStep] = useState<Step>("connect");
  const [selectedPads, setSelectedPads] = useState<string[]>([]);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployProgress, setDeployProgress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Result state
  const [mintAddress, setMintAddress] = useState<string | null>(null);
  const [mintTx, setMintTx] = useState<string | null>(null);
  const [launchResults, setLaunchResults] = useState<
    { launchpad: string; poolAddress: string; status: "live" | "failed" }[]
  >([]);

  const [tokenData, setTokenData] = useState({
    name: "",
    symbol: "",
    supply: "",
    decimals: "9",
    description: "",
  });

  const currentIndex = stepsMeta.findIndex((s) => s.id === currentStep);

  const goNext = () => {
    setError(null);
    if (currentStep === "connect") setCurrentStep("create");
    else if (currentStep === "create") setCurrentStep("launchpads");
    else if (currentStep === "launchpads") setCurrentStep("confirm");
    else if (currentStep === "confirm") handleDeploy();
  };

  const goBack = () => {
    setError(null);
    if (currentStep === "create") setCurrentStep("connect");
    else if (currentStep === "launchpads") setCurrentStep("create");
    else if (currentStep === "confirm") setCurrentStep("launchpads");
  };

  const togglePad = (pad: string) => {
    setSelectedPads((prev) =>
      prev.includes(pad) ? prev.filter((p) => p !== pad) : [...prev, pad]
    );
  };

  const canProceed = () => {
    if (currentStep === "connect") return session.isLoggedIn && connected;
    if (currentStep === "create")
      return tokenData.name && tokenData.symbol && tokenData.supply;
    if (currentStep === "launchpads") return selectedPads.length > 0;
    if (currentStep === "confirm") return true;
    return false;
  };

  // ─── Image Upload Handler ──────────────────────────
  const handleImageSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be under 5MB");
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    },
    []
  );

  // ─── Deploy Flow ───────────────────────────────────
  const handleDeploy = useCallback(async () => {
    if (!publicKey || !signTransaction || !connection) {
      setError("Wallet not connected");
      return;
    }

    setIsDeploying(true);
    setError(null);

    try {
      // Step 1: Upload image (if any)
      let imageUrl: string | null = null;
      if (imageFile) {
        setDeployProgress("Uploading image...");
        try {
          const formData = new FormData();
          formData.append("file", imageFile);
          const uploadRes = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });
          if (uploadRes.ok) {
            const { url } = await uploadRes.json();
            imageUrl = url;
          }
        } catch {
          console.warn("Image upload failed, continuing without image");
        }
      }

      // Step 2: Create token record in DB
      setDeployProgress("Preparing token...");
      const tokenRes = await fetch("/api/tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: tokenData.name,
          symbol: tokenData.symbol,
          supply: tokenData.supply,
          decimals: parseInt(tokenData.decimals),
          description: tokenData.description,
          imageUrl,
        }),
      });

      let tokenId: string | null = null;
      if (tokenRes.ok) {
        const { token } = await tokenRes.json();
        tokenId = token.id;
      }

      // Step 3: Build + sign + send mint transaction
      setDeployProgress("Creating token on Solana...");
      const mintResult = await createMintTransaction(connection, publicKey, {
        name: tokenData.name,
        symbol: tokenData.symbol,
        decimals: parseInt(tokenData.decimals),
        supply: tokenData.supply,
        description: tokenData.description,
        imageUrl: imageUrl || undefined,
      });

      const signed = await signTransaction(mintResult.transaction);
      const rawTx = signed.serialize();

      setDeployProgress("Confirming mint transaction...");
      const sig = await connection.sendRawTransaction(rawTx, {
        skipPreflight: false,
        preflightCommitment: "confirmed",
      });

      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash("confirmed");
      await connection.confirmTransaction(
        { signature: sig, blockhash, lastValidBlockHeight },
        "confirmed"
      );

      const mintAddr = mintResult.mintKeypair.publicKey.toBase58();
      setMintAddress(mintAddr);
      setMintTx(sig);

      // Step 4: Confirm token in DB
      if (tokenId) {
        await fetch("/api/tokens", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tokenId,
            mintAddress: mintAddr,
            mintTx: sig,
          }),
        });
      }

      // Step 5: Launch on selected launchpads
      const results: typeof launchResults = [];

      for (const padId of selectedPads) {
        const padMeta = LAUNCHPAD_META.find((m) => m.id === padId);
        setDeployProgress(`Launching on ${padMeta?.name || padId}...`);

        try {
          const launchpad = getLaunchpad(padId);
          if (!launchpad) throw new Error(`Unknown launchpad: ${padId}`);

          // Create launch record
          let launchId: string | null = null;
          if (tokenId) {
            const launchRes = await fetch("/api/launches", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                tokenId,
                launchpad: padId,
                initialLiquidity: 1,
              }),
            });
            if (launchRes.ok) {
              const { launch } = await launchRes.json();
              launchId = launch.id;
            }
          }

          // Build launch transaction
          const launchResult = await launchpad.createLaunchTransaction(
            connection,
            {
              mintAddress: new PublicKey(mintAddr),
              walletPublicKey: publicKey,
              initialLiquiditySol: 1,
              tokenAmount:
                (BigInt(tokenData.supply) *
                  BigInt(10 ** parseInt(tokenData.decimals))) /
                10n,
            }
          );

          const signedLaunch = await signTransaction(launchResult.transaction);
          const launchSig = await connection.sendRawTransaction(
            signedLaunch.serialize(),
            { skipPreflight: false, preflightCommitment: "confirmed" }
          );

          const launchBlock = await connection.getLatestBlockhash("confirmed");
          await connection.confirmTransaction(
            {
              signature: launchSig,
              blockhash: launchBlock.blockhash,
              lastValidBlockHeight: launchBlock.lastValidBlockHeight,
            },
            "confirmed"
          );

          const poolAddr = launchResult.poolAddress.toBase58();

          if (launchId) {
            await fetch("/api/launches", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                launchId,
                poolAddress: poolAddr,
                launchTx: launchSig,
              }),
            });
          }

          results.push({
            launchpad: padId,
            poolAddress: poolAddr,
            status: "live",
          });
        } catch (padErr) {
          console.error(`[LAUNCH] ${padId} failed:`, padErr);
          results.push({ launchpad: padId, poolAddress: "", status: "failed" });
          toast.error(`${padMeta?.name || padId} launch failed`);
        }
      }

      setLaunchResults(results);
      setCurrentStep("success");
      toast.success("Token launched successfully!");
    } catch (err) {
      console.error("[DEPLOY] Error:", err);
      const message = err instanceof Error ? err.message : "Deployment failed";
      setError(message);
      toast.error(message);
    } finally {
      setIsDeploying(false);
      setDeployProgress("");
    }
  }, [
    publicKey,
    signTransaction,
    connection,
    tokenData,
    selectedPads,
    imageFile,
    launchResults,
  ]);

  // ─── Cost Estimate ─────────────────────────────────
  const estimatedCost = selectedPads.reduce((total, pad) => {
    const meta = LAUNCHPAD_META.find((m) => m.id === pad);
    const feeStr = meta?.estimatedFee || "0";
    return total + parseFloat(feeStr.replace(/[^0-9.]/g, ""));
  }, 0.01);

  return (
    <div className="min-h-screen bg-background dot-grid">
      {/* Nav bar */}
      <nav className="border-b border-border bg-[rgba(5,5,5,0.8)] backdrop-blur-xl sticky top-0 z-50">
        <div className="mx-auto max-w-[1000px] px-6 md:px-10 flex items-center justify-between h-16">
          <Link
            href="/"
            className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors text-sm"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Back to home</span>
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="relative w-6 h-6 flex-shrink-0">
              <Image
                src="/1.jpg"
                alt=""
                fill
                className="object-cover rounded-md"
              />
            </div>
            <span className="text-sm font-semibold text-text-primary">
              Multipu
            </span>
          </div>
          <div className="w-20" />
        </div>
      </nav>

      <div className="mx-auto max-w-[1000px] px-6 md:px-10 py-12">
        {/* Step indicator */}
        {currentStep !== "success" && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="mb-12"
          >
            <div className="flex items-center gap-2 md:gap-4 overflow-x-auto pb-2">
              {stepsMeta.map((step, i) => (
                <motion.div
                  key={step.id}
                  variants={fadeUp}
                  className="flex items-center gap-2 md:gap-4"
                >
                  <div
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-sm font-mono text-xs transition-colors whitespace-nowrap",
                      i <= currentIndex
                        ? "text-accent bg-accent/10 border border-accent/20"
                        : "text-text-dim border border-border"
                    )}
                  >
                    <span>{step.number}</span>
                    <span className="hidden sm:inline">{step.label}</span>
                  </div>
                  {i < stepsMeta.length - 1 && (
                    <div
                      className={cn(
                        "w-6 md:w-10 h-px transition-colors",
                        i < currentIndex ? "bg-accent/40" : "bg-border"
                      )}
                    />
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Error banner */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 border border-error/30 bg-error/5 flex items-start gap-3"
            >
              <AlertCircle
                size={16}
                className="text-error mt-0.5 flex-shrink-0"
              />
              <div>
                <p className="text-sm text-error font-medium">Error</p>
                <p className="text-xs text-text-secondary mt-1">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-text-muted hover:text-text-primary text-xs"
              >
                Dismiss
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step content */}
        <AnimatePresence mode="wait">
          {/* ─── Step 1: Connect Wallet ─────────────── */}
          {currentStep === "connect" && (
            <motion.div
              key="connect"
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, y: -20 }}
              variants={stagger}
              className="max-w-lg mx-auto"
            >
              <motion.h1
                variants={fadeUp}
                className="text-2xl md:text-3xl font-bold tracking-tight"
              >
                Connect your wallet
              </motion.h1>
              <motion.p
                variants={fadeUp}
                className="mt-3 text-text-secondary"
              >
                Link your Solana wallet to deploy tokens and manage launches.
              </motion.p>

              <motion.div variants={fadeUp} className="mt-10 space-y-4">
                {!session.isLoggedIn ? (
                  <div className="p-8 border border-border bg-elevated text-center space-y-4">
                    <p className="text-sm text-text-secondary">
                      Connect and sign in with your Solana wallet to continue.
                    </p>
                    <WalletButton />
                  </div>
                ) : (
                  <div className="p-6 border border-accent/30 bg-accent/5">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-success" />
                      <span className="font-mono text-sm text-text-primary">
                        {session.walletAddress.slice(0, 4)}...
                        {session.walletAddress.slice(-4)}
                      </span>
                      <span className="font-mono text-xs text-success ml-auto">
                        Connected & Signed In
                      </span>
                      <Check size={14} className="text-success" />
                    </div>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}

          {/* ─── Step 2: Create Token ───────────────── */}
          {currentStep === "create" && (
            <motion.div
              key="create"
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, y: -20 }}
              variants={stagger}
              className="max-w-lg mx-auto"
            >
              <motion.h1
                variants={fadeUp}
                className="text-2xl md:text-3xl font-bold tracking-tight"
              >
                Create your token
              </motion.h1>
              <motion.p
                variants={fadeUp}
                className="mt-3 text-text-secondary"
              >
                Define your token&apos;s identity and supply parameters.
              </motion.p>

              <motion.div variants={fadeUp} className="mt-10 space-y-6">
                {/* Token image upload */}
                <div className="flex items-center gap-6">
                  <label className="relative w-20 h-20 border border-dashed border-border hover:border-border-hover bg-elevated rounded-xl flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer overflow-hidden">
                    {imagePreview ? (
                      <Image
                        src={imagePreview}
                        alt="Token logo"
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <>
                        <Upload size={18} className="text-text-muted" />
                        <span className="text-[10px] font-mono text-text-dim">
                          Logo
                        </span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={handleImageSelect}
                    />
                  </label>
                  <div className="flex-1">
                    <label className="font-mono text-xs text-text-dim uppercase tracking-wider block mb-2">
                      Token Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. MoonCoin"
                      maxLength={32}
                      value={tokenData.name}
                      onChange={(e) =>
                        setTokenData({ ...tokenData, name: e.target.value })
                      }
                      className="w-full bg-transparent border border-border hover:border-border-hover focus:border-accent/50 focus:outline-none px-4 py-3 text-sm text-text-primary placeholder:text-text-dim transition-colors"
                    />
                  </div>
                </div>

                {/* Symbol + Supply */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-mono text-xs text-text-dim uppercase tracking-wider block mb-2">
                      Symbol
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. MOON"
                      maxLength={10}
                      value={tokenData.symbol}
                      onChange={(e) =>
                        setTokenData({
                          ...tokenData,
                          symbol: e.target.value.toUpperCase(),
                        })
                      }
                      className="w-full bg-transparent border border-border hover:border-border-hover focus:border-accent/50 focus:outline-none px-4 py-3 text-sm text-text-primary placeholder:text-text-dim transition-colors font-mono"
                    />
                  </div>
                  <div>
                    <label className="font-mono text-xs text-text-dim uppercase tracking-wider block mb-2">
                      Total Supply
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="e.g. 1000000000"
                      value={tokenData.supply}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, "");
                        setTokenData({ ...tokenData, supply: val });
                      }}
                      className="w-full bg-transparent border border-border hover:border-border-hover focus:border-accent/50 focus:outline-none px-4 py-3 text-sm text-text-primary placeholder:text-text-dim transition-colors font-mono"
                    />
                  </div>
                </div>

                {/* Decimals */}
                <div>
                  <label className="font-mono text-xs text-text-dim uppercase tracking-wider block mb-2">
                    Decimals
                  </label>
                  <select
                    value={tokenData.decimals}
                    onChange={(e) =>
                      setTokenData({ ...tokenData, decimals: e.target.value })
                    }
                    className="w-full bg-transparent border border-border hover:border-border-hover focus:border-accent/50 focus:outline-none px-4 py-3 text-sm text-text-primary transition-colors appearance-none cursor-pointer"
                  >
                    {[6, 8, 9].map((d) => (
                      <option key={d} value={d} className="bg-background">
                        {d} decimals
                      </option>
                    ))}
                  </select>
                </div>

                {/* Description */}
                <div>
                  <label className="font-mono text-xs text-text-dim uppercase tracking-wider block mb-2">
                    Description
                  </label>
                  <textarea
                    placeholder="A short description of your token..."
                    maxLength={500}
                    value={tokenData.description}
                    onChange={(e) =>
                      setTokenData({
                        ...tokenData,
                        description: e.target.value,
                      })
                    }
                    rows={3}
                    className="w-full bg-transparent border border-border hover:border-border-hover focus:border-accent/50 focus:outline-none px-4 py-3 text-sm text-text-primary placeholder:text-text-dim transition-colors resize-none"
                  />
                  <div className="text-right mt-1">
                    <span className="font-mono text-[10px] text-text-dim">
                      {tokenData.description.length}/500
                    </span>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* ─── Step 3: Select Launchpads ──────────── */}
          {currentStep === "launchpads" && (
            <motion.div
              key="launchpads"
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, y: -20 }}
              variants={stagger}
              className="max-w-2xl mx-auto"
            >
              <motion.h1
                variants={fadeUp}
                className="text-2xl md:text-3xl font-bold tracking-tight"
              >
                Select launchpads
              </motion.h1>
              <motion.p
                variants={fadeUp}
                className="mt-3 text-text-secondary"
              >
                Choose one or more. Your token details will auto-fill on each
                platform.
              </motion.p>

              <motion.div
                variants={fadeUp}
                className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4"
              >
                {LAUNCHPAD_META.map((pad) => (
                  <button
                    key={pad.id}
                    onClick={() => togglePad(pad.id)}
                    className={cn(
                      "relative text-left p-6 border transition-all duration-200 group",
                      selectedPads.includes(pad.id)
                        ? "border-accent/40 bg-accent/5"
                        : "border-border hover:border-border-hover hover:bg-elevated"
                    )}
                  >
                    {selectedPads.includes(pad.id) && (
                      <div className="absolute top-4 right-4 w-5 h-5 rounded-sm bg-accent flex items-center justify-center">
                        <Check size={12} className="text-white" />
                      </div>
                    )}

                    <div className="flex items-center gap-3 mb-4">
                      <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-border">
                        <Image
                          src={pad.image}
                          alt={pad.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-text-primary">
                          {pad.name}
                        </h3>
                        <span className="font-mono text-[10px] text-text-dim">
                          Est. fee: {pad.estimatedFee}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-text-secondary leading-relaxed">
                      {pad.description}
                    </p>
                  </button>
                ))}
              </motion.div>

              {selectedPads.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-6 p-4 border border-border bg-elevated"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-text-muted">
                      Selected:{" "}
                      {selectedPads
                        .map(
                          (p) =>
                            LAUNCHPAD_META.find((m) => m.id === p)?.name || p
                        )
                        .join(", ")}
                    </span>
                    <span className="font-mono text-xs text-accent">
                      {selectedPads.length === 1
                        ? "Single launch"
                        : selectedPads.length === 2
                        ? "Dual launch"
                        : "Triple launch"}
                    </span>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ─── Step 4: Confirm ────────────────────── */}
          {currentStep === "confirm" && (
            <motion.div
              key="confirm"
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, y: -20 }}
              variants={stagger}
              className="max-w-lg mx-auto"
            >
              <motion.h1
                variants={fadeUp}
                className="text-2xl md:text-3xl font-bold tracking-tight"
              >
                Confirm & launch
              </motion.h1>
              <motion.p
                variants={fadeUp}
                className="mt-3 text-text-secondary"
              >
                Review your token details before deploying.
              </motion.p>

              <motion.div
                variants={fadeUp}
                className="mt-10 border border-border divide-y divide-border"
              >
                <div className="p-6">
                  <span className="font-mono text-[0.65rem] text-text-dim uppercase tracking-[0.15em]">
                    // Token Details
                  </span>
                  <div className="mt-4 space-y-3">
                    {[
                      { label: "Name", value: tokenData.name || "-" },
                      { label: "Symbol", value: tokenData.symbol || "-" },
                      {
                        label: "Supply",
                        value: tokenData.supply
                          ? Number(tokenData.supply).toLocaleString()
                          : "-",
                      },
                      { label: "Decimals", value: tokenData.decimals },
                      {
                        label: "Image",
                        value: imageFile ? imageFile.name : "None",
                      },
                    ].map((row) => (
                      <div
                        key={row.label}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm text-text-muted">
                          {row.label}
                        </span>
                        <span className="text-sm font-mono text-text-primary">
                          {row.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-6">
                  <span className="font-mono text-[0.65rem] text-text-dim uppercase tracking-[0.15em]">
                    // Launchpads
                  </span>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {selectedPads.map((padId) => {
                      const meta = LAUNCHPAD_META.find((m) => m.id === padId);
                      return (
                        <span
                          key={padId}
                          className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-mono border border-accent/20 bg-accent/5 text-accent"
                        >
                          <Rocket size={12} />
                          {meta?.name || padId}
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div className="p-6">
                  <span className="font-mono text-[0.65rem] text-text-dim uppercase tracking-[0.15em]">
                    // Estimated Cost
                  </span>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-sm text-text-muted">
                      Token mint + launchpad fees
                    </span>
                    <span className="text-lg font-mono font-bold text-text-primary">
                      ~{estimatedCost.toFixed(2)} SOL
                    </span>
                  </div>
                </div>
              </motion.div>

              {isDeploying && deployProgress && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-6 p-4 border border-accent/20 bg-accent/5"
                >
                  <div className="flex items-center gap-3">
                    <Loader2 size={16} className="text-accent animate-spin" />
                    <span className="text-sm text-accent font-mono">
                      {deployProgress}
                    </span>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ─── Step 5: Success ────────────────────── */}
          {currentStep === "success" && (
            <motion.div
              key="success"
              initial="hidden"
              animate="visible"
              variants={stagger}
              className="max-w-lg mx-auto text-center py-12"
            >
              <motion.div variants={scaleIn} className="mb-8">
                <div className="inline-flex w-16 h-16 rounded-full bg-success/10 border border-success/20 items-center justify-center">
                  <Check size={28} className="text-success" />
                </div>
              </motion.div>

              <motion.h1
                variants={fadeUp}
                className="text-2xl md:text-3xl font-bold tracking-tight"
              >
                Token launched!
              </motion.h1>
              <motion.p
                variants={fadeUp}
                className="mt-3 text-text-secondary"
              >
                Your token has been deployed and pushed to{" "}
                {launchResults.filter((r) => r.status === "live").length}{" "}
                launchpad
                {launchResults.filter((r) => r.status === "live").length !== 1
                  ? "s"
                  : ""}
                .
              </motion.p>

              {mintAddress && (
                <motion.div
                  variants={fadeUp}
                  className="mt-8 border border-border p-4 text-left"
                >
                  <span className="font-mono text-[0.65rem] text-text-dim uppercase tracking-[0.15em]">
                    // Token Address
                  </span>
                  <div className="mt-3 flex items-center gap-3">
                    <span className="font-mono text-sm text-text-primary truncate">
                      {mintAddress}
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(mintAddress);
                        toast.success("Copied!");
                      }}
                      className="text-text-muted hover:text-text-primary transition-colors flex-shrink-0"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                  {mintTx && (
                    <a
                      href={`https://explorer.solana.com/tx/${mintTx}?cluster=${process.env.NEXT_PUBLIC_SOLANA_NETWORK || "devnet"}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-xs font-mono text-accent hover:text-accent-hover transition-colors"
                    >
                      View transaction <ExternalLink size={10} />
                    </a>
                  )}
                </motion.div>
              )}

              <motion.div variants={fadeUp} className="mt-4 space-y-2">
                {launchResults.map((result) => {
                  const meta = LAUNCHPAD_META.find(
                    (m) => m.id === result.launchpad
                  );
                  return (
                    <div
                      key={result.launchpad}
                      className="flex items-center justify-between p-4 border border-border"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            "w-2 h-2 rounded-full",
                            result.status === "live"
                              ? "bg-success"
                              : "bg-error"
                          )}
                        />
                        <span className="text-sm font-medium text-text-primary">
                          {meta?.name || result.launchpad}
                        </span>
                      </div>
                      <span
                        className={cn(
                          "font-mono text-xs",
                          result.status === "live"
                            ? "text-success"
                            : "text-error"
                        )}
                      >
                        {result.status === "live" ? "Live" : "Failed"}
                      </span>
                    </div>
                  );
                })}
              </motion.div>

              <motion.div
                variants={fadeUp}
                className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
              >
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold bg-accent hover:bg-accent-hover text-white rounded-full transition-all duration-300"
                >
                  View Dashboard
                  <ArrowRight size={16} />
                </Link>
                <button
                  onClick={() => {
                    setCurrentStep("connect");
                    setSelectedPads([]);
                    setTokenData({
                      name: "",
                      symbol: "",
                      supply: "",
                      decimals: "9",
                      description: "",
                    });
                    setImageFile(null);
                    setImagePreview(null);
                    setMintAddress(null);
                    setMintTx(null);
                    setLaunchResults([]);
                    setError(null);
                  }}
                  className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-text-primary border border-border hover:border-border-hover rounded-full transition-all"
                >
                  Launch Another
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation buttons */}
        {currentStep !== "success" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-lg mx-auto mt-12 flex items-center justify-between"
          >
            <button
              onClick={goBack}
              disabled={currentStep === "connect"}
              className={cn(
                "inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium border rounded-full transition-all",
                currentStep === "connect"
                  ? "border-border text-text-dim cursor-not-allowed"
                  : "border-border text-text-primary hover:border-border-hover hover:bg-elevated"
              )}
            >
              <ArrowLeft size={16} />
              Back
            </button>
            <button
              onClick={goNext}
              disabled={!canProceed() || isDeploying}
              className={cn(
                "inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-full transition-all duration-300",
                canProceed() && !isDeploying
                  ? "bg-accent hover:bg-accent-hover text-white hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(139,92,246,0.3)]"
                  : "bg-accent/20 text-accent/40 cursor-not-allowed"
              )}
            >
              {isDeploying ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Deploying...
                </>
              ) : currentStep === "confirm" ? (
                <>
                  <Rocket size={16} />
                  Deploy & Launch
                </>
              ) : (
                <>
                  Next
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
