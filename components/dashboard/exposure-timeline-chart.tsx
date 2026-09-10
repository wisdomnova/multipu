"use client";

import { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface ExposurePoint {
  date: string;
  value: number;
}

interface ExposureData {
  total: string;
  change: string;
  period: string;
  points: ExposurePoint[];
}

const fallbackPoints: ExposurePoint[] = [
  { date: "18 Dec", value: 5200 },
  { date: "20 Dec", value: 4300 },
  { date: "22 Dec", value: 4800 },
  { date: "24 Dec", value: 4600 },
  { date: "25 Dec", value: 4200 },
  { date: "26 Dec", value: 4500 },
  { date: "27 Dec", value: 3600 },
  { date: "28 Dec", value: 4100 },
  { date: "29 Dec", value: 3200 },
  { date: "30 Dec", value: 3700 },
  { date: "31 Dec", value: 2900 },
  { date: "1 Jan", value: 3400 },
  { date: "2 Jan", value: 3800 },
  { date: "3 Jan", value: 4500 },
  { date: "4 Jan", value: 5400 },
  { date: "5 Jan", value: 7100 },
  { date: "6 Jan", value: 9284 },
  { date: "7 Jan", value: 8100 },
  { date: "8 Jan", value: 12200 },
  { date: "9 Jan", value: 10400 },
  { date: "10 Jan", value: 11200 },
  { date: "11 Jan", value: 8900 },
  { date: "12 Jan", value: 9400 },
  { date: "13 Jan", value: 9600 },
];

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; payload: ExposurePoint }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="flex flex-col items-center -translate-y-2 pointer-events-none">
        <div className="px-3 py-1 bg-white text-black text-xs font-mono font-bold rounded-lg shadow-lg flex items-center gap-2">
          <span className="text-neutral-500 font-normal">{data.date}</span>
          <span>{data.value.toLocaleString()}</span>
        </div>
      </div>
    );
  }
  return null;
}

export function ExposureTimelineChart({
  initialData,
}: {
  initialData?: ExposureData;
}) {
  const [data, setData] = useState<ExposureData>(
    initialData || {
      total: "9,284",
      change: "↑ 21.6%",
      period: "last month",
      points: fallbackPoints,
    }
  );
  const [mounted, setMounted] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Fetch live data from backend if initialData wasn't passed
    if (!initialData) {
      fetch("/api/dashboard/exposure")
        .then((res) => (res.ok ? res.json() : null))
        .then((res) => {
          if (res?.points?.length) {
            setData({
              total: res.formattedTotal || "9,284",
              change: res.changeFormatted || "↑ 21.6%",
              period: res.period || "last month",
              points: res.points,
            });
          }
        })
        .catch(() => {});
    }
  }, [initialData]);

  const points = data.points?.length ? data.points : fallbackPoints;

  return (
    <div className="rounded-2xl bg-[#181818] p-6 sm:p-8 mb-8">
      {/* Header Info */}
      <div className="text-sm font-medium text-neutral-400 font-sans mb-1">
        Exposure Timeline
      </div>
      <div className="flex items-baseline gap-3 mb-6">
        <span className="text-4xl sm:text-5xl font-bold font-mono tracking-tight text-white">
          {data.total}
        </span>
        <span className="text-xs font-mono text-emerald-400 font-medium">
          {data.change} <span className="text-neutral-500">{data.period}</span>
        </span>
      </div>

      {/* Chart Canvas */}
      <div
        className="relative w-full h-48 sm:h-64"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {mounted ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={points}
              margin={{ top: 35, right: 10, left: 10, bottom: 5 }}
            >
              <XAxis dataKey="date" hide />
              <YAxis hide domain={["dataMin - 1000", "dataMax + 1000"]} />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{
                  stroke: "rgba(255,255,255,0.15)",
                  strokeWidth: 1,
                  strokeDasharray: "3 3",
                }}
              />
              <Line
                type="linear"
                dataKey="value"
                stroke="#ffffff"
                strokeWidth={1.8}
                dot={false}
                activeDot={{
                  r: 4.5,
                  fill: "#ffffff",
                  stroke: "#181818",
                  strokeWidth: 2,
                }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full animate-pulse bg-white/[0.02] rounded-lg" />
        )}

        {/* Static Default Tooltip matching screenshot when not actively hovering */}
        {!isHovering && (
          <div className="absolute top-[42px] right-[24%] sm:right-[31%] flex flex-col items-center pointer-events-none transition-opacity duration-200">
            <div className="px-3 py-1 bg-white text-black text-xs font-mono font-bold rounded-lg shadow-lg flex items-center gap-2">
              <span className="text-neutral-500 font-normal">6 Jan</span>
              <span>9,284</span>
            </div>
            <div className="w-2 h-2 rounded-full bg-white ring-4 ring-white/20 mt-1" />
          </div>
        )}
      </div>
    </div>
  );
}
