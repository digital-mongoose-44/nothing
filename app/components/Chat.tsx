"use client";

import { useState, useRef, useEffect } from "react";
import { ChatInput } from "./ChatInput";
import { ChatMessage, type Message } from "./ChatMessage";
import { parseUIElements } from "../types/ui-elements";

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
 * Mock LLM response containing a radio UI element.
 * In production, this would come from the actual LLM backend.
 */
function getMockRadioResponse(incidentId: string): string {
  const uiElement = {
    type: "radio",
    payload: {
      audioUrl: "https://example.com/audio/incident-" + incidentId + ".mp3",
      transcription: [
        {
          speaker: "Dispatch",
          text: "Unit 42, respond to incident " + incidentId + ", structure fire reported.",
          startTime: 0,
          endTime: 4.5,
        },
        {
          speaker: "Unit 42",
          text: "Copy dispatch, Unit 42 responding.",
          startTime: 5.0,
          endTime: 7.2,
        },
        {
          speaker: "Unit 42",
          text: "On scene, smoke visible from second floor.",
          startTime: 12.0,
          endTime: 15.3,
        },
        {
          speaker: null,
          text: "Requesting additional units.",
          startTime: 16.0,
          endTime: 18.0,
        },
      ],
      metadata: {
        incidentId: incidentId,
        duration: 18.0,
        recordedAt: new Date().toISOString(),
      },
    },
  };

  return `Here is the radio traffic for incident ${incidentId}:

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

  const handleSend = (content: string) => {
    const userMessage: Message = {
      id: generateId(),
      role: "user",
      content,
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    // Simulate async response
    setTimeout(() => {
      let responseContent: string;

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
      } else if (isRadioTrafficRequest(content)) {
        // Extract incident ID from the request (if present)
        const incidentMatch = content.match(/incident\s*(\d+)/i);
        const incidentId = incidentMatch?.[1] ?? "123";
        responseContent = getMockRadioResponse(incidentId);
      } else {
        responseContent =
          "I received your message. Try asking for radio traffic, for example: 'Give me the radio traffic for incident 123'. To test error handling, try: 'test malformed json', 'test malformed missing field', or 'test malformed segment'.";
      }

      // Parse the response to extract UI elements
      const parsedContent = parseUIElements(responseContent);

      const assistantMessage: Message = {
        id: generateId(),
        role: "assistant",
        content: responseContent,
        parsedContent,
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 500);
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
