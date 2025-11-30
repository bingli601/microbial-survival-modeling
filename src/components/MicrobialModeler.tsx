// MicrobialModeler.tsx
import React, { useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Activity, FlaskConical, RefreshCw } from "lucide-react";

import DataTable from "./DataTable";
import ChartSection from "./ChartSection";
import AIChat from "./AIChat";
import UploadProgressSimulator from "./UploadProgressSimulator";

import { DataRow } from "@/types/data";
import { getDataSummary } from "@/utils/dataAnalysis";
import { ExpectedRow, fitMicrobialModel } from "@/utils/microbialUtils";

interface FitResult {
  modelName: string;
  parameters: Record<string, any>;
  metrics: {
    rmse: number;
    mae: number;
    r2: number;
  };
  fittedData: (DataRow & { microbe_fitted?: number })[];
}

const MicrobialModeler: React.FC = () => {
  const [rawData, setRawData] = useState<ExpectedRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [selectedModel, setSelectedModel] = useState<
    "linear" | "ann" | "svr" | "gpr" | "knn" | "decision_tree"
  >("linear");
  const [isFitting, setIsFitting] = useState(false);
  const [fitResult, setFitResult] = useState<FitResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const processedData = useMemo(() => rawData.slice(), [rawData]);
  const rawSummary = useMemo(() => (rawData.length ? getDataSummary(rawData) : null), [rawData]);
  const countValidRows = useMemo(
    () =>
      processedData.filter(
        (r) =>
          typeof r.time === "number" &&
          typeof r.temperature === "number" &&
          typeof r.microbe === "number"
      ).length,
    [processedData]
  );

  const canFit = processedData.length > 0 && countValidRows > 0 && !isFitting;

  const handleDataLoad = useCallback((data: ExpectedRow[], name: string) => {
    setRawData(data);
    setFileName(name || "");
    setFitResult(null);
    setErrorMessage(null);
  }, []);

  const handleGlobalReset = () => {
    setRawData([]);
    setFileName("");
    setSelectedModel("linear");
    setFitResult(null);
    setErrorMessage(null);
  };

  const handleModelFit = async () => {
    setErrorMessage(null);
    if (!canFit) {
      setErrorMessage("No valid data rows to fit. Ensure time/microbe/temperature are numeric.");
      return;
    }

    setIsFitting(true);
    setFitResult(null);

    try {
      const result = await fitMicrobialModel(processedData, selectedModel);
      // normalize fittedData times and sort
      result.fittedData = result.fittedData
        .map((d) => ({ ...d }))
        .sort((a, b) => Number(a.time) - Number(b.time));
      // Some older code expected rSquared; we expose metrics.r2 instead
      setFitResult({
        modelName: result.modelName,
        parameters: result.parameters ?? {},
        metrics: (result as any).metrics ?? {
          rmse: 0,
          mae: 0,
          r2: (result as any).rSquared ?? 0,
        },
        fittedData: result.fittedData,
      });
    } catch (err: any) {
      setErrorMessage(err?.message || "An error occurred during model fitting.");
    } finally {
      setIsFitting(false);
    }
  };

  const renderSummaryTable = (dataSummary: ReturnType<typeof getDataSummary> | null) => {
    if (!dataSummary) return null;
    const { totalRows, columnStats } = dataSummary;
    const relevantCols = ["time", "microbe"].filter((c) => columnStats[c] !== undefined);

    return (
      <div>
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

  const renderFitResultInfo = () => {
    if (!fitResult) return null;
    const { metrics } = fitResult;
    return (
      <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
        <div>
          <strong>Model:</strong> {fitResult.modelName}
        </div>
        <div>
          <strong>RMSE:</strong> {Number(metrics.rmse ?? 0).toFixed(4)}
        </div>
        <div>
          <strong>MAE:</strong> {Number(metrics.mae ?? 0).toFixed(4)}
        </div>
        <div>
          <strong>R²:</strong> {Number(metrics.r2 ?? 0).toFixed(4)}
        </div>
        {fitResult.parameters && Object.keys(fitResult.parameters).length > 0 && (
          <div className="mt-1 text-xs text-gray-700">
            <strong>Parameters:</strong> {JSON.stringify(fitResult.parameters)}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex w-full max-w-full gap-6">
      {/* First column */}
      <div className="w-1/4 flex flex-col gap-6">
        <Card className="flex flex-col">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
              <FlaskConical className="h-6 w-6 text-blue-600" />
              Microbial Survival Modeler
            </CardTitle>
            <CardDescription>Upload Time, Temperature, Microbe data (.csv)</CardDescription>
          </CardHeader>
          <CardContent>
            <UploadProgressSimulator onComplete={handleDataLoad} onReset={handleGlobalReset} />
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-600" />
              Model
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col space-y-4">
            <Label>Select Model</Label>
            <Select
              value={selectedModel}
              onValueChange={(v: string) =>
                setSelectedModel(v as "linear" | "ann" | "svr" | "gpr" | "knn" | "decision_tree")
              }
              disabled={isFitting}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select fitting model" />
              </SelectTrigger>
              <SelectContent className="bg-white shadow-lg rounded-md z-50">
                <SelectItem value="linear">LINEAR</SelectItem>
                <SelectItem value="ann">ANN</SelectItem>
                <SelectItem value="svr">SVR</SelectItem>
                <SelectItem value="gpr">GPR</SelectItem>
                <SelectItem value="knn">KNN</SelectItem>
                <SelectItem value="decision_tree">DT</SelectItem>
              </SelectContent>
            </Select>

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

            {errorMessage && (
              <div className="text-sm text-red-600 p-2 bg-red-50 rounded">{errorMessage}</div>
            )}

            {renderFitResultInfo()}
          </CardContent>
        </Card>
      </div>

      {/* Second column */}
      <div className="w-1/2 flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Survival Curves</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartSection data={processedData} fitResult={fitResult} />
          </CardContent>
        </Card>

        <div className="flex gap-6">
          {/* Raw Data Summary */}
          <Card className="w-1/2">
            <CardHeader>
              <CardTitle>Raw Data Summary</CardTitle>
            </CardHeader>
            <CardContent>{renderSummaryTable(rawSummary)}</CardContent>
          </Card>

          {/* Raw Data Preview */}
          <Card className="w-1/2">
            <CardHeader>
              <CardTitle>Raw Data Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable data={processedData} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Third column */}
      <div className="w-1/4 flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>AI Data Insights & Chat</CardTitle>
          </CardHeader>
          <CardContent>
            <AIChat csv_data={rawData} fitResult={fitResult} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MicrobialModeler;
