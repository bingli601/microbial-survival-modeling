// UploadProgressSimulator.tsx
// Simulated file upload component for CSV files

import React, { useState, useRef, useEffect } from "react";
import { ExpectedRow, parseCSVFile } from "@/utils/microbialUtils";

type UploadSimulatorProps = {
  onComplete: (data: ExpectedRow[], filename: string) => void;
};

const UploadProgressSimulator: React.FC<UploadSimulatorProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const clearTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Start simulated upload
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
        const next = Math.min(prev + Math.floor(3 + Math.random() * 8), 100);

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
            } else {
              setStatusMessage("No file found after upload.");
            }
          }, 400);
        } else {
          // update dynamic messages
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
    const file = e.target.files?.[0] ?? null;
    setSelectedFile(file);
    setStatusMessage(file ? `Selected file: ${file.name}` : null);
    setProgress(0);
  };

  return (
    <div className="progress-container p-6 bg-white rounded-lg shadow-md">
      <h3 className="text-xl font-semibold mb-4">Upload CSV (Simulated)</h3>

      {/* File input */}
      <div className="mb-3">
        <input type="file" accept=".csv,text/csv" onChange={onFileChange} disabled={isUploading} className="w-full" />
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

      {/* Numeric progress and status message */}
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

export default UploadProgressSimulator;
