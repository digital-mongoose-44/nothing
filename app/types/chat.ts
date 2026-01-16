/**
 * chat.ts - Extended Chat Types
 *
 * This module extends the base message types with radio traffic
 * specific data structures for use with the AI SDK.
 */

import type { RadioUIElementPayload, ParsedContent } from "./ui-elements";

/**
 * Chat message with optional radio traffic data.
 * Extends basic message structure with parsed content.
 */
export interface ChatMessage {
  /** Unique identifier for the message */
  id: string;
  /** Who sent the message */
  role: "user" | "assistant";
  /** Raw message content */
  content: string;
  /** Parsed content with UI elements */
  parsedContent?: ParsedContent;
  /** Radio traffic payload data (extracted from parsedContent for convenience) */
  radioData?: RadioUIElementPayload;
}

/**
 * Represents an error that occurred during chat operations.
 */
export interface ChatError {
  /** Error category for UI treatment */
  type: "not_found" | "server_error" | "network_error" | "parse_error";
  /** Human-readable error message */
  message: string;
  /** The incident ID that was requested (if applicable) */
  incidentId?: string;
}

/**
 * Status of the chat session.
 */
export type ChatStatus = "idle" | "submitted" | "streaming" | "error";
