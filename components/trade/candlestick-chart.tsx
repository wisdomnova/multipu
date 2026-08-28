"use client";

import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";

interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
  time: string;
}

interface CandlestickChartProps {
  currentPrice: number;
  priceDirection: "up" | "down" | "flat";
  gasSymbol: string;
}

export function CandlestickChart({ currentPrice, priceDirection, gasSymbol }: CandlestickChartProps) {
  const [candles, setCandles] = useState<Candle[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredCandle, setHoveredCandle] = useState<Candle | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  
  // Toggles and Filters
  const [chartType, setChartType] = useState<"candles" | "line">("candles");
  const [timeFilter, setTimeFilter] = useState<"15m" | "1h" | "4h" | "1d">("15m");

  // 1. Seed historical candles on load or whenever timeFilter changes
  useEffect(() => {
    const initialCandles: Candle[] = [];
    let prevClose = currentPrice * (0.92 + Math.random() * 0.05);

    const intervalMinutes = 
      timeFilter === "15m" ? 15 : 
      timeFilter === "1h" ? 60 : 
      timeFilter === "4h" ? 240 : 
      1440; // 1d

    for (let i = 24; i >= 0; i--) {
      const isUp = Math.random() > 0.46; // upward trend bias
      const change = prevClose * (Math.random() * 0.025);
      
      const open = prevClose;
      const close = isUp ? open + change : open - change;
      const high = Math.max(open, close) + (open * Math.random() * 0.012);
      const low = Math.min(open, close) - (open * Math.random() * 0.012);

      const d = new Date(Date.now() - i * intervalMinutes * 60 * 1000);
      let timeStr = "";
      if (timeFilter === "15m" || timeFilter === "1h") {
        timeStr = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      } else {
        timeStr = d.toLocaleDateString([], { month: "short", day: "numeric" });
      }

      initialCandles.push({ open, high, low, close, time: timeStr });
      prevClose = close;
    }
    setCandles(initialCandles);
  }, [timeFilter]);

  // 2. Update the active (last) candle when currentPrice ticks
  useEffect(() => {
    if (candles.length === 0) return;

    setCandles((prevCandles) => {
      const nextCandles = [...prevCandles];
      const lastIndex = nextCandles.length - 1;
      const lastCandle = { ...nextCandles[lastIndex] };

      // Update Close
      lastCandle.close = currentPrice;
      // Update High/Low bounds
      if (currentPrice > lastCandle.high) lastCandle.high = currentPrice;
      if (currentPrice < lastCandle.low) lastCandle.low = currentPrice;

      nextCandles[lastIndex] = lastCandle;
      return nextCandles;
    });
  }, [currentPrice]);

  // 3. Cycle candles: Close the active candle and open a new one
  useEffect(() => {
    const cycleInterval = setInterval(() => {
      setCandles((prevCandles) => {
        if (prevCandles.length === 0) return prevCandles;
        const lastCandle = prevCandles[prevCandles.length - 1];
        
        const d = new Date();
        let timeStr = "";
        if (timeFilter === "15m" || timeFilter === "1h") {
          timeStr = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        } else {
          timeStr = d.toLocaleDateString([], { month: "short", day: "numeric" });
        }

        const newCandle: Candle = {
          open: lastCandle.close,
          high: lastCandle.close,
          low: lastCandle.close,
          close: lastCandle.close,
          time: timeStr,
        };

        // Keep a rolling window of 25 candles
        return [...prevCandles.slice(1), newCandle];
      });
    }, 45000); // 45 seconds per candle cycle

    return () => clearInterval(cycleInterval);
  }, [timeFilter]);

  if (candles.length === 0) {
    return <div className="h-[300px] flex items-center justify-center text-xs text-text-dim">Loading chart...</div>;
  }

  // Calculate pricing bounds for scaling
  const prices = candles.flatMap((c) => [c.high, c.low, c.open, c.close]);
  const maxPrice = Math.max(...prices) * 1.002;
  const minPrice = Math.min(...prices) * 0.998;
  const priceRange = maxPrice - minPrice;

  // Render variables
  const width = 680;
  const height = 280;
  const rightAxisWidth = 80;
  const chartWidth = width - rightAxisWidth;
  const paddingBottom = 20;
  const chartHeight = height - paddingBottom;

  const scaleY = (val: number) => {
    return chartHeight - ((val - minPrice) / priceRange) * (chartHeight - 15);
  };

  const candleCount = candles.length;
  const slotWidth = chartWidth / candleCount;
  const bodyWidth = slotWidth * 0.65;

  // Grid lines
  const gridLinesCount = 5;
  const gridLines = Array.from({ length: gridLinesCount }, (_, i) => {
    const val = minPrice + (priceRange / (gridLinesCount - 1)) * i;
    return { val, y: scaleY(val) };
  });

  const latestCandle = candles[candles.length - 1];
  const displayCandle = hoveredCandle || latestCandle;
  const changePct = ((displayCandle.close - displayCandle.open) / displayCandle.open) * 100;

  // Polyline coordinates for Line/Area chart view
  const points = candles.map((c, idx) => ({
    x: idx * slotWidth + slotWidth / 2,
    y: scaleY(c.close),
  }));
  const linePath = points.map((p, idx) => `${idx === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = points.length > 0
    ? `${linePath} L ${points[points.length - 1].x} ${chartHeight} L ${points[0].x} ${chartHeight} Z`
    : "";
  const isOverallUp = candles.length > 0 && candles[candles.length - 1].close >= candles[0].open;

  return (
    <div className="border border-border p-5 rounded-none flex flex-col gap-4 bg-white/[0.002]" ref={containerRef}>
      {/* Chart Top Info Bar */}
      <div className="flex items-center justify-between text-[11px] font-mono border-b border-border pb-3 flex-wrap gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-text-primary font-semibold">TradingView Live</span>
          <span className="text-text-dim">|</span>
          <span className="text-text-muted">O:</span>
          <span className={cn("font-medium", displayCandle.close >= displayCandle.open ? "text-success" : "text-error")}>
            {displayCandle.open.toFixed(8)}
          </span>
          <span className="text-text-muted">H:</span>
          <span className="text-text-primary">{displayCandle.high.toFixed(8)}</span>
          <span className="text-text-muted">L:</span>
          <span className="text-text-primary">{displayCandle.low.toFixed(8)}</span>
          <span className="text-text-muted">C:</span>
          <span className={cn("font-medium", displayCandle.close >= displayCandle.open ? "text-success" : "text-error")}>
            {displayCandle.close.toFixed(8)}
          </span>
          <div className={cn("text-[10px] px-1.5 py-0.5 font-bold rounded-sm uppercase inline-block", changePct >= 0 ? "text-success bg-success/5" : "text-error bg-error/5")}>
            {changePct >= 0 ? "+" : ""}{changePct.toFixed(2)}%
          </div>
        </div>

        {/* Filters and Chart Type Toggles */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Timeframe Filters */}
          <div className="flex items-center bg-white/[0.03] p-0.5 rounded border border-border/40">
            {(["15m", "1h", "4h", "1d"] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setTimeFilter(filter)}
                className={cn(
                  "px-2 py-0.5 text-[9px] font-mono rounded transition-all",
                  timeFilter === filter
                    ? "bg-white/[0.08] text-white font-semibold"
                    : "text-text-dim hover:text-text-muted"
                )}
              >
                {filter}
              </button>
            ))}
          </div>

          {/* Chart View Toggle Switch */}
          <div className="flex items-center bg-white/[0.04] p-0.5 rounded border border-border/40">
            {(["candles", "line"] as const).map((type) => (
              <button
                key={type}
                onClick={() => setChartType(type)}
                className={cn(
                  "px-2.5 py-0.5 text-[9px] font-mono rounded capitalize transition-all",
                  chartType === type
                    ? "bg-white/[0.08] text-white font-semibold"
                    : "text-text-dim hover:text-text-muted"
                )}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div className="relative select-none overflow-hidden h-[280px]">
        <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%" className="overflow-visible">
          {/* Horizontal Grid lines */}
          {gridLines.map((line, idx) => (
            <g key={idx}>
              <line
                x1={0}
                y1={line.y}
                x2={chartWidth}
                y2={line.y}
                stroke="rgba(255,255,255,0.03)"
                strokeDasharray="4 4"
                strokeWidth={1}
              />
              <text
                x={chartWidth + 8}
                y={line.y + 3}
                fill="var(--text-dim)"
                fontSize={9}
                fontFamily="monospace"
                textAnchor="start"
              >
                {line.val.toFixed(6)}
              </text>
            </g>
          ))}

          {/* Time coordinates labels */}
          {candles.map((candle, idx) => {
            if (idx % 6 !== 0) return null; // Show label every 6 candles to avoid clutter
            const x = idx * slotWidth + slotWidth / 2;
            return (
              <text
                key={idx}
                x={x}
                y={height - 2}
                fill="var(--text-dim)"
                fontSize={9}
                fontFamily="monospace"
                textAnchor="middle"
              >
                {candle.time}
              </text>
            );
          })}

          {/* Line/Area chart view rendering */}
          {chartType === "line" && (
            <>
              {/* Linear Gradient Fill */}
              <defs>
                <linearGradient id="chartLineGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={isOverallUp ? "rgb(16, 185, 129)" : "rgb(239, 68, 68)"} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={isOverallUp ? "rgb(16, 185, 129)" : "rgb(239, 68, 68)"} stopOpacity={0.0} />
                </linearGradient>
              </defs>

              {/* Area path */}
              <path
                d={areaPath}
                fill="url(#chartLineGradient)"
                className="transition-all duration-300"
              />

              {/* Glowing Line path */}
              <path
                d={linePath}
                fill="none"
                stroke={isOverallUp ? "rgb(16, 185, 129)" : "rgb(239, 68, 68)"}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-all duration-300"
                filter={isOverallUp ? "drop-shadow(0 0 3px rgba(16, 185, 129, 0.4))" : "drop-shadow(0 0 3px rgba(239, 68, 68, 0.4))"}
              />

              {/* Hover overlay targets for line chart details */}
              {candles.map((candle, idx) => {
                const xCenter = idx * slotWidth + slotWidth / 2;
                return (
                  <rect
                    key={idx}
                    x={xCenter - slotWidth / 2}
                    y={0}
                    width={slotWidth}
                    height={chartHeight}
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={() => {
                      setHoveredCandle(candle);
                      setHoverIndex(idx);
                    }}
                    onMouseLeave={() => {
                      setHoveredCandle(null);
                      setHoverIndex(null);
                    }}
                  />
                );
              })}
            </>
          )}

          {/* Candlestick view rendering */}
          {chartType === "candles" && candles.map((candle, idx) => {
            const isGreen = candle.close >= candle.open;
            const xCenter = idx * slotWidth + slotWidth / 2;
            const xBody = xCenter - bodyWidth / 2;
            
            const yHigh = scaleY(candle.high);
            const yLow = scaleY(candle.low);
            const yOpen = scaleY(candle.open);
            const yClose = scaleY(candle.close);
            
            const yMax = Math.min(yOpen, yClose);
            const yMin = Math.max(yOpen, yClose);
            const bodyHeight = Math.max(2, yMin - yMax);

            return (
              <g
                key={idx}
                className="cursor-pointer transition-opacity duration-200"
                onMouseEnter={() => {
                  setHoveredCandle(candle);
                  setHoverIndex(idx);
                }}
                onMouseLeave={() => {
                  setHoveredCandle(null);
                  setHoverIndex(null);
                }}
                opacity={hoverIndex === null || hoverIndex === idx ? 1 : 0.65}
              >
                {/* Vertical Wick Line */}
                <line
                  x1={xCenter}
                  y1={yHigh}
                  x2={xCenter}
                  y2={yLow}
                  stroke={isGreen ? "rgb(16, 185, 129)" : "rgb(239, 68, 68)"}
                  strokeWidth={1.2}
                />
                {/* Glowing candle body */}
                <rect
                  x={xBody}
                  y={yMax}
                  width={bodyWidth}
                  height={bodyHeight}
                  fill={isGreen ? "rgba(16, 185, 129, 0.85)" : "rgba(239, 68, 68, 0.85)"}
                  className="transition-all duration-300"
                  filter={isGreen ? "drop-shadow(0 0 2px rgba(16, 185, 129, 0.2))" : "drop-shadow(0 0 2px rgba(239, 68, 68, 0.2))"}
                />
              </g>
            );
          })}

          {/* Current price horizontal dashed tracker */}
          <g>
            <line
              x1={0}
              y1={scaleY(currentPrice)}
              x2={chartWidth}
              y2={scaleY(currentPrice)}
              stroke={priceDirection === "up" ? "#10B981" : priceDirection === "down" ? "#EF4444" : "rgba(255,255,255,0.25)"}
              strokeDasharray="2 2"
              strokeWidth={1}
            />
            {/* Price Badge on Y-Axis */}
            <rect
              x={chartWidth}
              y={scaleY(currentPrice) - 8}
              width={75}
              height={16}
              fill={priceDirection === "up" ? "rgba(16, 185, 129, 0.95)" : priceDirection === "down" ? "rgba(239, 68, 68, 0.95)" : "rgba(30, 41, 59, 0.95)"}
              rx={2}
            />
            <text
              x={chartWidth + 37}
              y={scaleY(currentPrice) + 3}
              fill="#ffffff"
              fontSize={8.5}
              fontFamily="monospace"
              fontWeight="bold"
              textAnchor="middle"
            >
              {currentPrice.toFixed(6)}
            </text>
          </g>
        </svg>
      </div>
    </div>
  );
}
