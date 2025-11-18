// microbialUtils.ts
// Utility functions for microbial data handling and model fitting

import { DataRow } from "@/types/data";

/** Row type with expected numeric fields */
export type ExpectedRow = DataRow & {
  time?: number;
  temperature?: number;
  microbe?: number; // final usable value, no log needed
};

/** Group data by numeric temperature and sort ascending */
export const groupDataByTemperature = (
  data: ExpectedRow[]
): { temperature: number; data: ExpectedRow[] }[] => {
  if (!data || data.length === 0) return [];

  const groups: Record<number, ExpectedRow[]> = {};

  data.forEach((row) => {
    const t = Number(row.temperature);
    if (Number.isFinite(t)) {
      if (!groups[t]) groups[t] = [];
      groups[t].push(row);
    }
  });

  return Object.keys(groups)
    .map((k) => ({
      temperature: Number(k),
      data: groups[Number(k)],
    }))
    .sort((a, b) => a.temperature - b.temperature);
};

/** REMOVE: No log transformation needed */
export const transformDataLog = undefined as any;

/** Model fitting for each temperature separately */
export const fitMicrobialModel = async (
  data: ExpectedRow[],
  model: "linear" | "weibull"
): Promise<{
  modelName: string;
  parameters: Record<string, any>;
  rSquared: number;
  fittedData: ExpectedRow[];
}> => {
  // 首先按温度分组
  const temperatureGroups = groupDataByTemperature(data);
  
  if (temperatureGroups.length === 0) {
    throw new Error("No valid data groups for fitting.");
  }

  await new Promise((res) => setTimeout(res, 900));

  let allFittedData: ExpectedRow[] = [];
  let totalRSquared = 0;
  let temperatureParameters: Record<string, any> = {};

  // 对每个温度分别进行拟合
  for (const group of temperatureGroups) {
    const valid = group.data.filter(
      (r) =>
        typeof r.time === "number" &&
        Number.isFinite(r.time) &&
        typeof r.microbe === "number" &&
        Number.isFinite(r.microbe)
    );

    if (valid.length < 2) {
      console.warn(`Not enough data points for temperature ${group.temperature}`);
      continue;
    }

    let fittedDataForTemp: ExpectedRow[] = [];
    let rSquaredForTemp = 0;
    let parametersForTemp: Record<string, number> = {};

    if (model === "linear") {
      // 线性回归拟合
      const n = valid.length;
      const sumX = valid.reduce((sum, r) => sum + (r.time || 0), 0);
      const sumY = valid.reduce((sum, r) => sum + (r.microbe || 0), 0);
      const sumXY = valid.reduce((sum, r) => sum + (r.time || 0) * (r.microbe || 0), 0);
      const sumX2 = valid.reduce((sum, r) => sum + Math.pow(r.time || 0, 2), 0);
      
      const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - Math.pow(sumX, 2));
      const intercept = (sumY - slope * sumX) / n;

      // 为该温度的所有数据点计算拟合值
      fittedDataForTemp = group.data.map((row) => ({
        ...row,
        microbe_fitted: intercept + slope * (Number(row.time) || 0),
      }));

      // 计算 R²
      const yMean = sumY / n;
      const ssTot = valid.reduce((sum, r) => sum + Math.pow((r.microbe || 0) - yMean, 2), 0);
      const ssRes = valid.reduce((sum, r) => {
        const predicted = intercept + slope * (r.time || 0);
        return sum + Math.pow((r.microbe || 0) - predicted, 2);
      }, 0);
      rSquaredForTemp = ssTot > 0 ? 1 - (ssRes / ssTot) : 1;

      parametersForTemp = { intercept, slope };

      console.log(`Temperature ${group.temperature}°C - Linear fit: intercept=${intercept.toFixed(4)}, slope=${slope.toFixed(4)}, R²=${rSquaredForTemp.toFixed(4)}`);
    } else {
      // Weibull 模型拟合
      const initialMicrobe = Math.max(...valid.map(r => r.microbe || 0));
      const finalMicrobe = Math.min(...valid.map(r => r.microbe || 0));
      const maxTime = Math.max(...valid.map(r => r.time || 0));
      
      // 简化的 Weibull 参数估计
      const delta = maxTime * 0.8;
      const p = 1.2;
      
      fittedDataForTemp = group.data.map((row) => {
        const t = Number(row.time) || 0;
        const survival = Math.exp(-Math.pow(t / delta, p));
        const fittedValue = initialMicrobe + (finalMicrobe - initialMicrobe) * (1 - survival);
        
        return {
          ...row,
          microbe_fitted: fittedValue,
        };
      });

      // 计算 R²
      const yMean = valid.reduce((sum, r) => sum + (r.microbe || 0), 0) / valid.length;
      const ssTot = valid.reduce((sum, r) => sum + Math.pow((r.microbe || 0) - yMean, 2), 0);
      const ssRes = valid.reduce((sum, r) => {
        const t = r.time || 0;
        const survival = Math.exp(-Math.pow(t / delta, p));
        const predicted = initialMicrobe + (finalMicrobe - initialMicrobe) * (1 - survival);
        return sum + Math.pow((r.microbe || 0) - predicted, 2);
      }, 0);
      rSquaredForTemp = ssTot > 0 ? 1 - (ssRes / ssTot) : 1;

      parametersForTemp = { delta, p, initialMicrobe };

      console.log(`Temperature ${group.temperature}°C - Weibull fit: delta=${delta.toFixed(4)}, p=${p.toFixed(4)}, R²=${rSquaredForTemp.toFixed(4)}`);
    }

    allFittedData = [...allFittedData, ...fittedDataForTemp];
    totalRSquared += rSquaredForTemp;
    temperatureParameters[group.temperature.toString()] = parametersForTemp;
  }

  // 计算平均 R²
  const avgRSquared = temperatureGroups.length > 0 ? totalRSquared / temperatureGroups.length : 0;

  return {
    modelName: `${model === "linear" ? "Linear Regression" : "Weibull Model"} (Per Temperature)`,
    parameters: { 
      averageRSquared: avgRSquared,
      temperatureParameters
    },
    rSquared: avgRSquared,
    fittedData: allFittedData,
  };
};

/** Parse CSV file to ExpectedRow[] */
export const parseCSVFile = async (file: File): Promise<ExpectedRow[]> => {
  const text = await readFileAsText(file);
  const lines = text.split(/\r\n|\n/).filter((l) => l.trim() !== "");
  if (lines.length === 0) return [];

  const header = lines[0].split(",").map((h) => h.trim());
  const rows: ExpectedRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const items = splitCSVLine(line);
    if (items.length === 0) continue;

    const obj: any = {};
    for (let j = 0; j < header.length; j++) {
      const key = header[j] || `col${j}`;
      const val = items[j] ?? "";
      obj[key] = val;
    }

    const map: ExpectedRow = { ...obj } as any;
    const normalizeKey = (k: string) => k.trim().toLowerCase();

    // Convert numeric-like fields
    Object.keys(obj).forEach((k) => {
      const v = obj[k].trim();
      const n = Number(v);
      if (v === "") map[k] = v;
      else if (!Number.isNaN(n) && v.match(/^[-+]?\d*\.?\d+(e[-+]?\d+)?$/i)) map[k] = n;
      else map[k] = v;
    });

    // Map common CSV synonyms to our fields
    for (const k of Object.keys(map)) {
      const nk = normalizeKey(k);

      if (nk === "time" || nk === "t" || nk === "hours" || nk === "minute" || nk === "min")
        map.time = Number(map[k]);

      if (nk === "temperature" || nk === "temp" || nk === "°c" || nk === "c")
        map.temperature = Number(map[k]);

      // 关键修改：将 target 映射到 microbe
      if (nk === "microbe" || nk === "count" || nk === "cfu" || nk === "concentration" || nk === "value" || nk === "target")
        map.microbe = Number(map[k]);
    }

    rows.push(map);
  }

  return rows;
};

/** Read file as text */
const readFileAsText = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = (e) => reject(e);
    reader.readAsText(file);
  });

/** Split CSV line robustly (handles quoted commas) */
function splitCSVLine(line: string): string[] {
  const result: string[] = [];
  let cur = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"' || ch === "“" || ch === "”") {
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === "," && !inQuotes) {
      result.push(cur.trim());
      cur = "";
      continue;
    }
    cur += ch;
  }

  result.push(cur.trim());
  return result;
}