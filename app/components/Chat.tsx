/**
 * Chat.tsx - Main Chat Orchestrator Component
 *
 * This component is the central hub for the chat interface that supports
 * radio traffic playback. It handles:
 *
 * 1. MESSAGE FLOW: User input → Pattern detection → API calls → Response rendering
 * 2. RADIO TRAFFIC: Detects radio requests, fetches data, displays audio player
 * 3. ERROR TESTING: Supports testing malformed responses for PRD requirements
 *
 * Data Flow:
 * ┌─────────────┐    ┌──────────────────┐    ┌─────────────────┐
 * │ ChatInput   │───▶│ handleSend()     │───▶│ ChatMessage     │
 * │ (user msg)  │    │ (pattern detect) │    │ (render)        │
 * └─────────────┘    └────────┬─────────┘    └─────────────────┘
 *                             │
 *                    ┌────────▼─────────┐
 *                    │ /api/radio-traffic│
 *                    │ (fetch data)      │
 *                    └──────────────────┘
 */
"use client";

import { useState, useRef, useEffect } from "react";
import { ChatInput } from "./ChatInput";
import { ChatMessage, type Message } from "./ChatMessage";
import { ErrorBoundary } from "./ErrorBoundary";
import { parseUIElements, type ParsedContent, type APIError } from "../types/ui-elements";
import { generateId } from "../utils/format";
import {
  isRadioTrafficRequest,
  extractIncidentId,
  isMalformedTestRequest,
  getMalformedResponse,
  getTestTypeFromMessage,
} from "../utils/chat-utils";
import type { RadioTrafficResponse, RadioTrafficErrorResponse } from "../api/radio-traffic/route";

// ============================================================================
// CONSTANTS
// ============================================================================

/** Timeout for API requests in milliseconds */
const API_TIMEOUT_MS = 30000;

// ============================================================================
// API FUNCTIONS
// These functions handle communication with the radio traffic backend API
// ============================================================================

/**
 * Fetches radio traffic data from the backend API with timeout support.
 *
 * @param incidentId - The incident ID to fetch radio traffic for
 * @param signal - Optional AbortSignal for request cancellation
 * @returns Object containing success status, data (on success), or error details
 *
 * Error handling:
 * - HTTP errors: Extracts error message and code from response
 * - Timeout errors: Returns TIMEOUT_ERROR code
 * - Network errors: Returns NETWORK_ERROR code
 */
async function fetchRadioTraffic(
  incidentId: string,
  signal?: AbortSignal
): Promise<{
  success: boolean;
  data?: RadioTrafficResponse;
  error?: string;
  errorCode?: string;
}> {
  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  // Combine with external signal if provided
  const combinedSignal = signal
    ? AbortSignal.any([signal, controller.signal])
    : controller.signal;

  try {
    const response = await fetch("/api/radio-traffic", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ incidentId }),
      signal: combinedSignal,
    });

    clearTimeout(timeoutId);

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
    clearTimeout(timeoutId);

    // Check if this was a timeout abort
    if (err instanceof Error && err.name === "AbortError") {
      return {
        success: false,
        error: "Request timed out. Please try again.",
        errorCode: "TIMEOUT_ERROR",
      };
    }

    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to fetch radio traffic",
      errorCode: "NETWORK_ERROR",
    };
  }
}

/**
 * Converts an API error code to a structured APIError object.
 * Maps backend error codes to user-facing error types for consistent UI display.
 *
 * Error type mapping:
 * - INCIDENT_NOT_FOUND, MISSING_INCIDENT_ID → "not_found"
 * - NETWORK_ERROR, TIMEOUT_ERROR → "network_error"
 * - INTERNAL_ERROR, unknown → "server_error"
 */
function createAPIError(errorCode: string | undefined, errorMessage: string, incidentId: string): APIError {
  let type: APIError["type"];

  switch (errorCode) {
    case "INCIDENT_NOT_FOUND":
    case "MISSING_INCIDENT_ID":
      type = "not_found";
      break;
    case "NETWORK_ERROR":
    case "TIMEOUT_ERROR":
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
 *
 * The response is formatted as markdown with a fenced code block
 * using the "ui-element" language identifier. This format allows
 * the parseUIElements function to extract and render rich UI components.
 *
 * Output format:
 * ```
 * Here is the radio traffic for incident 123:
 *
 * ```ui-element
 * { "type": "radio", "payload": {...} }
 * ```
 * ```
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

// ============================================================================
// MAIN CHAT COMPONENT
// ============================================================================

/**
 * Main Chat component that orchestrates the chat interface.
 *
 * State:
 * - messages: Array of all chat messages (user + assistant)
 * - isLoading: Whether a response is being generated
 *
 * Features:
 * - Auto-scrolls to newest message
 * - Detects radio traffic requests and fetches from API
 * - Shows loading skeleton while fetching
 * - Handles both API errors and malformed response testing
 */
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

  /**
   * Handles sending a message from the user.
   *
   * Processing flow:
   * 1. Add user message to chat
   * 2. Detect request type (malformed test / radio traffic / generic)
   * 3. Process accordingly and generate response
   * 4. Add assistant response to chat
   */
  const handleSend = async (content: string) => {
    // Step 1: Add user message to the chat
    const userMessage: Message = {
      id: generateId(),
      role: "user",
      content,
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    let responseContent: string;
    let parsedContent: ParsedContent;

    // Step 2: Detect request type and process accordingly

    if (isMalformedTestRequest(content)) {
      // ─── BRANCH A: Error Testing Mode ───
      // Generates intentionally malformed responses to test error handling UI
      const testType = getTestTypeFromMessage(content);
      responseContent = getMalformedResponse(testType);
      parsedContent = parseUIElements(responseContent);

    } else if (isRadioTrafficRequest(content)) {
      // ─── BRANCH B: Radio Traffic Request ───
      // Fetches audio and transcription data from the API
      const incidentId = extractIncidentId(content);

      // Show loading skeleton while fetching
      const loadingMessageId = generateId();
      const loadingMessage: Message = {
        id: loadingMessageId,
        role: "assistant",
        content: `Fetching radio traffic for incident ${incidentId}...`,
        parsedContent: {
          text: `Fetching radio traffic for incident ${incidentId}...`,
          uiElements: [],
          errors: [],
          isLoading: true, // Triggers AudioPlayerSkeleton
        },
      };
      setMessages((prev) => [...prev, loadingMessage]);

      // Fetch data from the radio traffic API
      const result = await fetchRadioTraffic(incidentId);

      if (result.success && result.data) {
        // Success: Format response with UI element for audio player
        responseContent = formatRadioResponse(result.data);
        parsedContent = parseUIElements(responseContent);
      } else {
        // API error: Create structured error for display
        const apiError = createAPIError(result.errorCode, result.error ?? "Unknown error", incidentId);
        responseContent = "";
        parsedContent = {
          text: responseContent,
          uiElements: [],
          errors: [],
          apiError, // Triggers APIErrorDisplay component
        };
      }

      // Replace loading message with actual response
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === loadingMessageId
            ? { ...msg, content: responseContent, parsedContent }
            : msg
        )
      );
      setIsLoading(false);
      return;

    } else {
      // ─── BRANCH C: Generic Message ───
      // Returns helpful instructions for using the chat
      responseContent =
        "I received your message. Try asking for radio traffic, for example: 'Give me the radio traffic for incident 123'. To test error handling, try: 'test malformed json', 'test malformed missing field', or 'test malformed segment'. To test API errors, try incident 999 (not found) or incident error.";
      parsedContent = {
        text: responseContent,
        uiElements: [],
        errors: [],
      };
    }

    // Step 3: Add assistant response to the chat
    const assistantMessage: Message = {
      id: generateId(),
      role: "assistant",
      content: responseContent,
      parsedContent,
    };
    setMessages((prev) => [...prev, assistantMessage]);
    setIsLoading(false);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-full flex-col">
      {/* Messages Area - scrollable container for chat history */}
      <div
        className="flex-1 overflow-y-auto p-4"
        role="list"
        aria-label="Chat messages"
      >
        {messages.length === 0 ? (
          // Empty state - show helpful prompt
          <div className="flex h-full items-center justify-center text-zinc-500 dark:text-zinc-400">
            <p>
              Start a conversation. Try: &quot;Give me the radio traffic for
              incident 123&quot;
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Render all messages - wrapped in ErrorBoundary for resilience */}
            {messages.map((message) => (
              <ErrorBoundary key={message.id}>
                <ChatMessage message={message} />
              </ErrorBoundary>
            ))}

            {/* Typing indicator - shown while waiting for response */}
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

            {/* Scroll anchor - used for auto-scroll to bottom */}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area - fixed at bottom */}
      <div className="border-t border-zinc-200 p-4 dark:border-zinc-800">
        <ChatInput onSend={handleSend} disabled={isLoading} />
      </div>
    </div>
  );
}
