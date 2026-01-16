/**
 * UserMessage.tsx - User Message Bubble Component
 *
 * Renders user messages with Vercel AI Chatbot styling:
 * - Blue background (#006cff / primary)
 * - Right-aligned
 * - White text
 * - Rounded corners
 */
"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface UserMessageProps {
  content: string;
}

export const UserMessage = memo(function UserMessage({ content }: UserMessageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex justify-end"
    >
      <div
        className={cn(
          "max-w-[calc(100%-2.5rem)] sm:max-w-[min(fit-content,80%)]",
          "rounded-2xl px-4 py-2.5",
          "bg-primary text-primary-foreground",
          "shadow-sm"
        )}
      >
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{content}</p>
      </div>
    </motion.div>
  );
});

UserMessage.displayName = "UserMessage";
