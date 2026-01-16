/**
 * radio-traffic/route.ts - Radio Traffic API Endpoint
 *
 * This Next.js API route handles requests for radio traffic recordings.
 * Currently returns mock data for development; in production, this would
 * connect to a real database or external service.
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
 * - 400: Missing incident ID or invalid request
 * - 404: Incident not found (test with incident 999)
 * - 500: Server error (test with incident "error")
 */
import { NextRequest, NextResponse } from "next/server";
import type { TranscriptionSegment } from "../../types/ui-elements";

// Re-export for consumers of this API module
export type { TranscriptionSegment };

// ============================================================================
// CONFIGURATION
// ============================================================================

/** Default audio URL from environment variable, with fallback */
const DEFAULT_AUDIO_URL = process.env.NEXT_PUBLIC_DEFAULT_AUDIO_URL || "/sample-15s.mp3";

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
// MOCK DATA GENERATION
// ============================================================================

/**
 * Generates mock radio traffic data for a given incident ID.
 *
 * In production, this would:
 * - Query a database for the incident
 * - Retrieve associated audio recordings
 * - Return real transcription data
 *
 * Currently returns static mock data with the incident ID interpolated.
 *
 * @param incidentId - The incident ID to generate data for
 * @returns Complete RadioTrafficResponse with mock data
 */
function generateMockRadioTraffic(incidentId: string): RadioTrafficResponse {
  // Mock transcription data simulating a structure fire response
  // Includes multiple speakers and one unknown speaker segment
  const transcription: TranscriptionSegment[] = [
    {
      speaker: "Dispatch",
      text: `Unit 42, respond to incident ${incidentId}, structure fire reported.`,
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
      speaker: null, // Unknown speaker - tests null handling
      text: "Requesting additional units.",
      startTime: 16.0,
      endTime: 18.0,
    },
    {
      speaker: "Dispatch",
      text: "Copy Unit 42, dispatching Engine 7 and Ladder 3 to your location.",
      startTime: 19.5,
      endTime: 24.0,
    },
    {
      speaker: "Engine 7",
      text: "Engine 7 responding, ETA five minutes.",
      startTime: 25.0,
      endTime: 27.5,
    },
  ];

  // Calculate duration from last segment's end time
  const duration = transcription[transcription.length - 1].endTime;

  return {
    type: "radio",
    payload: {
      // Audio URL from environment variable (defaults to local sample)
      audioUrl: DEFAULT_AUDIO_URL,
      transcription,
      metadata: {
        incidentId,
        duration,
        recordedAt: new Date().toISOString(),
      },
    },
    textResponse: `Here is the radio traffic for incident ${incidentId}:`,
  };
}

// ============================================================================
// API ROUTE HANDLER
// ============================================================================

/**
 * POST /api/radio-traffic
 *
 * Handles requests for radio traffic data by incident ID.
 *
 * Special test cases:
 * - incidentId "999" → Returns 404 (not found)
 * - incidentId "error" → Returns 500 (server error)
 * - Any other ID → Returns mock radio traffic data
 *
 * Includes simulated 800ms latency to demonstrate loading states.
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = (await request.json()) as RadioTrafficRequest;

    // Validate required field
    if (!body.incidentId) {
      return NextResponse.json<RadioTrafficErrorResponse>(
        { error: "Missing incident ID", code: "MISSING_INCIDENT_ID" },
        { status: 400 }
      );
    }

    // ─── Simulated network latency ───
    // Allows testing of loading states (skeleton display)
    await new Promise((resolve) => setTimeout(resolve, 800));

    // ─── Test error scenarios ───
    // These special IDs trigger error responses for testing

    // Test: 404 Not Found
    if (body.incidentId === "999") {
      return NextResponse.json<RadioTrafficErrorResponse>(
        { error: "Incident not found", code: "INCIDENT_NOT_FOUND" },
        { status: 404 }
      );
    }

    // Test: 500 Internal Server Error
    if (body.incidentId === "error") {
      return NextResponse.json<RadioTrafficErrorResponse>(
        { error: "Internal server error", code: "INTERNAL_ERROR" },
        { status: 500 }
      );
    }

    // ─── Success case ───
    // Generate and return mock radio traffic data
    const response = generateMockRadioTraffic(body.incidentId);
    return NextResponse.json(response);

  } catch {
    // JSON parsing failed or other request error
    return NextResponse.json<RadioTrafficErrorResponse>(
      { error: "Invalid request body", code: "INVALID_REQUEST" },
      { status: 400 }
    );
  }
}
