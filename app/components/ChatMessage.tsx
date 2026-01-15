import type { ParsedContent, RadioUIElement } from "../types/ui-elements";

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
      </div>
    </div>
  );
}
