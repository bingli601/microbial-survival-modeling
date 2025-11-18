import React from "react";
import MicrobialModeler from "@/components/MicrobialModeler";

const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 p-6 flex flex-col items-center">
      {/* Page Header */}
      <header className="w-full text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800">
          Microbial Survival Modeling Dashboard
        </h1>
        <p className="mt-2 text-gray-600">
          Upload your CSV data, fit models, and visualize microbial survival curves.
        </p>
      </header>

      <main className="w-full flex justify-center">
        <MicrobialModeler />
      </main>

      <footer className="mt-12 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} Microbial Modeler. All rights reserved.
      </footer>

    </div>
  );
};

export default HomePage;
