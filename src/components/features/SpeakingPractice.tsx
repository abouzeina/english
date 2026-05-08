"use client";

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, RefreshCw, AlertCircle, ShieldCheck } from 'lucide-react';
import { useSpeechPractice } from '@/hooks/useSpeechPractice';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface SpeakingPracticeProps {
  targetText: string;
  onAudioPlay?: () => void;
  className?: string;
}

export function SpeakingPractice({ targetText, onAudioPlay, className }: SpeakingPracticeProps) {
  const {
    isPreparing,
    isListening,
    transcript,
    score,
    error,
    audioUrl,
    isSupported,
    startListening,
    stopListening,
    reset
  } = useSpeechPractice({ targetText });

  const playMyVoice = () => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.play();
    }
  };

  // Reset when target text changes (e.g. flipping flashcards)
  useEffect(() => {
    reset();
  }, [targetText, reset]);

  if (!isSupported) {
    return null; // Fallback UI for unsupported browsers could go here, but hiding is cleaner for now
  }

  const getErrorText = (err: string) => {
    if (err === 'not-allowed') return 'Microphone access denied. Please allow permissions in your browser.';
    if (err === 'not-supported') return 'Speech recognition is not supported in this browser.';
    if (err === 'network') return 'Network error occurred during speech recognition.';
    if (err === 'no-speech') return 'No speech detected. Please try again.';
    return 'An error occurred. Please try again.';
  };

  return (
    <div className={cn("flex flex-col items-center w-full bg-secondary/20 rounded-2xl p-4 border border-white/5", className)}>
      <div className="flex items-center gap-2 mb-4 w-full justify-center">
        <div className="h-px flex-1 bg-white/5" />
        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest font-sans px-2">Speaking Practice</h4>
        <div className="h-px flex-1 bg-white/5" />
      </div>

      <AnimatePresence mode="wait">
        {!isPreparing && !isListening && !score && !error && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex flex-col items-center gap-3 w-full"
          >
            <button
              onClick={startListening}
              className="w-16 h-16 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20 flex items-center justify-center hover:bg-blue-500/20 hover:scale-105 transition-all duration-300"
            >
              <Mic className="w-8 h-8" />
            </button>
            <p className="text-xs font-cairo text-muted-foreground">Tap to speak</p>
          </motion.div>
        )}

        {isPreparing && (
          <motion.div
            key="preparing"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex flex-col items-center gap-3 w-full"
          >
            <div className="w-16 h-16 rounded-full bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 flex items-center justify-center animate-pulse">
              <Mic className="w-8 h-8" />
            </div>
            <p className="text-xs font-sans text-yellow-500 font-bold uppercase tracking-widest animate-pulse">Warming up...</p>
          </motion.div>
        )}

        {isListening && (
          <motion.div
            key="listening"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex flex-col items-center gap-4 w-full"
          >
            <div className="relative">
              <button
                onClick={stopListening}
                className="w-16 h-16 rounded-full bg-red-500 text-white shadow-lg flex items-center justify-center z-10 relative hover:bg-red-600 transition-colors"
              >
                <MicOff className="w-8 h-8" />
              </button>
              <motion.div
                className="absolute inset-0 rounded-full bg-red-500/30"
                animate={{ scale: [1, 1.5, 1], opacity: [0.7, 0, 0.7] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>
            
            <div className="text-center w-full px-4">
              <p className="text-sm font-bold font-sans text-primary animate-pulse">Listening...</p>
              {transcript && (
                <p className="text-lg font-cairo text-foreground mt-2 italic opacity-70">"{transcript}"</p>
              )}
            </div>
          </motion.div>
        )}

        {error && !isListening && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col items-center gap-3 w-full text-center"
          >
            <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <p className="text-sm text-red-400 font-cairo max-w-[250px]">{getErrorText(error)}</p>
            <Button onClick={startListening} variant="outline" size="sm" className="mt-2 rounded-xl gap-2">
              <RefreshCw className="w-4 h-4" /> Try Again
            </Button>
          </motion.div>
        )}

        {score && !isListening && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col items-center w-full gap-4"
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <div className={cn(
                  "flex items-center justify-center w-12 h-12 rounded-full font-bold text-lg shadow-sm border",
                  score.accuracy >= 80 ? "bg-emerald-500/20 text-emerald-500 border-emerald-500/30" : 
                  score.accuracy >= 50 ? "bg-yellow-500/20 text-yellow-500 border-yellow-500/30" : 
                  "bg-red-500/20 text-red-500 border-red-500/30"
                )}>
                  {score.accuracy}%
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-foreground">Speech Accuracy</span>
                  <span className={cn(
                    "text-xs font-bold",
                    score.isPassing ? "text-emerald-500" : "text-yellow-500"
                  )}>
                    {score.accuracy >= 80 ? 'Excellent!' : score.accuracy >= 50 ? 'Good try!' : 'Keep practicing!'}
                  </span>
                </div>
              </div>
              <Button onClick={startListening} variant="ghost" size="icon" className="rounded-full hover:bg-secondary">
                <RefreshCw className="w-5 h-5 text-muted-foreground" />
              </Button>
            </div>

            <div className="w-full bg-background/50 p-4 rounded-xl border border-white/5 flex flex-wrap gap-x-2 gap-y-1">
              {score.details.map((detail, idx) => (
                <span 
                  key={idx} 
                  className={cn(
                    "text-lg font-sans font-medium transition-colors",
                    detail.status === 'correct' ? "text-emerald-500" :
                    detail.status === 'missing' ? "text-muted-foreground/30 line-through decoration-red-500/50" :
                    detail.status === 'extra' ? "text-yellow-500 underline decoration-dashed" :
                    "text-red-500"
                  )}
                  title={detail.status}
                >
                  {detail.word}
                </span>
              ))}
            </div>
            
            {score.accuracy < 100 && (
              <div className="flex gap-4 text-[10px] font-sans text-muted-foreground uppercase font-bold w-full justify-center">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Match</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Error</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-muted-foreground/30" /> Missed</span>
              </div>
            )}

            <div className="flex items-center gap-3 w-full mt-2">
              {audioUrl && (
                <Button onClick={playMyVoice} variant="secondary" className="flex-1 rounded-xl font-cairo font-bold bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border border-blue-500/20">
                  <Mic className="w-4 h-4 mr-2" /> اسمع صوتي
                </Button>
              )}
              {onAudioPlay && (
                <Button onClick={onAudioPlay} variant="secondary" className="flex-1 rounded-xl font-cairo font-bold bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border border-emerald-500/20">
                  النطق الصحيح
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-4 flex items-center gap-1.5 opacity-50 justify-center">
        <ShieldCheck className="w-3 h-3 text-muted-foreground" />
        <span className="text-[9px] font-sans text-muted-foreground uppercase tracking-wider">Voice is processed locally and never stored</span>
      </div>
    </div>
  );
}
