"use client";

import { useCallback, memo } from "react";
import { formatTime } from "../utils/format";
import { useAudioPlayer } from "./hooks/useAudioPlayer";
import { useProgressDrag } from "./hooks/useProgressDrag";
import type { AudioPlayerProps } from "./types/audio-player.types";
import { KEYBOARD_SHORTCUTS, SKIP_AMOUNTS } from "./types/audio-player.types";
import "./audioplayer.css";

/**
 * AudioPlayer Component
 *
 * A fully accessible audio player with:
 * - Full keyboard navigation
 * - ARIA labels and roles
 * - Mobile touch support via pointer events
 * - Error handling with retry capability
 * - Performance-optimized time updates
 */
const AudioPlayer = memo(function AudioPlayer({
  src,
  title = "Unknown Track",
  artist = "Unknown Artist",
  initialVolume = 0.7,
  onPlayStateChange,
  onError,
}: AudioPlayerProps) {
  const {
    audioRef,
    state,
    togglePlay,
    seek,
    skip,
    retry,
    progress,
  } = useAudioPlayer(src, initialVolume, onPlayStateChange, onError);

  const { progressRef, isDragging, handlePointerDown } = useProgressDrag(
    state.duration,
    seek
  );

  /**
   * Handles keyboard navigation on the progress bar.
   */
  const handleProgressKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const skipAmount = e.shiftKey ? SKIP_AMOUNTS.LARGE : SKIP_AMOUNTS.SMALL;

      switch (e.key) {
        case KEYBOARD_SHORTCUTS.SKIP_BACK:
          e.preventDefault();
          skip(-skipAmount);
          break;
        case KEYBOARD_SHORTCUTS.SKIP_FORWARD:
          e.preventDefault();
          skip(skipAmount);
          break;
        case KEYBOARD_SHORTCUTS.JUMP_START:
          e.preventDefault();
          seek(0);
          break;
        case KEYBOARD_SHORTCUTS.JUMP_END:
          e.preventDefault();
          seek(state.duration);
          break;
      }
    },
    [skip, seek, state.duration]
  );

  /**
   * Handles keyboard navigation on the player container.
   */
  const handlePlayerKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Only handle if target is the container itself or a non-interactive element
      const target = e.target as HTMLElement;
      if (target.tagName === "BUTTON" || target.tagName === "INPUT") {
        return;
      }

      if (
        (e.key === " " || e.key === "Enter") &&
        target.getAttribute("role") !== "slider"
      ) {
        e.preventDefault();
        togglePlay();
      }
    },
    [togglePlay]
  );

  return (
    <section
      className="audio-player"
      role="region"
      aria-label={`Audio player: ${title}`}
      onKeyDown={handlePlayerKeyDown}
    >
      <audio ref={audioRef} src={src} preload="auto" />

      <header className="track-info">
        <h2 className="track-title">{title}</h2>
        <p className="track-artist">{artist}</p>
      </header>

      {state.error && (
        <div className="error-container" role="alert" aria-live="polite">
          <span className="error-message">{state.error.message}</span>
          <button
            className="retry-button"
            onClick={retry}
            aria-label="Retry loading audio"
          >
            Retry
          </button>
        </div>
      )}

      {!state.isLoaded && !state.error && (
        <div className="status" aria-live="polite">
          Loading audio...
        </div>
      )}

      <div className="progress-container">
        <div
          ref={progressRef}
          className={`progress-bar ${isDragging ? "dragging" : ""}`}
          role="slider"
          aria-label="Audio playback progress"
          aria-valuemin={0}
          aria-valuemax={Math.round(state.duration)}
          aria-valuenow={Math.round(state.currentTime)}
          aria-valuetext={`${formatTime(state.currentTime)} of ${formatTime(state.duration)}`}
          tabIndex={state.isLoaded ? 0 : -1}
          onPointerDown={handlePointerDown}
          onKeyDown={handleProgressKeyDown}
        >
          <div
            className="progress-fill"
            style={{ width: `${progress}%` }}
            aria-hidden="true"
          />
        </div>
        <div className="time-display" aria-hidden="true">
          <span>{formatTime(state.currentTime)}</span>
          <span>{formatTime(state.duration)}</span>
        </div>
      </div>

      <div className="controls" role="group" aria-label="Playback controls">
        <button
          className="control-btn"
          onClick={() => skip(-SKIP_AMOUNTS.SMALL)}
          disabled={!state.isLoaded}
          aria-label="Skip back 10 seconds"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M12.5 3C17.15 3 21.08 6.03 22.47 10.22L20.1 11C19.05 7.81 16.04 5.5 12.5 5.5C10.54 5.5 8.77 6.22 7.38 7.38L10 10H3V3L5.6 5.6C7.45 4 9.85 3 12.5 3M10 12V22H8V14H6V12H10M18 14V20C18 21.11 17.11 22 16 22H14C12.9 22 12 21.1 12 20V14C12 12.9 12.9 12 14 12H16C17.11 12 18 12.9 18 14M14 14V20H16V14H14Z" />
          </svg>
        </button>

        <button
          className={`control-btn play-btn ${!state.isLoaded ? "loading" : ""}`}
          onClick={togglePlay}
          disabled={!state.isLoaded}
          aria-label={state.isPlaying ? "Pause" : "Play"}
          aria-pressed={state.isPlaying}
        >
          {state.isPlaying ? (
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M14,19H18V5H14M6,19H10V5H6V19Z" />
            </svg>
          ) : (
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M8,5.14V19.14L19,12.14L8,5.14Z" />
            </svg>
          )}
        </button>

        <button
          className="control-btn"
          onClick={() => skip(SKIP_AMOUNTS.SMALL)}
          disabled={!state.isLoaded}
          aria-label="Skip forward 10 seconds"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M10 3V5.5C6.46 5.5 3.45 7.81 2.4 11L0.03 10.22C1.42 6.03 5.35 3 10 3M10 12V22H8V14H6V12H10M18 14V20C18 21.11 17.11 22 16 22H14C12.9 22 12 21.1 12 20V14C12 12.9 12.9 12 14 12H16C17.11 12 18 12.9 18 14M14 14V20H16V14H14M19.6 5.6L22.17 3V10H15.17L17.77 7.38C16.38 6.22 14.61 5.5 12.65 5.5V3C15.3 3 17.7 4 19.6 5.6Z" />
          </svg>
        </button>
      </div>

      <div className="keyboard-hint" aria-hidden="true">
        <kbd>Space</kbd> play/pause · <kbd>←</kbd><kbd>→</kbd> seek ·{" "}
        <kbd>Shift</kbd> + arrows for 30s
      </div>
    </section>
  );
});

AudioPlayer.displayName = "AudioPlayer";

export default AudioPlayer;
