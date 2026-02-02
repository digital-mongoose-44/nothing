/**
 * radio-traffic/route.ts - Radio Traffic API Endpoint
 *
 * This Next.js API route handles requests for radio traffic recordings
 * using the DTO/DAL implementation for authenticated database access.
 *
 * Endpoint: POST /api/radio-traffic
 *
 * Request body:
 * {
 *   "incidentId": "123"
 * }
 *
 * Success response (200):
 * {
 *   "type": "radio",
 *   "payload": { "audioUrl": "...", "transcription": [...], "metadata": {...} },
 *   "textResponse": "Here is the radio traffic for incident 123:"
 * }
 *
 * Error responses:
 * - 401: Unauthorized (no valid session)
 * - 400: Missing incident ID or invalid request
 * - 404: Incident not found
 * - 500: Server error
 */
import { NextRequest, NextResponse } from "next/server";
import type { TranscriptionSegment } from "../../types/ui-elements";
import { RadioTrafficDAL } from "@/lib/dal/radio-traffic/radio-traffic.dal";

// Re-export for consumers of this API module
export type { TranscriptionSegment };

// ============================================================================
// REQUEST/RESPONSE TYPES
// ============================================================================

/**
 * Expected request body for the radio traffic endpoint.
 */
export interface RadioTrafficRequest {
  /** The incident ID to fetch radio traffic for */
  incidentId: string;
  /** Optional message (reserved for future use) */
  message?: string;
}

/**
 * Successful response containing radio traffic data.
 * The structure is designed to be wrapped in a ui-element block.
 */
export interface RadioTrafficResponse {
  /** Element type for UI rendering */
  type: "radio";
  /** Audio and transcription data */
  payload: {
    /** URL to the audio file */
    audioUrl: string;
    /** Array of transcribed segments */
    transcription: TranscriptionSegment[];
    /** Recording metadata */
    metadata: {
      /** Associated incident ID */
      incidentId: string;
      /** Total duration in seconds */
      duration: number;
      /** ISO timestamp of recording */
      recordedAt: string;
    };
  };
  /** Natural language response text to display above the player */
  textResponse: string;
}

/**
 * Error response structure for failed requests.
 */
export interface RadioTrafficErrorResponse {
  /** Human-readable error message */
  error: string;
  /** Machine-readable error code for client handling */
  code: string;
}

// ============================================================================
// API ROUTE HANDLER
// ============================================================================

/**
 * POST /api/radio-traffic
 *
 * Fetches radio traffic data for an incident using the DAL.
 * Returns the most recent radio traffic record formatted for the chat UI.
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate and get DAL instance
    let dal: RadioTrafficDAL;
    try {
      dal = await RadioTrafficDAL.create();
    } catch {
      return NextResponse.json<RadioTrafficErrorResponse>(
        { error: "Unauthorized", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    // Parse request body
    const body = (await request.json()) as RadioTrafficRequest;

    // Validate required field
    if (!body.incidentId) {
      return NextResponse.json<RadioTrafficErrorResponse>(
        { error: "Missing incident ID", code: "MISSING_INCIDENT_ID" },
        { status: 400 }
      );
    }

    // Fetch radio traffic from the database via DAL
    const result = await dal.listByIncident(body.incidentId, { pageSize: 1 });

    if (result.items.length === 0) {
      return NextResponse.json<RadioTrafficErrorResponse>(
        { error: "No radio traffic found for this incident", code: "INCIDENT_NOT_FOUND" },
        { status: 404 }
      );
    }

    const item = result.items[0];
    const transcription = Array.isArray(item.transcription)
      ? (item.transcription as Array<{ start: number; end: number; text: string; speaker?: string | null }>)
      : [];

    const response: RadioTrafficResponse = {
      type: "radio",
      payload: {
        audioUrl: item.audioUrl,
        transcription: transcription.map((seg) => ({
          speaker: seg.speaker ?? null,
          text: seg.text,
          startTime: seg.start,
          endTime: seg.end,
        })),
        metadata: {
          incidentId: item.incidentId,
          duration: item.duration,
          recordedAt: item.createdAt.toISOString(),
        },
      },
      textResponse: `Here is the radio traffic for incident ${body.incidentId}:`,
    };

    return NextResponse.json(response);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";

    if (message.includes("not found") || message.includes("Not found")) {
      return NextResponse.json<RadioTrafficErrorResponse>(
        { error: message, code: "INCIDENT_NOT_FOUND" },
        { status: 404 }
      );
    }

    if (message.includes("Not authorized")) {
      return NextResponse.json<RadioTrafficErrorResponse>(
        { error: message, code: "UNAUTHORIZED" },
        { status: 403 }
      );
    }

    return NextResponse.json<RadioTrafficErrorResponse>(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
