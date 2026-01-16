/**
 * format.ts - Shared Formatting Utilities
 *
 * This module contains formatting functions used across multiple components.
 * Centralizing these utilities prevents code duplication and ensures
 * consistent behavior throughout the application.
 */

/**
 * Formats time in seconds to mm:ss display format.
 * Handles edge cases like NaN, Infinity, and negative values.
 *
 * @param seconds - Time in seconds
 * @returns Formatted time string (e.g., "1:23" or "0:05")
 *
 * @example
 * formatTime(65) // "1:05"
 * formatTime(0) // "0:00"
 * formatTime(NaN) // "0:00"
 * formatTime(-5) // "0:00"
 */
export function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) {
    return "0:00";
  }
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Generates a unique ID for messages.
 * Uses base-36 encoding of random number for short, URL-safe IDs.
 *
 * @returns A 7-character random ID string
 *
 * @example
 * generateId() // "k7h2n3f"
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}
