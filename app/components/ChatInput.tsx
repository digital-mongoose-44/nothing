/**
 * ChatInput.tsx - Message Input Component
 *
 * A controlled textarea input for composing chat messages.
 *
 * Features:
 * - Single-line appearance with textarea (allows future multi-line support)
 * - Enter key to send (Shift+Enter for newline)
 * - Disabled state during message processing
 * - Accessible with proper ARIA labels
 */
"use client";

import { useState, type FormEvent, type KeyboardEvent } from "react";

// ============================================================================
// TYPES
// ============================================================================

interface ChatInputProps {
  /** Callback fired when user submits a message */
  onSend: (message: string) => void;
  /** Whether the input is disabled (e.g., while loading) */
  disabled?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Chat input component with send button.
 * Handles form submission via button click or Enter key.
 */
export function ChatInput({ onSend, disabled = false }: ChatInputProps) {
  const [input, setInput] = useState("");

  /**
   * Handles form submission.
   * Trims whitespace and clears input after sending.
   */
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (trimmed && !disabled) {
      onSend(trimmed);
      setInput("");
    }
  };

  /**
   * Handles keyboard events for the textarea.
   * Enter sends message, Shift+Enter creates newline.
   */
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      {/* Message input - textarea for potential multi-line support */}
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a message..."
        disabled={disabled}
        rows={1}
        className="flex-1 resize-none rounded-lg border border-zinc-300 bg-white px-4 py-3 text-base text-zinc-900 placeholder-zinc-500 focus:border-zinc-500 focus:outline-none disabled:bg-zinc-100 disabled:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-400 dark:focus:border-zinc-500 dark:disabled:bg-zinc-800"
        aria-label="Chat message input"
      />

      {/* Send button - disabled when empty or loading */}
      <button
        type="submit"
        disabled={disabled || !input.trim()}
        className="rounded-lg bg-zinc-900 px-4 py-3 text-base font-medium text-white transition-colors hover:bg-zinc-700 disabled:bg-zinc-300 disabled:text-zinc-500 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300 dark:disabled:bg-zinc-700 dark:disabled:text-zinc-500"
        aria-label="Send message"
      >
        Send
      </button>
    </form>
  );
}
