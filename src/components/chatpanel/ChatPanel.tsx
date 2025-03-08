import "../index.css";
import { Button } from "../ui/button";

const SidePanel = () => {
  return (
    <div className="panel">
      <div className="fixed right-0 top-0 h-full w-64 bg-card shadow-lg p-4">
        <h2 className="text-xl font-bold mb-4">OverReleaf AI</h2>
        <Button variant="default" className="w-full mb-2 h-10 font-medium">
          Read Text
        </Button>
        <Button variant="default" className="w-full mb-2 h-10 font-medium">
          Write Text
        </Button>
        <Button variant="default" className="w-full mb-2 h-10 font-medium">
          Create Div
        </Button>
      </div>
    </div>
  );
};
export default SidePanel;
