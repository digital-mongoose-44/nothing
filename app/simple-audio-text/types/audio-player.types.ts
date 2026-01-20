/**
 * TypeScript type definitions for the AudioPlayer component.
 * Provides strong typing for props, state, and error handling.
 */

/**
 * Error types for audio playback failures.
 * Maps to MediaError.code values for specific error handling.
 */
export type AudioErrorType =
  | "load_error"
  | "network_error"
  | "decode_error"
  | "not_supported"
  | "playback_error";

/**
 * Structured error information for audio playback failures.
 */
export interface AudioPlayerError {
  type: AudioErrorType;
  message: string;
  originalError?: Error;
  recoveryAttempted: boolean;
}

/**
 * Props for the AudioPlayer component.
 */
export interface AudioPlayerProps {
  /** URL of the audio source */
  src: string;
  /** Track title displayed in the player */
  title?: string;
  /** Artist name displayed below the title */
  artist?: string;
  /** Initial volume level (0-1), defaults to 0.7 */
  initialVolume?: number;
  /** Callback fired when play state changes */
  onPlayStateChange?: (isPlaying: boolean) => void;
  /** Callback fired when an error occurs */
  onError?: (error: AudioPlayerError) => void;
}

/**
 * Internal state for the audio player.
 * Managed by useReducer in the useAudioPlayer hook.
 */
export interface AudioPlayerState {
  /** Whether audio is currently playing */
  isPlaying: boolean;
  /** Whether audio metadata has loaded */
  isLoaded: boolean;
  /** Current playback position in seconds */
  currentTime: number;
  /** Total duration in seconds */
  duration: number;
  /** Current volume level (0-1) */
  volume: number;
  /** Volume before muting (for restore on unmute) */
  previousVolume: number;
  /** Current error state, if any */
  error: AudioPlayerError | null;
}

/**
 * Actions for the audio player reducer.
 */
export type AudioPlayerAction =
  | { type: "PLAY" }
  | { type: "PAUSE" }
  | { type: "SET_LOADED"; duration: number }
  | { type: "TIME_UPDATE"; currentTime: number }
  | { type: "SET_VOLUME"; volume: number }
  | { type: "TOGGLE_MUTE" }
  | { type: "SET_ERROR"; error: AudioPlayerError }
  | { type: "CLEAR_ERROR" }
  | { type: "RESET" };

/**
 * Return type from the useAudioPlayer hook.
 */
export interface UseAudioPlayerReturn {
  /** Ref to attach to the audio element */
  audioRef: React.RefObject<HTMLAudioElement | null>;
  /** Current player state */
  state: AudioPlayerState;
  /** Toggle play/pause */
  togglePlay: () => Promise<void>;
  /** Seek to a specific time in seconds */
  seek: (time: number) => void;
  /** Skip forward/backward by seconds */
  skip: (seconds: number) => void;
  /** Set volume (0-1) */
  setVolume: (volume: number) => void;
  /** Toggle mute state */
  toggleMute: () => void;
  /** Retry loading after an error */
  retry: () => void;
  /** Computed progress percentage (0-100) */
  progress: number;
  /** Whether audio is muted */
  isMuted: boolean;
}

/**
 * Return type from the useProgressDrag hook.
 */
export interface UseProgressDragReturn {
  /** Ref to attach to the progress bar element */
  progressRef: React.RefObject<HTMLDivElement | null>;
  /** Whether currently dragging */
  isDragging: boolean;
  /** Handler for pointer down on progress bar */
  handlePointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
}

/**
 * Keyboard shortcuts supported by the player.
 */
export const KEYBOARD_SHORTCUTS = {
  PLAY_PAUSE: [" ", "Enter"],
  SKIP_BACK: "ArrowLeft",
  SKIP_FORWARD: "ArrowRight",
  VOLUME_UP: "ArrowUp",
  VOLUME_DOWN: "ArrowDown",
  MUTE: "m",
  JUMP_START: "Home",
  JUMP_END: "End",
} as const;

/**
 * Skip amounts in seconds.
 */
export const SKIP_AMOUNTS = {
  SMALL: 10,
  LARGE: 30,
} as const;

/**
 * Volume adjustment step (10%).
 */
export const VOLUME_STEP = 0.1;
