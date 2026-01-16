/**
 * ui-elements.test.ts - Unit Tests for UI Element Parsing
 *
 * Tests the parseUIElements function and related utilities for:
 * - Valid UI element extraction
 * - JSON parsing error handling
 * - Validation error messages
 * - Edge cases and malformed data
 */
import { describe, it, expect } from "vitest";
import { parseUIElements, hasRadioElement, getRadioElements } from "./ui-elements";

describe("parseUIElements", () => {
  describe("valid UI elements", () => {
    it("should parse a valid radio UI element", () => {
      const content = `Here is the radio traffic:

\`\`\`ui-element
{
  "type": "radio",
  "payload": {
    "audioUrl": "https://example.com/audio.mp3",
    "transcription": [
      { "speaker": "Dispatch", "text": "Unit 42, respond.", "startTime": 0, "endTime": 3 }
    ]
  }
}
\`\`\``;

      const result = parseUIElements(content);

      expect(result.uiElements).toHaveLength(1);
      expect(result.errors).toHaveLength(0);
      expect(result.text).toBe("Here is the radio traffic:");
      expect(result.uiElements[0].type).toBe("radio");
      expect(result.uiElements[0].payload.audioUrl).toBe("https://example.com/audio.mp3");
      expect(result.uiElements[0].payload.transcription).toHaveLength(1);
    });

    it("should parse multiple UI elements", () => {
      const content = `First element:

\`\`\`ui-element
{
  "type": "radio",
  "payload": {
    "audioUrl": "/audio1.mp3",
    "transcription": [
      { "speaker": "A", "text": "Hello", "startTime": 0, "endTime": 1 }
    ]
  }
}
\`\`\`

Second element:

\`\`\`ui-element
{
  "type": "radio",
  "payload": {
    "audioUrl": "/audio2.mp3",
    "transcription": [
      { "speaker": "B", "text": "World", "startTime": 0, "endTime": 1 }
    ]
  }
}
\`\`\``;

      const result = parseUIElements(content);

      expect(result.uiElements).toHaveLength(2);
      expect(result.errors).toHaveLength(0);
      expect(result.uiElements[0].payload.audioUrl).toBe("/audio1.mp3");
      expect(result.uiElements[1].payload.audioUrl).toBe("/audio2.mp3");
    });

    it("should handle null speaker in transcription", () => {
      const content = `\`\`\`ui-element
{
  "type": "radio",
  "payload": {
    "audioUrl": "/audio.mp3",
    "transcription": [
      { "speaker": null, "text": "Unknown speaker", "startTime": 0, "endTime": 1 }
    ]
  }
}
\`\`\``;

      const result = parseUIElements(content);

      expect(result.uiElements).toHaveLength(1);
      expect(result.errors).toHaveLength(0);
      expect(result.uiElements[0].payload.transcription[0].speaker).toBeNull();
    });

    it("should handle optional metadata", () => {
      const content = `\`\`\`ui-element
{
  "type": "radio",
  "payload": {
    "audioUrl": "/audio.mp3",
    "transcription": [
      { "speaker": "A", "text": "Test", "startTime": 0, "endTime": 1 }
    ],
    "metadata": {
      "incidentId": "123",
      "duration": 60,
      "recordedAt": "2024-01-01T00:00:00Z"
    }
  }
}
\`\`\``;

      const result = parseUIElements(content);

      expect(result.uiElements).toHaveLength(1);
      expect(result.uiElements[0].payload.metadata?.incidentId).toBe("123");
      expect(result.uiElements[0].payload.metadata?.duration).toBe(60);
    });
  });

  describe("JSON parsing errors", () => {
    it("should handle invalid JSON syntax", () => {
      const content = `\`\`\`ui-element
{ "type": "radio", "payload": { invalid json here }
\`\`\``;

      const result = parseUIElements(content);

      expect(result.uiElements).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain("Failed to parse");
    });

    it("should handle truncated JSON", () => {
      const content = `\`\`\`ui-element
{ "type": "radio", "payload": {
\`\`\``;

      const result = parseUIElements(content);

      expect(result.uiElements).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
    });
  });

  describe("validation errors", () => {
    it("should error on missing type field", () => {
      const content = `\`\`\`ui-element
{
  "payload": { "audioUrl": "/test.mp3", "transcription": [] }
}
\`\`\``;

      const result = parseUIElements(content);

      expect(result.uiElements).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain("missing required 'type' field");
    });

    it("should error on unknown type", () => {
      const content = `\`\`\`ui-element
{
  "type": "unknown-widget",
  "payload": { "data": "test" }
}
\`\`\``;

      const result = parseUIElements(content);

      expect(result.uiElements).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain("Unknown UI element type");
    });

    it("should error on missing audioUrl", () => {
      const content = `\`\`\`ui-element
{
  "type": "radio",
  "payload": {
    "transcription": [
      { "speaker": "A", "text": "Test", "startTime": 0, "endTime": 1 }
    ]
  }
}
\`\`\``;

      const result = parseUIElements(content);

      expect(result.uiElements).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain("missing required 'audioUrl' field");
    });

    it("should error on missing transcription array", () => {
      const content = `\`\`\`ui-element
{
  "type": "radio",
  "payload": {
    "audioUrl": "/test.mp3"
  }
}
\`\`\``;

      const result = parseUIElements(content);

      expect(result.uiElements).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain("missing required 'transcription' array");
    });

    it("should error on invalid transcription segment", () => {
      const content = `\`\`\`ui-element
{
  "type": "radio",
  "payload": {
    "audioUrl": "/test.mp3",
    "transcription": [
      { "speaker": "A", "text": "Valid", "startTime": 0, "endTime": 1 },
      { "invalid": "segment" }
    ]
  }
}
\`\`\``;

      const result = parseUIElements(content);

      expect(result.uiElements).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain("segment 1");
    });

    it("should error on missing startTime in segment", () => {
      const content = `\`\`\`ui-element
{
  "type": "radio",
  "payload": {
    "audioUrl": "/test.mp3",
    "transcription": [
      { "speaker": "A", "text": "Test", "endTime": 1 }
    ]
  }
}
\`\`\``;

      const result = parseUIElements(content);

      expect(result.uiElements).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain("startTime");
    });
  });

  describe("text extraction", () => {
    it("should remove UI element blocks from text", () => {
      const content = `Before text

\`\`\`ui-element
{"type": "radio", "payload": {"audioUrl": "/a.mp3", "transcription": []}}
\`\`\`

After text`;

      const result = parseUIElements(content);

      // The block is removed, leaving the surrounding text (with preserved whitespace)
      expect(result.text).toContain("Before text");
      expect(result.text).toContain("After text");
      expect(result.text).not.toContain("ui-element");
      expect(result.text).not.toContain("audioUrl");
    });

    it("should handle content with no UI elements", () => {
      const content = "This is just plain text with no UI elements.";

      const result = parseUIElements(content);

      expect(result.text).toBe(content);
      expect(result.uiElements).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
    });

    it("should remove malformed blocks from text", () => {
      const content = `Text before

\`\`\`ui-element
{ invalid json }
\`\`\`

Text after`;

      const result = parseUIElements(content);

      // Malformed blocks are still removed from text display
      expect(result.text).toContain("Text before");
      expect(result.text).toContain("Text after");
      expect(result.text).not.toContain("ui-element");
      expect(result.text).not.toContain("invalid json");
      expect(result.errors).toHaveLength(1);
    });
  });

  describe("edge cases", () => {
    it("should handle empty content", () => {
      const result = parseUIElements("");

      expect(result.text).toBe("");
      expect(result.uiElements).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
    });

    it("should handle whitespace-only content", () => {
      const result = parseUIElements("   \n\n   ");

      expect(result.text).toBe("   \n\n   ");
      expect(result.uiElements).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
    });

    it("should handle empty UI element block", () => {
      const content = `\`\`\`ui-element
\`\`\``;

      const result = parseUIElements(content);

      expect(result.errors).toHaveLength(1);
      expect(result.uiElements).toHaveLength(0);
    });

    it("should truncate raw content in error to 100 chars", () => {
      const longJson = `{ "type": "radio", "payload": { "audioUrl": "${"x".repeat(150)}" }`;
      const content = `\`\`\`ui-element
${longJson}
\`\`\``;

      const result = parseUIElements(content);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].rawContent.length).toBeLessThanOrEqual(103); // 100 + "..."
      expect(result.errors[0].rawContent).toContain("...");
    });
  });
});

describe("hasRadioElement", () => {
  it("should return true when radio elements exist", () => {
    const parsed = parseUIElements(`\`\`\`ui-element
{"type": "radio", "payload": {"audioUrl": "/a.mp3", "transcription": []}}
\`\`\``);

    expect(hasRadioElement(parsed)).toBe(true);
  });

  it("should return false when no radio elements exist", () => {
    const parsed = parseUIElements("Just plain text");

    expect(hasRadioElement(parsed)).toBe(false);
  });
});

describe("getRadioElements", () => {
  it("should return all radio elements", () => {
    const content = `\`\`\`ui-element
{"type": "radio", "payload": {"audioUrl": "/a.mp3", "transcription": []}}
\`\`\`

\`\`\`ui-element
{"type": "radio", "payload": {"audioUrl": "/b.mp3", "transcription": []}}
\`\`\``;

    const parsed = parseUIElements(content);
    const radioElements = getRadioElements(parsed);

    expect(radioElements).toHaveLength(2);
    expect(radioElements[0].payload.audioUrl).toBe("/a.mp3");
    expect(radioElements[1].payload.audioUrl).toBe("/b.mp3");
  });

  it("should return empty array when no radio elements exist", () => {
    const parsed = parseUIElements("Just plain text");
    const radioElements = getRadioElements(parsed);

    expect(radioElements).toHaveLength(0);
  });
});
