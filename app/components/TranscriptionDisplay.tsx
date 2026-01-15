"use client";

import type { TranscriptionSegment } from "../types/ui-elements";

interface TranscriptionDisplayProps {
  segments: TranscriptionSegment[];
}

/**
 * Color palette for speaker differentiation.
 * Each speaker gets a consistent color based on their name.
 */
const SPEAKER_COLORS = [
  { bg: "bg-blue-100 dark:bg-blue-900/50", text: "text-blue-700 dark:text-blue-300", border: "border-blue-200 dark:border-blue-800" },
  { bg: "bg-emerald-100 dark:bg-emerald-900/50", text: "text-emerald-700 dark:text-emerald-300", border: "border-emerald-200 dark:border-emerald-800" },
  { bg: "bg-purple-100 dark:bg-purple-900/50", text: "text-purple-700 dark:text-purple-300", border: "border-purple-200 dark:border-purple-800" },
  { bg: "bg-amber-100 dark:bg-amber-900/50", text: "text-amber-700 dark:text-amber-300", border: "border-amber-200 dark:border-amber-800" },
  { bg: "bg-rose-100 dark:bg-rose-900/50", text: "text-rose-700 dark:text-rose-300", border: "border-rose-200 dark:border-rose-800" },
  { bg: "bg-cyan-100 dark:bg-cyan-900/50", text: "text-cyan-700 dark:text-cyan-300", border: "border-cyan-200 dark:border-cyan-800" },
];

/**
 * Unknown speaker styling - neutral gray.
 */
const UNKNOWN_SPEAKER_STYLE = {
  bg: "bg-zinc-100 dark:bg-zinc-800",
  text: "text-zinc-600 dark:text-zinc-400",
  border: "border-zinc-200 dark:border-zinc-700",
};

/**
 * Gets a consistent color for a speaker based on their name.
 * Same speaker will always get the same color within a session.
 */
function getSpeakerColor(speaker: string | null, speakerMap: Map<string, number>): typeof SPEAKER_COLORS[number] {
  if (!speaker) {
    return UNKNOWN_SPEAKER_STYLE;
  }

  let colorIndex = speakerMap.get(speaker);
  if (colorIndex === undefined) {
    colorIndex = speakerMap.size % SPEAKER_COLORS.length;
    speakerMap.set(speaker, colorIndex);
  }

  return SPEAKER_COLORS[colorIndex];
}

/**
 * Formats time in seconds to mm:ss format.
 */
function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) {
    return "0:00";
  }
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Displays transcription segments with speaker callsigns.
 * Each speaker is color-coded for easy identification.
 */
export function TranscriptionDisplay({ segments }: TranscriptionDisplayProps) {
  // Build speaker color map to ensure consistent colors
  const speakerMap = new Map<string, number>();

  // Pre-populate map with all speakers in order of appearance
  segments.forEach((segment) => {
    if (segment.speaker && !speakerMap.has(segment.speaker)) {
      speakerMap.set(segment.speaker, speakerMap.size % SPEAKER_COLORS.length);
    }
  });

  if (segments.length === 0) {
    return (
      <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
        <p className="text-sm text-zinc-500 dark:text-zinc-400 italic">
          No transcription available
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <h3 className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
        Transcription
      </h3>
      <div
        className="space-y-2 rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800/50"
        role="list"
        aria-label="Transcription segments"
      >
        {segments.map((segment, index) => {
          const speakerName = segment.speaker ?? "Unknown";
          const colors = getSpeakerColor(segment.speaker, speakerMap);

          return (
            <div
              key={`${segment.startTime}-${index}`}
              className={`rounded-md border p-2 ${colors.border} ${colors.bg}`}
              role="listitem"
            >
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded ${colors.text}`}
                  aria-label={`Speaker: ${speakerName}`}
                >
                  {speakerName}
                </span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  {formatTime(segment.startTime)} - {formatTime(segment.endTime)}
                </span>
              </div>
              <p className="text-sm text-zinc-800 dark:text-zinc-200">
                {segment.text}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
