"use client";

import { useState, useEffect, useCallback } from "react";

interface UseAudioProps {
  text: string;
  lang?: string;
}

export function useAudio({ text, lang = "en-US" }: UseAudioProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null);

  // Initialize and select a high-quality voice
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      // Try to find a good English voice (e.g., Google or a natural sounding local voice)
      const preferredVoice = voices.find(
        (v) => v.lang.includes(lang.split("-")[0]) && (v.name.includes("Google") || v.name.includes("Natural"))
      );
      setVoice(preferredVoice || voices.find((v) => v.lang.includes(lang.split("-")[0])) || voices[0]);
    };

    loadVoices();
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, [lang]);

  const play = useCallback(() => {
    if (!text || !window.speechSynthesis) return;
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = speed;
    if (voice) {
      utterance.voice = voice;
    }

    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    window.speechSynthesis.speak(utterance);
  }, [text, lang, speed, voice]);

  const stop = useCallback(() => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    setIsPlaying(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {
    isPlaying,
    speed,
    setSpeed,
    play,
    stop,
  };
}
