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

    for (let i = 28; i >= 0; i--) {
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

        // Keep a rolling window of 29 candles
        return [...prevCandles.slice(1), newCandle];
      });
    }, 45000); // 45 seconds per candle cycle

    return () => clearInterval(cycleInterval);
  }, [timeFilter]);

  if (candles.length === 0) {
    return <div className="h-[320px] flex items-center justify-center text-xs text-neutral-500 font-mono">Loading chart...</div>;
  }

  // Calculate pricing bounds for scaling
  const prices = candles.flatMap((c) => [c.high, c.low, c.open, c.close]);
  const maxPrice = Math.max(...prices) * 1.002;
  const minPrice = Math.min(...prices) * 0.998;
  const priceRange = maxPrice - minPrice;

  // Render variables - wider dimensions filling available space
  const width = 880;
  const height = 310;
  const rightAxisWidth = 70;
  const chartWidth = width - rightAxisWidth;
  const paddingBottom = 22;
  const chartHeight = height - paddingBottom;

  const scaleY = (val: number) => {
    return chartHeight - ((val - minPrice) / priceRange) * (chartHeight - 15);
  };

  const candleCount = candles.length;
  const slotWidth = chartWidth / candleCount;
  const bodyWidth = slotWidth * 0.7;

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
    <div className="bg-[#181818] border border-white/[0.04] p-6 rounded-2xl flex flex-col gap-4 w-full" ref={containerRef}>
      {/* Chart Top Info Bar */}
      <div className="flex items-center justify-between text-xs font-mono border-b border-white/[0.04] pb-3.5 flex-wrap gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-white font-semibold font-sans">Live Chart</span>
          <span className="text-neutral-600">|</span>
          <span className="text-neutral-500">O:</span>
          <span className={cn("font-medium", displayCandle.close >= displayCandle.open ? "text-emerald-400" : "text-red-400")}>
            {displayCandle.open.toFixed(8)}
          </span>
          <span className="text-neutral-500">H:</span>
          <span className="text-neutral-300">{displayCandle.high.toFixed(8)}</span>
          <span className="text-neutral-500">L:</span>
          <span className="text-neutral-300">{displayCandle.low.toFixed(8)}</span>
          <span className="text-neutral-500">C:</span>
          <span className={cn("font-medium", displayCandle.close >= displayCandle.open ? "text-emerald-400" : "text-red-400")}>
            {displayCandle.close.toFixed(8)}
          </span>
          <div className={cn("text-[10px] px-2 py-0.5 font-semibold font-mono rounded-full uppercase inline-block", changePct >= 0 ? "text-emerald-400 bg-emerald-400/10" : "text-red-400 bg-red-400/10")}>
            {changePct >= 0 ? "+" : ""}{changePct.toFixed(2)}%
          </div>
        </div>

        <div className="text-[11px] font-mono text-neutral-400">
          Pair: {gasSymbol}
        </div>
      </div>

      {/* SVG Canvas Area - Expanded width */}
      <div className="relative select-none overflow-hidden h-[310px] w-full">
        <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%" className="w-full h-full">
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
                x={chartWidth + 6}
                y={line.y + 3}
                fill="#737373"
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
            if (idx % 5 !== 0) return null; // Show label every 5 candles
            const x = idx * slotWidth + slotWidth / 2;
            return (
              <text
                key={idx}
                x={x}
                y={height - 2}
                fill="#737373"
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
                  <stop offset="0%" stopColor={isOverallUp ? "rgb(52, 211, 153)" : "rgb(248, 113, 113)"} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={isOverallUp ? "rgb(52, 211, 153)" : "rgb(248, 113, 113)"} stopOpacity={0.0} />
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
                stroke={isOverallUp ? "rgb(52, 211, 153)" : "rgb(248, 113, 113)"}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-all duration-300"
                filter={isOverallUp ? "drop-shadow(0 0 3px rgba(52, 211, 153, 0.4))" : "drop-shadow(0 0 3px rgba(248, 113, 113, 0.4))"}
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
                  stroke={isGreen ? "rgb(52, 211, 153)" : "rgb(248, 113, 113)"}
                  strokeWidth={1.2}
                />
                {/* Glowing candle body */}
                <rect
                  x={xBody}
                  y={yMax}
                  width={bodyWidth}
                  height={bodyHeight}
                  fill={isGreen ? "rgba(52, 211, 153, 0.85)" : "rgba(248, 113, 113, 0.85)"}
                  className="transition-all duration-300"
                  filter={isGreen ? "drop-shadow(0 0 2px rgba(52, 211, 153, 0.2))" : "drop-shadow(0 0 2px rgba(248, 113, 113, 0.2))"}
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
              stroke={priceDirection === "up" ? "#34D399" : priceDirection === "down" ? "#F87171" : "rgba(255,255,255,0.25)"}
              strokeDasharray="2 2"
              strokeWidth={1}
            />
            {/* Price Badge on Y-Axis */}
            <rect
              x={chartWidth}
              y={scaleY(currentPrice) - 8}
              width={66}
              height={16}
              fill={priceDirection === "up" ? "rgba(52, 211, 153, 0.95)" : priceDirection === "down" ? "rgba(248, 113, 113, 0.95)" : "rgba(30, 41, 59, 0.95)"}
              rx={4}
            />
            <text
              x={chartWidth + 33}
              y={scaleY(currentPrice) + 4}
              fill={priceDirection === "up" || priceDirection === "down" ? "#000000" : "#ffffff"}
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

      {/* Bottom Controls Bar: Timeframe Filters & Chart Type Toggle */}
      <div className="flex items-center justify-between pt-3 border-t border-white/[0.04] flex-wrap gap-3">
        {/* Timeframe Filters */}
        <div className="flex items-center bg-[#141414] p-1 rounded-full border border-white/[0.04]">
          {(["15m", "1h", "4h", "1d"] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setTimeFilter(filter)}
              className={cn(
                "px-3 py-1 text-xs font-mono rounded-full transition-all cursor-pointer",
                timeFilter === filter
                  ? "bg-white text-black font-semibold"
                  : "text-neutral-400 hover:text-white"
              )}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Chart View Toggle Switch */}
        <div className="flex items-center bg-[#141414] p-1 rounded-full border border-white/[0.04]">
          {(["candles", "line"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setChartType(type)}
              className={cn(
                "px-3.5 py-1 text-xs font-mono rounded-full capitalize transition-all cursor-pointer",
                chartType === type
                  ? "bg-white text-black font-semibold"
                  : "text-neutral-400 hover:text-white"
              )}
            >
              {type}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
