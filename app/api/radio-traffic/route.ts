import { NextRequest, NextResponse } from "next/server";

export interface RadioTrafficRequest {
  incidentId: string;
  message?: string;
}

export interface TranscriptionSegment {
  speaker: string | null;
  text: string;
  startTime: number;
  endTime: number;
}

export interface RadioTrafficResponse {
  type: "radio";
  payload: {
    audioUrl: string;
    transcription: TranscriptionSegment[];
    metadata: {
      incidentId: string;
      duration: number;
      recordedAt: string;
    };
  };
  textResponse: string;
}

export interface RadioTrafficErrorResponse {
  error: string;
  code: string;
}

/**
 * Generates mock radio traffic data for a given incident ID.
 * In production, this would fetch from a real database/service.
 */
function generateMockRadioTraffic(incidentId: string): RadioTrafficResponse {
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
      speaker: null,
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

  const duration = transcription[transcription.length - 1].endTime;

  return {
    type: "radio",
    payload: {
      audioUrl: `/sample-15s.mp3`,
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

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as RadioTrafficRequest;

    if (!body.incidentId) {
      return NextResponse.json<RadioTrafficErrorResponse>(
        { error: "Missing incident ID", code: "MISSING_INCIDENT_ID" },
        { status: 400 }
      );
    }

    // Simulate network latency
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Simulate error for specific incident IDs (for testing error handling)
    if (body.incidentId === "999") {
      return NextResponse.json<RadioTrafficErrorResponse>(
        { error: "Incident not found", code: "INCIDENT_NOT_FOUND" },
        { status: 404 }
      );
    }

    if (body.incidentId === "error") {
      return NextResponse.json<RadioTrafficErrorResponse>(
        { error: "Internal server error", code: "INTERNAL_ERROR" },
        { status: 500 }
      );
    }

    const response = generateMockRadioTraffic(body.incidentId);
    return NextResponse.json(response);
  } catch {
    return NextResponse.json<RadioTrafficErrorResponse>(
      { error: "Invalid request body", code: "INVALID_REQUEST" },
      { status: 400 }
    );
  }
}
