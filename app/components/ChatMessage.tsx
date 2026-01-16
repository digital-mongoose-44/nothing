/**
 * ChatMessage.tsx - Message Rendering Component
 *
 * Renders individual chat messages with support for rich UI elements.
 * This component is the bridge between raw message content and the
 * specialized display components (AudioPlayer, error displays, etc.)
 *
 * Rendering Flow:
 * ┌─────────────────┐
 * │ Message         │
 * │ ├─ text         │──▶ Plain text display
 * │ ├─ uiElements[] │──▶ AudioPlayer (for type="radio")
 * │ ├─ errors[]     │──▶ UIElementError (parsing failures)
 * │ ├─ apiError     │──▶ APIErrorDisplay (API failures)
 * │ └─ isLoading    │──▶ AudioPlayerSkeleton
 * └─────────────────┘
 */
import { memo } from "react";
import type { ParsedContent, RadioUIElement, ParseError, APIError } from "../types/ui-elements";
import { AudioPlayer } from "./AudioPlayer";
import { AudioPlayerSkeleton } from "./AudioPlayerSkeleton";

// ============================================================================
// TYPES
// ============================================================================

/**
 * Represents a single chat message.
 */
export interface Message {
  /** Unique identifier for the message */
  id: string;
  /** Who sent the message */
  role: "user" | "assistant";
  /** Raw message content (may include ui-element blocks) */
  content: string;
  /** Parsed content with extracted UI elements and errors */
  parsedContent?: ParsedContent;
}

interface ChatMessageProps {
  message: Message;
}

// ============================================================================
// ERROR DISPLAY COMPONENTS
// ============================================================================

/**
 * Displays UI element parsing errors (malformed JSON, missing fields, etc.)
 *
 * Shown when:
 * - JSON syntax is invalid
 * - Required fields are missing (audioUrl, transcription)
 * - Unknown UI element type encountered
 *
 * Features:
 * - Warning icon with amber/yellow styling
 * - Error message explaining the issue
 * - Expandable "Show raw data" section for debugging
 */
function UIElementError({ error }: { error: ParseError }) {
  return (
    <div
      className="mt-3 rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-950"
      role="alert"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-amber-200 dark:bg-amber-800">
          <svg
            className="h-4 w-4 text-amber-700 dark:text-amber-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
            Unable to display content
          </p>
          <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
            {error.message}
          </p>
          {error.rawContent && (
            <details className="mt-2">
              <summary className="cursor-pointer text-xs text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-200">
                Show raw data
              </summary>
              <pre className="mt-1 overflow-x-auto rounded bg-amber-100 p-2 text-xs text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                {error.rawContent}
              </pre>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Displays API errors when fetching radio traffic fails.
 *
 * Error types with corresponding icons:
 * - not_found: Search icon (incident doesn't exist)
 * - server_error: Exclamation icon (backend failure)
 * - network_error: Disconnected icon (connectivity issues)
 *
 * Features:
 * - Red error styling for high visibility
 * - Contextual icon based on error type
 * - Helpful suggestion for user action
 * - Displays incident ID when available
 */
function APIErrorDisplay({ error }: { error: APIError }) {
  /** Returns the appropriate SVG path for the error type */
  const getErrorIcon = () => {
    switch (error.type) {
      case "not_found":
        return (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        );
      case "server_error":
        return (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        );
      case "network_error":
        return (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
          />
        );
    }
  };

  /** Returns user-friendly title for the error type */
  const getTitle = () => {
    switch (error.type) {
      case "not_found":
        return "Incident Not Found";
      case "server_error":
        return "Server Error";
      case "network_error":
        return "Connection Error";
    }
  };

  /** Returns actionable suggestion for resolving the error */
  const getSuggestion = () => {
    switch (error.type) {
      case "not_found":
        return "Please verify the incident number and try again.";
      case "server_error":
        return "The server encountered an error. Please try again later.";
      case "network_error":
        return "Please check your internet connection and try again.";
    }
  };

  return (
    <div
      className="mt-3 rounded-lg border border-red-300 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950"
      role="alert"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-red-200 dark:bg-red-900">
          <svg
            className="h-4 w-4 text-red-700 dark:text-red-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            {getErrorIcon()}
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-red-800 dark:text-red-200">
            {getTitle()}
          </p>
          <p className="mt-1 text-sm text-red-700 dark:text-red-300">
            {error.message}
          </p>
          {error.incidentId && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">
              Incident ID: {error.incidentId}
            </p>
          )}
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">
            {getSuggestion()}
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * Renders a single chat message with all its content.
 * Wrapped in React.memo to prevent unnecessary re-renders in the message list.
 *
 * Handles multiple content types:
 * - Plain text (always shown if present)
 * - Loading skeleton (when fetching radio data)
 * - Audio players (for radio UI elements)
 * - Parse errors (for malformed UI elements)
 * - API errors (for failed API requests)
 *
 * Styling:
 * - User messages: right-aligned, dark background
 * - Assistant messages: left-aligned, light background
 */
export const ChatMessage = memo(function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";
  const { parsedContent } = message;

  // ─── Extract content from parsed message ───

  // Filter for radio-type UI elements (audio players)
  const radioElements =
    parsedContent?.uiElements.filter(
      (el): el is RadioUIElement => el.type === "radio"
    ) ?? [];

  // Collect any parsing errors (malformed JSON, missing fields)
  const parseErrors = parsedContent?.errors ?? [];

  // Get API error if the fetch failed
  const apiError = parsedContent?.apiError;

  // Check if still loading (shows skeleton)
  const isLoading = parsedContent?.isLoading ?? false;

  // Use cleaned text (UI element blocks removed) or fall back to raw content
  const displayText = parsedContent?.text ?? message.content;

  // ─── Render ───

  return (
    <div
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
      role="listitem"
    >
      <div
        className={`max-w-[80%] rounded-lg px-4 py-3 ${
          isUser
            ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
            : "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
        }`}
      >
        {/* Text content - always shown if present */}
        {displayText && (
          <p className="whitespace-pre-wrap text-base">{displayText}</p>
        )}

        {/* Loading skeleton - shown while fetching radio data */}
        {isLoading && <AudioPlayerSkeleton />}

        {/* Audio players - rendered for each radio UI element */}
        {!isLoading && radioElements.map((element, index) => (
          <AudioPlayer key={index} payload={element.payload} />
        ))}

        {/* Parse errors - shown for malformed UI elements */}
        {parseErrors.map((error, index) => (
          <UIElementError key={`error-${index}`} error={error} />
        ))}

        {/* API errors - shown when radio traffic fetch fails */}
        {apiError && <APIErrorDisplay error={apiError} />}
      </div>
    </div>
  );
});

// Set display name for debugging
ChatMessage.displayName = "ChatMessage";
