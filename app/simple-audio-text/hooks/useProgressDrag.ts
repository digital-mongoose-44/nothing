"use client";

import { useCallback, useRef, useState } from "react";
import type { UseProgressDragReturn } from "../types/audio-player.types";

/**
 * Custom hook for handling progress bar drag interactions.
 *
 * Uses PointerEvent API with setPointerCapture for:
 * - Mobile/touch support (not just mouse)
 * - No global window event listeners (prevents memory leaks)
 * - Proper event cleanup
 *
 * @param duration - Total duration in seconds
 * @param onSeek - Callback to seek to a position in seconds
 */
export function useProgressDrag(
  duration: number,
  onSeek: (time: number) => void
): UseProgressDragReturn {
  const progressRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  /**
   * Calculates seek time from pointer position.
   */
  const calculateSeekTime = useCallback(
    (clientX: number): number => {
      const element = progressRef.current;
      if (!element || !duration) return 0;

      const rect = element.getBoundingClientRect();
      const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      return percent * duration;
    },
    [duration]
  );

  /**
   * Handles pointer down - starts dragging and captures pointer.
   */
  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const element = progressRef.current;
      if (!element || !duration) return;

      // Prevent text selection during drag
      e.preventDefault();

      // Capture pointer to receive all events even outside element
      element.setPointerCapture(e.pointerId);

      setIsDragging(true);
      onSeek(calculateSeekTime(e.clientX));

      const handlePointerMove = (moveEvent: PointerEvent) => {
        onSeek(calculateSeekTime(moveEvent.clientX));
      };

      const handlePointerUp = () => {
        setIsDragging(false);
        element.removeEventListener("pointermove", handlePointerMove);
        element.removeEventListener("pointerup", handlePointerUp);
        element.removeEventListener("pointercancel", handlePointerUp);
      };

      element.addEventListener("pointermove", handlePointerMove);
      element.addEventListener("pointerup", handlePointerUp);
      element.addEventListener("pointercancel", handlePointerUp);
    },
    [duration, onSeek, calculateSeekTime]
  );

  return {
    progressRef,
    isDragging,
    handlePointerDown,
  };
}
