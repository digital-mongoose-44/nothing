"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";
import type {
  AudioPlayerState,
  AudioPlayerAction,
  AudioPlayerError,
  AudioErrorType,
  UseAudioPlayerReturn,
} from "../types/audio-player.types";

/**
 * Maps MediaError codes to our error types.
 */
function getErrorTypeFromMediaError(code: number): AudioErrorType {
  switch (code) {
    case MediaError.MEDIA_ERR_ABORTED:
      return "load_error";
    case MediaError.MEDIA_ERR_NETWORK:
      return "network_error";
    case MediaError.MEDIA_ERR_DECODE:
      return "decode_error";
    case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
      return "not_supported";
    default:
      return "playback_error";
  }
}

/**
 * Creates an error object from a MediaError.
 */
function createAudioError(
  mediaError: MediaError | null,
  recoveryAttempted = false
): AudioPlayerError {
  if (!mediaError) {
    return {
      type: "playback_error",
      message: "An unknown error occurred",
      recoveryAttempted,
    };
  }

  const type = getErrorTypeFromMediaError(mediaError.code);
  const messages: Record<AudioErrorType, string> = {
    load_error: "Audio loading was cancelled",
    network_error: "Network error while loading audio",
    decode_error: "Audio file is corrupted or unsupported format",
    not_supported: "Audio format is not supported by your browser",
    playback_error: "Playback error occurred",
  };

  return {
    type,
    message: messages[type],
    recoveryAttempted,
  };
}

/**
 * Initial state for the audio player.
 */
function createInitialState(initialVolume: number): AudioPlayerState {
  return {
    isPlaying: false,
    isLoaded: false,
    currentTime: 0,
    duration: 0,
    volume: initialVolume,
    previousVolume: initialVolume,
    error: null,
  };
}

/**
 * Reducer for audio player state management.
 * Consolidates all state updates into a single, predictable flow.
 */
function audioPlayerReducer(
  state: AudioPlayerState,
  action: AudioPlayerAction
): AudioPlayerState {
  switch (action.type) {
    case "PLAY":
      return { ...state, isPlaying: true };
    case "PAUSE":
      return { ...state, isPlaying: false };
    case "SET_LOADED":
      return { ...state, isLoaded: true, duration: action.duration, error: null };
    case "TIME_UPDATE":
      return { ...state, currentTime: action.currentTime };
    case "SET_VOLUME": {
      const newVolume = Math.max(0, Math.min(1, action.volume));
      return {
        ...state,
        volume: newVolume,
        previousVolume: newVolume > 0 ? newVolume : state.previousVolume,
      };
    }
    case "TOGGLE_MUTE": {
      if (state.volume > 0) {
        return { ...state, volume: 0 };
      }
      return { ...state, volume: state.previousVolume };
    }
    case "SET_ERROR":
      return { ...state, error: action.error, isPlaying: false };
    case "CLEAR_ERROR":
      return { ...state, error: null };
    case "RESET":
      return {
        ...state,
        isPlaying: false,
        currentTime: 0,
        error: null,
      };
    default:
      return state;
  }
}

/**
 * Custom hook for managing audio playback state and controls.
 *
 * Features:
 * - Centralized state management via useReducer
 * - Proper error handling with MediaError code mapping
 * - Throttled time updates using requestAnimationFrame
 * - Memoized control functions
 * - Automatic cleanup on unmount
 */
export function useAudioPlayer(
  src: string,
  initialVolume = 0.7,
  onPlayStateChange?: (isPlaying: boolean) => void,
  onError?: (error: AudioPlayerError) => void
): UseAudioPlayerReturn {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [state, dispatch] = useReducer(
    audioPlayerReducer,
    initialVolume,
    createInitialState
  );

  // Throttled time update using requestAnimationFrame
  const scheduleTimeUpdate = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    animationFrameRef.current = requestAnimationFrame(() => {
      if (audioRef.current) {
        dispatch({ type: "TIME_UPDATE", currentTime: audioRef.current.currentTime });
      }
      animationFrameRef.current = null;
    });
  }, []);

  // Set up audio element event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      dispatch({ type: "SET_LOADED", duration: audio.duration });
      audio.volume = state.volume;
    };

    const handleTimeUpdate = () => {
      scheduleTimeUpdate();
    };

    const handlePlay = () => {
      dispatch({ type: "PLAY" });
      onPlayStateChange?.(true);
    };

    const handlePause = () => {
      dispatch({ type: "PAUSE" });
      onPlayStateChange?.(false);
    };

    const handleEnded = () => {
      dispatch({ type: "PAUSE" });
      onPlayStateChange?.(false);
    };

    const handleError = () => {
      const error = createAudioError(audio.error);
      dispatch({ type: "SET_ERROR", error });
      onError?.(error);
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("canplaythrough", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("canplaythrough", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);

      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [scheduleTimeUpdate, onPlayStateChange, onError, state.volume]);

  // Sync volume changes to audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = state.volume;
    }
  }, [state.volume]);

  const togglePlay = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      if (audio.paused) {
        await audio.play();
      } else {
        audio.pause();
      }
    } catch (err) {
      const error: AudioPlayerError = {
        type: "playback_error",
        message: "Failed to play audio. Please try again.",
        originalError: err instanceof Error ? err : undefined,
        recoveryAttempted: false,
      };
      dispatch({ type: "SET_ERROR", error });
      onError?.(error);
    }
  }, [onError]);

  const seek = useCallback((time: number) => {
    const audio = audioRef.current;
    if (!audio || !state.duration) return;
    audio.currentTime = Math.max(0, Math.min(state.duration, time));
  }, [state.duration]);

  const skip = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, Math.min(state.duration, audio.currentTime + seconds));
  }, [state.duration]);

  const setVolume = useCallback((volume: number) => {
    dispatch({ type: "SET_VOLUME", volume });
  }, []);

  const toggleMute = useCallback(() => {
    dispatch({ type: "TOGGLE_MUTE" });
  }, []);

  const retry = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    dispatch({ type: "CLEAR_ERROR" });
    audio.load();
  }, []);

  const progress = state.duration > 0 ? (state.currentTime / state.duration) * 100 : 0;
  const isMuted = state.volume === 0;

  return {
    audioRef,
    state,
    togglePlay,
    seek,
    skip,
    setVolume,
    toggleMute,
    retry,
    progress,
    isMuted,
  };
}
