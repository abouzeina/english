"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getBestEnglishVoice } from "@/utils/audioVoice";

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
      const bestVoice = getBestEnglishVoice();
      if (bestVoice) setVoice(bestVoice);
    };

    loadVoices();
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
      return () => {
        window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
      };
    }
  }, [lang]);

  const [playId, setPlayId] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const play = useCallback(() => {
    if (!text || !window.speechSynthesis) return;
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    const newId = playId + 1;
    setPlayId(newId);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
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
    }, 50);
  }, [text, lang, speed, voice, playId]);

  const stop = useCallback(() => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    setIsPlaying(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
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
