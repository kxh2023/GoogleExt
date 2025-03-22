import { ChatPanel } from "./components/chatpanel/ChatPanel";

function App() {
  return (
    <div>
      <ChatPanel
        userName="kxh2023"
        userAvatarUrl="/api/placeholder/40/40"
        aiName="GitHub Copilot"
      />
    </div>
  );
}

export default App;
