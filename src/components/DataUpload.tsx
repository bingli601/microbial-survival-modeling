// DataUpload.tsx
import React, { useState, useRef, useEffect, DragEvent } from "react";
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
  const [dragOver, setDragOver] = useState(false);
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

  const simulateUploadIncrease = (current: number): number => {
    if (current < 20) {
      return current + (3 + Math.random() * 3);
    } else if (current < 70) {
      return current + (1 + Math.random() * 3);
    } else if (current < 95) {
      return current + (1 + Math.random() * 2);
    } else {
      return current + 1;
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setSelectedFile(file);
    setProgress(0);
    setStatusMessage(file ? `Selected file: ${file.name}` : null);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.toLowerCase().endsWith(".csv")) {
      setSelectedFile(file);
      setProgress(0);
      setStatusMessage(`Selected file: ${file.name}`);
    } else {
      setStatusMessage("Please drop a valid CSV file.");
    }
  };

  const startUpload = () => {
    if (!selectedFile) {
      setStatusMessage("Please select a CSV file first.");
      return;
    }
    if (isUploading) return;

    setIsUploading(true);
    setProgress(0);
    setStatusMessage("Uploading...");

    intervalRef.current = setInterval(() => {
      setProgress((prev) => {
        const next = simulateUploadIncrease(prev);

        if (next >= 100) {
          clearTimer();
          setIsUploading(false);
          setProgress(100);
          setStatusMessage("Upload complete. Parsing file...");

          setTimeout(() => {
            parseCSVFile(selectedFile)
              .then((rows) => {
                setStatusMessage("File loaded successfully.");
                onComplete(rows, selectedFile.name);
              })
              .catch(() => {
                setStatusMessage("Failed to parse CSV file.");
              });
          }, 450);

          return 100;
        }

        return next;
      });
    }, 120);
  };

  const startTemplateUpload = async () => {
    try {
      const response = await fetch("/sample-test-files/microbe_data.csv");
      const text = await response.text();
      const file = new File([text], "microbe_data.csv", { type: "text/csv" });

      setSelectedFile(file);
      setProgress(0);
      setStatusMessage("Sample template selected.");

    } catch {
      setStatusMessage("Failed to load template sample.");
    }
  };

  const resetUpload = () => {
    clearTimer();
    setIsUploading(false);
    setProgress(0);
    setSelectedFile(null);
    setStatusMessage(null);
  };

  return (
    <div
      className={`p-6 bg-white rounded-lg shadow-md max-w-md mx-auto transition-border ${
        dragOver ? "border-2 border-blue-500" : "border border-gray-200"
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      <h3 className="text-xl font-semibold mb-4">
        Upload Microbial Survival Data
      </h3>

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

      <div className="flex justify-center gap-3 mb-3">
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

      <div className="flex justify-center">
        <Button variant="secondary" onClick={startTemplateUpload}>
          Load Sample Template
        </Button>
      </div>
    </div>
  );
};

export default DataUpload;
