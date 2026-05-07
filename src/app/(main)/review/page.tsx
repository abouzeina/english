"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useWafiStore, useAppStore } from "@/store/useAppStore";
import { Flashcard } from "@/components/features/Flashcard";
import { Button } from "@/components/ui/button";
import { RotateCcw, Headphones, CheckCircle2, Loader2, ArrowRight, Clock, Target, Star, Zap } from "lucide-react";
import Link from "next/link";
import { WordItem } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { fetchWordsByIds } from "@/lib/content/actions";
import { GuestNotice } from "@/components/auth/guest-notice";

export default function ReviewPage() {
  const hasHydrated = useWafiStore(s => true) ?? false;
  const startSession = useAppStore(s => s.startSession);
  const endSession = useAppStore(s => s.endSession);
  const updateWordProgress = useAppStore(s => s.updateWordProgress);

  const [queue, setQueue] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loadedWords, setLoadedWords] = useState<Record<string, WordItem>>({});
  const [isFinished, setIsFinished] = useState(false);
  const [isListenFirst, setIsListenFirst] = useState(false);
  const [sessionStats, setSessionStats] = useState<any>(null);
  const [isLoadingNext, setIsLoadingNext] = useState(false);

  // 1. Initialize queue
  useEffect(() => {
    if (hasHydrated) {
      const dueIds = useAppStore.getState().getReviewQueue();
      setQueue(dueIds.sort(() => Math.random() - 0.5));
      startSession();
    }
  }, [hasHydrated, startSession]);

  // 2. Pre-fetch logic: Load words in chunks
  useEffect(() => {
    const fetchNextBatch = async () => {
      const wordsToFetch = queue.slice(currentIndex, currentIndex + 5)
        .filter(id => !loadedWords[id]);

      if (wordsToFetch.length > 0) {
        setIsLoadingNext(true);
        const details = await fetchWordsByIds(wordsToFetch);
        setLoadedWords(prev => {
          const next = { ...prev };
          details.forEach(w => { next[w.id] = w; });
          return next;
        });
        setIsLoadingNext(false);
      }
    };

    if (queue.length > 0 && currentIndex < queue.length) {
      fetchNextBatch();
    }
  }, [queue, currentIndex, loadedWords]);

  const currentWord = useMemo(() => {
    const id = queue[currentIndex];
    return id ? loadedWords[id] : null;
  }, [queue, currentIndex, loadedWords]);

  const handleNext = useCallback((quality: number) => {
    if (currentIndex < queue.length - 1) {
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
      }, 150); 
    } else {
      const stats = endSession();
      setSessionStats(stats);
      setIsFinished(true);
    }
  }, [currentIndex, queue.length, endSession]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isFinished || !currentWord) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch(e.key) {
        case '1': updateWordProgress(currentWord.id, 0); handleNext(0); break;
        case '2': updateWordProgress(currentWord.id, 1); handleNext(1); break;
        case '3': updateWordProgress(currentWord.id, 2); handleNext(2); break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentWord, isFinished, updateWordProgress, handleNext]);

  if (!hasHydrated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary opacity-20" />
      </div>
    );
  }

  if (queue.length === 0 && !isFinished) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
        <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="w-10 h-10 text-primary opacity-40" />
        </div>
        <h1 className="text-3xl font-bold mb-4 tracking-tight">All caught up</h1>
        <p className="text-muted-foreground font-cairo max-w-md mb-10 leading-relaxed">
          ذاكرتك في حالة ممتازة اليوم. لا توجد كلمات تحتاج للمراجعة حالياً.
        </p>
        <Link href="/levels">
          <Button size="lg" className="rounded-2xl h-14 px-8 font-bold bg-secondary text-foreground hover:bg-secondary/80">Explore Lessons</Button>
        </Link>
      </div>
    );
  }

  if (isFinished) {
    const duration = sessionStats ? Math.round((Date.now() - sessionStats.startTime) / 60000) : 0;
    const accuracy = sessionStats ? Math.round((sessionStats.correct / sessionStats.total) * 100) : 0;

    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto w-full pt-12 pb-20"
      >
        {/* Results UI remains the same but with sessionStats safety */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest mb-6">
            Session Complete
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-editorial">Quiet Progress.</h1>
          <p className="text-muted-foreground font-cairo text-lg">لقد قمت بتحسين استبقاء كلماتك اليوم بنجاح.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
           <div className="glass-panel p-8 rounded-[2rem] border-white/5 bg-secondary/20 flex flex-col items-center text-center">
              <Target className="w-6 h-6 text-primary mb-4 opacity-50" />
              <span className="text-3xl font-bold mb-1">{accuracy}%</span>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Retention Rate</span>
           </div>
           <div className="glass-panel p-8 rounded-[2rem] border-white/5 bg-secondary/20 flex flex-col items-center text-center">
              <Clock className="w-6 h-6 text-blue-500 mb-4 opacity-50" />
              <span className="text-3xl font-bold mb-1">{duration} min</span>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Time Focused</span>
           </div>
           <div className="glass-panel p-8 rounded-[2rem] border-white/5 bg-secondary/20 flex flex-col items-center text-center">
              <Zap className="w-6 h-6 text-yellow-500 mb-4 opacity-50" />
              <span className="text-3xl font-bold mb-1">+{sessionStats?.xpGained || 0}</span>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">XP Earned</span>
           </div>
           <div className="glass-panel p-8 rounded-[2rem] border-white/5 bg-secondary/20 flex flex-col items-center text-center">
              <Star className="w-6 h-6 text-purple-500 mb-4 opacity-50" />
              <span className="text-3xl font-bold mb-1">{sessionStats?.focusWordsIdentified || 0}</span>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Focus Words Found</span>
           </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/" className="flex-1">
            <Button variant="ghost" className="w-full h-16 rounded-[2rem] font-bold text-lg font-cairo">العودة للرئيسية</Button>
          </Link>
          <Button onClick={() => window.location.reload()} className="flex-1 h-16 rounded-[2rem] bg-foreground text-background font-bold text-lg gap-2 hover:scale-[1.02] transition-premium">
            <RotateCcw className="w-5 h-5" /> مراجعة أخرى
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center pt-8 px-4">
      <GuestNotice />
      <div className="w-full flex items-center justify-between mb-12 px-2">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-muted-foreground hover:text-foreground transition-premium">
            <ArrowRight className="w-5 h-5 rtl:rotate-180" />
          </Link>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Session Flow</span>
            <span className="text-sm font-bold font-sans">{currentIndex + 1} / {queue.length}</span>
          </div>
        </div>
        
        <div className="flex-1 mx-12 h-1.5 bg-secondary/50 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-primary shadow-[0_0_12px_rgba(var(--primary),0.3)]" 
            initial={{ width: 0 }}
            animate={{ width: `${((currentIndex + 1) / queue.length) * 100}%` }}
            transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
          />
        </div>

        <button 
          onClick={() => setIsListenFirst(!isListenFirst)}
          className={cn(
            "p-2.5 rounded-2xl transition-premium border border-transparent",
            isListenFirst ? "bg-primary/10 text-primary border-primary/20" : "bg-secondary/50 text-muted-foreground hover:text-foreground"
          )}
          title="Listen First Mode"
        >
          <Headphones className="w-5 h-5" />
        </button>
      </div>

      <div className="w-full relative">
        <AnimatePresence mode="wait">
          {currentWord ? (
            <motion.div
              key={currentWord.id}
              initial={{ opacity: 0, x: 20, filter: 'blur(10px)' }}
              animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, x: -20, filter: 'blur(10px)' }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
              className="w-full"
            >
              <Flashcard 
                {...currentWord} 
                mode="review" 
                isListenFirst={isListenFirst}
                onActionComplete={handleNext}
              />
            </motion.div>
          ) : (
            <div className="w-full h-80 flex flex-col items-center justify-center text-muted-foreground gap-4">
               <Loader2 className="w-8 h-8 animate-spin opacity-20" />
               <p className="text-xs font-bold uppercase tracking-widest">جاري تحضير الكلمات...</p>
            </div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-12 flex items-center gap-8 text-muted-foreground/30 text-[9px] font-bold uppercase tracking-[0.2em] font-sans">
        <span className="flex items-center gap-2 transition-premium hover:text-muted-foreground/60"><div className="w-4 h-4 rounded-md border border-current flex items-center justify-center text-[7px]">SPC</div> REVEAL</span>
        <span className="flex items-center gap-2 transition-premium hover:text-muted-foreground/60"><div className="w-4 h-4 rounded-md border border-current flex items-center justify-center text-[7px]">1-3</div> SCORE</span>
      </div>
    </div>
  );
}
