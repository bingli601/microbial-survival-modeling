import React, { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { ExpectedRow } from "@/utils/microbialUtils";
import { FitResult } from "@/types/fitResult";

interface ChartSectionProps {
  data: ExpectedRow[];
  fitResult?: FitResult | null;
}

/** 按温度分组并排序时间 */
const groupDataByTemperature = (data: ExpectedRow[]) => {
  const groups: Record<number, ExpectedRow[]> = {};
  data.forEach((r) => {
    const t = Number(r.temperature);
    const time = Number(r.time);
    const microbe = Number(r.microbe);
    if (!Number.isFinite(t) || !Number.isFinite(time) || !Number.isFinite(microbe)) return;
    if (!groups[t]) groups[t] = [];
    groups[t].push({ ...r, time, microbe, temperature: t });
  });

  return Object.keys(groups)
    .map((k) => {
      const temp = Number(k);
      return { temperature: temp, data: groups[temp].sort((a, b) => a.time - b.time) };
    })
    .sort((a, b) => a.temperature - b.temperature);
};

const computeXDomain = (data: ExpectedRow[]) => {
  const times = data.map((r) => Number(r.time)).filter((t) => Number.isFinite(t));
  if (!times.length) return [0, 1];
  const min = Math.min(...times);
  const max = Math.max(...times);
  return [Math.max(0, min - 0.5), max + 0.5];
};

const formatToThreeDecimals = (value: number) =>
  typeof value === "number" ? value.toFixed(3) : "0.000";

const ChartSection: React.FC<ChartSectionProps> = ({ data, fitResult = null }) => {
  if (!data || data.length === 0)
    return <div className="text-gray-500 text-sm text-center p-4">No data to display</div>;

  const groups = useMemo(() => groupDataByTemperature(data), [data]);
  const xDomain = computeXDomain(data);

  const fittedGroups = useMemo(() => {
    if (!fitResult?.fittedData) return [];
    return groupDataByTemperature(
      fitResult.fittedData.filter(
        (r) =>
          typeof r.time === "number" &&
          typeof r.microbe_fitted === "number" &&
          Number.isFinite(r.time) &&
          Number.isFinite(r.microbe_fitted)
      )
    );
  }, [fitResult]);

  return (
    <div className="w-full h-96">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart margin={{ top: 20, right: 30, bottom: 20, left: 40 }}>
          <CartesianGrid strokeDasharray="4 4" stroke="#f0f0f0" />

          <XAxis
            dataKey="time"
            type="number"
            domain={xDomain}
            label={{
              value: "Time (h)",
              position: "insideBottomRight",
              offset: -5,
              fill: "#333",
              fontSize: 14,
              fontWeight: 600,
            }}
            tick={{ fill: "#555", fontSize: 12 }}
          />

          <YAxis
            type="number"
            label={{
              value: "Microbe (CFU/mL)",
              angle: -90,
              position: "insideLeft",
              fill: "#333",
              fontSize: 14,
              fontWeight: 600,
            }}
            tick={{ fill: "#555", fontSize: 12 }}
            domain={["dataMin - 0.5", "dataMax + 0.5"]}
            tickFormatter={formatToThreeDecimals}
          />

          {/* Tooltip */}
          <Tooltip
            formatter={(value: any) => [
              typeof value === "number" ? value.toFixed(3) : "0.000",
              "Microbe",
            ]}
            contentStyle={{
              backgroundColor: "#ffffff",
              borderRadius: 6,
              border: "1px solid #ddd",
              fontSize: 12,
              boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
            }}
          />

          {/* Legend */}
          <Legend wrapperStyle={{ fontSize: 12 }} />

          
          {groups.map((grp, idx) => {
            const validData = grp.data.map((r) => ({ ...r, microbe: Number(r.microbe) }));
            const gray = 30 + (idx * 25) % 60; 
            return (
              <Line
                key={`data-${grp.temperature}`}
                data={validData}
                type="monotone"
                dataKey="microbe"
                stroke="transparent" 
                dot={{ r: 4, stroke: `hsl(0,0%,${gray}%)`, fill: `hsl(0,0%,${gray}%)` }}
                isAnimationActive={false}
                name={`T=${grp.temperature}°C (Data)`}
              />
            );
          })}

          {fittedGroups.map((grp) => {
            const validData = grp.data.map((r) => ({
              time: Number(r.time),
              microbe: Number(r.microbe_fitted),
            }));
            return (
              <Line
                key={`fit-${grp.temperature}`}
                data={validData}
                type="monotone"
                dataKey="microbe"
                stroke="#FF4136"
                strokeWidth={2.5}
                dot={false}
                isAnimationActive={false}
                name={`T=${grp.temperature}°C (Fitted)`}
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ChartSection;
