/**
 * ChatMessages.tsx - Message List Container
 *
 * Renders the scrollable list of chat messages with:
 * - Empty state greeting
 * - User and assistant messages
 * - Typing indicator during loading
 * - Auto-scroll to newest message
 */
"use client";

import { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { MessageSquare } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ErrorBoundary } from "../ErrorBoundary";
import { UserMessage } from "./UserMessage";
import { AssistantMessage } from "./AssistantMessage";
import type { ChatMessage } from "../../types/chat";

interface ChatMessagesProps {
  messages: ChatMessage[];
  isLoading: boolean;
}

/**
 * Empty state greeting shown when no messages exist.
 */
function Greeting() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="flex h-full flex-col items-center justify-center gap-4 text-center"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-pink-500 shadow-lg">
        <MessageSquare className="h-6 w-6 text-white" />
      </div>
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-foreground">
          Radio Traffic Assistant
        </h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          Ask for radio traffic recordings by incident number.
          <br />
          Try: &quot;Give me the radio traffic for incident 123&quot;
        </p>
      </div>
    </motion.div>
  );
}

/**
 * Typing indicator shown while waiting for response.
 */
function ThinkingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex justify-start gap-3"
    >
      <div className="h-8 w-8 shrink-0" /> {/* Avatar spacer */}
      <div className="rounded-2xl bg-secondary px-4 py-3">
        <div className="flex gap-1">
          <motion.span
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1, repeat: Infinity, delay: 0 }}
            className="h-2 w-2 rounded-full bg-muted-foreground"
          />
          <motion.span
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
            className="h-2 w-2 rounded-full bg-muted-foreground"
          />
          <motion.span
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
            className="h-2 w-2 rounded-full bg-muted-foreground"
          />
        </div>
      </div>
    </motion.div>
  );
}

export function ChatMessages({ messages, isLoading }: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <ScrollArea className="h-full">
      <div className="p-4">
        {messages.length === 0 ? (
          <div className="flex h-[calc(100vh-200px)] items-center justify-center">
            <Greeting />
          </div>
        ) : (
          <div className="space-y-4" role="list" aria-label="Chat messages">
            {messages.map((message) => (
              <ErrorBoundary key={message.id}>
                <div role="listitem">
                  {message.role === "user" ? (
                    <UserMessage content={message.content} />
                  ) : (
                    <AssistantMessage
                      content={message.content}
                      parsedContent={message.parsedContent}
                    />
                  )}
                </div>
              </ErrorBoundary>
            ))}

            {/* Typing indicator */}
            {isLoading && <ThinkingIndicator />}

            {/* Scroll anchor */}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
