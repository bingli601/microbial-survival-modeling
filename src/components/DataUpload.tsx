// DataUpload.tsx
import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { parseCSVFile, ExpectedRow } from "@/utils/microbialUtils";

type DataUploadProps = {
  onComplete: (data: ExpectedRow[], filename: string) => void;
};

const DataUpload: React.FC<DataUploadProps> = ({ onComplete }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

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

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setSelectedFile(file);
    setProgress(0);
    setStatusMessage(file ? `Selected file: ${file.name}` : null);
  };

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
        const next = Math.min(prev + Math.floor(Math.random() * 8 + 3), 100);

        if (next >= 100) {
          clearTimer();
          setIsUploading(false);
          setStatusMessage("Upload complete. Parsing file...");

          setTimeout(() => {
            if (selectedFile) {
              parseCSVFile(selectedFile)
                .then((rows) => {
                  setStatusMessage("File loaded successfully.");
                  onComplete(rows, selectedFile.name);
                })
                .catch((err) => {
                  console.error("CSV parse error:", err);
                  setStatusMessage("Failed to parse CSV file. Check the format.");
                });
            }
          }, 400);
        } else {
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

  const resetUpload = () => {
    clearTimer();
    setIsUploading(false);
    setProgress(0);
    setSelectedFile(null);
    setStatusMessage(null);
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-md mx-auto">
      <h3 className="text-xl font-semibold mb-4">Upload CSV File</h3>

      <input
        type="file"
        accept=".csv,text/csv"
        onChange={onFileChange}
        disabled={isUploading}
        className="w-full mb-4"
      />

      <Progress value={progress} className="mb-2" />

      <div className="text-center text-sm text-gray-600 mb-4">
        {statusMessage ?? (progress === 0 ? "Ready to upload" : "")}
      </div>

      <div className="flex justify-center gap-3">
        <Button
          onClick={startUpload}
          disabled={!selectedFile || isUploading || progress === 100}
        >
          {isUploading ? "Uploading..." : "Start Upload"}
        </Button>

        <Button onClick={resetUpload} disabled={isUploading}>
          Reset
        </Button>
      </div>
    </div>
  );
};

export default DataUpload;
