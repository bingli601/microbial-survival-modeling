// ==========================================
// 🔧 WEEK 2: UploadProgressSimulator.tsx (Optimized Final Version)
// ==========================================

import { useState, useRef, useEffect } from "react";

const UploadProgressSimulator = () => {
  // 🧠 State variables
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // 🔒 ref 用来存定时器 ID，避免重复触发 & 组件卸载后报错
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // 📌 清理 interval（避免内存泄漏）
  const clearTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // =============================
  // ▶ Start Upload Simulation
  // =============================
  const startUpload = () => {
    if (isUploading) return; // double-click protection

    setIsUploading(true);
    setProgress(0);

    intervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearTimer();
          setIsUploading(false);
          return 100;
        }
        return prev + 5; // 每 100ms +5%
      });
    }, 100);
  };

  // =============================
  // ▶ Manually Add Progress (+25%)
  // =============================
  const addProgress = () => {
    if (isUploading) return;

    setProgress((prev) => Math.min(prev + 25, 100));
  };

  // =============================
  // ▶ Reset
  // =============================
  const resetProgress = () => {
    clearTimer(); // 重要：避免残留 interval
    setIsUploading(false);
    setProgress(0);
  };

  // =============================
  // 🧹 Clean interval on unmount
  // =============================
  useEffect(() => {
    return () => clearTimer();
  }, []);

  // =============================
  // ✨ Dynamic Status Message
  // =============================
  const getStatusMessage = () => {
    if (isUploading) return "Uploading your file...";

    if (progress === 0) return "Ready to start!";
    if (progress < 25) return "Just getting started...";
    if (progress < 50) return "Making progress!";
    if (progress < 75) return "More than halfway there!";
    if (progress < 100) return "Almost done!";
    if (progress === 100) return "Upload complete! 🎉";

    return "";
  };

  return (
    <div className="progress-container p-6 bg-white rounded-lg shadow-md max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-center mb-6">
        File Upload Simulator
      </h2>

      {/* 📊 Progress Bar */}
      <div className="mb-4">
        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* 📈 Numeric Progress */}
      <div className="text-center mb-6">
        <span className="text-3xl font-bold text-blue-600">{progress}%</span>
        <div className="text-sm text-gray-600 mt-2">{getStatusMessage()}</div>
      </div>

      {/* 🎮 Control Buttons */}
      <div className="flex justify-center gap-3">
        <button
          onClick={startUpload}
          disabled={isUploading || progress === 100}
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

      {/* 🎉 Fun messages */}
      <div className="text-center mt-4 text-sm text-gray-600">
        {progress === 0 && "Let's begin!"}
        {progress > 0 && progress < 50 && "Uploading like a champ 🚀"}
        {progress >= 50 && progress < 100 && "Keep going... almost there!"}
        {progress === 100 && "Well done! 🎊"}
      </div>
    </div>
  );
};

export default UploadProgressSimulator;
