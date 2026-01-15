"use client";

import { useState, useRef, useEffect } from "react";
import { ChatInput } from "./ChatInput";
import { ChatMessage, type Message } from "./ChatMessage";
import { parseUIElements, type ParsedContent, type APIError } from "../types/ui-elements";
import type { RadioTrafficResponse, RadioTrafficErrorResponse } from "../api/radio-traffic/route";

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

/**
 * Extracts incident ID from a radio traffic request message.
 */
function extractIncidentId(message: string): string {
  const incidentMatch = message.match(/incident\s*(\d+)/i);
  return incidentMatch?.[1] ?? "123";
}

/**
 * Checks if the message is requesting malformed test data.
 * Used to test error handling for the PRD requirement.
 */
function isMalformedTestRequest(message: string): boolean {
  const lower = message.toLowerCase();
  return lower.includes("test malformed") || lower.includes("test error");
}

/**
 * Generates a mock response with malformed UI element data for testing.
 * This simulates various error cases that can occur with LLM responses.
 */
function getMalformedResponse(testType: string): string {
  if (testType === "json") {
    // Invalid JSON syntax
    return `Here is the data you requested:

\`\`\`ui-element
{ "type": "radio", "payload": { invalid json here }
\`\`\``;
  }

  if (testType === "missing-field") {
    // Missing required audioUrl field
    return `Here is the data you requested:

\`\`\`ui-element
{
  "type": "radio",
  "payload": {
    "transcription": [
      { "speaker": "Test", "text": "Hello", "startTime": 0, "endTime": 1 }
    ]
  }
}
\`\`\``;
  }

  if (testType === "invalid-segment") {
    // Invalid transcription segment missing required fields
    return `Here is the data you requested:

\`\`\`ui-element
{
  "type": "radio",
  "payload": {
    "audioUrl": "https://example.com/test.mp3",
    "transcription": [
      { "speaker": "Test", "text": "Valid" },
      { "invalid": "segment" }
    ]
  }
}
\`\`\``;
  }

  // Default: unknown type
  return `Here is the data you requested:

\`\`\`ui-element
{
  "type": "unknown-widget",
  "payload": { "data": "test" }
}
\`\`\``;
}

/**
 * Fetches radio traffic data from the backend API.
 */
async function fetchRadioTraffic(incidentId: string): Promise<{
  success: boolean;
  data?: RadioTrafficResponse;
  error?: string;
  errorCode?: string;
}> {
  try {
    const response = await fetch("/api/radio-traffic", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ incidentId }),
    });

    if (!response.ok) {
      const errorData = (await response.json()) as RadioTrafficErrorResponse;
      return {
        success: false,
        error: errorData.error || `Request failed with status ${response.status}`,
        errorCode: errorData.code,
      };
    }

    const data = (await response.json()) as RadioTrafficResponse;
    return { success: true, data };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to fetch radio traffic",
      errorCode: "NETWORK_ERROR",
    };
  }
}

/**
 * Converts an API error code to an APIError type.
 */
function createAPIError(errorCode: string | undefined, errorMessage: string, incidentId: string): APIError {
  let type: APIError["type"];

  switch (errorCode) {
    case "INCIDENT_NOT_FOUND":
    case "MISSING_INCIDENT_ID":
      type = "not_found";
      break;
    case "NETWORK_ERROR":
      type = "network_error";
      break;
    case "INTERNAL_ERROR":
    default:
      type = "server_error";
      break;
  }

  return {
    type,
    message: errorMessage,
    incidentId,
  };
}

/**
 * Converts API response to UI element format for parsing.
 */
function formatRadioResponse(response: RadioTrafficResponse): string {
  const uiElement = {
    type: response.type,
    payload: response.payload,
  };

  return `${response.textResponse}

\`\`\`ui-element
${JSON.stringify(uiElement, null, 2)}
\`\`\``;
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

  const handleSend = async (content: string) => {
    const userMessage: Message = {
      id: generateId(),
      role: "user",
      content,
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    let responseContent: string;
    let parsedContent: ParsedContent;

    if (isMalformedTestRequest(content)) {
      // Determine which type of malformed data to return
      const lower = content.toLowerCase();
      let testType = "unknown";
      if (lower.includes("json")) {
        testType = "json";
      } else if (lower.includes("missing")) {
        testType = "missing-field";
      } else if (lower.includes("segment")) {
        testType = "invalid-segment";
      }
      responseContent = getMalformedResponse(testType);
      parsedContent = parseUIElements(responseContent);
    } else if (isRadioTrafficRequest(content)) {
      // Extract incident ID and fetch from API
      const incidentId = extractIncidentId(content);
      const result = await fetchRadioTraffic(incidentId);

      if (result.success && result.data) {
        responseContent = formatRadioResponse(result.data);
        parsedContent = parseUIElements(responseContent);
      } else {
        // API error - display structured error with proper styling
        const apiError = createAPIError(result.errorCode, result.error ?? "Unknown error", incidentId);
        responseContent = "";
        parsedContent = {
          text: responseContent,
          uiElements: [],
          errors: [],
          apiError,
        };
      }
    } else {
      responseContent =
        "I received your message. Try asking for radio traffic, for example: 'Give me the radio traffic for incident 123'. To test error handling, try: 'test malformed json', 'test malformed missing field', or 'test malformed segment'. To test API errors, try incident 999 (not found) or incident error.";
      parsedContent = {
        text: responseContent,
        uiElements: [],
        errors: [],
      };
    }

    const assistantMessage: Message = {
      id: generateId(),
      role: "assistant",
      content: responseContent,
      parsedContent,
    };
    setMessages((prev) => [...prev, assistantMessage]);
    setIsLoading(false);
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
