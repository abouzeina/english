"use client";

import { useState, useEffect, useCallback, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Heart, Volume2, Loader2, RefreshCw, EyeOff } from "lucide-react";
import { useWafiStore, useAppStore } from "@/store/useAppStore";
import { toast } from "sonner";
import { useAudioQueue } from "@/store/useAudioQueue";
import { Example } from "@/types";
import { analytics } from "@/lib/analytics";

interface FlashcardProps {
  id: string;
  en: string;
  ar: string;
  exampleEn?: string;
  exampleAr?: string;
  examples?: Example[];
  tags?: string[];
  className?: string;
  
  // New Learning Features
  mode?: 'study' | 'review';
  isListenFirst?: boolean;
  onActionComplete?: (quality: number) => void;
}

/**
 * Atomic Audio Controls Component to prevent Flashcard re-renders when queue changes
 */
const AudioControls = memo(({ 
  wordId,
  textToPlay, 
  playbackId, 
  compact = false,
  onPlay
}: { 
  wordId: string,
  textToPlay: string, 
  playbackId: string, 
  compact?: boolean,
  onPlay: (text: string, pId: string, speed: number, repeat: number) => void
}) => {
  const [repeatCount, setRepeatCount] = useState<number>(1);
  const [speed, setSpeed] = useState<number>(1);
  
  // Subscribe only to the specific playing state for this word
  const fullPlaybackId = `${wordId}_${playbackId}`;
  const isThisPlaying = useAudioQueue(s => 
    s.isPlaying && s.queue.some(item => item.id.startsWith(fullPlaybackId))
  );

  return (
    <div className={cn("flex flex-col w-full mt-auto", compact ? "pt-2" : "pt-6")}>
      <div className={cn("flex flex-col gap-2 w-full", compact ? "mb-2" : "mb-4")}>
        <div className="flex items-center justify-between w-full bg-secondary/30 px-3 py-1.5 rounded-xl border border-white/5">
          <span className="text-[9px] font-bold text-muted-foreground uppercase font-sans">Repeat</span>
          <div className="flex bg-background/50 p-0.5 rounded-lg border border-white/5">
            {[1, 3, 5, 10].map(val => (
              <button
                key={`rep-${val}`}
                onClick={(e) => { e.stopPropagation(); setRepeatCount(val); }}
                className={cn(
                  "px-2 py-0.5 text-[10px] font-bold font-sans rounded-md transition-premium",
                  repeatCount === val ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {val}x
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between w-full bg-secondary/30 px-3 py-1.5 rounded-xl border border-white/5">
          <span className="text-[9px] font-bold text-muted-foreground uppercase font-sans">Speed</span>
          <div className="flex bg-background/50 p-0.5 rounded-lg border border-white/5">
            {[0.75, 1, 1.25].map(val => (
              <button
                key={`spd-${val}`}
                onClick={(e) => { e.stopPropagation(); setSpeed(val); }}
                className={cn(
                  "px-2 py-0.5 text-[10px] font-bold font-sans rounded-md transition-premium",
                  speed === val ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {val}x
              </button>
            ))}
          </div>
        </div>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onPlay(textToPlay, playbackId, speed, repeatCount); }}
        className={cn(
          "w-full rounded-xl flex items-center justify-center gap-2 transition-premium font-bold font-sans text-sm",
          compact ? "h-9 text-xs" : "h-12",
          isThisPlaying ? "bg-primary/20 text-primary border border-primary/20 animate-pulse" : "bg-primary text-primary-foreground shadow-sm"
        )}
      >
        {isThisPlaying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Volume2 className="w-4 h-4" />}
        <span>{isThisPlaying ? "Playing..." : "Play Audio"}</span>
      </button>
    </div>
  );
});

AudioControls.displayName = "AudioControls";

export const Flashcard = memo(({ 
  id, en, ar, exampleEn, exampleAr, examples, tags, className,
  mode = 'study',
  isListenFirst = false,
  onActionComplete
}: FlashcardProps) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isRevealed, setIsRevealed] = useState(!isListenFirst);
  
  // Use atomic selectors to prevent unnecessary re-renders
  const isFavorite = useWafiStore(useCallback(s => s.favorites.includes(id), [id])) || false;
  const toggleFavorite = useAppStore(s => s.toggleFavorite);
  const updateWordProgress = useAppStore(s => s.updateWordProgress);
  const metadata = useWafiStore(useCallback(s => s.userWords[id], [id])) || { state: 'new' as const, nextReview: '' };
  
  const playQueue = useAudioQueue(s => s.playQueue);
  const stopAll = useAudioQueue(s => s.stopAll);
  const isAnyPlaying = useAudioQueue(s => s.isPlaying);
  const queue = useAudioQueue(s => s.queue);
  
  const allExamples: Example[] = [
    ...(exampleEn && exampleAr ? [{ en: exampleEn, ar: exampleAr }] : []),
    ...(examples || [])
  ];

  useEffect(() => {
    setIsRevealed(!isListenFirst);
  }, [id, isListenFirst]);

  const handlePlay = useCallback((textToPlay: string, playbackId: string, speed: number, repeatCount: number) => {
    const fullPlaybackId = `${id}_${playbackId}`;
    const isThisPlaying = isAnyPlaying && queue.some(item => item.id.startsWith(fullPlaybackId));

    if (isThisPlaying) {
      stopAll();
      return;
    }
    
    analytics.track({ type: 'word_played', wordId: id, speed, repeat: repeatCount });

    const items = Array.from({ length: repeatCount }).map((_, i) => ({
      id: `${fullPlaybackId}_${i}`,
      text: textToPlay,
      speed: speed
    }));
    
    playQueue(items);

    if (isListenFirst && !isRevealed) {
      setTimeout(() => setIsRevealed(true), 1500);
    }
  }, [id, isAnyPlaying, queue, stopAll, playQueue, isListenFirst, isRevealed]);

  const handleSRSAction = useCallback((quality: number) => {
    updateWordProgress(id, quality);
    analytics.track({ 
      type: 'review_completed', 
      wordId: id, 
      quality, 
      nextReview: useAppStore.getState().getWordMetadata(id).nextReview 
    });
    
    if (onActionComplete) {
      onActionComplete(quality);
    } else {
      toast.success(quality === 2 ? "Easy!" : quality === 1 ? "Got it" : "Keep practicing");
    }
  }, [id, updateWordProgress, onActionComplete]);

  const hasExamples = allExamples.length > 0;

  const stateColors = {
    new: "bg-blue-500",
    learning: "bg-orange-500",
    reviewing: "bg-emerald-500",
    mastered: "bg-purple-500"
  };

  return (
    <div className={cn("w-full perspective-1000", className)}>
      <motion.div
        className="w-full grid [transform-style:preserve-3d]"
        initial={false}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
      >
        <Card className="[grid-area:1/1] [backface-visibility:hidden] w-full flex flex-col p-5 sm:p-7 border-white/5 bg-card rounded-[2.5rem] h-[520px] shadow-2xl">
          <div className="flex justify-between items-start mb-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className={cn("w-2 h-2 rounded-full", stateColors[metadata.state])} title={metadata.state} />
              {tags?.[0] && <span className="px-2.5 py-1 bg-secondary text-muted-foreground text-[10px] font-bold font-sans uppercase rounded-full border border-white/5">{tags[0]}</span>}
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {hasExamples && (
                <button onClick={() => setIsFlipped(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold font-cairo text-muted-foreground bg-secondary/50 rounded-full border border-white/5 transition-premium">
                  <RefreshCw className="w-3 h-3" /> الأمثلة
                </button>
              )}
              <button onClick={(e) => { e.stopPropagation(); toggleFavorite(id); }} className="text-muted-foreground hover:text-red-500 transition-premium p-1">
                <Heart className={cn("w-5 h-5", isFavorite && "fill-red-500 text-red-500")} />
              </button>
            </div>
          </div>
          
          <div className="flex-1 flex flex-col items-center justify-center text-center py-4 px-2 relative overflow-hidden">
            <AnimatePresence mode="wait">
              {!isRevealed ? (
                <motion.div 
                  key="hidden"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.1 }}
                  className="flex flex-col items-center gap-4 cursor-pointer group"
                  onClick={() => setIsRevealed(true)}
                >
                  <div className="w-20 h-20 rounded-full bg-secondary/50 flex items-center justify-center group-hover:scale-110 transition-premium">
                    <EyeOff className="w-8 h-8 text-muted-foreground/50" />
                  </div>
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Listen first...</span>
                </motion.div>
              ) : (
                <motion.div 
                  key="revealed"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full flex flex-col items-center gap-3"
                >
                  <h3 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight leading-tight w-full">{en}</h3>
                  <h4 className="text-xl sm:text-2xl font-bold text-primary font-cairo mt-2">{ar}</h4>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {mode === 'review' && isRevealed ? (
            <div className="flex flex-col gap-4 mt-auto pt-6">
              <div className="grid grid-cols-3 gap-2">
                <button 
                  onClick={() => handleSRSAction(0)}
                  className="flex flex-col items-center gap-1 p-3 rounded-2xl bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 transition-premium"
                >
                  <span className="text-xs font-bold">Forgot</span>
                  <span className="text-[10px] opacity-70">1d</span>
                </button>
                <button 
                  onClick={() => handleSRSAction(1)}
                  className="flex flex-col items-center gap-1 p-3 rounded-2xl bg-orange-500/10 text-orange-500 border border-orange-500/20 hover:bg-orange-500/20 transition-premium"
                >
                  <span className="text-xs font-bold">Hard</span>
                  <span className="text-[10px] opacity-70">3d</span>
                </button>
                <button 
                  onClick={() => handleSRSAction(2)}
                  className="flex flex-col items-center gap-1 p-3 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20 transition-premium"
                >
                  <span className="text-xs font-bold">Easy</span>
                  <span className="text-[10px] opacity-70">7d+</span>
                </button>
              </div>
              <button 
                onClick={() => handlePlay(en, 'main', 1, 1)}
                className="w-full h-10 rounded-xl bg-secondary text-foreground text-xs font-bold flex items-center justify-center gap-2 border border-white/5"
              >
                <Volume2 className="w-4 h-4" /> Repeat Audio
              </button>
            </div>
          ) : (
            <AudioControls wordId={id} textToPlay={en} playbackId="main" onPlay={handlePlay} />
          )}
        </Card>

        {hasExamples && (
          <Card className="[grid-area:1/1] [backface-visibility:hidden] w-full flex flex-col p-5 sm:p-7 border-white/5 bg-secondary/30 backdrop-blur-2xl rounded-[2.5rem] [transform:rotateY(180deg)] h-[520px] shadow-2xl">
            <div className="flex justify-between items-start mb-4">
              <span className="px-3 py-1 bg-secondary text-muted-foreground text-[10px] font-bold font-sans uppercase rounded-full border border-white/5">Examples ({allExamples.length})</span>
              <button onClick={() => setIsFlipped(false)} className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold font-cairo text-muted-foreground bg-card rounded-full border border-white/5">
                <RefreshCw className="w-3 h-3" /> الكلمة
              </button>
            </div>
            <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-8 py-2 scrollbar-hide">
              {allExamples.map((ex, idx) => (
                <div key={idx} className="flex flex-col gap-3 pb-6 border-b border-white/5 last:border-0 last:pb-0">
                  <div className="text-center">
                    <p className={cn("text-lg sm:text-xl font-sans text-foreground italic leading-relaxed", !isRevealed && "blur-md select-none")}>"{ex.en}"</p>
                    <p className={cn("text-base sm:text-lg font-cairo text-primary mt-1", !isRevealed && "blur-md select-none")}>{ex.ar}</p>
                  </div>
                  <AudioControls wordId={id} textToPlay={ex.en} playbackId={`ex_${idx}`} compact onPlay={handlePlay} />
                </div>
              ))}
            </div>
          </Card>
        )}
      </motion.div>
    </div>
  );
});

Flashcard.displayName = "Flashcard";
