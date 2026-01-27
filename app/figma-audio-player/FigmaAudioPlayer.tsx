"use client";

import { useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { useAudioPlayer } from "@/app/simple-audio-text/hooks/useAudioPlayer";
import { formatTime } from "@/app/utils/format";

const SKIP_SECONDS = 10;
const SKIP_SECONDS_LARGE = 30;

interface FigmaAudioPlayerProps {
  src: string;
  timestamp: string;
  label: string;
  transcript: string;
}

const FigmaAudioPlayer = ({
  src,
  timestamp,
  label,
  transcript,
}: FigmaAudioPlayerProps) => {
  const { audioRef, state, togglePlay, seek, skip, progress } =
    useAudioPlayer(src);

  const handleSliderChange = (value: number[]) => {
    const newTime = (value[0] / 100) * state.duration;
    seek(newTime);
  };

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const target = e.target as HTMLElement;

      // Don't handle if target is the slider (it has its own keyboard handling)
      if (target.getAttribute("role") === "slider") {
        return;
      }

      const skipAmount = e.shiftKey ? SKIP_SECONDS_LARGE : SKIP_SECONDS;

      switch (e.key) {
        case " ":
        case "Enter":
          e.preventDefault();
          togglePlay();
          break;
        case "ArrowLeft":
          e.preventDefault();
          skip(-skipAmount);
          break;
        case "ArrowRight":
          e.preventDefault();
          skip(skipAmount);
          break;
        case "Home":
          e.preventDefault();
          seek(0);
          break;
        case "End":
          e.preventDefault();
          seek(state.duration);
          break;
      }
    },
    [togglePlay, skip, seek, state.duration]
  );

  const progressValueText = `${formatTime(state.currentTime)} of ${formatTime(state.duration)}`;

  return (
    <section
      role="region"
      aria-label={`Audio player: ${label}`}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      className="bg-zinc-900 rounded-lg p-4 w-full max-w-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-zinc-950"
    >
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Header Row - Always visible */}
      <div className="flex items-center gap-3">
        {/* Play/Pause Button */}
        <button
          onClick={togglePlay}
          disabled={!state.isLoaded}
          className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-blue-500 bg-transparent hover:bg-blue-500/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-zinc-900"
          aria-label={state.isPlaying ? "Pause" : "Play"}
          aria-pressed={state.isPlaying}
        >
          {state.isPlaying ? (
            <Pause className="w-4 h-4 text-blue-500 fill-blue-500" />
          ) : (
            <Play className="w-4 h-4 text-blue-500 fill-blue-500 ml-0.5" />
          )}
        </button>

        {/* Timestamp */}
        <span className="text-zinc-400 text-sm font-mono">{timestamp}</span>

        {/* Label */}
        <span className="text-cyan-400 text-sm font-medium">{label}</span>

        {/* Duration */}
        <span className="text-zinc-400 text-sm font-mono ml-auto">
          {state.isLoaded ? formatTime(state.duration) : "--:--"}
        </span>
      </div>

      {/* Loading State */}
      {!state.isLoaded && !state.error && (
        <div className="sr-only" aria-live="polite" aria-atomic="true">
          Loading audio...
        </div>
      )}

      {/* Expandable Content - Animated */}
      <AnimatePresence initial={false}>
        {state.isPlaying && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="pt-4">
              {/* Transcript Section */}
              <div className="mb-4">
                <span
                  id={`transcript-label-${label}`}
                  className="text-zinc-500 text-xs uppercase tracking-wide font-medium"
                >
                  TRANSCRIPT:
                </span>
                <p
                  className="text-zinc-300 text-sm mt-1 leading-relaxed"
                  aria-labelledby={`transcript-label-${label}`}
                >
                  {transcript}
                </p>
              </div>

              {/* Progress Section */}
              <div className="flex items-center gap-3">
                <span
                  className="text-zinc-400 text-xs font-mono min-w-[36px]"
                  aria-hidden="true"
                >
                  {formatTime(state.currentTime)}
                </span>
                <Slider
                  value={[progress]}
                  max={100}
                  step={0.1}
                  onValueChange={handleSliderChange}
                  aria-label="Audio playback progress"
                  aria-valuetext={progressValueText}
                  className="flex-1 [&_[data-slot=slider-track]]:bg-zinc-700 [&_[data-slot=slider-range]]:bg-blue-500 [&_[data-slot=slider-thumb]]:border-blue-500 [&_[data-slot=slider-thumb]]:bg-blue-500"
                />
                <span
                  className="text-zinc-400 text-xs font-mono min-w-[36px] text-right"
                  aria-hidden="true"
                >
                  {formatTime(state.duration)}
                </span>
              </div>

              {/* Keyboard hints - visually hidden but available */}
              <div className="mt-3 text-zinc-600 text-xs" aria-hidden="true">
                <kbd className="px-1 py-0.5 bg-zinc-800 rounded text-zinc-500">
                  Space
                </kbd>{" "}
                play/pause ·{" "}
                <kbd className="px-1 py-0.5 bg-zinc-800 rounded text-zinc-500">
                  ←
                </kbd>
                <kbd className="px-1 py-0.5 bg-zinc-800 rounded text-zinc-500">
                  →
                </kbd>{" "}
                seek
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error State */}
      {state.error && (
        <div
          className="mt-2 text-red-400 text-xs"
          role="alert"
          aria-live="assertive"
        >
          {state.error.message}
        </div>
      )}
    </section>
  );
};

export default FigmaAudioPlayer;
