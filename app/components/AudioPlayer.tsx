/**
 * AudioPlayer.tsx - Radio Traffic Audio Player Component
 *
 * Restyled with shadcn/ui components:
 * - Card container
 * - Radix Slider for seek bar
 * - lucide-react icons
 * - Framer Motion for play button
 */
"use client";

import { useState, useRef, useEffect, useCallback, memo } from "react";
import { motion } from "framer-motion";
import { Play, Pause, Radio } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { RadioUIElementPayload } from "../types/ui-elements";
import { TranscriptionDisplay } from "./TranscriptionDisplay";
import { formatTime } from "../utils/format";

interface AudioPlayerProps {
  payload: RadioUIElementPayload;
}

export const AudioPlayer = memo(function AudioPlayer({ payload }: AudioPlayerProps) {
  // Refs
  const audioRef = useRef<HTMLAudioElement>(null);

  // State
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Derived Values
  const speakerCount = new Set(
    payload.transcription.map((s) => s.speaker ?? "Unknown")
  ).size;

  // Event Handlers (preserved from original)
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

  const handlePlay = useCallback(() => setIsPlaying(true), []);
  const handlePause = useCallback(() => setIsPlaying(false), []);
  const handleCanPlay = useCallback(() => {
    setIsLoaded(true);
    setError(null);
  }, []);
  const handleError = useCallback(() => {
    setError("Failed to load audio");
    setIsLoaded(false);
  }, []);
  const handleTimeUpdate = useCallback(() => {
    const audio = audioRef.current;
    if (audio) setCurrentTime(audio.currentTime);
  }, []);
  const handleLoadedMetadata = useCallback(() => {
    const audio = audioRef.current;
    if (audio) setDuration(audio.duration);
  }, []);

  const handleSeek = useCallback((value: number[]) => {
    const audio = audioRef.current;
    if (audio) {
      const newTime = value[0];
      audio.currentTime = newTime;
      setCurrentTime(newTime);
    }
  }, []);

  const handleSegmentClick = useCallback((time: number) => {
    handleSeek([time]);
  }, [handleSeek]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === " " || event.key === "Enter") {
        event.preventDefault();
        handlePlayPause();
      }
    },
    [handlePlayPause]
  );

  // Effects (preserved from original)
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

  return (
    <Card className="mt-3 border-border bg-card">
      <CardContent className="p-4">
        {/* Header */}
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-pink-500 shadow-md">
            <Radio className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Radio Traffic Recording</h3>
            {payload.metadata?.incidentId && (
              <p className="text-sm text-muted-foreground">
                Incident {payload.metadata.incidentId}
              </p>
            )}
          </div>
        </div>

        {/* Hidden audio element */}
        <audio ref={audioRef} src={payload.audioUrl} preload="metadata" aria-hidden="true" />

        {/* Player Controls */}
        <div className="flex items-center gap-4">
          {/* Play/Pause button */}
          <motion.div whileTap={{ scale: 0.95 }}>
            <Button
              type="button"
              size="icon"
              onClick={handlePlayPause}
              onKeyDown={handleKeyDown}
              disabled={!!error}
              className={cn(
                "h-12 w-12 rounded-full shadow-md transition-all",
                "bg-primary hover:bg-primary/90",
                "disabled:bg-muted disabled:text-muted-foreground"
              )}
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Pause className="h-5 w-5 fill-current" />
              ) : (
                <Play className="h-5 w-5 fill-current translate-x-0.5" />
              )}
            </Button>
          </motion.div>

          {/* Seek bar area */}
          <div className="flex-1">
            {error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : !isLoaded ? (
              <p className="text-sm text-muted-foreground">Loading audio...</p>
            ) : (
              <div className="space-y-2">
                <Slider
                  value={[currentTime]}
                  max={duration || 0}
                  step={0.1}
                  onValueChange={handleSeek}
                  className="w-full"
                  aria-label="Seek audio position"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Metadata */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {payload.transcription.length} segments
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {speakerCount} speakers
          </Badge>
          {payload.metadata?.duration && (
            <Badge variant="secondary" className="text-xs">
              {Math.round(payload.metadata.duration)}s duration
            </Badge>
          )}
        </div>

        {/* Transcription */}
        <TranscriptionDisplay
          segments={payload.transcription}
          currentTime={currentTime}
          isPlaying={isPlaying}
          onSegmentClick={handleSegmentClick}
        />
      </CardContent>
    </Card>
  );
});

AudioPlayer.displayName = "AudioPlayer";
