"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { RadioUIElementPayload } from "../types/ui-elements";

interface AudioPlayerProps {
  payload: RadioUIElementPayload;
}

/**
 * Audio player component for radio traffic playback.
 * Provides play/pause controls for audio recordings.
 */
export function AudioPlayer({ payload }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const speakerCount = new Set(
    payload.transcription.map((s) => s.speaker ?? "Unknown")
  ).size;

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

  const handlePlay = useCallback(() => {
    setIsPlaying(true);
  }, []);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const handleCanPlay = useCallback(() => {
    setIsLoaded(true);
    setError(null);
  }, []);

  const handleError = useCallback(() => {
    setError("Failed to load audio");
    setIsLoaded(false);
  }, []);

  // Handle keyboard controls for play/pause
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === " " || event.key === "Enter") {
        event.preventDefault();
        handlePlayPause();
      }
    },
    [handlePlayPause]
  );

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("error", handleError);
    };
  }, [handlePlay, handlePause, handleCanPlay, handleError]);

  return (
    <div className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-900">
      {/* Header */}
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
          <svg
            className="h-4 w-4 text-blue-600 dark:text-blue-400"
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
        <span className="font-medium">Radio Traffic Recording</span>
      </div>

      {/* Audio element - hidden */}
      <audio ref={audioRef} src={payload.audioUrl} preload="metadata" />

      {/* Play/Pause Controls */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handlePlayPause}
          onKeyDown={handleKeyDown}
          disabled={!!error}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-zinc-400 dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-offset-zinc-900"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            // Pause icon
            <svg
              className="h-6 w-6"
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
              className="h-6 w-6 translate-x-0.5"
              fill="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        <div className="flex-1">
          {/* Loading or error state */}
          {error ? (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          ) : !isLoaded ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Loading audio...
            </p>
          ) : (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {isPlaying ? "Playing..." : "Ready to play"}
            </p>
          )}
        </div>
      </div>

      {/* Metadata */}
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-600 dark:text-zinc-400">
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
    </div>
  );
}
