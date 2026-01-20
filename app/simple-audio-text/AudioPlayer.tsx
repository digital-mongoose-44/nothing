"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import "./audioplayer.css";

const formatTime = (seconds: number) => {
  if (isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};



const AudioPlayer = ({ src, title = "Unknown Track", artist = "Unknown Artist" }: { src: string, title: string, artist: string }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);



  const togglePlay = useCallback(async () => {
    if (!audioRef.current) return;
    
    try {
      if (audioRef.current.paused) {
        await audioRef.current.play();
      } else {
        audioRef.current.pause();
      }
    } catch (err) {
      console.error("Playback error:", err);
      setError("Playback failed. Trying fallback audio...");
  
    }
  }, []);

  const handleSeek = useCallback(
    (e: MouseEvent) => {
      if (!progressRef.current || !audioRef.current || !duration) return;
      const rect = progressRef.current.getBoundingClientRect();
      const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      audioRef.current.currentTime = percent * duration;
    },
    [duration]
  );

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
    if (newVolume > 0) setIsMuted(false);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    if (isMuted) {
      audioRef.current.volume = volume;
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  const skip = (seconds: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(0, Math.min(duration, audioRef.current.currentTime + seconds));
  };

  useEffect(() => {
    if (!isDragging) return;
    const handleMouseMove = (e: MouseEvent) => handleSeek(e);
    const handleMouseUp = () => setIsDragging(false);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, handleSeek]);

  const handleError = () => {
    console.error("Audio load error, using fallback");

    setError("Failed to load audio");
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
   
<>
      <audio
        ref={audioRef}
        src={src}
        preload="auto"
        onLoadedMetadata={(e) => {
          setDuration(e.currentTarget.duration);
          setIsLoaded(true);
          e.currentTarget.volume = volume;
          setError(null);
        }}
        onCanPlayThrough={() => setIsLoaded(true)}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        onError={handleError}
      />

      <div className="audio-player">
        <div className="track-info">
          <h2 className="track-title">{title}</h2>
          <p className="track-artist">{artist}</p>
        </div>

        {error && <div className="error-message">{error}</div>}
        
        {!isLoaded && <div className="status">Loading audio...</div>}

        <div className="progress-container">
          <div
            ref={progressRef}
            className={`progress-bar ${isDragging ? "dragging" : ""}`}
            onClick={handleSeek}
            onMouseDown={(e) => {
              setIsDragging(true);
              handleSeek(e);
            }}
          >
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="time-display">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <div className="controls">
          <button className="control-btn" onClick={() => skip(-10)} disabled={!isLoaded}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.5 3C17.15 3 21.08 6.03 22.47 10.22L20.1 11C19.05 7.81 16.04 5.5 12.5 5.5C10.54 5.5 8.77 6.22 7.38 7.38L10 10H3V3L5.6 5.6C7.45 4 9.85 3 12.5 3M10 12V22H8V14H6V12H10M18 14V20C18 21.11 17.11 22 16 22H14C12.9 22 12 21.1 12 20V14C12 12.9 12.9 12 14 12H16C17.11 12 18 12.9 18 14M14 14V20H16V14H14Z" />
            </svg>
          </button>

          <button
            className={`control-btn play-btn ${!isLoaded ? "loading" : ""}`}
            onClick={togglePlay}
            disabled={!isLoaded}
          >
            {isPlaying ? (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                <path d="M14,19H18V5H14M6,19H10V5H6V19Z" />
              </svg>
            ) : (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8,5.14V19.14L19,12.14L8,5.14Z" />
              </svg>
            )}
          </button>

          <button className="control-btn" onClick={() => skip(10)} disabled={!isLoaded}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M10 3V5.5C6.46 5.5 3.45 7.81 2.4 11L0.03 10.22C1.42 6.03 5.35 3 10 3M10 12V22H8V14H6V12H10M18 14V20C18 21.11 17.11 22 16 22H14C12.9 22 12 21.1 12 20V14C12 12.9 12.9 12 14 12H16C17.11 12 18 12.9 18 14M14 14V20H16V14H14M19.6 5.6L22.17 3V10H15.17L17.77 7.38C16.38 6.22 14.61 5.5 12.65 5.5V3C15.3 3 17.7 4 19.6 5.6Z" />
            </svg>
          </button>
        </div>


        
      </div>
</>
  );
}

export default AudioPlayer;