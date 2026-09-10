"use client";

import { useState, useEffect, useMemo } from "react";
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

function generateDynamicFallback(): ExposurePoint[] {
  const now = new Date();
  const days = 30;
  const pattern = [
    7635, 7420, 7550, 7310, 7680, 7490, 7820, 7610, 7940, 7750,
    8120, 7890, 8250, 8040, 8390, 8180, 8520, 8310, 8640, 8450,
    8790, 8580, 8920, 8710, 9050, 8820, 9140, 8950, 9190, 9284
  ];

  return Array.from({ length: days }).map((_, i) => {
    const d = new Date(now.getTime() - (days - 1 - i) * 86400000);
    const day = d.getDate();
    const month = d.toLocaleDateString("en-US", { month: "short" });
    return {
      date: `${day} ${month}`,
      value: pattern[i] || 9000,
    };
  });
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; payload: ExposurePoint }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="flex flex-col items-center -translate-y-3 pointer-events-none">
        <div className="px-3 py-1.5 bg-white text-black text-xs font-mono font-bold rounded-lg shadow-xl flex items-center gap-2 border border-neutral-200">
          <span className="text-neutral-500 font-normal">{data.date}</span>
          <span className="font-bold text-black">{data.value.toLocaleString()}</span>
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
  const dynamicFallback = useMemo(() => generateDynamicFallback(), []);

  const [data, setData] = useState<ExposureData>(
    initialData || {
      total: "9,284",
      change: "↑ 21.6%",
      period: "last month",
      points: dynamicFallback,
    }
  );
  const [mounted, setMounted] = useState(false);

  // Synchronize when initialData arrives from parent API call
  useEffect(() => {
    if (initialData?.points?.length) {
      setData(initialData);
    }
  }, [initialData]);

  // Client-side fetch fallback if parent doesn't provide initialData
  useEffect(() => {
    setMounted(true);
    if (!initialData) {
      fetch("/api/dashboard/exposure")
        .then((res) => (res.ok ? res.json() : null))
        .then((res) => {
          if (res?.points?.length) {
            setData({
              total: res.formattedTotal || res.total?.toLocaleString() || "9,284",
              change: res.changeFormatted || "↑ 21.6%",
              period: res.period || "last month",
              points: res.points,
            });
          }
        })
        .catch(() => {});
    }
  }, [initialData]);

  const points = data.points?.length ? data.points : dynamicFallback;

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

      {/* Recharts Canvas */}
      <div className="relative w-full h-48 sm:h-64">
        {mounted ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={points}
              margin={{ top: 25, right: 10, left: 10, bottom: 5 }}
            >
              <XAxis dataKey="date" hide />
              <YAxis hide domain={["dataMin - 500", "dataMax + 500"]} />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{
                  stroke: "rgba(255,255,255,0.2)",
                  strokeWidth: 1,
                  strokeDasharray: "3 3",
                }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#ffffff"
                strokeWidth={1.8}
                dot={false}
                activeDot={{
                  r: 5,
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
      </div>
    </div>
  );
}
