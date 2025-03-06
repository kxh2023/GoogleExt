import React from "react";
import { Button } from "./ui/button"; // Assuming you have shadcn components

const SidePanel: React.FC = () => {
  return (
    <div className="fixed top-0 right-0 h-screen w-64 bg-white dark:bg-slate-800 shadow-lg p-4 z-50 overflow-y-auto">
      <h2 className="text-xl font-bold mb-4 dark:text-white">Side Panel</h2>
      <div className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          This panel is rendered in a Shadow DOM
        </p>
        <Button variant="default">Primary Button</Button>
        <Button variant="outline" className="mt-2">
          Secondary Button
        </Button>
      </div>
    </div>
  );
};

export default SidePanel;
