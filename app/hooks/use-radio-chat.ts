/**
 * use-radio-chat.ts - Custom Chat Hook for Radio Traffic
 *
 * This hook manages chat state and handles the special flow for
 * radio traffic requests. It intercepts radio-related messages
 * and fetches data from the internal radio traffic API.
 */
"use client";

import { useState, useCallback } from "react";
import type { ChatMessage } from "../types/chat";
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
// ============================================================================

/**
 * Fetches radio traffic data from the internal API with timeout support.
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
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  const combinedSignal = signal
    ? AbortSignal.any([signal, controller.signal])
    : controller.signal;

  try {
    const response = await fetch("/api/radio-traffic", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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

  return { type, message: errorMessage, incidentId };
}

/**
 * Converts API response to UI element format.
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
// HOOK
// ============================================================================

export type ChatStatus = "idle" | "loading" | "error";

export interface UseRadioChatReturn {
  /** Array of all messages in the chat */
  messages: ChatMessage[];
  /** Current status of the chat */
  status: ChatStatus;
  /** Whether the chat is currently loading */
  isLoading: boolean;
  /** Send a new message */
  sendMessage: (content: string) => Promise<void>;
  /** Clear all messages */
  clearMessages: () => void;
  /** Stop the current operation */
  stop: () => void;
}

/**
 * Custom hook for managing chat with radio traffic support.
 */
export function useRadioChat(): UseRadioChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<ChatStatus>("idle");
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  const isLoading = status === "loading";

  const stop = useCallback(() => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
    setStatus("idle");
  }, [abortController]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setStatus("idle");
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    // Create user message
    const userMessage: ChatMessage = {
      id: generateId(),
      role: "user",
      content,
    };
    setMessages((prev) => [...prev, userMessage]);
    setStatus("loading");

    // Create new abort controller for this request
    const controller = new AbortController();
    setAbortController(controller);

    let responseContent: string;
    let parsedContent: ParsedContent;

    try {
      if (isMalformedTestRequest(content)) {
        // Error testing mode
        const testType = getTestTypeFromMessage(content);
        responseContent = getMalformedResponse(testType);
        parsedContent = parseUIElements(responseContent);

      } else if (isRadioTrafficRequest(content)) {
        // Radio traffic request
        const incidentId = extractIncidentId(content);

        // Show loading message
        const loadingMessageId = generateId();
        const loadingMessage: ChatMessage = {
          id: loadingMessageId,
          role: "assistant",
          content: `Fetching radio traffic for incident ${incidentId}...`,
          parsedContent: {
            text: `Fetching radio traffic for incident ${incidentId}...`,
            uiElements: [],
            errors: [],
            isLoading: true,
          },
        };
        setMessages((prev) => [...prev, loadingMessage]);

        // Fetch data from internal API
        const result = await fetchRadioTraffic(incidentId, controller.signal);

        if (result.success && result.data) {
          responseContent = formatRadioResponse(result.data);
          parsedContent = parseUIElements(responseContent);
        } else {
          const apiError = createAPIError(result.errorCode, result.error ?? "Unknown error", incidentId);
          responseContent = "";
          parsedContent = {
            text: responseContent,
            uiElements: [],
            errors: [],
            apiError,
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
        setStatus("idle");
        setAbortController(null);
        return;

      } else {
        // Generic message
        responseContent =
          "I received your message. Try asking for radio traffic, for example: 'Give me the radio traffic for incident 123'. To test error handling, try: 'test malformed json', 'test malformed missing field', or 'test malformed segment'.";
        parsedContent = {
          text: responseContent,
          uiElements: [],
          errors: [],
        };
      }

      // Add assistant response
      const assistantMessage: ChatMessage = {
        id: generateId(),
        role: "assistant",
        content: responseContent,
        parsedContent,
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setStatus("idle");

    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") {
        setStatus("error");
      }
    } finally {
      setAbortController(null);
    }
  }, []);

  return {
    messages,
    status,
    isLoading,
    sendMessage,
    clearMessages,
    stop,
  };
}
