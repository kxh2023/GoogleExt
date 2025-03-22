import React, { useState } from "react";
import { Button } from "../../ui/button";
import { Textarea } from "../../ui/textarea";
import { AtSign, Paperclip, Mic, Send } from "lucide-react";

interface EnhancedMessageBoxProps {
  onSendMessage?: (message: string) => void;
}

export function EnhancedMessageBox({ onSendMessage }: EnhancedMessageBoxProps) {
  const [message, setMessage] = useState("");

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
  };

  const handleSendMessage = () => {
    if (message.trim()) {
      if (onSendMessage) {
        onSendMessage(message);
      } else {
        console.log("Sending message:", message);
      }
      setMessage("");
    }
  };

  return (
    <div className="flex flex-col w-full rounded-lg border border-gray-200 bg-white p-2 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <div className="flex items-center p-1 rounded bg-blue-600">
          <img
            src="/api/placeholder/20/20"
            alt="React icon"
            className="w-5 h-5"
          />
        </div>
        <span className="text-gray-600 text-sm">
          message.tsx:1-12 Current file
        </span>
      </div>

      <Textarea
        placeholder="Ask Copilot"
        value={message}
        onChange={handleMessageChange}
        className="min-h-24 bg-gray-50 border border-gray-200 focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:ring-offset-0 text-gray-700 placeholder:text-gray-400 resize-none"
      />

      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
          >
            <AtSign className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
          >
            <Paperclip className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
          >
            <Mic className="h-5 w-5" />
          </Button>

          <div className="flex items-center gap-1 mx-2">
            <span className="text-gray-600">Claude 3.5 Sonnet (Preview)</span>
            <svg
              className="h-4 w-4 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>

        <Button
          onClick={handleSendMessage}
          disabled={!message.trim()}
          size="icon"
          variant="ghost"
          className={`h-8 w-8 rounded-md ${
            message.trim()
              ? "text-gray-600 hover:bg-gray-100"
              : "text-gray-300 cursor-not-allowed"
          }`}
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
