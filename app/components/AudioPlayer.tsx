/**
 * AudioPlayer.tsx - Radio Traffic Audio Player Component
 *
 * A full-featured audio player for radio traffic recordings with:
 * - Play/pause controls with keyboard accessibility (Space/Enter)
 * - Interactive seek bar for navigation
 * - Time display (current position / total duration)
 * - Metadata display (segments, speakers, incident ID)
 * - Synchronized transcription display with segment highlighting
 *
 * Architecture:
 * ┌───────────────────────────────────────────────────────────┐
 * │ AudioPlayer                                               │
 * │ ┌─────────────────┐ ┌───────────────────────────────────┐│
 * │ │ Play/Pause      │ │ Seek Bar + Time                   ││
 * │ │ Button          │ │ [========|--------] 1:23 / 3:45   ││
 * │ └─────────────────┘ └───────────────────────────────────┘│
 * │ ┌─────────────────────────────────────────────────────┐  │
 * │ │ Metadata: Segments: 6 | Speakers: 3 | Incident: 123│  │
 * │ └─────────────────────────────────────────────────────┘  │
 * │ ┌─────────────────────────────────────────────────────┐  │
 * │ │ TranscriptionDisplay (synchronized segments)        │  │
 * │ └─────────────────────────────────────────────────────┘  │
 * └───────────────────────────────────────────────────────────┘
 */
"use client";

import { useState, useRef, useEffect, useCallback, memo } from "react";
import type { RadioUIElementPayload } from "../types/ui-elements";
import { TranscriptionDisplay } from "./TranscriptionDisplay";
import { formatTime } from "../utils/format";

// ============================================================================
// TYPES
// ============================================================================

interface AudioPlayerProps {
  /** Radio traffic data including audio URL, transcription, and metadata */
  payload: RadioUIElementPayload;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * Audio player component for radio traffic playback.
 * Wrapped in React.memo to prevent unnecessary re-renders when parent updates.
 *
 * State Management:
 * - isPlaying: Sync'd with HTML audio element play/pause state
 * - isLoaded: Whether audio is ready for playback
 * - currentTime/duration: For seek bar and time display
 * - error: Error message if audio fails to load/play
 *
 * Event Flow:
 * User clicks play → audio.play() → "play" event → setIsPlaying(true)
 * User seeks → onChange → audio.currentTime = value → "timeupdate" → setCurrentTime
 */
export const AudioPlayer = memo(function AudioPlayer({ payload }: AudioPlayerProps) {
  // ─── Refs ───
  const audioRef = useRef<HTMLAudioElement>(null);

  // ─── State ───
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // ─── Derived Values ───
  // Count unique speakers for metadata display
  const speakerCount = new Set(
    payload.transcription.map((s) => s.speaker ?? "Unknown")
  ).size;

  // ─────────────────────────────────────────────────────────────────────────
  // EVENT HANDLERS
  // ─────────────────────────────────────────────────────────────────────────

  /** Toggles play/pause state of the audio element */
  const handlePlayPause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch((err) => {
        console.error("Failed to play audio:", err);
        setError("Failed to play audio");
      });
    }
  }, [isPlaying]);

  /** Called when audio starts playing (sync state with audio element) */
  const handlePlay = useCallback(() => {
    setIsPlaying(true);
  }, []);

  /** Called when audio pauses (sync state with audio element) */
  const handlePause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  /** Called when audio is ready to play */
  const handleCanPlay = useCallback(() => {
    setIsLoaded(true);
    setError(null);
  }, []);

  /** Called when audio fails to load */
  const handleError = useCallback(() => {
    setError("Failed to load audio");
    setIsLoaded(false);
  }, []);

  /** Called periodically during playback to update current time */
  const handleTimeUpdate = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      setCurrentTime(audio.currentTime);
    }
  }, []);

  /** Called when audio metadata loads (used to get duration) */
  const handleLoadedMetadata = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      setDuration(audio.duration);
    }
  }, []);

  /** Handles seek bar changes - updates audio position */
  const handleSeek = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (audio) {
      const newTime = parseFloat(event.target.value);
      audio.currentTime = newTime;
      setCurrentTime(newTime);
    }
  }, []);

  /** Handles keyboard accessibility - Space/Enter toggles play/pause */
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === " " || event.key === "Enter") {
        event.preventDefault();
        handlePlayPause();
      }
    },
    [handlePlayPause]
  );

  // ─────────────────────────────────────────────────────────────────────────
  // EFFECTS
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Sets up audio element event listeners.
   * We use native event listeners instead of React props because:
   * - More reliable state synchronization
   * - Better cleanup on unmount
   */
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("error", handleError);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);

    return () => {
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("error", handleError);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
    };
  }, [handlePlay, handlePause, handleCanPlay, handleError, handleTimeUpdate, handleLoadedMetadata]);

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3 sm:p-4 dark:border-zinc-700 dark:bg-zinc-900">
      {/* ─── Header with icon and title ─── */}
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 shrink-0">
          {/* Microphone icon */}
          <svg
            className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600 dark:text-blue-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
            />
          </svg>
        </div>
        <span className="font-medium text-sm sm:text-base">Radio Traffic Recording</span>
      </div>

      {/* ─── Hidden audio element ─── */}
      {/* The actual HTML5 audio element - hidden from view, controlled programmatically */}
      <audio ref={audioRef} src={payload.audioUrl} preload="metadata" aria-hidden="true" />

      {/* ─── Player Controls: Play button + Seek bar ─── */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Play/Pause button - circular with icon */}
        <button
          type="button"
          onClick={handlePlayPause}
          onKeyDown={handleKeyDown}
          disabled={!!error}
          className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-blue-600 text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-zinc-400 dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-offset-zinc-900 shrink-0"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            // Pause icon
            <svg
              className="h-5 w-5 sm:h-6 sm:w-6"
              fill="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            // Play icon
            <svg
              className="h-5 w-5 sm:h-6 sm:w-6 translate-x-0.5"
              fill="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        {/* Seek bar container - flexes to fill remaining space */}
        <div className="flex-1">
          {/* ─── Conditional content based on loading/error state ─── */}
          {error ? (
            // Error state - red text
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          ) : !isLoaded ? (
            // Loading state - gray "Loading audio..." text
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Loading audio...
            </p>
          ) : (
            // Ready state - show seek bar and time display
            <div className="flex flex-col gap-1">
              {/* Seek bar - HTML range input styled as progress bar */}
              <input
                type="range"
                min={0}
                max={duration || 0}
                step={0.1}
                value={currentTime}
                onChange={handleSeek}
                className="seek-bar h-2 w-full cursor-pointer appearance-none rounded-full bg-zinc-200 dark:bg-zinc-700"
                aria-label="Seek audio position"
                aria-valuemin={0}
                aria-valuemax={duration}
                aria-valuenow={currentTime}
                aria-valuetext={`${Math.floor(currentTime)} of ${Math.floor(duration)} seconds`}
              />
              {/* Time display - current / duration at ends of seek bar */}
              <div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400">
                <span aria-label="Current time">{formatTime(currentTime)}</span>
                <span aria-label="Total duration">{formatTime(duration)}</span>
              </div>

              {/* ─── Custom seek bar styling ───
                  Range inputs need custom CSS for cross-browser styling.
                  This creates a circular blue thumb with a track.
              */}
              <style>{`
                .seek-bar::-webkit-slider-thumb {
                  appearance: none;
                  width: 14px;
                  height: 14px;
                  border-radius: 50%;
                  background: #2563eb;
                  cursor: pointer;
                  border: 2px solid white;
                  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
                }
                .seek-bar::-moz-range-thumb {
                  width: 14px;
                  height: 14px;
                  border-radius: 50%;
                  background: #2563eb;
                  cursor: pointer;
                  border: 2px solid white;
                  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
                }
                .seek-bar::-webkit-slider-runnable-track {
                  height: 8px;
                  border-radius: 4px;
                }
                .seek-bar::-moz-range-track {
                  height: 8px;
                  border-radius: 4px;
                }
                .seek-bar:focus {
                  outline: none;
                }
                .seek-bar:focus-visible {
                  outline: 2px solid #3b82f6;
                  outline-offset: 2px;
                }
              `}</style>
            </div>
          )}
        </div>
      </div>

      {/* ─── Metadata row ───
          Shows recording statistics. Responsive:
          - Mobile: 2-column grid
          - Desktop: horizontal flex wrap
      */}
      <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 sm:flex sm:flex-wrap sm:gap-x-4">
        <p>
          <span className="font-medium">Segments:</span>{" "}
          {payload.transcription.length}
        </p>
        <p>
          <span className="font-medium">Speakers:</span> {speakerCount}
        </p>
        {payload.metadata?.incidentId && (
          <p>
            <span className="font-medium">Incident:</span>{" "}
            {payload.metadata.incidentId}
          </p>
        )}
        {payload.metadata?.duration && (
          <p>
            <span className="font-medium">Duration:</span>{" "}
            {Math.round(payload.metadata.duration)}s
          </p>
        )}
      </div>

      {/* ─── Transcription display ───
          Shows all transcription segments with speaker color-coding.
          currentTime prop enables synchronized highlighting during playback.
      */}
      <TranscriptionDisplay segments={payload.transcription} currentTime={currentTime} />
    </div>
  );
});

// Set display name for debugging
AudioPlayer.displayName = "AudioPlayer";
