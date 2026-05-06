"use client";

import { useEffect, useState } from "react";
import { WordItem } from "@/types";
import { useAudioQueue } from "@/store/useAudioQueue";
import { Button } from "@/components/ui/button";
import { PlayCircle, PauseCircle, Square, Volume2, SkipForward, SkipBack } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function ListeningMode({ words }: { words: WordItem[] }) {
  const { playQueue, pauseQueue, resumeQueue, stopAll, next, prev, isPlaying, queue, currentIndex } = useAudioQueue();
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    return () => {
      stopAll(); // Cleanup on unmount
    };
  }, [stopAll]);

  const handleStart = () => {
    setHasStarted(true);
    playQueue(words.map(w => ({ id: w.id, text: w.en, speed: 0.9 })));
  };

  const currentWord = queue[currentIndex] ? words.find(w => w.id === queue[currentIndex].id) : null;

  if (!hasStarted) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-slate-50 dark:bg-slate-800/30 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
        <div className="bg-emerald-100 dark:bg-emerald-900/50 p-6 rounded-full mb-6">
          <HeadphonesIcon className="w-12 h-12 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h2 className="text-2xl font-bold font-cairo mb-2">وضع الاستماع التلقائي</h2>
        <p className="text-slate-500 font-cairo mb-8 text-center max-w-md">
          استمع لجميع الكلمات بالترتيب مع توقف تلقائي قصير بين كل كلمة. مثالي للمراجعة أثناء الانشغال!
        </p>
        <Button onClick={handleStart} size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-2 font-cairo font-bold">
          <PlayCircle className="w-5 h-5" />
          بدء الاستماع
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto mt-8">
      {currentWord ? (
        <motion.div
          key={currentWord.id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-slate-800 rounded-3xl p-10 text-center shadow-lg border border-slate-100 dark:border-slate-700 mb-8"
        >
          <div className="inline-flex justify-center items-center w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-900/30 mb-6 relative">
            <Volume2 className={cn("w-8 h-8 text-emerald-500", isPlaying && "animate-pulse")} />
            {isPlaying && (
              <span className="absolute w-full h-full rounded-full border-2 border-emerald-400 animate-ping opacity-20"></span>
            )}
          </div>
          <h2 className="text-5xl font-bold font-sans text-slate-800 dark:text-slate-100 mb-4 tracking-tight">
            {currentWord.en}
          </h2>
          <h3 className="text-2xl font-bold font-cairo text-emerald-600 dark:text-emerald-400">
            {currentWord.ar}
          </h3>
          <p className="text-slate-500 font-cairo mt-6">{currentIndex + 1} / {queue.length}</p>
        </motion.div>
      ) : (
        <div className="py-20 text-center">
          <h2 className="text-2xl font-cairo font-bold text-slate-700 mb-4">اكتملت القائمة! 🎉</h2>
          <Button variant="outline" onClick={() => handleStart()} className="rounded-xl font-cairo font-bold">
            إعادة الاستماع
          </Button>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-full shadow-md border border-slate-100 dark:border-slate-700 w-fit mx-auto">
        <Button variant="ghost" size="icon" onClick={prev} disabled={currentIndex <= 0} className="rounded-full">
          <SkipBack className="w-5 h-5" />
        </Button>
        
        {isPlaying ? (
          <Button variant="default" size="icon" onClick={pauseQueue} className="w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-700">
            <PauseCircle className="w-8 h-8" />
          </Button>
        ) : (
          <Button variant="default" size="icon" onClick={resumeQueue} className="w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-700">
            <PlayCircle className="w-8 h-8" />
          </Button>
        )}

        <Button variant="ghost" size="icon" onClick={stopAll} className="rounded-full hover:text-red-500">
          <Square className="w-5 h-5" />
        </Button>

        <Button variant="ghost" size="icon" onClick={next} disabled={currentIndex >= queue.length - 1} className="rounded-full">
          <SkipForward className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}

function HeadphonesIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3" />
    </svg>
  );
}
