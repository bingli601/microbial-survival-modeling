import React, { useState, useRef, useEffect, DragEvent } from "react";
import { ExpectedRow, parseCSVFile } from "@/utils/microbialUtils";

type UploadSimulatorProps = {
  onComplete: (data: ExpectedRow[], filename: string) => void;
  onReset: () => void;
};

const UploadProgressSimulator: React.FC<UploadSimulatorProps> = ({ onComplete, onReset }) => {
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [canLoadSample, setCanLoadSample] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => clearTimer();
  }, []);

  const clearTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const handleFileChange = (file: File | null) => {
    setSelectedFile(file);
    setProgress(0);
    setStatusMessage(file ? `Selected file: ${file.name}` : null);
    if (file) setCanLoadSample(false);
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    handleFileChange(file);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileChange(file);
  };

  const onDragOver = (e: DragEvent<HTMLDivElement>) => e.preventDefault();

  const startUpload = () => {
    if (!selectedFile || isUploading) return;

    setIsUploading(true);
    setProgress(0);
    setStatusMessage("Preparing upload...");

    const startTime = Date.now();
    const duration = 3000; // 3 seconds fixed

    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const next = Math.min(100, Math.floor((elapsed / duration) * 100));
      setProgress(next);

      if (next >= 100) {
        clearTimer();
        setIsUploading(false);
        setStatusMessage("Upload complete — processing file...");

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
          }
        }, 400);
      } else {
        if (next < 40) setStatusMessage("Uploading...");
        else if (next < 70) setStatusMessage("Making good progress...");
        else setStatusMessage("Almost done...");
      }
    }, 50);
  };

  const resetAll = () => {
    clearTimer();
    setIsUploading(false);
    setSelectedFile(null);
    setProgress(0);
    setStatusMessage(null);
    setCanLoadSample(true);
    onReset();
  };

  const loadSample = async () => {
    if (!canLoadSample) return;
    try {
      const sampleFile = await fetch("/microbe_data.csv")
        .then((res) => res.blob())
        .then((blob) => new File([blob], "microbe_data.csv", { type: "text/csv" }));
      handleFileChange(sampleFile);
      startUpload();
    } catch (err) {
      console.error("Failed to load sample file", err);
    }
  };

  return (
    <div
      className="progress-container p-6 bg-white rounded-lg shadow-md"
      onDrop={onDrop}
      onDragOver={onDragOver}
    >
      <h3 className="text-xl font-semibold mb-4">Microbial Survival Data Upload</h3>

      {/* File input */}
      <div className="mb-3">
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={onFileInputChange}
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

      {/* Numeric progress and status */}
      <div className="text-center mb-4">
        <div className="text-3xl font-bold text-blue-600">{progress}%</div>
        <div className="text-sm text-gray-600 mt-2">
          {statusMessage ?? (progress === 0 ? "Ready to upload" : "")}
        </div>
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
          onClick={loadSample}
          disabled={!canLoadSample || isUploading}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors disabled:bg-gray-400"
        >
          Load Sample Dataset
        </button>

        <button
          onClick={resetAll}
          disabled={isUploading}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors disabled:bg-gray-400"
        >
          Reset
        </button>
      </div>
    </div>
  );
};

export default UploadProgressSimulator;
