/**
 * ChatInput.tsx - Multimodal Input Component
 *
 * A styled input component matching Vercel AI Chatbot design:
 * - Rounded pill container
 * - Send button inside (arrow icon)
 * - Stop button during loading
 * - Auto-resize textarea
 */
"use client";

import { useState, useRef, useEffect, type FormEvent, type KeyboardEvent } from "react";
import { ArrowUp, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  /** Callback fired when user submits a message */
  onSend: (message: string) => void;
  /** Callback to stop current operation */
  onStop?: () => void;
  /** Whether the input is disabled (e.g., while loading) */
  disabled?: boolean;
  /** Whether a response is being generated */
  isLoading?: boolean;
}

export function ChatInput({
  onSend,
  onStop,
  disabled = false,
  isLoading = false,
}: ChatInputProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (trimmed && !disabled) {
      onSend(trimmed);
      setInput("");
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleStopClick = () => {
    onStop?.();
  };

  const canSubmit = input.trim().length > 0 && !disabled;

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div
        className={cn(
          "flex items-end gap-2 rounded-2xl border bg-background p-2 shadow-sm transition-colors",
          "border-input focus-within:border-ring focus-within:ring-1 focus-within:ring-ring"
        )}
      >
        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Send a message..."
          disabled={disabled}
          rows={1}
          className={cn(
            "flex-1 resize-none bg-transparent px-2 py-1.5",
            "text-sm text-foreground placeholder:text-muted-foreground",
            "focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
            "max-h-[200px] min-h-[44px]"
          )}
          aria-label="Chat message input"
        />

        {/* Submit/Stop button */}
        {isLoading ? (
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={handleStopClick}
            className="h-8 w-8 shrink-0 rounded-lg bg-foreground text-background hover:bg-foreground/90"
            aria-label="Stop generating"
          >
            <Square className="h-4 w-4 fill-current" />
          </Button>
        ) : (
          <Button
            type="submit"
            size="icon"
            disabled={!canSubmit}
            className={cn(
              "h-8 w-8 shrink-0 rounded-lg transition-colors",
              canSubmit
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-muted text-muted-foreground"
            )}
            aria-label="Send message"
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Hint text */}
      <p className="mt-2 text-center text-xs text-muted-foreground">
        Press Enter to send, Shift+Enter for new line
      </p>
    </form>
  );
}
