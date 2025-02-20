import { useState } from "react";
import SidePanel from "./components/SidePanel";
// Import the readOverleafText function (adjust the path if needed)
//import { createRoot } from "react-dom/client";

function App() {
  //const [overleafText] = useState("");
  const [overleafText, setOverleafText] = useState("");

  const handleRead = async () => {
    setOverleafText("Reading text from Overleaf...");
  };

  return (
    <div style={{ display: "flex", height: "100%", overflow: "auto" }}>
      {/* Left side: Display area for Overleaf text */}
      <div>
        <h2 className="text-xl font-bold mb-4">Overleaf Text</h2>
        <pre className="bg-gray-100 p-4 whitespace-pre-wrap">
          {overleafText}
        </pre>
      </div>
      {/* Right side: SidePanel fixed to the right */}
      <SidePanel />
    </div>
  );
}

export default App;
