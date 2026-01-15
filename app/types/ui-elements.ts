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

export interface ParsedContent {
  text: string;
  uiElements: UIElement[];
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
        console.error("Invalid UI element structure:", parsed);
      }
    } catch (error) {
      console.error("Failed to parse UI element JSON:", error);
    }
  }

  return { text, uiElements };
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
