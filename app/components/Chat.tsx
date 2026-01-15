"use client";

import { useState, useRef, useEffect } from "react";
import { ChatInput } from "./ChatInput";
import { ChatMessage, type Message } from "./ChatMessage";

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

function isRadioTrafficRequest(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("radio traffic") ||
    lower.includes("radio recording") ||
    (lower.includes("give me") && lower.includes("radio"))
  );
}

export function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (content: string) => {
    const userMessage: Message = {
      id: generateId(),
      role: "user",
      content,
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    // Simulate async response
    setTimeout(() => {
      let responseContent: string;

      if (isRadioTrafficRequest(content)) {
        responseContent =
          "I recognized your request for radio traffic. The radio playback feature will be implemented in upcoming iterations.";
      } else {
        responseContent =
          "I received your message. Try asking for radio traffic, for example: 'Give me the radio traffic for incident 123'";
      }

      const assistantMessage: Message = {
        id: generateId(),
        role: "assistant",
        content: responseContent,
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 500);
  };

  return (
    <div className="flex h-full flex-col">
      <div
        className="flex-1 overflow-y-auto p-4"
        role="list"
        aria-label="Chat messages"
      >
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-zinc-500 dark:text-zinc-400">
            <p>
              Start a conversation. Try: &quot;Give me the radio traffic for
              incident 123&quot;
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {isLoading && (
              <div className="flex justify-start" role="listitem">
                <div className="rounded-lg bg-zinc-100 px-4 py-3 dark:bg-zinc-800">
                  <div className="flex space-x-1">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 dark:bg-zinc-500" />
                    <span
                      className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 dark:bg-zinc-500"
                      style={{ animationDelay: "0.1s" }}
                    />
                    <span
                      className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 dark:bg-zinc-500"
                      style={{ animationDelay: "0.2s" }}
                    />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      <div className="border-t border-zinc-200 p-4 dark:border-zinc-800">
        <ChatInput onSend={handleSend} disabled={isLoading} />
      </div>
    </div>
  );
}
