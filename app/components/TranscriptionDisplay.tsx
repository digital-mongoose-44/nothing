/**
 * TranscriptionDisplay.tsx - Transcription Segment Display Component
 *
 * Displays radio traffic transcription with:
 * - Color-coded speakers for easy identification
 * - Real-time segment highlighting synchronized with audio playback
 * - Auto-scroll to keep active segment visible
 * - Manual scroll pause detection with resume button
 *
 * Synchronization Flow:
 * ┌──────────────┐     ┌────────────────────┐     ┌─────────────────┐
 * │ AudioPlayer  │────▶│ TranscriptionDisplay│────▶│ Active Segment  │
 * │ currentTime  │     │ (finds active)      │     │ (highlighted)   │
 * └──────────────┘     └────────────────────┘     └─────────────────┘
 *                              │
 *                              ▼
 *                      ┌────────────────┐
 *                      │ Auto-scroll    │
 *                      │ (if not paused)│
 *                      └────────────────┘
 */
"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import type { TranscriptionSegment } from "../types/ui-elements";
import { formatTime } from "../utils/format";

// ============================================================================
// TYPES
// ============================================================================

interface TranscriptionDisplayProps {
  /** Array of transcription segments to display */
  segments: TranscriptionSegment[];
  /** Current audio playback time in seconds (for highlighting) */
  currentTime?: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Color palette for speaker differentiation.
 * Speakers are assigned colors in order of first appearance.
 * Each color has bg (background), text, and border variants for
 * both light and dark modes.
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
 * Styling for segments where speaker is unknown or null.
 * Uses neutral gray to not draw attention.
 */
const UNKNOWN_SPEAKER_STYLE = {
  bg: "bg-zinc-100 dark:bg-zinc-800",
  text: "text-zinc-600 dark:text-zinc-400",
  border: "border-zinc-200 dark:border-zinc-700",
};

/** Time in ms to wait after user stops scrolling before resuming auto-scroll */
const AUTO_SCROLL_RESUME_DELAY = 3000;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Gets a consistent color for a speaker based on their name.
 * Uses a Map to track which color index is assigned to each speaker.
 * Colors are assigned in order of appearance, cycling through SPEAKER_COLORS.
 *
 * @param speaker - Speaker name (null returns gray style)
 * @param speakerMap - Map tracking speaker → color index assignments
 * @returns Color object with bg, text, and border classes
 */
function getSpeakerColor(speaker: string | null, speakerMap: Map<string, number>): typeof SPEAKER_COLORS[number] {
  if (!speaker) {
    return UNKNOWN_SPEAKER_STYLE;
  }

  let colorIndex = speakerMap.get(speaker);
  if (colorIndex === undefined) {
    // Assign next available color, cycling through palette
    colorIndex = speakerMap.size % SPEAKER_COLORS.length;
    speakerMap.set(speaker, colorIndex);
  }

  return SPEAKER_COLORS[colorIndex];
}

/**
 * Determines if a segment is currently being played.
 * A segment is active when currentTime falls within its time range.
 *
 * @param segment - The transcription segment to check
 * @param currentTime - Current audio playback position in seconds
 * @returns true if segment is currently playing
 */
function isSegmentActive(segment: TranscriptionSegment, currentTime: number | undefined): boolean {
  if (currentTime === undefined) return false;
  return currentTime >= segment.startTime && currentTime < segment.endTime;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * Displays transcription segments with speaker callsigns.
 *
 * Features:
 * - Color-coded speakers for easy visual identification
 * - Active segment highlighted with ring and scale effect
 * - Auto-scroll keeps active segment visible during playback
 * - Detects manual scrolling and pauses auto-scroll
 * - "Resume auto-scroll" button to re-enable
 *
 * State:
 * - isAutoScrollPaused: True when user has manually scrolled
 * - isAutoScrolling: Ref to prevent scroll events during programmatic scroll
 */
export function TranscriptionDisplay({ segments, currentTime }: TranscriptionDisplayProps) {
  // ─── Refs ───
  // Map of segment index → DOM element for scrollIntoView
  const segmentRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  // Container ref for scroll event listening
  const containerRef = useRef<HTMLDivElement>(null);

  // ─── State ───
  // Whether auto-scroll is paused due to manual user scrolling
  const [isAutoScrollPaused, setIsAutoScrollPaused] = useState(false);
  // Flag to distinguish programmatic scrolls from user scrolls
  const isAutoScrolling = useRef(false);
  // Timeout ref for resuming auto-scroll after delay
  const resumeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ─── Speaker Color Assignment ───
  // Build color map with consistent assignments per speaker
  // useMemo prevents recalculation on every render (only recalculates when segments change)
  const speakerMap = useMemo(() => {
    const map = new Map<string, number>();
    // Pre-populate map in appearance order so colors are deterministic
    segments.forEach((segment) => {
      if (segment.speaker && !map.has(segment.speaker)) {
        map.set(segment.speaker, map.size % SPEAKER_COLORS.length);
      }
    });
    return map;
  }, [segments]);

  // ─── Derived State ───
  // Find which segment (if any) is currently being played
  const activeSegmentIndex = segments.findIndex((segment) =>
    isSegmentActive(segment, currentTime)
  );

  // ─────────────────────────────────────────────────────────────────────────
  // EVENT HANDLERS
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Handles scroll events on the transcription container.
   * Detects manual user scrolling and pauses auto-scroll.
   *
   * Strategy:
   * 1. Ignore scrolls triggered by our own scrollIntoView calls
   * 2. Pause auto-scroll when user manually scrolls
   * 3. Set timeout to auto-resume after 3 seconds of no scrolling
   */
  const handleScroll = useCallback(() => {
    // Skip if this is a programmatic scroll from auto-scroll
    if (isAutoScrolling.current) {
      return;
    }

    // User is manually scrolling - pause auto-scroll
    setIsAutoScrollPaused(true);

    // Clear any existing resume timeout
    if (resumeTimeoutRef.current) {
      clearTimeout(resumeTimeoutRef.current);
    }

    // Schedule auto-resume after delay
    resumeTimeoutRef.current = setTimeout(() => {
      setIsAutoScrollPaused(false);
    }, AUTO_SCROLL_RESUME_DELAY);
  }, []);

  /**
   * Handler for "Resume auto-scroll" button click.
   * Immediately re-enables auto-scroll and clears pending timeout.
   */
  const handleResumeAutoScroll = useCallback(() => {
    setIsAutoScrollPaused(false);
    // Clear any pending resume timeout since we're resuming now
    if (resumeTimeoutRef.current) {
      clearTimeout(resumeTimeoutRef.current);
      resumeTimeoutRef.current = null;
    }
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // EFFECTS
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Sets up scroll event listener on the container.
   * Uses passive: true for better scroll performance.
   */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      container.removeEventListener("scroll", handleScroll);
      // Clean up timeout on unmount to prevent memory leaks
      if (resumeTimeoutRef.current) {
        clearTimeout(resumeTimeoutRef.current);
      }
    };
  }, [handleScroll]);

  /**
   * Auto-scrolls to keep the active segment visible during playback.
   *
   * Behavior:
   * - Only scrolls when there's an active segment
   * - Skipped when auto-scroll is paused (user scrolled)
   * - Uses smooth scrolling animation
   * - Sets flag to prevent triggering handleScroll
   */
  useEffect(() => {
    // Don't scroll if no active segment or auto-scroll is paused
    if (activeSegmentIndex === -1 || isAutoScrollPaused) return;

    const activeElement = segmentRefs.current.get(activeSegmentIndex);
    if (!activeElement || !containerRef.current) return;

    // Flag to prevent handleScroll from detecting this as user scroll
    isAutoScrolling.current = true;

    // Smooth scroll the active segment into view
    activeElement.scrollIntoView({
      behavior: "smooth",
      block: "nearest", // Minimize scroll distance
    });

    // Clear flag after scroll animation (scrollIntoView has no callback)
    setTimeout(() => {
      isAutoScrolling.current = false;
    }, 500);
  }, [activeSegmentIndex, isAutoScrollPaused]);

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  // Empty state - no transcription available
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
    <div className="mt-3 sm:mt-4">
      {/* ─── Header with title and resume button ─── */}
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Transcription
        </h3>

        {/* Resume auto-scroll button - only shown when paused during playback */}
        {isAutoScrollPaused && currentTime !== undefined && (
          <button
            type="button"
            onClick={handleResumeAutoScroll}
            className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1 transition-colors"
            aria-label="Resume auto-scroll"
          >
            {/* Down arrow icon */}
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

      {/* ─── Scrollable segments container ─── */}
      <div
        ref={containerRef}
        className="space-y-2 rounded-lg border border-zinc-200 bg-zinc-50 p-2 sm:p-3 dark:border-zinc-700 dark:bg-zinc-800/50 max-h-48 sm:max-h-64 overflow-y-auto"
        role="list"
        aria-label="Transcription segments"
      >
        {/* ─── Individual segment cards ─── */}
        {segments.map((segment, index) => {
          // Get display values for this segment
          const speakerName = segment.speaker ?? "Unknown";
          const colors = getSpeakerColor(segment.speaker, speakerMap);
          const isActive = isSegmentActive(segment, currentTime);

          return (
            <div
              key={`${segment.startTime}-${index}`}
              // Store ref for auto-scroll targeting
              ref={(el) => {
                if (el) {
                  segmentRefs.current.set(index, el);
                } else {
                  segmentRefs.current.delete(index);
                }
              }}
              // Dynamic styling: speaker color + active highlight
              className={`rounded-md border p-1.5 sm:p-2 transition-all duration-200 ${colors.border} ${colors.bg} ${
                isActive
                  ? "ring-2 ring-blue-500 ring-offset-1 dark:ring-offset-zinc-800 scale-[1.01]"
                  : ""
              }`}
              role="listitem"
              aria-current={isActive ? "true" : undefined}
            >
              {/* Segment header: speaker name + time range + playing indicator */}
              <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-1">
                {/* Speaker badge - colored based on speaker assignment */}
                <span
                  className={`text-xs font-semibold px-1.5 sm:px-2 py-0.5 rounded ${colors.text}`}
                  aria-label={`Speaker: ${speakerName}`}
                >
                  {speakerName}
                </span>

                {/* Time range display (e.g., "0:00 - 0:45") */}
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  {formatTime(segment.startTime)} - {formatTime(segment.endTime)}
                </span>

                {/* "Now Playing" badge - pulsing animation, responsive text */}
                {isActive && (
                  <span className="text-xs bg-blue-500 text-white px-1.5 sm:px-2 py-0.5 rounded-full animate-pulse">
                    <span className="hidden sm:inline">Now Playing</span>
                    <span className="sm:hidden">Playing</span>
                  </span>
                )}
              </div>

              {/* Segment text content - emphasized when active */}
              <p className={`text-xs sm:text-sm ${isActive ? "font-medium text-zinc-900 dark:text-zinc-100" : "text-zinc-800 dark:text-zinc-200"}`}>
                {segment.text}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
