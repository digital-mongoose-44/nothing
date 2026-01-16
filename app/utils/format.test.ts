/**
 * format.test.ts - Unit Tests for Formatting Utilities
 */
import { describe, it, expect } from "vitest";
import { formatTime, generateId } from "./format";

describe("formatTime", () => {
  it("should format 0 seconds as 0:00", () => {
    expect(formatTime(0)).toBe("0:00");
  });

  it("should format seconds under a minute", () => {
    expect(formatTime(5)).toBe("0:05");
    expect(formatTime(30)).toBe("0:30");
    expect(formatTime(59)).toBe("0:59");
  });

  it("should format seconds over a minute", () => {
    expect(formatTime(60)).toBe("1:00");
    expect(formatTime(65)).toBe("1:05");
    expect(formatTime(90)).toBe("1:30");
    expect(formatTime(125)).toBe("2:05");
  });

  it("should format longer durations", () => {
    expect(formatTime(600)).toBe("10:00");
    expect(formatTime(3661)).toBe("61:01");
  });

  it("should handle fractional seconds by flooring", () => {
    expect(formatTime(5.7)).toBe("0:05");
    expect(formatTime(65.9)).toBe("1:05");
  });

  it("should handle NaN by returning 0:00", () => {
    expect(formatTime(NaN)).toBe("0:00");
  });

  it("should handle Infinity by returning 0:00", () => {
    expect(formatTime(Infinity)).toBe("0:00");
    expect(formatTime(-Infinity)).toBe("0:00");
  });

  it("should handle negative values by returning 0:00", () => {
    expect(formatTime(-5)).toBe("0:00");
    expect(formatTime(-100)).toBe("0:00");
  });
});

describe("generateId", () => {
  it("should generate a 7-character string", () => {
    const id = generateId();
    expect(id).toHaveLength(7);
  });

  it("should generate unique IDs", () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      ids.add(generateId());
    }
    // All 100 should be unique (extremely unlikely to have collisions)
    expect(ids.size).toBe(100);
  });

  it("should only contain alphanumeric characters", () => {
    const id = generateId();
    expect(id).toMatch(/^[a-z0-9]+$/);
  });
});
