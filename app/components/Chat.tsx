/**
 * Chat.tsx - Main Chat Orchestrator Component
 *
 * Refactored to use the Vercel AI Chatbot design with:
 * - useRadioChat hook for state management
 * - New message components with animations
 * - Styled input matching Vercel design
 */
"use client";

import { useRadioChat } from "../hooks/use-radio-chat";
import { ChatInput } from "./ChatInput";
import { ChatMessages } from "./chat/ChatMessages";

export function Chat() {
  const { messages, isLoading, sendMessage, stop } = useRadioChat();

  return (
    <div className="flex h-full flex-col">
      {/* Messages Area */}
      <div className="flex-1 overflow-hidden">
        <ChatMessages messages={messages} isLoading={isLoading} />
      </div>

      {/* Input Area */}
      <div className="border-t border-border p-4">
        <div className="mx-auto max-w-3xl">
          <ChatInput
            onSend={sendMessage}
            onStop={stop}
            disabled={isLoading}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
