// src/components/MicrobialModeler.tsx
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

// 更新 FitResult 接口以匹配 microbialUtils 中的返回类型
interface FitResult {
  modelName: string;
  parameters: Record<string, any>; // 改为 any 以容纳复杂结构
  rSquared: number;
  fittedData: (DataRow & { microbe_fitted?: number })[];
}

const MicrobialModeler: React.FC = () => {
  const [rawData, setRawData] = useState<ExpectedRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [selectedModel, setSelectedModel] = useState<"linear" | "weibull">("linear");
  const [isFitting, setIsFitting] = useState(false);
  const [fitResult, setFitResult] = useState<FitResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Processed data is just rawData (no log transform)
  const processedData = useMemo(() => rawData.slice(), [rawData]);

  const rawSummary = useMemo(() => (rawData.length ? getDataSummary(rawData) : null), [rawData]);

  // Count rows with valid time, temperature, microbe
  const countValidRows = useMemo(() => {
    return processedData.filter(
      (r) =>
        typeof r.time === "number" &&
        typeof r.temperature === "number" &&
        typeof r.microbe === "number"
    ).length;
  }, [processedData]);

  const canFit = processedData.length > 0 && countValidRows > 0 && !isFitting;

  const handleDataLoad = useCallback((data: ExpectedRow[], name: string) => {
    setRawData(data);
    setFileName(name || "");
    setFitResult(null);
    setErrorMessage(null);
  }, []);

  const handleReset = () => {
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

      // Ensure fittedData is sorted by time
      result.fittedData = result.fittedData
        .map(d => ({ ...d }))
        .sort((a, b) => Number(a.time) - Number(b.time));

      setFitResult(result);
      
      // 输出拟合信息到控制台
      console.log("Fit completed:", {
        modelName: result.modelName,
        rSquared: result.rSquared,
        parameters: result.parameters
      });
    } catch (err: any) {
      console.error("Fitting error:", err);
      setErrorMessage(err?.message || "An error occurred during model fitting.");
    } finally {
      setIsFitting(false);
    }
  };

  const renderSummaryTable = (dataSummary: ReturnType<typeof getDataSummary> | null) => {
    if (!dataSummary) return null;
    const { totalRows, columnStats } = dataSummary;

    // Only show time and microbe
    const relevantCols = ["time", "microbe"].filter(c => columnStats[c] !== undefined);

    return (
      <div>
        <table className="w-full text-sm border-collapse">
          <thead className="bg-gray-50">
            <tr className="border-b">
              <th className="p-2 text-left">Statistic</th>
              {relevantCols.map(col => (
                <th key={col} className="p-2 text-right">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="p-2 font-medium">Count</td>
              {relevantCols.map(col => (
                <td key={`${col}-count`} className="p-2 text-right">{totalRows}</td>
              ))}
            </tr>
            {["mean", "std", "min", "max"].map(stat => (
              <tr key={stat} className="border-b hover:bg-gray-50">
                <td className="p-2 font-medium">{stat.charAt(0).toUpperCase() + stat.slice(1)}</td>
                {relevantCols.map(col => (
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

  // 渲染拟合结果信息
  const renderFitResultInfo = () => {
    if (!fitResult) return null;
    
    return (
      <div className="mt-4 p-3 bg-blue-50 rounded-md text-sm">
        <h4 className="font-semibold text-blue-800 mb-2">Fitted Result:</h4>
        <div className="space-y-1">
          <div><span className="font-medium">Model:</span> {fitResult.modelName}</div>
          <div><span className="font-medium">R²:</span> {fitResult.rSquared.toFixed(4)}</div>
          {fitResult.parameters.averageRSquared && (
            <div><span className="font-medium">Average R²:</span> {fitResult.parameters.averageRSquared.toFixed(4)}</div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex w-full max-w-full mx-auto min-h-screen gap-6 p-6">
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
          <CardContent className="flex-1">
            <UploadProgressSimulator onComplete={handleDataLoad} />
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-600" />
              Model
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col space-y-4 overflow-auto">
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
            
            {errorMessage && (
              <div className="text-sm text-red-600 p-2 bg-red-50 rounded-md">{errorMessage}</div>
            )}
            
            {renderFitResultInfo()}
            
            {rawData.length > 0 && (
              <Button 
                onClick={handleReset} 
                variant="outline" 
                className="w-full mt-2"
              >
                Reset Data
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Second column */}
      <div className="w-1/2 flex flex-col gap-6">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Raw Data Summary</CardTitle>
          </CardHeader>
          <CardContent className="flex-1">{renderSummaryTable(rawSummary)}</CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Survival Curves</CardTitle>
            {fitResult && (
              <CardDescription>
                {fitResult.modelName} - R²: {fitResult.rSquared.toFixed(4)}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="flex-1">
            <ChartSection data={processedData} fitResult={fitResult} />
          </CardContent>
        </Card>

        {/* <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Raw Data Preview (First 10 Rows)</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto">
            <DataTable data={processedData.slice(0, 10)} />
          </CardContent>
        </Card> */}
      </div>

      {/* Third column */}
      <div className="w-1/4 flex flex-col gap-6">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>AI Data Insights & Chat</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-auto">
              <AIChat csv_data={rawData} fitResult={fitResult} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MicrobialModeler;