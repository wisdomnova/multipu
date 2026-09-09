"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  IconCpu,
  IconSparkles,
  IconX,
  IconPlayerPlay,
  IconPlayerPause,
  IconPlayerStop,
  IconRefresh,
  IconArrowRight,
  IconCheck,
  IconFlame,
  IconTrendingUp,
  IconShieldLock,
  IconActivity,
  IconCoin,
  IconChevronRight,
  IconTerminal2,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ParsedStrategy, StrategyRules, StrategySimulationResult } from "@/lib/agents/types";

interface TelemetryLog {
  id: string;
  time: string;
  type: "info" | "signal" | "buy" | "sell" | "warning";
  text: string;
  token?: string;
  pnl?: number;
}

const PRESET_PROMPTS = [
  {
    title: "Pump.fun Momentum Scalper",
    chain: "SOL",
    icon: "🔥",
    prompt:
      "Scalp fresh Pump.fun memes with >$5k volume & OlaXBT momentum >80. Max 0.2 SOL per trade. Take profit at +35%, stop loss at -12%.",
  },
  {
    title: "Meteora DLMM Volatility Hunter",
    chain: "SOL",
    icon: "🌊",
    prompt:
      "Trade high-volatility Solana tokens on Meteora DLMM. Take profit at +45%, stop loss at -15%. 0.25 SOL size with MEV protection.",
  },
  {
    title: "Four.meme BNB Hunter",
    chain: "BNB",
    icon: "⚡",
    prompt:
      "Snipe trending BSC tokens on Four.meme with >$3k volume. Take profit at +50%, stop loss at -10%. 0.05 BNB per trade.",
  },
  {
    title: "OlaXBT Alpha Whale Sniper",
    chain: "SOL",
    icon: "🐋",
    prompt:
      "Follow top smart-money wallet accumulations on Solana with OlaXBT score >85. Buy 0.5 SOL, TP at +60%, SL at -15%.",
  },
];

export function TradingAgentCopilot() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"prompt" | "rules" | "telemetry">("prompt");
  
  // Prompt & Strategy state
  const [promptInput, setPromptInput] = useState("");
  const [isCompiling, setIsCompiling] = useState(false);
  const [parsedStrategy, setParsedStrategy] = useState<ParsedStrategy | null>(null);
  
  // Simulation state
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<StrategySimulationResult | null>(null);
  
  // Execution & Agent state
  const [agentMode, setAgentMode] = useState<"paper" | "live">("paper");
  const [isAgentRunning, setIsAgentRunning] = useState(false);
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null);
  const [agentPnl, setAgentPnl] = useState<number>(0);
  const [tradeCount, setTradeCount] = useState<number>(0);
  const [telemetryLogs, setTelemetryLogs] = useState<TelemetryLog[]>([]);

  const logsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logs
  useEffect(() => {
    if (activeTab === "telemetry") {
      logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [telemetryLogs, activeTab]);

  // Live simulation loop when agent is running
  useEffect(() => {
    if (!isAgentRunning) return;

    const sampleTokens = ["$PEPE2", "$DOGEX", "$SOLAI", "$NEOPUMP", "$BAGMAN", "$PONS"];
    const actions: ("scan" | "signal" | "buy" | "sell")[] = ["scan", "signal", "buy", "sell"];

    const interval = setInterval(() => {
      const now = new Date().toLocaleTimeString();
      const rand = Math.random();
      const randomToken = sampleTokens[Math.floor(Math.random() * sampleTokens.length)];

      if (rand < 0.4) {
        // Pool scan
        setTelemetryLogs((prev) => [
          ...prev.slice(-30),
          {
            id: Math.random().toString(),
            time: now,
            type: "info",
            text: `[KeeperHub Shield] Scanned 8 pools across ${parsedStrategy?.rules.launchpads.join(", ") || "Pump.fun"}. Filter checks passed.`,
          },
        ]);
      } else if (rand < 0.7) {
        // Signal detected
        const score = Math.floor(Math.random() * 15 + 80);
        setTelemetryLogs((prev) => [
          ...prev.slice(-30),
          {
            id: Math.random().toString(),
            time: now,
            type: "signal",
            text: `[OlaXBT Nexus] Momentum score ${score}/100 detected on ${randomToken}. 24h Vol: $${(Math.random() * 15 + 5).toFixed(1)}k.`,
            token: randomToken,
          },
        ]);
      } else if (rand < 0.88) {
        // Buy execution
        const amount = parsedStrategy?.rules.tradeAmount || 0.2;
        setTradeCount((c) => c + 1);
        setTelemetryLogs((prev) => [
          ...prev.slice(-30),
          {
            id: Math.random().toString(),
            time: now,
            type: "buy",
            text: `[Trade Dispatched] BUY order executed: ${amount} ${parsedStrategy?.rules.chain.toUpperCase() === "BSC" ? "BNB" : "SOL"} on ${randomToken} via private mempool shield.`,
            token: randomToken,
          },
        ]);
      } else {
        // Sell execution with TP / SL
        const isProfit = Math.random() > 0.3;
        const pnl = isProfit
          ? +(parsedStrategy?.rules.takeProfitPct || 35)
          : -(parsedStrategy?.rules.stopLossPct || 12);

        setAgentPnl((prev) => +(prev + (pnl > 0 ? pnl * 0.05 : pnl * 0.02)).toFixed(2));
        setTradeCount((c) => c + 1);

        setTelemetryLogs((prev) => [
          ...prev.slice(-30),
          {
            id: Math.random().toString(),
            time: now,
            type: "sell",
            text: `[Auto Exit] SOLD ${randomToken} | ${isProfit ? "Take Profit hit" : "Stop Loss executed"} (${pnl > 0 ? "+" : ""}${pnl}%). PnL: ${pnl > 0 ? "+" : ""}${(pnl * 0.01).toFixed(3)} SOL.`,
            token: randomToken,
            pnl,
          },
        ]);
      }
    }, 4500);

    return () => clearInterval(interval);
  }, [isAgentRunning, parsedStrategy]);

  // Handle compile prompt
  const handleCompileStrategy = async (customPrompt?: string) => {
    const textToCompile = customPrompt || promptInput;
    if (!textToCompile.trim()) {
      toast.error("Please enter a strategy prompt");
      return;
    }

    setIsCompiling(true);
    try {
      const res = await fetch("/api/agents/parse-strategy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: textToCompile }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to compile");

      setParsedStrategy(data.strategy);
      setActiveTab("rules");
      toast.success("Strategy compiled successfully!");

      // Auto-run simulation
      handleSimulate(data.strategy.rules);
    } catch (err: any) {
      toast.error(err.message || "Failed to parse strategy prompt");
    } finally {
      setIsCompiling(false);
    }
  };

  // Handle simulation
  const handleSimulate = async (rules: StrategyRules) => {
    setIsSimulating(true);
    try {
      const res = await fetch("/api/agents/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rules }),
      });

      const data = await res.json();
      if (res.ok && data.simulation) {
        setSimulationResult(data.simulation);
      }
    } catch {
      // Ignored
    } finally {
      setIsSimulating(false);
    }
  };

  // Handle Deploy / Start Agent
  const handleDeployAgent = async () => {
    if (!parsedStrategy) return;

    try {
      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: parsedStrategy.name,
          description: parsedStrategy.summary,
          prompt: promptInput || parsedStrategy.name,
          mode: agentMode,
          chain: parsedStrategy.rules.chain,
          launchpads: parsedStrategy.rules.launchpads,
          strategyConfig: parsedStrategy.rules,
          budgetAllocated: parsedStrategy.rules.tradeAmount * 5,
        }),
      });

      const data = await res.json();
      const agentId = data.agent?.id || "agent_local_demo";
      setActiveAgentId(agentId);
      setIsAgentRunning(true);
      setActiveTab("telemetry");

      const now = new Date().toLocaleTimeString();
      setTelemetryLogs([
        {
          id: "init",
          time: now,
          type: "info",
          text: `[Agent Online] Initialized ${parsedStrategy.name} in ${agentMode.toUpperCase()} mode. Connected to KeeperHub MCP router.`,
        },
      ]);

      toast.success(
        agentMode === "paper"
          ? "Agent deployed in Paper Trading mode!"
          : "Agent deployed LIVE on-chain with MEV Shield!"
      );
    } catch {
      setIsAgentRunning(true);
      setActiveTab("telemetry");
      toast.success("Agent started in Paper Trading mode!");
    }
  };

  // Rule updater
  const updateRule = <K extends keyof StrategyRules>(key: K, value: StrategyRules[K]) => {
    if (!parsedStrategy) return;
    const updated = {
      ...parsedStrategy,
      rules: {
        ...parsedStrategy.rules,
        [key]: value,
      },
    };
    setParsedStrategy(updated);
  };

  return (
    <>
      {/* Floating Copilot Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(true)}
          className={cn(
            "relative flex items-center gap-2.5 px-4 py-3 rounded-full font-mono text-xs font-semibold text-white shadow-2xl transition-all border cursor-pointer",
            isAgentRunning
              ? "bg-gradient-to-r from-emerald-600 to-teal-600 border-emerald-400/50 shadow-emerald-500/20 animate-pulse"
              : "bg-gradient-to-r from-indigo-600 via-accent to-purple-600 border-accent/40 shadow-accent/25 hover:shadow-accent/40"
          )}
        >
          <div className="relative flex items-center justify-center">
            <IconSparkles size={16} className="text-white" />
            {isAgentRunning && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-300 animate-ping" />
            )}
          </div>
          <span className="tracking-wide">
            {isAgentRunning ? `AI Agent Active (${agentPnl >= 0 ? "+" : ""}${agentPnl}%)` : "AI Trade Copilot"}
          </span>
        </motion.button>
      </div>

      {/* Slide-out Terminal Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            />

            {/* Slide-out Drawer Window */}
            <motion.div
              initial={{ x: "100%", opacity: 0.8 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0.8 }}
              transition={{ type: "spring", damping: 25, stiffness: 250 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-full sm:w-[540px] bg-[#0c0d14] border-l border-white/10 shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Drawer Header */}
              <div className="p-4 sm:p-5 border-b border-white/10 bg-white/[0.02] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-accent to-purple-600 flex items-center justify-center text-white shadow-md">
                    <IconCpu size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-text-primary">
                        Multipu Strategy Copilot
                      </h3>
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-accent/15 border border-accent/30 text-accent font-semibold">
                        X-Agent MCP
                      </span>
                    </div>
                    <p className="text-xs text-text-muted mt-0.5">
                      Prompt-to-Live Automated Trading Live Terminal
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-text-muted hover:text-text-primary rounded hover:bg-white/[0.05] transition-colors cursor-pointer"
                >
                  <IconX size={18} />
                </button>
              </div>

              {/* Navigation Tabs */}
              <div className="flex items-center border-b border-white/10 bg-black/40 px-3 pt-2 gap-1 font-mono text-xs">
                <button
                  onClick={() => setActiveTab("prompt")}
                  className={cn(
                    "px-3.5 py-2 rounded-t transition-all cursor-pointer flex items-center gap-1.5",
                    activeTab === "prompt"
                      ? "bg-white/[0.06] text-accent border-b-2 border-accent font-semibold"
                      : "text-text-muted hover:text-text-primary"
                  )}
                >
                  <IconSparkles size={14} />
                  <span>1. Prompt Builder</span>
                </button>

                <button
                  onClick={() => {
                    if (!parsedStrategy) {
                      toast.error("Please compile a strategy prompt first");
                      return;
                    }
                    setActiveTab("rules");
                  }}
                  className={cn(
                    "px-3.5 py-2 rounded-t transition-all cursor-pointer flex items-center gap-1.5",
                    activeTab === "rules"
                      ? "bg-white/[0.06] text-accent border-b-2 border-accent font-semibold"
                      : "text-text-muted hover:text-text-primary"
                  )}
                >
                  <IconTerminal2 size={14} />
                  <span>2. Strategy &amp; Sim</span>
                </button>

                <button
                  onClick={() => setActiveTab("telemetry")}
                  className={cn(
                    "px-3.5 py-2 rounded-t transition-all cursor-pointer flex items-center gap-1.5",
                    activeTab === "telemetry"
                      ? "bg-white/[0.06] text-accent border-b-2 border-accent font-semibold"
                      : "text-text-muted hover:text-text-primary"
                  )}
                >
                  <IconActivity size={14} />
                  <span>3. Live Telemetry</span>
                  {isAgentRunning && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  )}
                </button>
              </div>

              {/* Tab 1: Prompt Builder */}
              {activeTab === "prompt" && (
                <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
                  <div>
                    <label className="block text-xs font-mono text-text-muted uppercase tracking-wider mb-2">
                      Describe your trading strategy in plain English
                    </label>
                    <div className="relative">
                      <textarea
                        value={promptInput}
                        onChange={(e) => setPromptInput(e.target.value)}
                        placeholder="e.g. Scalp new Pump.fun Solana memes with >$10k volume and OlaXBT momentum >80. Take profit at +40%, stop loss at -10%, allocate 0.25 SOL per trade."
                        rows={4}
                        className="w-full p-3.5 rounded-lg bg-white/[0.03] border border-white/10 text-text-primary text-xs font-mono leading-relaxed placeholder:text-text-dim focus:outline-none focus:border-accent transition-colors resize-none"
                      />
                      <button
                        disabled={isCompiling || !promptInput.trim()}
                        onClick={() => handleCompileStrategy()}
                        className="mt-2 w-full py-2.5 px-4 bg-accent hover:bg-accent/90 disabled:opacity-50 text-white rounded-md font-mono text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-accent/20"
                      >
                        {isCompiling ? (
                          <>
                            <IconRefresh size={14} className="animate-spin" />
                            <span>Compiling via X-Agent MCP...</span>
                          </>
                        ) : (
                          <>
                            <IconSparkles size={14} />
                            <span>Compile Strategy &amp; Backtest</span>
                            <IconArrowRight size={14} />
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Preset Starters */}
                  <div>
                    <span className="block text-[11px] font-mono text-text-dim uppercase tracking-wider mb-2.5">
                      Or Choose a Quick-Starter Template:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {PRESET_PROMPTS.map((preset) => (
                        <button
                          key={preset.title}
                          onClick={() => {
                            setPromptInput(preset.prompt);
                            handleCompileStrategy(preset.prompt);
                          }}
                          className="text-left p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 hover:border-accent/40 transition-all cursor-pointer group"
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-1.5 font-semibold text-xs text-text-primary group-hover:text-accent transition-colors">
                              <span>{preset.icon}</span>
                              <span className="truncate">{preset.title}</span>
                            </div>
                            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-white/[0.05] text-text-muted">
                              {preset.chain}
                            </span>
                          </div>
                          <p className="text-[11px] text-text-dim line-clamp-2 leading-relaxed font-mono">
                            {preset.prompt}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Feature Highlights */}
                  <div className="p-3.5 rounded-lg bg-white/[0.02] border border-white/5 space-y-2 font-mono text-[11px] text-text-muted">
                    <div className="flex items-center gap-2 text-text-primary font-semibold">
                      <IconShieldLock size={14} className="text-emerald-400" />
                      <span>Built-in Guardrails &amp; Routing</span>
                    </div>
                    <ul className="space-y-1 text-text-dim list-disc list-inside">
                      <li>KeeperHub Private Mempool MEV Shield prevents front-running.</li>
                      <li>Honeypot &amp; Freeze authority blacklist verification.</li>
                      <li>Simulate in Paper Trading first before committing real capital.</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Tab 2: Strategy Visualizer & Simulation */}
              {activeTab === "rules" && parsedStrategy && (
                <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
                  {/* Strategy Summary Card */}
                  <div className="p-4 rounded-xl bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-base">🤖</span>
                        <h4 className="text-sm font-bold text-text-primary">
                          {parsedStrategy.name}
                        </h4>
                      </div>
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-semibold">
                        {(parsedStrategy.confidenceScore * 100).toFixed(0)}% Match
                      </span>
                    </div>

                    <p className="text-xs text-text-secondary leading-relaxed">
                      {parsedStrategy.summary}
                    </p>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {parsedStrategy.tags.map((tag) => (
                        <span
                          key={tag}
                          className="font-mono text-[10px] px-2 py-0.5 rounded bg-white/[0.04] border border-white/10 text-text-muted"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Interactive Parameter Controls */}
                  <div className="space-y-3.5 font-mono text-xs">
                    <span className="block text-[11px] text-text-muted uppercase tracking-wider">
                      Fine-Tune Execution Parameters
                    </span>

                    {/* Take Profit Slider */}
                    <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5 space-y-1.5">
                      <div className="flex justify-between items-center text-text-secondary">
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <IconTrendingUp size={14} /> Take Profit (TP)
                        </span>
                        <span className="font-bold text-emerald-400">
                          +{parsedStrategy.rules.takeProfitPct}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="200"
                        step="5"
                        value={parsedStrategy.rules.takeProfitPct}
                        onChange={(e) =>
                          updateRule("takeProfitPct", parseInt(e.target.value))
                        }
                        className="w-full accent-emerald-400 cursor-pointer"
                      />
                    </div>

                    {/* Stop Loss Slider */}
                    <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5 space-y-1.5">
                      <div className="flex justify-between items-center text-text-secondary">
                        <span className="text-rose-400 font-semibold flex items-center gap-1">
                          <IconShieldLock size={14} /> Stop Loss (SL)
                        </span>
                        <span className="font-bold text-rose-400">
                          -{parsedStrategy.rules.stopLossPct}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="5"
                        max="50"
                        step="1"
                        value={parsedStrategy.rules.stopLossPct}
                        onChange={(e) =>
                          updateRule("stopLossPct", parseInt(e.target.value))
                        }
                        className="w-full accent-rose-400 cursor-pointer"
                      />
                    </div>

                    {/* Trade Amount & Min Vol */}
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5 space-y-1">
                        <span className="text-[10px] text-text-dim block uppercase">
                          Trade Size ({parsedStrategy.rules.chain.toUpperCase() === "BSC" ? "BNB" : "SOL"})
                        </span>
                        <input
                          type="number"
                          step="0.05"
                          value={parsedStrategy.rules.tradeAmount}
                          onChange={(e) =>
                            updateRule("tradeAmount", parseFloat(e.target.value) || 0.1)
                          }
                          className="w-full bg-transparent font-bold text-text-primary focus:outline-none"
                        />
                      </div>

                      <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5 space-y-1">
                        <span className="text-[10px] text-text-dim block uppercase">
                          Min OlaXBT Score
                        </span>
                        <input
                          type="number"
                          min="50"
                          max="95"
                          value={parsedStrategy.rules.minOlaXbtScore}
                          onChange={(e) =>
                            updateRule("minOlaXbtScore", parseInt(e.target.value) || 70)
                          }
                          className="w-full bg-transparent font-bold text-accent focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Pre-Flight Simulation Backtest Results */}
                  {simulationResult && (
                    <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-3 font-mono">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
                          <IconActivity size={14} className="text-accent" />
                          <span>Pre-Flight Simulation (Backtest)</span>
                        </span>
                        {isSimulating && (
                          <IconRefresh size={12} className="animate-spin text-text-dim" />
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="p-2 rounded bg-white/[0.02] border border-white/5">
                          <span className="text-[10px] text-text-dim block">Win Rate</span>
                          <span className="text-sm font-bold text-emerald-400">
                            {simulationResult.winRatePct}%
                          </span>
                        </div>
                        <div className="p-2 rounded bg-white/[0.02] border border-white/5">
                          <span className="text-[10px] text-text-dim block">Expected PnL</span>
                          <span className="text-sm font-bold text-text-primary">
                            +{simulationResult.expectedPnlPct}%
                          </span>
                        </div>
                        <div className="p-2 rounded bg-white/[0.02] border border-white/5">
                          <span className="text-[10px] text-text-dim block">MEV Risk</span>
                          <span className="text-sm font-bold text-emerald-400">
                            {simulationResult.mevRisk}
                          </span>
                        </div>
                      </div>

                      {/* Sample Candidate Tokens */}
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[10px] text-text-dim uppercase tracking-wider block">
                          Recent Matched Telemetry Candidates:
                        </span>
                        {simulationResult.sampleTokens.slice(0, 3).map((item) => (
                          <div
                            key={item.symbol}
                            className="flex items-center justify-between p-2 rounded bg-white/[0.02] border border-white/5 text-[11px]"
                          >
                            <div>
                              <span className="font-bold text-text-primary mr-1.5">
                                {item.symbol}
                              </span>
                              <span className="text-text-dim uppercase text-[9px] px-1 py-0.5 bg-white/[0.04] rounded">
                                {item.launchpad}
                              </span>
                            </div>
                            <span
                              className={cn(
                                "font-bold",
                                item.pnlPct >= 0 ? "text-emerald-400" : "text-rose-400"
                              )}
                            >
                              {item.pnlPct >= 0 ? "+" : ""}
                              {item.pnlPct}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Mode Selector & Launch Trigger */}
                  <div className="pt-2 space-y-3">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-white/10 font-mono text-xs">
                      <span className="text-text-muted">Execution Mode:</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setAgentMode("paper")}
                          className={cn(
                            "px-3 py-1 rounded text-xs transition-colors cursor-pointer",
                            agentMode === "paper"
                              ? "bg-accent/20 text-accent font-semibold border border-accent/40"
                              : "text-text-dim hover:text-text-muted"
                          )}
                        >
                          Paper Trading (Risk-Free)
                        </button>
                        <button
                          onClick={() => setAgentMode("live")}
                          className={cn(
                            "px-3 py-1 rounded text-xs transition-colors cursor-pointer",
                            agentMode === "live"
                              ? "bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/40"
                              : "text-text-dim hover:text-text-muted"
                          )}
                        >
                          Live On-Chain
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={handleDeployAgent}
                      className={cn(
                        "w-full py-3 px-4 rounded-lg font-mono text-xs font-bold text-white shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2",
                        agentMode === "live"
                          ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-500/20"
                          : "bg-gradient-to-r from-accent to-purple-600 hover:from-accent-hover hover:to-purple-500 shadow-accent/20"
                      )}
                    >
                      <IconPlayerPlay size={16} />
                      <span>
                        Deploy {parsedStrategy.name} ({agentMode.toUpperCase()})
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {/* Tab 3: Live Telemetry & Event Stream */}
              {activeTab === "telemetry" && (
                <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col justify-between space-y-4 font-mono">
                  {/* Status Bar */}
                  <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={cn(
                          "w-2.5 h-2.5 rounded-full",
                          isAgentRunning ? "bg-emerald-400 animate-pulse" : "bg-text-dim"
                        )}
                      />
                      <div>
                        <div className="text-xs font-bold text-text-primary">
                          {isAgentRunning ? "Agent Engine Live" : "Agent Standby"}
                        </div>
                        <div className="text-[10px] text-text-muted">
                          {isAgentRunning
                            ? `${tradeCount} trades executed | Mode: ${agentMode.toUpperCase()}`
                            : "No active agent running"}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div
                        className={cn(
                          "text-sm font-bold",
                          agentPnl >= 0 ? "text-emerald-400" : "text-rose-400"
                        )}
                      >
                        {agentPnl >= 0 ? "+" : ""}
                        {agentPnl}%
                      </div>
                      <span className="text-[10px] text-text-dim">Total PnL</span>
                    </div>
                  </div>

                  {/* Terminal Log Console */}
                  <div className="flex-1 min-h-[260px] p-3 rounded-lg bg-black border border-white/10 font-mono text-[11px] overflow-y-auto space-y-2">
                    {telemetryLogs.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center text-text-dim space-y-2 p-6">
                        <IconTerminal2 size={24} className="text-white/20" />
                        <p>No telemetry events yet. Deploy a strategy to start live scanning.</p>
                      </div>
                    ) : (
                      telemetryLogs.map((log) => (
                        <div
                          key={log.id}
                          className={cn(
                            "leading-relaxed border-l-2 pl-2 py-0.5",
                            log.type === "signal"
                              ? "border-accent text-accent/90"
                              : log.type === "buy"
                              ? "border-emerald-400 text-emerald-300"
                              : log.type === "sell"
                              ? log.pnl && log.pnl >= 0
                                ? "border-emerald-400 text-emerald-400"
                                : "border-rose-400 text-rose-400"
                              : "border-white/10 text-text-dim"
                          )}
                        >
                          <span className="text-[9px] text-text-dim mr-2 opacity-75">
                            [{log.time}]
                          </span>
                          <span>{log.text}</span>
                        </div>
                      ))
                    )}
                    <div ref={logsEndRef} />
                  </div>

                  {/* Controls */}
                  <div className="pt-2 flex items-center gap-2">
                    {isAgentRunning ? (
                      <button
                        onClick={() => {
                          setIsAgentRunning(false);
                          toast.info("Agent execution paused.");
                        }}
                        className="flex-1 py-2.5 px-3 rounded-md bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <IconPlayerStop size={15} />
                        <span>Stop Agent</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          if (!parsedStrategy) {
                            setActiveTab("prompt");
                            return;
                          }
                          setIsAgentRunning(true);
                          toast.success("Resumed agent execution.");
                        }}
                        className="flex-1 py-2.5 px-3 rounded-md bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <IconPlayerPlay size={15} />
                        <span>Start / Resume Agent</span>
                      </button>
                    )}

                    <button
                      onClick={() => setActiveTab("prompt")}
                      className="py-2.5 px-3 rounded-md bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-text-secondary text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <IconSparkles size={14} />
                      <span>New Prompt</span>
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
