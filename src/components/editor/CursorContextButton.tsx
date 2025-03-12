import React, { useState } from "react";
import { Toggle } from "../ui/toggle";
import CursorContextCapture from "./CursorContextCapture";

interface CursorContextButtonProps {
  className?: string;
}

const CursorContextButton: React.FC<CursorContextButtonProps> = ({
  className,
}) => {
  const [isActive, setIsActive] = useState(false);

  const handleToggle = () => {
    const newState = !isActive;
    setIsActive(newState);
    console.log(`Cursor context capture ${newState ? "enabled" : "disabled"}`);
  };

  return (
    <div className={`flex items-center ${className}`}>
      <Toggle
        pressed={isActive}
        onPressedChange={handleToggle}
        aria-label="Toggle cursor context capture"
        className={`${isActive ? "bg-primary text-primary-foreground" : ""}`}
      >
        <div className="flex items-center gap-2">
          <span>📝</span>
          <span>Context Capture</span>
          {isActive && (
            <span className="ml-1 h-2 w-2 rounded-full bg-green-500" />
          )}
        </div>
      </Toggle>

      {/* Only render the CursorContextCapture component when active */}
      {isActive && <CursorContextCapture />}
    </div>
  );
};

export default CursorContextButton;
