"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { TranscriptionSegment } from "../types/ui-elements";

interface TranscriptionDisplayProps {
  segments: TranscriptionSegment[];
  currentTime?: number;
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
 * Determines if a segment is currently active based on playback time.
 */
function isSegmentActive(segment: TranscriptionSegment, currentTime: number | undefined): boolean {
  if (currentTime === undefined) return false;
  return currentTime >= segment.startTime && currentTime < segment.endTime;
}

/** Time in ms to wait after user stops scrolling before resuming auto-scroll */
const AUTO_SCROLL_RESUME_DELAY = 3000;

/**
 * Displays transcription segments with speaker callsigns.
 * Each speaker is color-coded for easy identification.
 * Active segment is highlighted during playback.
 * Auto-scrolls to keep the active segment visible.
 * Pauses auto-scroll when user manually scrolls.
 */
export function TranscriptionDisplay({ segments, currentTime }: TranscriptionDisplayProps) {
  // Refs for segment elements to enable auto-scroll
  const segmentRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll pause state
  const [isAutoScrollPaused, setIsAutoScrollPaused] = useState(false);
  const isAutoScrolling = useRef(false);
  const resumeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Build speaker color map to ensure consistent colors
  const speakerMap = new Map<string, number>();

  // Pre-populate map with all speakers in order of appearance
  segments.forEach((segment) => {
    if (segment.speaker && !speakerMap.has(segment.speaker)) {
      speakerMap.set(segment.speaker, speakerMap.size % SPEAKER_COLORS.length);
    }
  });

  // Find the currently active segment index
  const activeSegmentIndex = segments.findIndex((segment) =>
    isSegmentActive(segment, currentTime)
  );

  // Handle manual scroll detection
  const handleScroll = useCallback(() => {
    // If this scroll was triggered by auto-scroll, ignore it
    if (isAutoScrolling.current) {
      return;
    }

    // User is manually scrolling - pause auto-scroll
    setIsAutoScrollPaused(true);

    // Clear any existing resume timeout
    if (resumeTimeoutRef.current) {
      clearTimeout(resumeTimeoutRef.current);
    }

    // Set a timeout to resume auto-scroll after user stops scrolling
    resumeTimeoutRef.current = setTimeout(() => {
      setIsAutoScrollPaused(false);
    }, AUTO_SCROLL_RESUME_DELAY);
  }, []);

  // Attach scroll event listener to container
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      container.removeEventListener("scroll", handleScroll);
      // Clean up timeout on unmount
      if (resumeTimeoutRef.current) {
        clearTimeout(resumeTimeoutRef.current);
      }
    };
  }, [handleScroll]);

  // Handler to manually resume auto-scroll
  const handleResumeAutoScroll = useCallback(() => {
    setIsAutoScrollPaused(false);
    // Clear any pending resume timeout
    if (resumeTimeoutRef.current) {
      clearTimeout(resumeTimeoutRef.current);
      resumeTimeoutRef.current = null;
    }
  }, []);

  // Auto-scroll to active segment when it changes (if not paused)
  useEffect(() => {
    if (activeSegmentIndex === -1 || isAutoScrollPaused) return;

    const activeElement = segmentRefs.current.get(activeSegmentIndex);
    if (!activeElement || !containerRef.current) return;

    // Mark that we're auto-scrolling to avoid triggering the scroll handler
    isAutoScrolling.current = true;

    // Scroll the active segment into view with smooth animation
    activeElement.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });

    // Reset the auto-scrolling flag after animation completes
    // Using a timeout as scrollIntoView doesn't provide a callback
    setTimeout(() => {
      isAutoScrolling.current = false;
    }, 500);
  }, [activeSegmentIndex, isAutoScrollPaused]);

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
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Transcription
        </h3>
        {isAutoScrollPaused && currentTime !== undefined && (
          <button
            type="button"
            onClick={handleResumeAutoScroll}
            className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1 transition-colors"
            aria-label="Resume auto-scroll"
          >
            <svg
              className="w-3 h-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
            Resume auto-scroll
          </button>
        )}
      </div>
      <div
        ref={containerRef}
        className="space-y-2 rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800/50 max-h-64 overflow-y-auto"
        role="list"
        aria-label="Transcription segments"
      >
        {segments.map((segment, index) => {
          const speakerName = segment.speaker ?? "Unknown";
          const colors = getSpeakerColor(segment.speaker, speakerMap);
          const isActive = isSegmentActive(segment, currentTime);

          return (
            <div
              key={`${segment.startTime}-${index}`}
              ref={(el) => {
                if (el) {
                  segmentRefs.current.set(index, el);
                } else {
                  segmentRefs.current.delete(index);
                }
              }}
              className={`rounded-md border p-2 transition-all duration-200 ${colors.border} ${colors.bg} ${
                isActive
                  ? "ring-2 ring-blue-500 ring-offset-1 dark:ring-offset-zinc-800 scale-[1.01]"
                  : ""
              }`}
              role="listitem"
              aria-current={isActive ? "true" : undefined}
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
                {isActive && (
                  <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full animate-pulse">
                    Now Playing
                  </span>
                )}
              </div>
              <p className={`text-sm ${isActive ? "font-medium text-zinc-900 dark:text-zinc-100" : "text-zinc-800 dark:text-zinc-200"}`}>
                {segment.text}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
