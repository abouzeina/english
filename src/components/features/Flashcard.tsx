"use client";

import { useState, useEffect, useCallback, memo, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Heart, Volume2, Loader2, RefreshCw, EyeOff } from "lucide-react";
import { useWafiStore, useAppStore } from "@/store/useAppStore";
import { toast } from "sonner";
import { useAudioQueue } from "@/store/useAudioQueue";
import { Example } from "@/types";
import { analytics } from "@/lib/analytics";
import { YouGlishWidget } from "./YouGlishWidget";
import { SpeakingPractice } from "./SpeakingPractice";
import { Video } from "lucide-react";

export interface FlashcardProps {
  id: string;
  en: string;
  ar: string;
  exampleEn?: string;
  exampleAr?: string;
  examples?: Example[];
  tags?: string[];
  className?: string;
  ipa?: string;
  
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
                  "min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 md:px-2 md:py-0.5 text-[10px] font-bold font-sans rounded-md transition-premium flex items-center justify-center",
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
                  "min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 md:px-2 md:py-0.5 text-[10px] font-bold font-sans rounded-md transition-premium flex items-center justify-center",
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
  id, en, ar, exampleEn, exampleAr, examples, tags, className, ipa,
  mode = 'study',
  isListenFirst = false,
  onActionComplete
}: FlashcardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isRevealed, setIsRevealed] = useState(!isListenFirst);
  const [mounted, setMounted] = useState(false);
  const [showYouGlish, setShowYouGlish] = useState(false);
  const revealTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMounted(true);
    return () => {
      if (revealTimeoutRef.current) clearTimeout(revealTimeoutRef.current);
    };
  }, []);
  
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
      if (revealTimeoutRef.current) clearTimeout(revealTimeoutRef.current);
      revealTimeoutRef.current = setTimeout(() => setIsRevealed(true), 1500);
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
    <div className={cn("w-full", className)}>
      <Card className="w-full flex flex-col p-5 sm:p-7 border-white/5 bg-card rounded-[2.5rem] h-[520px] shadow-2xl relative overflow-hidden group">
        <div className="flex justify-between items-start mb-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className={cn("w-2 h-2 rounded-full", stateColors[metadata.state])} title={metadata.state} />
            {tags?.[0] && <span className="px-2.5 py-1 bg-secondary text-muted-foreground text-[10px] font-bold font-sans uppercase rounded-full border border-white/5">{tags[0]}</span>}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button onClick={(e) => { e.stopPropagation(); toggleFavorite(id); }} className="text-muted-foreground hover:text-red-500 transition-premium p-1">
              <Heart className={cn("w-5 h-5", isFavorite && "fill-red-500 text-red-500")} />
            </button>
          </div>
        </div>
        
        <div 
          className="flex-1 flex flex-col items-center justify-center text-center py-4 px-2 relative overflow-hidden min-h-0 cursor-pointer"
          onClick={() => setIsExpanded(true)}
        >
          <AnimatePresence mode="wait">
            {!isRevealed ? (
              <motion.div 
                key="hidden"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                className="flex flex-col items-center gap-4 group/reveal"
                onClick={(e) => { e.stopPropagation(); setIsRevealed(true); }}
              >
                <div className="w-20 h-20 rounded-full bg-secondary/50 flex items-center justify-center group-hover/reveal:scale-110 transition-premium">
                  <EyeOff className="w-8 h-8 text-muted-foreground/50" />
                </div>
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Listen first...</span>
              </motion.div>
            ) : (
              <motion.div 
                key="revealed"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full flex flex-col items-center gap-3 overflow-y-auto max-h-full py-4 scrollbar-hide"
              >
                <h3 className={cn(
                  "font-bold text-foreground tracking-tight leading-tight w-full",
                  en.length > 100 ? "text-xl sm:text-2xl" : 
                  en.length > 60 ? "text-2xl sm:text-3xl" : 
                  "text-3xl sm:text-4xl"
                )}>
                  <span dir="ltr">{en}</span>
                </h3>
                {ipa && (
                  <p className="text-sm font-sans text-muted-foreground mt-1" dir="ltr">{ipa}</p>
                )}
                <h4 className={cn(
                  "font-bold text-primary font-cairo mt-2",
                  ar.length > 100 ? "text-base sm:text-lg" : 
                  ar.length > 60 ? "text-lg sm:text-xl" : 
                  "text-xl sm:text-2xl"
                )}>
                  <span dir="rtl">{ar}</span>
                </h4>
              </motion.div>
            )}
          </AnimatePresence>
          
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-card to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
             <span className="text-[10px] font-bold text-teal-500 uppercase tracking-widest flex items-center gap-2">
               Click to expand <RefreshCw className="w-3 h-3" />
             </span>
          </div>
        </div>

        {mode === 'review' && isRevealed ? (
          <div className="flex flex-col gap-4 mt-auto pt-6">
            <div className="grid grid-cols-3 gap-2">
              <button 
                onClick={(e) => { e.stopPropagation(); handleSRSAction(0); }}
                className="flex flex-col items-center gap-1 p-3 rounded-2xl bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 transition-premium"
              >
                <span className="text-xs font-bold">Forgot</span>
                <span className="text-[10px] opacity-70">1d</span>
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); handleSRSAction(1); }}
                className="flex flex-col items-center gap-1 p-3 rounded-2xl bg-orange-500/10 text-orange-500 border border-orange-500/20 hover:bg-orange-500/20 transition-premium"
              >
                <span className="text-xs font-bold">Hard</span>
                <span className="text-[10px] opacity-70">3d</span>
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); handleSRSAction(2); }}
                className="flex flex-col items-center gap-1 p-3 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20 transition-premium"
              >
                <span className="text-xs font-bold">Easy</span>
                <span className="text-[10px] opacity-70">7d+</span>
              </button>
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); handlePlay(en, 'main', 1, 1); }}
              className="w-full h-10 rounded-xl bg-secondary text-foreground text-xs font-bold flex items-center justify-center gap-2 border border-white/5"
            >
              <Volume2 className="w-4 h-4" /> Repeat Audio
            </button>
          </div>
        ) : (
          <AudioControls wordId={id} textToPlay={en} playbackId="main" onPlay={handlePlay} />
        )}
      </Card>

      {/* Premium Full-Screen Modal via Portal */}
      {mounted && createPortal(
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-8 bg-background/80 backdrop-blur-xl"
              onClick={() => setIsExpanded(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="w-full max-w-4xl max-h-[90vh] bg-card/50 border border-white/10 rounded-[3rem] shadow-2xl overflow-hidden flex flex-col relative"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Close Button */}
                <button 
                  onClick={() => {
                    setIsExpanded(false);
                    setShowYouGlish(false);
                  }}
                  className="absolute top-6 right-6 z-10 p-3 bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground rounded-full transition-premium backdrop-blur-md border border-white/5"
                >
                  <RefreshCw className="w-5 h-5 rotate-45" />
                </button>

                <div className="flex-1 overflow-y-auto p-8 sm:p-12 scrollbar-hide">
                  <div className="max-w-2xl mx-auto space-y-12">
                    {/* Phrase Section */}
                    <div className="text-center space-y-6 pt-8">
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                      >
                        <h2 className="text-4xl sm:text-6xl font-bold text-foreground tracking-tight leading-tight">
                          <span dir="ltr">{en}</span>
                        </h2>
                        {ipa && (
                          <p className="text-xl sm:text-2xl font-sans text-muted-foreground mt-4 tracking-wider" dir="ltr">{ipa}</p>
                        )}
                        <h3 className="text-2xl sm:text-3xl font-bold text-primary font-cairo mt-6">
                          <span dir="rtl">{ar}</span>
                        </h3>
                      </motion.div>

                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="flex flex-wrap justify-center gap-3"
                      >
                        {tags?.map((tag, i) => (
                          <span key={i} className="px-4 py-1.5 bg-secondary/50 text-muted-foreground text-xs font-bold font-sans uppercase rounded-full border border-white/5">
                            {tag}
                          </span>
                        ))}
                      </motion.div>
                    </div>

                    <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 }}
                      className="space-y-6"
                    >
                      <AudioControls wordId={id} textToPlay={en} playbackId="modal_main" onPlay={handlePlay} />
                      <SpeakingPractice 
                        targetText={en} 
                        onAudioPlay={() => handlePlay(en, 'modal_main_practice', 1, 1)}
                      />
                    </motion.div>

                    {/* YouGlish Section moved up */}
                    <div className="pt-2 pb-4 w-full flex flex-col items-center">
                      {!showYouGlish ? (
                        <button
                          onClick={() => setShowYouGlish(true)}
                          className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 transition-all hover:scale-105 shadow-lg group w-full justify-center max-w-[600px]"
                        >
                          <Video className="w-6 h-6 group-hover:scale-110 transition-transform" />
                          <span className="font-bold font-cairo text-sm">أمثلة من يوتيوب (YouGlish)</span>
                        </button>
                      ) : (
                        <motion.div 
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="w-full flex flex-col items-center gap-4"
                        >
                          <div className="flex items-center justify-between w-full max-w-[600px] mb-2 px-4">
                            <span className="text-sm font-bold font-sans text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                              <Video className="w-4 h-4 text-red-500" /> Real Life Examples
                            </span>
                            <button 
                              onClick={() => setShowYouGlish(false)}
                              className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors px-2 py-1 bg-secondary/50 rounded-lg"
                            >
                              Close
                            </button>
                          </div>
                          <YouGlishWidget word={en} className="w-full" />
                        </motion.div>
                      )}
                    </div>

                    {/* Examples Section */}
                    {hasExamples && (
                      <div className="space-y-8 pt-8">
                        <div className="flex items-center gap-4">
                          <div className="h-px flex-1 bg-white/5" />
                          <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-widest font-sans">Examples</h4>
                          <div className="h-px flex-1 bg-white/5" />
                        </div>
                        
                        <div className="grid gap-6">
                          {allExamples.map((ex, idx) => (
                            <motion.div 
                              key={idx}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.4 + (idx * 0.1) }}
                              className="bg-secondary/20 p-6 rounded-[2rem] border border-white/5 space-y-4 hover:bg-secondary/30 transition-premium"
                            >
                              <div className="text-center">
                                <p className="text-xl font-sans text-foreground italic leading-relaxed"><span dir="ltr">"{ex.en}"</span></p>
                                <p className="text-lg font-cairo text-primary mt-2">{ex.ar}</p>
                              </div>
                              <AudioControls wordId={id} textToPlay={ex.en} playbackId={`modal_ex_${idx}`} compact onPlay={handlePlay} />
                              <SpeakingPractice 
                                targetText={ex.en} 
                                onAudioPlay={() => handlePlay(ex.en, `modal_ex_practice_${idx}`, 1, 1)}
                                className="mt-2"
                              />
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
});

Flashcard.displayName = "Flashcard";
