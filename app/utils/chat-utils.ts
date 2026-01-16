/**
 * chat-utils.ts - Chat Request Detection Utilities
 *
 * This module contains functions for analyzing user input to determine
 * request types and extract relevant information from messages.
 */

// ============================================================================
// REQUEST DETECTION FUNCTIONS
// ============================================================================

/**
 * Detects if the user message is asking for radio traffic.
 * Matches common phrasings like:
 * - "show me the radio traffic"
 * - "give me radio recording"
 * - "radio traffic for incident 123"
 *
 * @param message - The user's message to analyze
 * @returns true if the message is requesting radio traffic
 */
export function isRadioTrafficRequest(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("radio traffic") ||
    lower.includes("radio recording") ||
    (lower.includes("give me") && lower.includes("radio"))
  );
}

/**
 * Extracts incident ID from a radio traffic request message.
 * Looks for patterns like "incident 123" or "incident123".
 * Falls back to "123" if no incident ID is found.
 *
 * @param message - The user's message to extract from
 * @returns The extracted incident ID or "123" as default
 */
export function extractIncidentId(message: string): string {
  const incidentMatch = message.match(/incident\s*(\d+)/i);
  return incidentMatch?.[1] ?? "123";
}

// ============================================================================
// TEST/DEBUG FUNCTIONS
// ============================================================================

/**
 * Checks if the message is requesting malformed test data.
 * Used to test error handling for the PRD requirement.
 * Triggered by messages like "test malformed json" or "test error".
 *
 * @param message - The user's message to check
 * @returns true if this is a malformed test request
 */
export function isMalformedTestRequest(message: string): boolean {
  const lower = message.toLowerCase();
  return lower.includes("test malformed") || lower.includes("test error");
}

/**
 * Generates a mock response with malformed UI element data for testing.
 * This simulates various error cases that can occur with LLM responses:
 * - "json": Invalid JSON syntax
 * - "missing-field": Missing required audioUrl field
 * - "invalid-segment": Invalid transcription segment
 * - default: Unknown UI element type
 *
 * @param testType - The type of malformed response to generate
 * @returns A malformed response string for testing error handling
 */
export function getMalformedResponse(testType: string): string {
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

  // Default: unknown UI element type (tests graceful handling of future types)
  return `Here is the data you requested:

\`\`\`ui-element
{
  "type": "unknown-widget",
  "payload": { "data": "test" }
}
\`\`\``;
}

/**
 * Determines the test type from a user message.
 *
 * @param message - The user's message
 * @returns The test type to use ("json", "missing-field", "invalid-segment", or "unknown")
 */
export function getTestTypeFromMessage(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("json")) {
    return "json";
  } else if (lower.includes("missing")) {
    return "missing-field";
  } else if (lower.includes("segment")) {
    return "invalid-segment";
  }
  return "unknown";
}
