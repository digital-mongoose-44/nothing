"use client";

import { useEffect, useRef, useState } from 'react';

// Simple WebVTT parser
const parseVTT = (vttText) => {
  const cues = [];
  const lines = vttText.split('\n').filter(Boolean);

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('-->')) {
      const [start, end] = lines[i].split(' --> ').map(timeToSeconds);
      const text = lines[i + 1] || '';
      cues.push({ start, end, text });
      i++;
    }
  }
  return cues;
};

// Convert VTT timestamp to seconds
const timeToSeconds = (time) => {
  const parts = time.split(':').map(parseFloat);
  return parts.length === 3
    ? parts[0] * 3600 + parts[1] * 60 + parts[2]
    : parts[0] * 60 + parts[1];
};

export default function AudioWithSyncedText({ audioSrc, vttSrc }) {
  const [cues, setCues] = useState([]);
  const [currentText, setCurrentText] = useState('');
  const audioRef = useRef<HTMLAudioElement>(null);

  // Load and parse VTT
  useEffect(() => {
    fetch(vttSrc)
      .then((res) => res.text())
      .then((text) => setCues(parseVTT(text)));
  }, [vttSrc]);

  // Sync text with audio
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateText = () => {
      const currentTime = audio.currentTime;
      const cue = cues.find((c) => currentTime >= c.start && currentTime <= c.end);
      setCurrentText(cue ? cue.text : '');
      requestAnimationFrame(updateText);
    };

    requestAnimationFrame(updateText);
  }, [cues]);

  return (
    <div>
      <audio ref={audioRef} controls src={audioSrc}></audio>
      <div
        style={{
          marginTop: 10,
          padding: 10,
          background: '#222',
          color: '#0f0',
          fontFamily: 'monospace',
          fontSize: '1.2rem',
          minHeight: '2rem',
        }}
      >
        {currentText}
      </div>
    </div>
  );
}