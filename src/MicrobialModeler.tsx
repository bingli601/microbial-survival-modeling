// MicrobialModeler.tsx
import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Zap, Activity, FlaskConical, RefreshCw } from "lucide-react";

import { DataRow } from "@/types/data"; // keep if you already have this type
import { getDataSummary } from "@/utils/dataAnalysis";

import DataTable from "./components/DataTable";
import ChartSection from "./components/ChartSection";
import AIChat from "./components/AIChat";

/**
 * MicrobialModeler.tsx (Final integrated version)
 *
 * - Integrates UploadProgressSimulator (position A): user selects CSV file, a simulated upload runs,
 *   upon completion the CSV is parsed and data is loaded into the app.
 * - Preserves rawData and adds microbe_log on demand.
 * - Improved validation, error handling, and cleaned up timers.
 */

/** Fit result type */
interface FitResult {
  modelName: string;
  parameters: { [key: string]: number };
  rSquared: number;
  fittedData: (DataRow & { microbe_fitted?: number })[];
}

/** ExpectedRow extends DataRow to include typed fields we use */
type ExpectedRow = DataRow & {
  time?: number;
  temperature?: number;
  microbe?: number;
  microbe_log?: number | undefined;
};

const MicrobialModeler: React.FC = () => {
  // ----------------------------
  // Core state
  // ----------------------------
  const [rawData, setRawData] = useState<ExpectedRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [logTransformed, setLogTransformed] = useState(false);
  const [selectedModel, setSelectedModel] = useState<"linear" | "weibull">("linear");
  const [isFitting, setIsFitting] = useState(false);
  const [fitResult, setFitResult] = useState<FitResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // ----------------------------
  // Derived data (useMemo)
  // ----------------------------
  const processedData = useMemo(() => {
    if (!rawData || rawData.length === 0) return [];
    return logTransformed ? transformDataLog(rawData) : rawData.map((r) => ({ ...r }));
  }, [rawData, logTransformed]);

  const rawSummary = useMemo(() => {
    return rawData.length ? getDataSummary(rawData) : null;
  }, [rawData]);

  const processedSummary = useMemo(() => {
    return processedData.length ? getDataSummary(processedData) : null;
  }, [processedData]);

  const temperatureGroups = useMemo(() => groupDataByTemperature(rawData), [rawData]);

  const countValidRows = useMemo(() => {
    return processedData.filter(
      (r) =>
        typeof r.time === "number" &&
        typeof r.temperature === "number" &&
        (logTransformed ? typeof r.microbe_log === "number" : typeof r.microbe === "number")
    ).length;
  }, [processedData, logTransformed]);

  const canFit = processedData.length > 0 && countValidRows > 0 && !isFitting;

  // ----------------------------
  // Data load handler used by UploadProgressSimulator
  // ----------------------------
  const handleDataLoad = useCallback((data: ExpectedRow[], name: string) => {
    setRawData(data);
    setFileName(name || "");
    setFitResult(null);
    setErrorMessage(null);
  }, []);

  const handleReset = () => {
    setRawData([]);
    setFileName("");
    setLogTransformed(false);
    setSelectedModel("linear");
    setFitResult(null);
    setErrorMessage(null);
  };

  // ----------------------------
  // Model fitting
  // ----------------------------
  const handleModelFit = async () => {
    setErrorMessage(null);
    if (!canFit) {
      setErrorMessage("No valid data rows to fit. Ensure time/microbe/temperature are numeric.");
      return;
    }

    setIsFitting(true);
    setFitResult(null);

    try {
      const result = await fitMicrobialModel(processedData, selectedModel, logTransformed);
      if (!result || !Array.isArray(result.fittedData)) {
        throw new Error("Invalid fit result from modeling function.");
      }
      setFitResult(result);
    } catch (err: any) {
      console.error("Fitting error:", err);
      setErrorMessage(err?.message || "An error occurred during model fitting.");
    } finally {
      setIsFitting(false);
    }
  };

  // ----------------------------
  // Summary table renderer
  // ----------------------------
  const renderSummaryTable = (dataSummary: ReturnType<typeof getDataSummary> | null) => {
    if (!dataSummary) return null;
    const { totalRows, columnStats } = dataSummary;
    const relevantCols = ["time", logTransformed ? "microbe_log" : "microbe"].filter((c) => columnStats[c]);

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-gray-50">
            <tr className="border-b">
              <th className="p-2 text-left">Statistic</th>
              {relevantCols.map((col) => (
                <th key={col} className="p-2 text-right">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="p-2 font-medium">Count</td>
              {relevantCols.map((col) => (
                <td key={`${col}-count`} className="p-2 text-right">
                  {totalRows}
                </td>
              ))}
            </tr>
            {["mean", "std", "min", "max"].map((stat) => (
              <tr key={stat} className="border-b hover:bg-gray-50">
                <td className="p-2 font-medium">{stat.charAt(0).toUpperCase() + stat.slice(1)}</td>
                {relevantCols.map((col) => (
                  <td key={`${col}-${stat}`} className="p-2 text-right">
                    {columnStats[col] && columnStats[col][stat] != null
                      ? Number(columnStats[col][stat]).toFixed(2)
                      : "-"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // ----------------------------
  // Main UI
  // ----------------------------
  if (!rawData.length) {
    // Show uploader with integrated UploadProgressSimulator
    return (
      <div className="p-8 max-w-lg mx-auto">
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
              <FlaskConical className="h-6 w-6 text-blue-600" />
              Microbial Survival Modeler
            </CardTitle>
            <CardDescription>
              Upload your Time, Temperature, and Microbe concentration data (.csv) to begin analysis.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UploadProgressSimulator onComplete={handleDataLoad} />
          </CardContent>
        </Card>
      </div>
    );
  }

  // When data loaded
  return (
    <div className="flex flex-col lg:flex-row space-y-6 lg:space-y-0 lg:space-x-6 p-6">
      {/* Sidebar */}
      <div className="lg:w-1/4 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">File: {fileName || "Unknown"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-gray-500">
              {rawData.length.toLocaleString()} rows, {Object.keys(rawData[0] || {}).length} columns
            </p>
            <Button variant="outline" onClick={handleReset} className="w-full flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Upload New Dataset
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-600" />
              Model & Preprocessing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-between items-center p-2 rounded-md border">
              <Label htmlFor="log-switch" className="flex flex-col space-y-1">
                <span className="font-medium">Log Transformation (ln(N))</span>
                <span className="text-xs text-muted-foreground">Adds microbe_log column; original microbe preserved</span>
              </Label>
              <Switch
                id="log-switch"
                checked={logTransformed}
                onCheckedChange={(v) => setLogTransformed(Boolean(v))}
                disabled={isFitting}
              />
            </div>

            <div className="space-y-2">
              <Label>Select Model</Label>
              <Select
                value={selectedModel}
                onValueChange={(v: string) => setSelectedModel(v as "linear" | "weibull")}
                disabled={isFitting}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select fitting model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="linear">Linear Model</SelectItem>
                  <SelectItem value="weibull">Weibull Model</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleModelFit} disabled={!canFit} className="w-full">
              {isFitting ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Fitting Model...
                </>
              ) : (
                "Fit Model"
              )}
            </Button>

            {errorMessage && <div className="text-sm text-red-600">{errorMessage}</div>}

            {fitResult && (
              <div className="border-t pt-4 space-y-2">
                <h4 className="font-semibold text-sm">Latest Fit Result:</h4>
                <p className="text-xs">
                  Model: <span className="font-mono text-green-600">{fitResult.modelName}</span>
                </p>
                <p className="text-xs">
                  R-Squared: <span className="font-mono">{fitResult.rSquared.toFixed(4)}</span>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main workspace */}
      <div className="lg:w-3/4 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Data Summary & Preview</CardTitle>
            <CardDescription>Descriptive statistics (raw vs processed) and data preview.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold">Raw Data Summary</h4>
                {renderSummaryTable(rawSummary)}
              </div>
              <div>
                <h4 className="font-semibold">Processed Data Summary ({logTransformed ? "log" : "original"})</h4>
                {renderSummaryTable(processedSummary)}
              </div>
            </div>
            <h3 className="text-lg font-semibold border-t pt-4">Raw Data Preview (First 20 Rows)</h3>
            <DataTable data={processedData.slice(0, 20)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Survival Curves ({logTransformed ? "Log" : "Original"} Scale)</CardTitle>
            <CardDescription>Time vs. Concentration curves grouped by Temperature. Fitted lines are dashed when provided.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartSection data={processedData} fitResult={fitResult} />
          </CardContent>
        </Card>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="ai-chat">
            <AccordionTrigger className="text-lg font-semibold flex items-center gap-2">
              <Zap className="h-5 w-5 text-purple-600" />
              AI Data Insights & Chat
            </AccordionTrigger>
            <AccordionContent>
              <AIChat csv_data={rawData} />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
};

export default MicrobialModeler;

/* =====================================================
   UploadProgressSimulator (integrated, Position A)
   - Props: onComplete(data, filename)
   - Behavior: user selects file -> simulated upload -> when complete, parse CSV -> call onComplete
   ===================================================== */

type UploadSimulatorProps = {
  onComplete: (data: ExpectedRow[], filename: string) => void;
};

const UploadProgressSimulator: React.FC<UploadSimulatorProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  const clearTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Start simulated upload (0 -> 100)
  const startUpload = () => {
    if (!selectedFile) {
      setStatusMessage("Please select a CSV file first.");
      return;
    }
    if (isUploading) return;

    setIsUploading(true);
    setProgress(0);
    setStatusMessage("Preparing upload...");

    intervalRef.current = setInterval(() => {
      setProgress((prev) => {
        const next = Math.min(prev + Math.floor(3 + Math.random() * 8), 100); // variable step
        // update status messages during progress
        if (next >= 100) {
          clearTimer();
          setIsUploading(false);
          setStatusMessage("Upload complete — processing file...");
          // Small delay to simulate server processing, then parse the file
          setTimeout(() => {
            if (selectedFile) {
              parseCSVFile(selectedFile)
                .then((rows) => {
                  setStatusMessage("File parsed. Loading data...");
                  onComplete(rows, selectedFile.name);
                })
                .catch((err) => {
                  console.error("CSV parse error", err);
                  setStatusMessage("Failed to parse CSV file. Check format.");
                });
            } else {
              setStatusMessage("No file found after upload.");
            }
          }, 400);
        } else {
          // dynamic messages
          if (next < 10) setStatusMessage("Starting upload...");
          else if (next < 40) setStatusMessage("Uploading...");
          else if (next < 70) setStatusMessage("Making good progress...");
          else if (next < 95) setStatusMessage("Almost done...");
          else setStatusMessage("Finishing up...");
        }
        return next;
      });
    }, 120);
  };

  const resetProgress = () => {
    clearTimer();
    setIsUploading(false);
    setProgress(0);
    setStatusMessage(null);
  };

  const addProgress = () => {
    if (isUploading) return;
    setProgress((p) => Math.min(100, p + 25));
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setSelectedFile(f);
    setStatusMessage(f ? `Selected file: ${f.name}` : null);
    setProgress(0);
  };

  return (
    <div className="progress-container p-6 bg-white rounded-lg shadow-md">
      <h3 className="text-xl font-semibold mb-4">Upload CSV (simulated)</h3>

      {/* File input */}
      <div className="mb-3">
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={onFileChange}
          disabled={isUploading}
          className="w-full"
        />
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-200 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Numeric & status */}
      <div className="text-center mb-4">
        <div className="text-3xl font-bold text-blue-600">{progress}%</div>
        <div className="text-sm text-gray-600 mt-2">{statusMessage ?? (progress === 0 ? "Ready to upload" : "")}</div>
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-3 mb-3">
        <button
          onClick={startUpload}
          disabled={isUploading || progress === 100 || !selectedFile}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:bg-gray-400"
        >
          {isUploading ? "Uploading..." : "Start Upload"}
        </button>

        <button
          onClick={addProgress}
          disabled={isUploading || progress >= 100}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors disabled:bg-gray-400"
        >
          +25%
        </button>

        <button
          onClick={resetProgress}
          disabled={isUploading}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors disabled:bg-gray-400"
        >
          Reset
        </button>
      </div>

      {/* Fun messages */}
      <div className="text-center text-sm text-gray-600">
        {progress === 0 && "Select a CSV and click Start Upload"}
        {progress > 0 && progress < 50 && "Uploading — sit tight!"}
        {progress >= 50 && progress < 100 && "More than halfway there!"}
        {progress === 100 && "Upload completed. Parsing..."}
      </div>
    </div>
  );
};

/* =====================================================
   Utility Functions (moved inline for convenience)
   - groupDataByTemperature
   - transformDataLog
   - fitMicrobialModel
   - parseCSVFile (lightweight parser)
   ===================================================== */

/**
 * Group data by numeric temperature. Returns an array sorted by temperature (ascending).
 */
export const groupDataByTemperature = (data: ExpectedRow[]): { temperature: number; data: ExpectedRow[] }[] => {
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
    .map((k) => ({ temperature: Number(k), data: groups[Number(k)] }))
    .sort((a, b) => a.temperature - b.temperature);
};

/**
 * Transform data by adding a microbe_log field while preserving original microbe.
 */
export const transformDataLog = (data: ExpectedRow[]): ExpectedRow[] => {
  return data.map((row) => {
    const microbeVal = typeof row.microbe === "number" ? row.microbe : Number(row.microbe);
    const microbe_log =
      typeof microbeVal === "number" && microbeVal > 0 && Number.isFinite(microbeVal) ? Math.log(microbeVal) : undefined;
    return {
      ...row,
      microbe_log,
    };
  });
};

/**
 * Simulated fitting - frontend mock; replace with backend in production.
 */
export const fitMicrobialModel = async (data: ExpectedRow[], model: "linear" | "weibull", isLog: boolean): Promise<FitResult> => {
  // Only use rows that have numeric time and microbe or microbe_log
  const valid = data.filter(
    (r) => typeof r.time === "number" && Number.isFinite(r.time) && (isLog ? typeof r.microbe_log === "number" : typeof r.microbe === "number")
  );
  if (valid.length === 0) throw new Error("No valid numeric rows for fitting.");

  await new Promise((res) => setTimeout(res, 900));

  if (model === "linear") {
    const intercept = isLog ? 5.0 : 150.0;
    const slope = -0.15;
    const fittedData = data.map((row) => ({
      ...row,
      microbe_fitted: intercept + slope * (Number(row.time) || 0),
    }));
    return {
      modelName: "Linear Model",
      parameters: { k: slope, N0: intercept },
      rSquared: 0.985,
      fittedData,
    };
  } else {
    const delta = 10.5;
    const p = 0.9;
    const N0 = isLog ? 5.0 : 150.0;
    const fittedData = data.map((row) => ({
      ...row,
      microbe_fitted: N0 * Math.exp(-Math.pow((Number(row.time) || 0) / delta, p)),
    }));
    return {
      modelName: "Weibull Model",
      parameters: { delta, p, N0 },
      rSquared: 0.991,
      fittedData,
    };
  }
};

/**
 * Lightweight CSV parser:
 * - assumes first line header
 * - trims values, attempts to cast numeric fields (time, temperature, microbe)
 * - returns array of ExpectedRow
 */
export const parseCSVFile = async (file: File): Promise<ExpectedRow[]> => {
  const text = await readFileAsText(file);
  const lines = text.split(/\r\n|\n/).filter((l) => l.trim() !== "");
  if (lines.length === 0) return [];

  const header = lines[0].split(",").map((h) => h.trim());
  const rows: ExpectedRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    // naive CSV split: handle quoted values simply by removing surrounding quotes
    const items = splitCSVLine(line);
    if (items.length === 0) continue;
    const obj: any = {};
    for (let j = 0; j < header.length; j++) {
      const key = header[j] || `col${j}`;
      const val = items[j] ?? "";
      obj[key] = val;
    }

    // Try to detect columns commonly used: time, temperature, microbe
    const normalizeKey = (k: string) => k.trim().toLowerCase();
    const map: ExpectedRow = { ...obj } as any;

    // convert numeric columns heuristically
    Object.keys(obj).forEach((k) => {
      const v = obj[k].trim();
      const n = Number(v);
      if (v === "") {
        map[k] = v;
      } else if (!Number.isNaN(n) && v.match(/^[-+]?\d*\.?\d+(e[-+]?\d+)?$/i)) {
        map[k] = n;
      } else {
        // keep string
        map[k] = v;
      }
    });

    // If keys like "time", "temperature", "microbe" exist (or similar), map them
    for (const k of Object.keys(map)) {
      const nk = normalizeKey(k);
      if (nk === "time" || nk === "t" || nk === "hours" || nk === "minute" || nk === "min") {
        (map as any).time = typeof map[k] === "number" ? map[k] : Number(map[k]);
      }
      if (nk === "temperature" || nk === "temp" || nk === "°c" || nk === "c") {
        (map as any).temperature = typeof map[k] === "number" ? map[k] : Number(map[k]);
      }
      if (nk === "microbe" || nk === "count" || nk === "cfu" || nk === "concentration" || nk === "value") {
        (map as any).microbe = typeof map[k] === "number" ? map[k] : Number(map[k]);
      }
    }

    rows.push(map as ExpectedRow);
  }

  return rows;
};

const readFileAsText = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = (e) => reject(e);
    reader.readAsText(file);
  });

/**
 * Robust-ish CSV splitting for a single line (handles quoted commas).
 */
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
