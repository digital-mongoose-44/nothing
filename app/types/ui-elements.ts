/**
 * Types for UI elements that can be embedded in LLM responses.
 * UI elements are detected by a special JSON structure in the response.
 */

export interface TranscriptionSegment {
  speaker: string | null;
  text: string;
  startTime: number;
  endTime: number;
}

export interface RadioUIElementPayload {
  audioUrl: string;
  transcription: TranscriptionSegment[];
  metadata?: {
    incidentId?: string;
    duration?: number;
    recordedAt?: string;
  };
}

export interface RadioUIElement {
  type: "radio";
  payload: RadioUIElementPayload;
}

export type UIElement = RadioUIElement;

export interface ParseError {
  message: string;
  rawContent: string;
}

export interface ParsedContent {
  text: string;
  uiElements: UIElement[];
  errors: ParseError[];
}

/**
 * Marker used to identify UI element blocks in LLM responses.
 * Format: ```ui-element\n{ "type": "radio", "payload": {...} }\n```
 */
const UI_ELEMENT_PATTERN = /```ui-element\s*([\s\S]*?)```/g;

/**
 * Parses an LLM response and extracts any embedded UI elements.
 * UI elements are expected to be in fenced code blocks with the 'ui-element' language identifier.
 *
 * @param content - The raw LLM response content
 * @returns ParsedContent with text and extracted UI elements
 */
export function parseUIElements(content: string): ParsedContent {
  const uiElements: UIElement[] = [];
  const errors: ParseError[] = [];
  let text = content;

  // Find all UI element blocks
  const matches = content.matchAll(UI_ELEMENT_PATTERN);

  for (const match of matches) {
    const jsonString = match[1].trim();

    try {
      const parsed = JSON.parse(jsonString);

      if (isValidUIElement(parsed)) {
        uiElements.push(parsed);
        // Remove the UI element block from the text content
        text = text.replace(match[0], "").trim();
      } else {
        // Track validation error
        const errorMessage = getValidationErrorMessage(parsed);
        errors.push({
          message: errorMessage,
          rawContent: jsonString.slice(0, 100) + (jsonString.length > 100 ? "..." : ""),
        });
        console.error("Invalid UI element structure:", parsed);
        // Still remove the malformed block from text
        text = text.replace(match[0], "").trim();
      }
    } catch (error) {
      // Track JSON parse error
      const errorMessage = error instanceof Error ? error.message : "Invalid JSON";
      errors.push({
        message: `Failed to parse: ${errorMessage}`,
        rawContent: jsonString.slice(0, 100) + (jsonString.length > 100 ? "..." : ""),
      });
      console.error("Failed to parse UI element JSON:", error);
      // Still remove the malformed block from text
      text = text.replace(match[0], "").trim();
    }
  }

  return { text, uiElements, errors };
}

/**
 * Generates a human-readable error message for invalid UI element structures.
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

  return `Unknown UI element type: ${element.type}`;
}

/**
 * Generates specific error messages for radio payload validation failures.
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

  // Check individual segments
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

  return "Radio element payload validation failed";
}

/**
 * Type guard to validate that a parsed object is a valid UIElement.
 */
function isValidUIElement(obj: unknown): obj is UIElement {
  if (typeof obj !== "object" || obj === null) {
    return false;
  }

  const element = obj as Record<string, unknown>;

  if (element.type === "radio") {
    return isValidRadioPayload(element.payload);
  }

  return false;
}

/**
 * Validates the payload structure for a radio UI element.
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

/**
 * Checks if parsed content contains any radio UI elements.
 */
export function hasRadioElement(parsed: ParsedContent): boolean {
  return parsed.uiElements.some((el) => el.type === "radio");
}

/**
 * Extracts all radio UI elements from parsed content.
 */
export function getRadioElements(parsed: ParsedContent): RadioUIElement[] {
  return parsed.uiElements.filter((el): el is RadioUIElement => el.type === "radio");
}
