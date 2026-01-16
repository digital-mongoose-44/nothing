/**
 * ui-elements.ts - UI Element Types and Parser
 *
 * This module defines the type system and parsing logic for rich UI elements
 * embedded in LLM responses. UI elements allow the chat to render interactive
 * components (like audio players) instead of just text.
 *
 * Format:
 * UI elements are embedded in markdown code blocks with "ui-element" language:
 *
 * ```ui-element
 * {
 *   "type": "radio",
 *   "payload": { "audioUrl": "...", "transcription": [...] }
 * }
 * ```
 *
 * Currently supported element types:
 * - "radio" - Audio player with transcription (RadioUIElement)
 *
 * The system is designed to be extensible - new element types can be added
 * by defining new interfaces and updating the type guards.
 */

// ============================================================================
// DATA TYPES
// ============================================================================

/**
 * A single segment of radio traffic transcription.
 * Represents one speaker's utterance with timing information.
 */
export interface TranscriptionSegment {
  /** Speaker callsign/name, or null if unknown */
  speaker: string | null;
  /** The spoken text content */
  text: string;
  /** Start time in seconds from beginning of recording */
  startTime: number;
  /** End time in seconds from beginning of recording */
  endTime: number;
}

/**
 * Payload data for a radio traffic UI element.
 * Contains everything needed to render the audio player.
 */
export interface RadioUIElementPayload {
  /** URL to the audio file (can be relative or absolute) */
  audioUrl: string;
  /** Array of transcription segments */
  transcription: TranscriptionSegment[];
  /** Optional metadata about the recording */
  metadata?: {
    /** The incident this recording is associated with */
    incidentId?: string;
    /** Total duration in seconds */
    duration?: number;
    /** ISO timestamp when recorded */
    recordedAt?: string;
  };
}

/**
 * A radio traffic UI element.
 * Renders as an AudioPlayer component with transcription.
 */
export interface RadioUIElement {
  type: "radio";
  payload: RadioUIElementPayload;
}

/**
 * Union type of all supported UI elements.
 * Add new element types here as they're implemented.
 */
export type UIElement = RadioUIElement;

// ============================================================================
// ERROR TYPES
// ============================================================================

/**
 * Represents a parsing error when extracting UI elements from responses.
 * Used to show user-friendly errors for malformed data.
 */
export interface ParseError {
  /** Human-readable error description */
  message: string;
  /** Truncated raw content that failed to parse (for debugging) */
  rawContent: string;
}

/**
 * Represents an API error when fetching radio traffic data.
 * Maps to different UI treatments (icons, colors, suggestions).
 */
export interface APIError {
  /** Error category for UI treatment */
  type: "not_found" | "server_error" | "network_error";
  /** Error message from the API or network layer */
  message: string;
  /** The incident ID that was requested (if available) */
  incidentId?: string;
}

/**
 * Result of parsing an LLM response for UI elements.
 * Contains the cleaned text, extracted elements, and any errors.
 */
export interface ParsedContent {
  /** Text content with UI element blocks removed */
  text: string;
  /** Successfully parsed UI elements */
  uiElements: UIElement[];
  /** Parsing errors for malformed UI element blocks */
  errors: ParseError[];
  /** API-level error (fetch failure, not found, etc.) */
  apiError?: APIError;
  /** Whether data is still being fetched (shows skeleton) */
  isLoading?: boolean;
}

// ============================================================================
// PARSING
// ============================================================================

/**
 * Regex pattern to find UI element blocks in markdown.
 * Captures the JSON content between ```ui-element and ``` markers.
 *
 * Example match:
 * ```ui-element
 * { "type": "radio", "payload": {...} }
 * ```
 */
const UI_ELEMENT_PATTERN = /```ui-element\s*([\s\S]*?)```/g;

/**
 * Parses an LLM response and extracts any embedded UI elements.
 *
 * Process:
 * 1. Find all ```ui-element code blocks using regex
 * 2. For each block, try to parse as JSON
 * 3. Validate the structure matches a known UIElement type
 * 4. Remove parsed blocks from the text content
 * 5. Track errors for blocks that fail parsing/validation
 *
 * @param content - The raw LLM response content
 * @returns ParsedContent with cleaned text, extracted elements, and errors
 *
 * @example
 * const result = parseUIElements("Here's data:\n```ui-element\n{...}\n```");
 * // result.text = "Here's data:"
 * // result.uiElements = [{ type: "radio", payload: {...} }]
 */
export function parseUIElements(content: string): ParsedContent {
  const uiElements: UIElement[] = [];
  const errors: ParseError[] = [];
  let text = content;

  // Find all UI element blocks using regex
  const matches = content.matchAll(UI_ELEMENT_PATTERN);

  for (const match of matches) {
    const jsonString = match[1].trim();

    try {
      // Step 1: Parse JSON
      const parsed = JSON.parse(jsonString);

      // Step 2: Validate structure
      if (isValidUIElement(parsed)) {
        // Success - add to elements array
        uiElements.push(parsed);
        // Remove the block from displayed text
        text = text.replace(match[0], "").trim();
      } else {
        // Invalid structure - generate descriptive error
        const errorMessage = getValidationErrorMessage(parsed);
        errors.push({
          message: errorMessage,
          rawContent: jsonString.slice(0, 100) + (jsonString.length > 100 ? "..." : ""),
        });
        console.error("Invalid UI element structure:", parsed);
        // Still remove malformed block from text (don't show raw JSON)
        text = text.replace(match[0], "").trim();
      }
    } catch (error) {
      // JSON parse error - likely syntax issue
      const errorMessage = error instanceof Error ? error.message : "Invalid JSON";
      errors.push({
        message: `Failed to parse: ${errorMessage}`,
        rawContent: jsonString.slice(0, 100) + (jsonString.length > 100 ? "..." : ""),
      });
      console.error("Failed to parse UI element JSON:", error);
      // Still remove malformed block from text
      text = text.replace(match[0], "").trim();
    }
  }

  return { text, uiElements, errors };
}

// ============================================================================
// VALIDATION ERROR MESSAGES
// These functions generate human-readable error messages for UI display
// ============================================================================

/**
 * Generates a human-readable error message for invalid UI element structures.
 * Walks through the structure to find the first validation failure.
 *
 * @param parsed - The parsed JSON object that failed validation
 * @returns Descriptive error message for display to user
 */
function getValidationErrorMessage(parsed: unknown): string {
  if (typeof parsed !== "object" || parsed === null) {
    return "UI element must be an object";
  }

  const element = parsed as Record<string, unknown>;

  if (!element.type) {
    return "UI element missing required 'type' field";
  }

  if (element.type === "radio") {
    return getRadioValidationError(element.payload);
  }

  // Unknown type - extensibility point for future element types
  return `Unknown UI element type: ${element.type}`;
}

/**
 * Generates specific error messages for radio payload validation failures.
 * Checks each required field and provides specific feedback.
 *
 * @param payload - The payload object from a radio element
 * @returns Descriptive error message indicating what's missing/invalid
 */
function getRadioValidationError(payload: unknown): string {
  if (typeof payload !== "object" || payload === null) {
    return "Radio element missing required 'payload' field";
  }

  const p = payload as Record<string, unknown>;

  if (typeof p.audioUrl !== "string") {
    return "Radio element missing required 'audioUrl' field";
  }

  if (!Array.isArray(p.transcription)) {
    return "Radio element missing required 'transcription' array";
  }

  // Validate each segment and report first failure
  for (let i = 0; i < p.transcription.length; i++) {
    const segment = p.transcription[i] as Record<string, unknown>;
    if (typeof segment !== "object" || segment === null) {
      return `Transcription segment ${i} is not an object`;
    }
    if (typeof segment.text !== "string") {
      return `Transcription segment ${i} missing required 'text' field`;
    }
    if (typeof segment.startTime !== "number") {
      return `Transcription segment ${i} missing required 'startTime' field`;
    }
    if (typeof segment.endTime !== "number") {
      return `Transcription segment ${i} missing required 'endTime' field`;
    }
  }

  // Fallback - shouldn't reach here if called from isValidUIElement
  return "Radio element payload validation failed";
}

// ============================================================================
// TYPE GUARDS
// These functions provide runtime type checking for parsed JSON
// ============================================================================

/**
 * Type guard to validate that a parsed object is a valid UIElement.
 * Checks the type field and delegates to type-specific validators.
 *
 * @param obj - Unknown parsed JSON object
 * @returns true if obj is a valid UIElement
 */
function isValidUIElement(obj: unknown): obj is UIElement {
  if (typeof obj !== "object" || obj === null) {
    return false;
  }

  const element = obj as Record<string, unknown>;

  // Dispatch to type-specific validator based on type field
  if (element.type === "radio") {
    return isValidRadioPayload(element.payload);
  }

  // Unknown type - return false (can be extended for new types)
  return false;
}

/**
 * Validates the payload structure for a radio UI element.
 * Checks all required fields are present and have correct types.
 *
 * Required fields:
 * - audioUrl: string (URL to audio file)
 * - transcription: array of valid TranscriptionSegments
 */
function isValidRadioPayload(payload: unknown): payload is RadioUIElementPayload {
  if (typeof payload !== "object" || payload === null) {
    return false;
  }

  const p = payload as Record<string, unknown>;

  // audioUrl is required and must be a string
  if (typeof p.audioUrl !== "string") {
    return false;
  }

  // transcription is required and must be an array
  if (!Array.isArray(p.transcription)) {
    return false;
  }

  // Validate each transcription segment
  for (const segment of p.transcription) {
    if (!isValidTranscriptionSegment(segment)) {
      return false;
    }
  }

  return true;
}

/**
 * Validates a single transcription segment.
 *
 * Required fields:
 * - speaker: string | null
 * - text: string
 * - startTime: number
 * - endTime: number
 */
function isValidTranscriptionSegment(segment: unknown): segment is TranscriptionSegment {
  if (typeof segment !== "object" || segment === null) {
    return false;
  }

  const s = segment as Record<string, unknown>;

  return (
    (typeof s.speaker === "string" || s.speaker === null) &&
    typeof s.text === "string" &&
    typeof s.startTime === "number" &&
    typeof s.endTime === "number"
  );
}

// ============================================================================
// UTILITY FUNCTIONS
// Helper functions for working with parsed content
// ============================================================================

/**
 * Checks if parsed content contains any radio UI elements.
 * Useful for conditional rendering (e.g., show audio player section).
 *
 * @param parsed - The parsed content to check
 * @returns true if at least one radio element is present
 */
export function hasRadioElement(parsed: ParsedContent): boolean {
  return parsed.uiElements.some((el) => el.type === "radio");
}

/**
 * Extracts all radio UI elements from parsed content.
 * Filters and narrows the type for type-safe iteration.
 *
 * @param parsed - The parsed content to extract from
 * @returns Array of RadioUIElement (may be empty)
 */
export function getRadioElements(parsed: ParsedContent): RadioUIElement[] {
  return parsed.uiElements.filter((el): el is RadioUIElement => el.type === "radio");
}
