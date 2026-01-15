import type { ParsedContent, RadioUIElement, ParseError } from "../types/ui-elements";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  parsedContent?: ParsedContent;
}

interface ChatMessageProps {
  message: Message;
}

/**
 * Component to display UI element parsing errors.
 * Shows a user-friendly error message when malformed data is encountered.
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
 * Placeholder component for radio traffic playback.
 * Will be fully implemented in a future iteration.
 */
function RadioTrafficPlaceholder({ element }: { element: RadioUIElement }) {
  const { payload } = element;
  const speakerCount = new Set(
    payload.transcription.map((s) => s.speaker ?? "Unknown")
  ).size;

  return (
    <div className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-900">
      <div className="mb-2 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
          <svg
            className="h-4 w-4 text-blue-600 dark:text-blue-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
            />
          </svg>
        </div>
        <span className="font-medium">Radio Traffic Recording</span>
      </div>
      <div className="space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
        <p>
          <span className="font-medium">Segments:</span>{" "}
          {payload.transcription.length}
        </p>
        <p>
          <span className="font-medium">Speakers:</span> {speakerCount}
        </p>
        {payload.metadata?.incidentId && (
          <p>
            <span className="font-medium">Incident:</span>{" "}
            {payload.metadata.incidentId}
          </p>
        )}
        {payload.metadata?.duration && (
          <p>
            <span className="font-medium">Duration:</span>{" "}
            {Math.round(payload.metadata.duration)}s
          </p>
        )}
      </div>
      <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-500">
        Audio player will be available in a future update.
      </p>
    </div>
  );
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";
  const { parsedContent } = message;

  // Get radio elements if present
  const radioElements =
    parsedContent?.uiElements.filter(
      (el): el is RadioUIElement => el.type === "radio"
    ) ?? [];

  // Get parsing errors if present
  const parseErrors = parsedContent?.errors ?? [];

  // Use parsed text if available, otherwise fall back to raw content
  const displayText = parsedContent?.text ?? message.content;

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
        {displayText && (
          <p className="whitespace-pre-wrap text-base">{displayText}</p>
        )}
        {radioElements.map((element, index) => (
          <RadioTrafficPlaceholder key={index} element={element} />
        ))}
        {parseErrors.map((error, index) => (
          <UIElementError key={`error-${index}`} error={error} />
        ))}
      </div>
    </div>
  );
}
