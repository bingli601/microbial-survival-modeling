import React, { useState } from "react";
import MicrobialModeler from "@/components/MicrobialModeler";
import { ChevronDown, ChevronUp, Info } from "lucide-react";

const HomePage: React.FC = () => {
  const [showFeatures, setShowFeatures] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 p-8 flex flex-col items-center">
      {/* Header */}
      <header className="w-full text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
          Microbial Survival Modeling Dashboard
        </h1>
        <p className="text-gray-600 mt-2">
          Analyze microbial inactivation kinetics with machine learning models,
          visual analytics, and built-in AI assistance.
        </p>

        {/* Feature Card */}
        <div className="mt-6 max-w-3xl mx-auto">
          <div className="bg-white shadow-md rounded-xl border border-gray-200">
            {/* Button */}
            <button
              onClick={() => setShowFeatures(!showFeatures)}
              className="flex items-center justify-between w-full px-5 py-4 hover:bg-gray-100 rounded-xl transition"
            >
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-600" />
                <span className="text-lg font-semibold text-gray-800">
                  System Overview & Features
                </span>
              </div>
              {showFeatures ? (
                <ChevronUp className="w-5 h-5 text-gray-700" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-700" />
              )}
            </button>

            {/* Dropdown Content */}
            {showFeatures && (
              <div className="px-6 pb-6 mt-2 text-gray-700 text-sm animate-fadeIn">
                <ul className="list-disc list-inside space-y-3 leading-relaxed">
                  <li>
                    <strong>Data Upload & Management:</strong>  
                    Upload CSV files containing time, temperature, and microbial count.  
                    Includes progress simulation and example dataset loading.  
                    <span className="text-red-600 font-semibold ml-1">
                      Click “Load Sample Data” to start instantly.
                    </span>
                  </li>

                  <li>
                    <strong>Model Fitting:</strong>  
                    Supports Linear, ANN, SVR, GPR, KNN, and Decision Tree models.  
                    Automatically computes RMSE, MAE, R² and visualizes fitted curves.
                  </li>

                  <li>
                    <strong>Data Visualization:</strong>  
                    Displays microbial survival curves with model predictions.  
                    Includes summary statistics (mean, std, max, min).  
                    Tables support pagination and horizontal scrolling.
                  </li>

                  <li>
                    <strong>AI Data Assistant:</strong>  
                    Built-in chat system offering smart suggestions and analysis  
                    based on dataset and model results.  
                    Generates helpful prompts like “Analyze fitting results”  
                    or “Predict future trends.”
                  </li>

                  <li>
                    <strong>Ease of Use:</strong>  
                    100% browser-based — no installation required.  
                    Three-panel layout: upload & models (left), visualization (center), AI assistant (right).
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Modeler */}
      <main className="w-full flex justify-center flex-1">
        <MicrobialModeler />
      </main>

      {/* Footer */}
      <footer className="mt-10 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} Microbial Modeler. All rights reserved.
      </footer>
    </div>
  );
};

export default HomePage;
