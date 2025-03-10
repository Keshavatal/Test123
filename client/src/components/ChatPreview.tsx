import React from "react";
import { ChatMessage } from "@shared/schema";

interface ChatPreviewProps {
  messages: ChatMessage[];
  onClick: () => void;
}

export function ChatPreview({ messages, onClick }: ChatPreviewProps) {
  // Get the most recent AI message to show in the preview
  const latestAiMessage = messages.filter(msg => !msg.isUser).pop();

  return (
    <div className="bg-background rounded-xl p-4 mb-4 cursor-pointer" onClick={onClick}>
      {latestAiMessage ? (
        <div className="flex gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
            <i className="fas fa-robot text-white text-xs"></i>
          </div>
          <div className="bg-white rounded-lg p-3 rounded-tl-none shadow-sm">
            <p className="text-sm">{latestAiMessage.content}</p>
          </div>
        </div>
      ) : (
        <div className="flex gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
            <i className="fas fa-robot text-white text-xs"></i>
          </div>
          <div className="bg-white rounded-lg p-3 rounded-tl-none shadow-sm">
            <p className="text-sm">Hello! I'm your AI wellness coach. How are you feeling today?</p>
          </div>
        </div>
      )}
    </div>
  );
}
