// src/components/ChartSection.tsx
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

/** Group data by temperature and sort by time */
const groupDataByTemperature = (data: ExpectedRow[]) => {
  const groups: Record<number, ExpectedRow[]> = {};

  data.forEach((row) => {
    const t = Number(row.temperature);
    const time = Number(row.time);
    const microbe = Number(row.microbe);
    
    if (!Number.isFinite(t) || !Number.isFinite(time) || !Number.isFinite(microbe)) {
      console.warn('Invalid data point:', row);
      return;
    }
    
    if (!groups[t]) groups[t] = [];
    groups[t].push({ 
      ...row, 
      time, 
      microbe,
      temperature: t 
    });
  });

  return Object.keys(groups)
    .map((k) => {
      const temp = Number(k);
      const sortedData = groups[temp].sort((a, b) => a.time - b.time);
      return {
        temperature: temp,
        data: sortedData,
      };
    })
    .sort((a, b) => a.temperature - b.temperature);
};

/** Compute X axis domain */
const computeXDomain = (data: ExpectedRow[]) => {
  const times = data.map((r) => Number(r.time)).filter((t) => Number.isFinite(t));
  if (times.length === 0) return [0, 1];
  const min = Math.min(...times);
  const max = Math.max(...times);
  return [Math.max(0, min - 0.5), max + 0.5];
};

// 格式化函数，保留3位小数
const formatToThreeDecimals = (value: number) => {
  return typeof value === 'number' ? value.toFixed(3) : '0.000';
};

const ChartSection: React.FC<ChartSectionProps> = ({ data, fitResult = null }) => {
  console.log('ChartSection received data:', data);

  if (!data || data.length === 0) {
    return <div className="text-gray-500 text-sm text-center p-4">No data to display</div>;
  }

  const groups = useMemo(() => groupDataByTemperature(data), [data]);
  const xDomain = computeXDomain(data);

  // 对拟合数据也按温度分组
  const fittedGroups = useMemo(() => {
    if (!fitResult?.fittedData) return [];
    return groupDataByTemperature(
      fitResult.fittedData.filter((r) => 
        typeof r.time === "number" && 
        typeof r.microbe_fitted === "number" &&
        Number.isFinite(r.time) && 
        Number.isFinite(r.microbe_fitted)
      )
    );
  }, [fitResult]);

  console.log('Processed groups:', groups);
  console.log('Fitted groups:', fittedGroups);
  console.log('Fit result:', fitResult);

  return (
    <div className="w-full h-96">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="time"
            type="number"
            domain={xDomain}
            label={{ value: "Time", position: "insideBottomRight", offset: -5 }}
          />
          <YAxis
            type="number"
            label={{ value: "Microbe", angle: -90, position: "insideLeft" }}
            domain={['dataMin - 0.5', 'dataMax + 0.5']}
            tickFormatter={formatToThreeDecimals}
          />
          <Tooltip 
            formatter={(value: any) => [
              typeof value === 'number' ? value.toFixed(3) : '0.000', 
              'Microbe'
            ]} 
          />
          <Legend />

          {/* Draw each temperature group - 原始数据 */}
          {groups.map((grp) => {
            const validData = grp.data.filter(item => 
              Number.isFinite(item.time) && Number.isFinite(item.microbe)
            );

            if (validData.length === 0) {
              return null;
            }

            const stroke = `hsl(${(grp.temperature * 35) % 360}, 70%, 45%)`;
            
            return (
              <Line
                key={`data-${grp.temperature}`}
                data={validData}
                type="monotone"
                dataKey="microbe"
                stroke={stroke}
                name={`T=${grp.temperature}°C (Data)`}
                dot={{ r: 3 }}
                isAnimationActive={false}
                strokeWidth={2}
                connectNulls={false}
              />
            );
          })}

          {/* Draw fitted lines for each temperature - 拟合曲线 */}
          {fittedGroups.map((grp) => {
            const validData = grp.data.map((r) => ({ 
              time: Number(r.time), 
              microbe: Number(r.microbe_fitted)
            }));

            if (validData.length === 0) {
              return null;
            }

            const stroke = `hsl(${(grp.temperature * 35) % 360}, 70%, 45%)`;
            
            return (
              <Line
                key={`fitted-${grp.temperature}`}
                data={validData}
                type="monotone"
                dataKey="microbe"
                stroke={stroke}
                strokeDasharray="5 5"
                name={`T=${grp.temperature}°C (Fitted)`}
                dot={false}
                isAnimationActive={false}
                strokeWidth={2}
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
      
      Fitted Result:
      {fitResult && (
        <div className="mt-2 text-xs text-gray-600">
          <strong>{fitResult.method}</strong> | 
          Average R² = {fitResult.rSquared.toFixed(4)}
        </div>
      )}
    </div>
  );
};

export default ChartSection;