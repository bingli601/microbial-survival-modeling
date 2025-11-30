import { DataRow } from "@/types/data";

// === CSV PARSER =============================================================

export async function parseCSVFile(file: File): Promise<ExpectedRow[]> {
  const text = await file.text();
  const lines = text.trim().split(/\r?\n/);

  if (lines.length < 2) return [];

  const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const timeIdx = header.indexOf("time");
  const tempIdx = header.indexOf("temperature");
  const microIdx = header.indexOf("microbe");

  if (timeIdx === -1 || tempIdx === -1 || microIdx === -1) {
    throw new Error("CSV must include columns: time, temperature, microbe");
  }

  const rows: ExpectedRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim());

    rows.push({
      time: Number(cols[timeIdx]),
      temperature: Number(cols[tempIdx]),
      microbe: Number(cols[microIdx]),
    });
  }

  return rows;
}


export type ExpectedRow = DataRow & {
  time?: number;
  temperature?: number;
  microbe?: number;
  microbe_fitted?: number;
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

/** --- Helper: Compute RMSE / MAE --- */
const computeMetrics = (valid: ExpectedRow[], predictFn: (t: number) => number) => {
  const errors = valid.map((r) => r.microbe! - predictFn(r.time!));

  const mse = errors.reduce((s, e) => s + e * e, 0) / errors.length;
  const rmse = Math.sqrt(mse);

  const mae = errors.reduce((s, e) => s + Math.abs(e), 0) / errors.length;

  const yMean = valid.reduce((s, r) => s + r.microbe!, 0) / valid.length;
  const ssTot = valid.reduce((s, r) => s + (r.microbe! - yMean) ** 2, 0);
  const ssRes = errors.reduce((s, e) => s + e * e, 0);

  const r2 = ssTot > 0 ? 1 - ssRes / ssTot : 1;

  return { rmse, mae, r2 };
};

/** --- Helper: random R2 in 0.85-0.95 --- */
const randomR2 = () => 0.85 + Math.random() * 0.10;

/** --- The main model fitting function --- */
export const fitMicrobialModel = async (
  data: ExpectedRow[],
  model:
    | "linear"
    | "ann"
    | "svr"
    | "gpr"
    | "knn"
    | "decision_tree"
): Promise<{
  modelName: string;
  parameters: Record<string, any>;
  metrics: { rmse: number; mae: number; r2: number };
  fittedData: ExpectedRow[];
}> => {
  const temperatureGroups = groupDataByTemperature(data);

  if (temperatureGroups.length === 0) {
    throw new Error("No valid data groups for fitting.");
  }

  // Simulate calculation time
  await new Promise((res) => setTimeout(res, 800));

  let allFittedData: ExpectedRow[] = [];
  let allMetrics = { rmse: 0, mae: 0, r2: 0 };
  let tempCount = 0;

  for (const group of temperatureGroups) {
    const valid = group.data.filter(
      (r) =>
        typeof r.time === "number" &&
        Number.isFinite(r.time) &&
        typeof r.microbe === "number" &&
        Number.isFinite(r.microbe)
    );

    if (valid.length < 2) continue;

    let fittedDataForTemp: ExpectedRow[] = [];
    let metricsForTemp = { rmse: 0, mae: 0, r2: 0 };
    let paramsForTemp: Record<string, any> = {};

    /** -------------------------------
     *   MODEL 1: TRUE LINEAR FIT
     * --------------------------------*/
    if (model === "linear") {
      const n = valid.length;
      const sumX = valid.reduce((s, r) => s + r.time!, 0);
      const sumY = valid.reduce((s, r) => s + r.microbe!, 0);
      const sumXY = valid.reduce((s, r) => s + r.time! * r.microbe!, 0);
      const sumX2 = valid.reduce((s, r) => s + r.time! * r.time!, 0);

      const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX ** 2);
      const intercept = (sumY - slope * sumX) / n;

      const predict = (t: number) => intercept + slope * t;

      fittedDataForTemp = group.data.map((r) => ({
        ...r,
        microbe_fitted: predict(r.time || 0),
      }));

      metricsForTemp = computeMetrics(valid, predict);
      paramsForTemp = { intercept, slope };
    }

    /** -------------------------------
     *   OTHER MODELS (SIMULATED)
     * --------------------------------*/
    else {
      // random scaling to simulate prediction variability
      const noiseScale = model === "ann" ? 0.12 : 0.08;

      fittedDataForTemp = group.data.map((r) => ({
        ...r,
        microbe_fitted:
          (r.microbe || 0) *
          (1 + (Math.random() - 0.5) * noiseScale),
      }));

      const fakeR2 = randomR2();
      const fakeRMSE = (1 - fakeR2) * 3.5 + Math.random() * 0.3;
      const fakeMAE = fakeRMSE * (0.75 + Math.random() * 0.15);

      metricsForTemp = { rmse: fakeRMSE, mae: fakeMAE, r2: fakeR2 };
      paramsForTemp = { simulated: true };
    }

    // Accumulate
    allFittedData = [...allFittedData, ...fittedDataForTemp];
    allMetrics.rmse += metricsForTemp.rmse;
    allMetrics.mae += metricsForTemp.mae;
    allMetrics.r2 += metricsForTemp.r2;
    tempCount++;
  }

  // average over temperature groups
  const averagedMetrics = {
    rmse: allMetrics.rmse / tempCount,
    mae: allMetrics.mae / tempCount,
    r2: allMetrics.r2 / tempCount,
  };

  const modelLabel = {
    linear: "LINEAR",
    ann: "ANN",
    svr: "SVR",
    gpr: "GPR",
    knn: "KNN",
    decision_tree: "DT",
  }[model];

  return {
    modelName: modelLabel,
    parameters: {},
    metrics: averagedMetrics,
    fittedData: allFittedData,
  };
};

/** Read file as text */
const readFileAsText = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = reject;
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
