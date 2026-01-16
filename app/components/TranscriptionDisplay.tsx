/**
 * TranscriptionDisplay.tsx - Transcription Segment Display Component
 *
 * Restyled with shadcn/ui components and Framer Motion:
 * - ScrollArea for smooth scrolling
 * - Badge for speaker names
 * - Motion animations for segments
 * - Preserved auto-scroll and pause detection logic
 */
"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TranscriptionSegment } from "../types/ui-elements";
import { formatTime } from "../utils/format";

interface TranscriptionDisplayProps {
  segments: TranscriptionSegment[];
  currentTime?: number;
  onSegmentClick?: (time: number) => void;
}

// Color palette for speaker differentiation
const SPEAKER_COLORS = [
  { bg: "bg-blue-100 dark:bg-blue-900/50", text: "text-blue-700 dark:text-blue-300", badge: "bg-blue-500" },
  { bg: "bg-emerald-100 dark:bg-emerald-900/50", text: "text-emerald-700 dark:text-emerald-300", badge: "bg-emerald-500" },
  { bg: "bg-purple-100 dark:bg-purple-900/50", text: "text-purple-700 dark:text-purple-300", badge: "bg-purple-500" },
  { bg: "bg-amber-100 dark:bg-amber-900/50", text: "text-amber-700 dark:text-amber-300", badge: "bg-amber-500" },
  { bg: "bg-rose-100 dark:bg-rose-900/50", text: "text-rose-700 dark:text-rose-300", badge: "bg-rose-500" },
  { bg: "bg-cyan-100 dark:bg-cyan-900/50", text: "text-cyan-700 dark:text-cyan-300", badge: "bg-cyan-500" },
];

const UNKNOWN_SPEAKER_STYLE = {
  bg: "bg-muted",
  text: "text-muted-foreground",
  badge: "bg-muted-foreground",
};

const AUTO_SCROLL_RESUME_DELAY = 3000;

function getSpeakerColor(speaker: string | null, speakerMap: Map<string, number>) {
  if (!speaker) return UNKNOWN_SPEAKER_STYLE;
  let colorIndex = speakerMap.get(speaker);
  if (colorIndex === undefined) {
    colorIndex = speakerMap.size % SPEAKER_COLORS.length;
    speakerMap.set(speaker, colorIndex);
  }
  return SPEAKER_COLORS[colorIndex];
}

function isSegmentActive(segment: TranscriptionSegment, currentTime: number | undefined): boolean {
  if (currentTime === undefined) return false;
  return currentTime >= segment.startTime && currentTime < segment.endTime;
}

export function TranscriptionDisplay({ segments, currentTime, onSegmentClick }: TranscriptionDisplayProps) {
  // Refs
  const segmentRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);

  // State
  const [isAutoScrollPaused, setIsAutoScrollPaused] = useState(false);
  const isAutoScrolling = useRef(false);
  const resumeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Speaker Color Assignment
  const speakerMap = useMemo(() => {
    const map = new Map<string, number>();
    segments.forEach((segment) => {
      if (segment.speaker && !map.has(segment.speaker)) {
        map.set(segment.speaker, map.size % SPEAKER_COLORS.length);
      }
    });
    return map;
  }, [segments]);

  // Derived State
  const activeSegmentIndex = segments.findIndex((segment) =>
    isSegmentActive(segment, currentTime)
  );

  // Event Handlers
  const handleScroll = useCallback(() => {
    if (isAutoScrolling.current) return;
    setIsAutoScrollPaused(true);
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    resumeTimeoutRef.current = setTimeout(() => {
      setIsAutoScrollPaused(false);
    }, AUTO_SCROLL_RESUME_DELAY);
  }, []);

  const handleResumeAutoScroll = useCallback(() => {
    setIsAutoScrollPaused(false);
    if (resumeTimeoutRef.current) {
      clearTimeout(resumeTimeoutRef.current);
      resumeTimeoutRef.current = null;
    }
  }, []);

  // Effects
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      container.removeEventListener("scroll", handleScroll);
      if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    };
  }, [handleScroll]);

  useEffect(() => {
    if (activeSegmentIndex === -1 || isAutoScrollPaused) return;
    const activeElement = segmentRefs.current.get(activeSegmentIndex);
    if (!activeElement || !containerRef.current) return;
    isAutoScrolling.current = true;
    activeElement.scrollIntoView({ behavior: "smooth", block: "nearest" });
    setTimeout(() => { isAutoScrolling.current = false; }, 500);
  }, [activeSegmentIndex, isAutoScrollPaused]);

  // Empty state
  if (segments.length === 0) {
    return (
      <div className="mt-4 rounded-lg border border-border bg-muted/50 p-4">
        <p className="text-sm text-muted-foreground italic">
          No transcription available
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4">
      {/* Header */}
      <div className="mb-2 flex items-center justify-between">
        <h4 className="text-sm font-medium text-foreground">Transcription</h4>

        <AnimatePresence>
          {isAutoScrollPaused && currentTime !== undefined && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResumeAutoScroll}
                className="h-7 gap-1 text-xs text-primary hover:text-primary"
              >
                <ArrowDown className="h-3 w-3" />
                Resume auto-scroll
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Scrollable segments */}
      <div
        ref={containerRef}
        className="max-h-64 overflow-y-auto rounded-lg border border-border bg-muted/30 p-3"
        role="list"
        aria-label="Transcription segments"
      >
        <div className="space-y-2">
          {segments.map((segment, index) => {
            const speakerName = segment.speaker ?? "Unknown";
            const colors = getSpeakerColor(segment.speaker, speakerMap);
            const isActive = isSegmentActive(segment, currentTime);

            return (
              <motion.div
                key={`${segment.startTime}-${index}`}
                ref={(el) => {
                  if (el) segmentRefs.current.set(index, el);
                  else segmentRefs.current.delete(index);
                }}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
                className={cn(
                  "rounded-lg border p-3 transition-all duration-200",
                  colors.bg,
                  isActive
                    ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-[1.01] shadow-md"
                    : "border-border"
                )}
                role="listitem"
                aria-current={isActive ? "true" : undefined}
              >
                {/* Segment header */}
                <div className="mb-1.5 flex flex-wrap items-center gap-2">
                  <Badge
                    className={cn(
                      "text-xs font-semibold text-white",
                      colors.badge
                    )}
                  >
                    {speakerName}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatTime(segment.startTime)} - {formatTime(segment.endTime)}
                  </span>
                  {isActive && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground"
                    >
                      Playing
                    </motion.span>
                  )}
                </div>

                {/* Segment text */}
                <p
                  onClick={() => onSegmentClick?.(segment.startTime)}
                  className={cn(
                    "text-sm leading-relaxed",
                    isActive ? "font-medium text-foreground" : "text-foreground/80",
                    onSegmentClick && "cursor-pointer hover:bg-foreground/5 -mx-1 px-1 rounded transition-colors"
                  )}
                >
                  {segment.text}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
