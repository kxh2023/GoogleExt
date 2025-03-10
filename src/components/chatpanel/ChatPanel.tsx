import { useState, useRef, useEffect } from "react";
import { SingleUserMsgBox } from "./chatpanelcomp/singleusermsgbox";
import { SingleResponseMsgBox } from "./chatpanelcomp/singleresponsemsgbox";
import { EnhancedMessageBox } from "./chatpanelcomp/messagebox";

interface Message {
  id: string;
  type: "user" | "response";
  content: string;
  timestamp: Date;
}

interface ChatPanelProps {
  userName: string;
  userAvatarUrl?: string;
  aiName?: string;
  aiAvatarUrl?: string;
}

export function ChatPanel({
  userName = "kxh2023",
  userAvatarUrl = "/api/placeholder/40/40",
  aiName = "GitHub Copilot",
  aiAvatarUrl,
}: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "user",
      content: "how are you today",
      timestamp: new Date(),
    },
    {
      id: "2",
      type: "response",
      content:
        "Hi! I'm GitHub Copilot, an AI programming assistant. I'm functioning well and ready to help you with coding tasks! I notice you have a React project folder open. Would you like help with any specific React programming tasks?",
      timestamp: new Date(),
    },
    {
      id: "3",
      type: "user",
      content: "what is up?",
      timestamp: new Date(),
    },
    {
      id: "4",
      type: "response",
      content:
        "Hello!\n\nI'm GitHub Copilot and I'm ready to help with your coding tasks. I see you're working on a React project in Visual Studio Code on macOS.\n\nI'll format my responses with proper Markdown and code blocks as requested:\n\n• Code blocks will start with three backticks and language identifier\n• File paths will be clearly marked\n• System-specific commands will be for macOS\n• I'll reference VSCode features when relevant\n\nWould you like help with:\n\n• React component development\n• Code review\n• Testing\n• Project structure\n• Or something else?",
      timestamp: new Date(),
    },
  ]);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Track if user is scrolled to bottom
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showNewMessageButton, setShowNewMessageButton] = useState(false);

  // Handle scroll events to determine if user is at bottom
  const handleScroll = () => {
    if (!messagesContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } =
      messagesContainerRef.current;
    const scrollPosition = scrollHeight - scrollTop - clientHeight;

    // Consider "at bottom" if within 100px of the bottom
    const atBottom = scrollPosition < 100;
    setIsAtBottom(atBottom);

    // Show button immediately when user scrolls up
    if (!atBottom) {
      setShowNewMessageButton(true);
    } else {
      setShowNewMessageButton(false);
    }
  };

  // Scroll to bottom when new messages are added (if user was already at bottom)
  useEffect(() => {
    if (isAtBottom && messagesEndRef.current) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } else if (!isAtBottom && messages.length > 0) {
      // Show the new message button when messages are added and user is scrolled up
      setShowNewMessageButton(true);
    }
  }, [messages, isAtBottom]);

  // Add scroll event listener
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, []);

  // Initial scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView();
  }, []);

  const handleSendMessage = (message: string) => {
    if (!message.trim()) return;

    // Add user message
    const newUserMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: message,
      timestamp: new Date(),
    };

    setMessages((prevMessages) => [...prevMessages, newUserMessage]);

    // Force scroll to bottom when user sends a message
    setIsAtBottom(true);

    // Simulate AI response (in a real app, this would come from your AI implementation)
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: "response",
        content:
          "This is a placeholder response. You mentioned you'll implement the AI later.",
        timestamp: new Date(),
      };
      setMessages((prevMessages) => [...prevMessages, aiResponse]);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Message container */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 pb-56"
      >
        {messages.map((message) => (
          <div key={message.id} className="mb-6">
            {message.type === "user" ? (
              <SingleUserMsgBox
                username={userName}
                avatarUrl={userAvatarUrl}
                message={message.content}
              />
            ) : (
              <SingleResponseMsgBox
                name={aiName}
                avatarUrl={aiAvatarUrl}
                message={message.content}
                isMarkdown={true}
              />
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Fixed message input box */}
      <div className="sticky bottom-0 w-full p-4 pt-6 bg-gray-50 border-t border-gray-200 shadow-sm">
        <EnhancedMessageBox onSendMessage={handleSendMessage} />
      </div>

      {/* New message indicator (shows when user has scrolled up) */}
      {showNewMessageButton && (
        <button
          onClick={() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
            setIsAtBottom(true);
            setShowNewMessageButton(false);
          }}
          className="fixed bottom-48 right-4 bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-10 font-medium flex items-center gap-1"
        >
          ↓ Scroll to Bottom
        </button>
      )}
    </div>
  );
}
