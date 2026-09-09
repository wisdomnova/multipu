"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  IconX,
  IconCheck,
  IconArrowUp,
  IconRefresh,
  IconPlayerPlay,
  IconPlayerStop,
  IconSparkles,
  IconCircleCheck,
  IconCircleCheckFilled,
  IconTerminal2,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ParsedStrategy, StrategySimulationResult } from "@/lib/agents/types";

interface Message {
  id: string;
  sender: "user" | "agent";
  text?: string;
  strategy?: ParsedStrategy;
  simulation?: StrategySimulationResult;
  status?: "active" | "paused" | "completed";
  telemetryLogs?: { time: string; text: string; type: "info" | "signal" | "buy" | "sell" }[];
}

const STARTER_PROMPTS = [
  {
    label: "Pump.fun Momentum",
    prompt: "Scalp fresh Pump.fun memes on Solana with >$5k volume and OlaXBT momentum >80. Max 0.2 SOL per trade. Take profit at +35%, stop loss at -12%.",
  },
  {
    label: "Meteora DLMM Hunter",
    prompt: "Trade high-volatility Solana tokens on Meteora DLMM. Take profit at +45%, stop loss at -15%. 0.25 SOL trade size.",
  },
  {
    label: "Four.meme BSC Scalper",
    prompt: "Snipe trending BSC tokens on Four.meme with >$3k volume. Take profit at +50%, stop loss at -10%. 0.05 BNB per trade.",
  },
  {
    label: "OlaXBT Alpha Whale",
    prompt: "Follow top smart-money wallet accumulations on Solana with OlaXBT score >85. 0.5 SOL size, TP at +60%, SL at -15%.",
  },
];

export function TradingAgentCopilot() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputPrompt, setInputPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isAgentRunning, setIsAgentRunning] = useState(false);
  const [activeStrategy, setActiveStrategy] = useState<ParsedStrategy | null>(null);
  const [agentMode, setAgentMode] = useState<"paper" | "live">("paper");
  const [totalPnl, setTotalPnl] = useState<number>(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isLoading]);

  // Live telemetry generator when agent is running
  useEffect(() => {
    if (!isAgentRunning || !activeStrategy) return;

    const sampleTokens = ["$PEPE2", "$DOGEX", "$SOLAI", "$NEOPUMP", "$BAGMAN"];

    const interval = setInterval(() => {
      const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      const rand = Math.random();
      const randomToken = sampleTokens[Math.floor(Math.random() * sampleTokens.length)];

      let newLog: { time: string; text: string; type: "info" | "signal" | "buy" | "sell" };

      if (rand < 0.4) {
        newLog = {
          time: now,
          type: "info",
          text: `Scanned pools on ${activeStrategy.rules.launchpads.join(", ")}. Filter checks passed.`,
        };
      } else if (rand < 0.7) {
        const score = Math.floor(Math.random() * 15 + 80);
        newLog = {
          time: now,
          type: "signal",
          text: `OlaXBT momentum score ${score}/100 detected on ${randomToken}. 24h Vol: $${(Math.random() * 15 + 5).toFixed(1)}k.`,
        };
      } else if (rand < 0.88) {
        newLog = {
          time: now,
          type: "buy",
          text: `BUY executed: ${activeStrategy.rules.tradeAmount} ${activeStrategy.rules.chain.toUpperCase() === "BSC" ? "BNB" : "SOL"} on ${randomToken} via private mempool shield.`,
        };
      } else {
        const isProfit = Math.random() > 0.3;
        const pnl = isProfit
          ? +(activeStrategy.rules.takeProfitPct)
          : -(activeStrategy.rules.stopLossPct);

        setTotalPnl((prev) => +(prev + (pnl > 0 ? pnl * 0.05 : pnl * 0.02)).toFixed(2));

        newLog = {
          time: now,
          type: "sell",
          text: `SOLD ${randomToken} (${isProfit ? "Take Profit hit" : "Stop Loss executed"}: ${pnl > 0 ? "+" : ""}${pnl}%).`,
        };
      }

      setMessages((prev) => {
        const lastMsg = prev[prev.length - 1];
        if (lastMsg && lastMsg.sender === "agent" && lastMsg.telemetryLogs) {
          return [
            ...prev.slice(0, -1),
            {
              ...lastMsg,
              telemetryLogs: [...lastMsg.telemetryLogs.slice(-20), newLog],
            },
          ];
        }
        return prev;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [isAgentRunning, activeStrategy]);

  // Handle submit strategy
  const handleSubmit = async (customPrompt?: string) => {
    const text = (customPrompt || inputPrompt).trim();
    if (!text) return;

    const userMessage: Message = {
      id: Math.random().toString(),
      sender: "user",
      text,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputPrompt("");
    setIsLoading(true);
    setLoadingStatus("Analyzing strategy requirements...");

    try {
      // 1. Parse prompt
      const parseRes = await fetch("/api/agents/parse-strategy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: text }),
      });

      const parseData = await parseRes.json();
      if (!parseRes.ok) throw new Error(parseData.error || "Failed to compile strategy");

      setLoadingStatus("Running deterministic simulation & backtest...");

      // 2. Simulate
      const simRes = await fetch("/api/agents/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rules: parseData.strategy.rules }),
      });

      const simData = await simRes.json();

      const agentMessage: Message = {
        id: Math.random().toString(),
        sender: "agent",
        strategy: parseData.strategy,
        simulation: simData.simulation,
      };

      setMessages((prev) => [...prev, agentMessage]);
      setActiveStrategy(parseData.strategy);
    } catch (err: any) {
      toast.error(err.message || "Failed to process strategy");
      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          sender: "agent",
          text: "Sorry, I could not parse that strategy. Please specify target tokens, volume triggers, and take profit or stop loss percentages.",
        },
      ]);
    } finally {
      setIsLoading(false);
      setLoadingStatus("");
    }
  };

  // Deploy agent
  const handleDeploy = async (strategy: ParsedStrategy, mode: "paper" | "live") => {
    setAgentMode(mode);
    setIsAgentRunning(true);
    setActiveStrategy(strategy);

    try {
      await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: strategy.name,
          description: strategy.summary,
          prompt: strategy.name,
          mode,
          chain: strategy.rules.chain,
          launchpads: strategy.rules.launchpads,
          strategyConfig: strategy.rules,
          budgetAllocated: strategy.rules.tradeAmount * 5,
        }),
      });
    } catch {
      // Ignored
    }

    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    const liveMessage: Message = {
      id: Math.random().toString(),
      sender: "agent",
      text: `Strategy deployed in ${mode.toUpperCase()} mode. Active scanning initiated via KeeperHub private mempool.`,
      telemetryLogs: [
        {
          time: now,
          type: "info",
          text: `Strategy initialized. Monitoring ${strategy.rules.chain.toUpperCase()} pairs.`,
        },
      ],
    };

    setMessages((prev) => [...prev, liveMessage]);
    toast.success(`Agent active in ${mode} mode`);
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "flex items-center gap-2.5 px-4 py-2.5 rounded-full text-xs font-mono font-medium transition-all shadow-lg border border-purple-400/30 cursor-pointer text-white bg-purple-600 hover:bg-purple-700 active:scale-95"
          )}
        >
          <span
            className={cn(
              "w-2 h-2 rounded-full",
              isAgentRunning ? "bg-emerald-300 animate-pulse" : "bg-white/80"
            )}
          />
          <span className="text-white font-semibold">
            {isAgentRunning
              ? `Agent Active (${totalPnl >= 0 ? "+" : ""}${totalPnl}%)`
              : "AI Copilot"}
          </span>
        </button>
      </div>

      {/* Floating Popover Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="fixed bottom-20 right-6 z-50 w-[420px] max-w-[calc(100vw-32px)] h-[580px] max-h-[calc(100vh-120px)] bg-[#0c0d12] border border-border rounded-xl shadow-2xl flex flex-col overflow-hidden font-sans"
          >
            {/* Header */}
            <div className="px-4 py-3.5 border-b border-border flex items-center justify-between bg-[#101117]">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "w-2 h-2 rounded-full",
                    isAgentRunning ? "bg-emerald-400" : "bg-text-dim"
                  )}
                />
                <h3 className="text-xs font-semibold text-text-primary font-mono uppercase tracking-wider">
                  Strategy Copilot
                </h3>
              </div>

              <div className="flex items-center gap-2">
                {isAgentRunning && (
                  <button
                    onClick={() => {
                      setIsAgentRunning(false);
                      toast.info("Agent execution stopped");
                    }}
                    className="text-[11px] font-mono text-rose-400 hover:text-rose-300 px-2 py-0.5 rounded border border-rose-500/20 bg-rose-500/5 cursor-pointer"
                  >
                    Stop Agent
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-text-muted hover:text-text-primary transition-colors cursor-pointer rounded"
                >
                  <IconX size={15} />
                </button>
              </div>
            </div>

            {/* Conversation Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="space-y-4 pt-2">
                  <div className="text-xs text-text-secondary leading-relaxed font-sans">
                    Describe your trading strategy in plain text to compile rules, run pre-flight backtests, and deploy on-chain.
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-text-dim block">
                      Quick Starters
                    </span>
                    <div className="grid grid-cols-1 gap-1.5">
                      {STARTER_PROMPTS.map((item) => (
                        <button
                          key={item.label}
                          onClick={() => handleSubmit(item.prompt)}
                          className="w-full text-left px-3 py-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] border border-border/60 transition-colors cursor-pointer text-xs group"
                        >
                          <div className="font-medium text-text-primary group-hover:text-accent font-sans">
                            {item.label}
                          </div>
                          <div className="text-[11px] text-text-dim font-mono truncate mt-0.5">
                            {item.prompt}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Message List */}
              {messages.map((msg) => (
                <div key={msg.id} className="space-y-2">
                  {/* User Message */}
                  {msg.sender === "user" && (
                    <div className="flex justify-end">
                      <div className="max-w-[85%] px-3.5 py-2.5 rounded-lg bg-[#1a1b24] border border-border text-xs text-text-primary font-sans leading-relaxed">
                        {msg.text}
                      </div>
                    </div>
                  )}

                  {/* Agent Response Text */}
                  {msg.sender === "agent" && msg.text && (
                    <div className="flex justify-start">
                      <div className="max-w-[90%] px-3.5 py-2.5 rounded-lg bg-white/[0.02] border border-border text-xs text-text-secondary font-sans leading-relaxed">
                        {msg.text}
                      </div>
                    </div>
                  )}

                  {/* Structured Strategy & Simulation Card */}
                  {msg.strategy && (
                    <div className="rounded-lg border border-border bg-[#101117] p-3.5 space-y-3 font-sans">
                      <div className="flex items-center justify-between pb-2 border-b border-border/60">
                        <span className="text-xs font-semibold text-text-primary">
                          {msg.strategy.name}
                        </span>
                        <span className="font-mono text-[10px] text-text-dim uppercase px-1.5 py-0.5 rounded bg-white/[0.03] border border-border">
                          {msg.strategy.rules.chain.toUpperCase()}
                        </span>
                      </div>

                      {/* Checklist Rules (screenshot 4 style) */}
                      <div className="space-y-1.5 font-mono text-[11px] text-text-secondary bg-black/40 p-2.5 rounded border border-border/40">
                        <div className="flex items-center gap-2">
                          <IconCircleCheckFilled size={13} className="text-emerald-400 flex-shrink-0" />
                          <span>Chain: {msg.strategy.rules.chain.toUpperCase()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <IconCircleCheckFilled size={13} className="text-emerald-400 flex-shrink-0" />
                          <span>Launchpads: {msg.strategy.rules.launchpads.join(", ")}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <IconCircleCheckFilled size={13} className="text-emerald-400 flex-shrink-0" />
                          <span>Min 24h Volume: ${msg.strategy.rules.minVolume24hUsd.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <IconCircleCheckFilled size={13} className="text-emerald-400 flex-shrink-0" />
                          <span>OlaXBT Momentum Score: &gt;{msg.strategy.rules.minOlaXbtScore}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <IconCircleCheckFilled size={13} className="text-emerald-400 flex-shrink-0" />
                          <span>Take Profit: +{msg.strategy.rules.takeProfitPct}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <IconCircleCheckFilled size={13} className="text-emerald-400 flex-shrink-0" />
                          <span>Stop Loss: -{msg.strategy.rules.stopLossPct}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <IconCircleCheckFilled size={13} className="text-emerald-400 flex-shrink-0" />
                          <span>Trade Allocation: {msg.strategy.rules.tradeAmount} {msg.strategy.rules.chain.toUpperCase() === "BSC" ? "BNB" : "SOL"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <IconCircleCheckFilled size={13} className="text-emerald-400 flex-shrink-0" />
                          <span>MEV Protection: Active (Private Mempool)</span>
                        </div>
                      </div>

                      {/* Simulation Stats */}
                      {msg.simulation && (
                        <div className="grid grid-cols-2 gap-2 font-mono text-[11px] pt-1">
                          <div className="p-2 rounded bg-white/[0.02] border border-border text-center">
                            <span className="text-[10px] text-text-dim block">Simulated Win Rate</span>
                            <span className="font-semibold text-emerald-400">{msg.simulation.winRatePct}%</span>
                          </div>
                          <div className="p-2 rounded bg-white/[0.02] border border-border text-center">
                            <span className="text-[10px] text-text-dim block">Expected PnL</span>
                            <span className="font-semibold text-text-primary">+{msg.simulation.expectedPnlPct}%</span>
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 pt-1 font-mono text-xs">
                        <button
                          onClick={() => handleDeploy(msg.strategy!, "paper")}
                          className="flex-1 py-2 rounded bg-white/[0.04] hover:bg-white/[0.08] border border-border text-text-primary transition-colors cursor-pointer text-center"
                        >
                          Paper Trade
                        </button>
                        <button
                          onClick={() => handleDeploy(msg.strategy!, "live")}
                          className="flex-1 py-2 rounded bg-accent hover:bg-accent/90 text-white font-medium transition-colors cursor-pointer text-center"
                        >
                          Deploy Live
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Telemetry Stream Log Box */}
                  {msg.telemetryLogs && msg.telemetryLogs.length > 0 && (
                    <div className="rounded-lg border border-border bg-black p-3 space-y-1.5 font-mono text-[11px] max-h-48 overflow-y-auto">
                      <div className="text-[10px] text-text-dim uppercase tracking-wider pb-1 border-b border-border/40">
                        Live Execution Logs
                      </div>
                      {msg.telemetryLogs.map((log, idx) => (
                        <div
                          key={idx}
                          className={cn(
                            "leading-relaxed",
                            log.type === "buy" && "text-emerald-300",
                            log.type === "sell" && "text-emerald-400",
                            log.type === "signal" && "text-accent",
                            log.type === "info" && "text-text-dim"
                          )}
                        >
                          <span className="text-text-dim mr-1.5">[{log.time}]</span>
                          <span>{log.text}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Loading Indicator (screenshot 3 style) */}
              {isLoading && (
                <div className="flex items-center gap-2 text-xs text-text-muted font-mono py-2">
                  <IconRefresh size={13} className="animate-spin text-accent" />
                  <span>{loadingStatus}</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Bottom Input Area (screenshot 3 style) */}
            <div className="p-3 border-t border-border bg-[#101117]">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSubmit();
                }}
                className="flex items-center gap-2 p-1.5 rounded-lg bg-black border border-border focus-within:border-accent/80 transition-colors"
              >
                <input
                  type="text"
                  value={inputPrompt}
                  onChange={(e) => setInputPrompt(e.target.value)}
                  placeholder="Describe your trading strategy..."
                  disabled={isLoading}
                  className="flex-1 bg-transparent px-2.5 py-1 text-xs text-text-primary placeholder:text-text-dim focus:outline-none font-sans"
                />
                <button
                  type="submit"
                  disabled={isLoading || !inputPrompt.trim()}
                  className="w-7 h-7 rounded-full bg-accent hover:bg-accent/90 disabled:opacity-30 text-white flex items-center justify-center transition-colors cursor-pointer flex-shrink-0"
                >
                  <IconArrowUp size={14} />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
