"use client";

import { Volume2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAudioQueue } from "@/store/useAudioQueue";
import { useState } from "react";

interface AudioPlayerProps {
  text: string;
  className?: string;
  showSpeedControl?: boolean;
}

export function AudioPlayer({ text, className, showSpeedControl = true }: AudioPlayerProps) {
  const { playItem, stopAll } = useAudioQueue();
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);

  const handlePlay = async () => {
    try {
      setIsPlaying(true);
      await playItem({ id: text, text, speed });
    } finally {
      setIsPlaying(false);
    }
  };

  const toggleSpeed = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSpeed(s => s === 1 ? 0.75 : s === 0.75 ? 0.5 : 1);
  };

  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <Button
        size="lg"
        variant="secondary"
        className={cn(
          "rounded-full w-14 h-14 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:hover:bg-emerald-800/60 text-emerald-600 dark:text-emerald-400 transition-all shadow-sm hover:scale-105 active:scale-95",
          isPlaying && "animate-pulse shadow-emerald-200 dark:shadow-emerald-900/50"
        )}
        onClick={(e) => {
          e.stopPropagation();
          if (isPlaying) {
            stopAll();
            setIsPlaying(false);
          } else {
            handlePlay();
          }
        }}
        aria-label={isPlaying ? "إيقاف الصوت" : "تشغيل الصوت"}
      >
        {isPlaying ? (
          <Loader2 className="w-6 h-6 animate-spin" />
        ) : (
          <Volume2 className="w-6 h-6" />
        )}
      </Button>
      
      {showSpeedControl && (
        <button
          onClick={toggleSpeed}
          aria-label={`تغيير سرعة الصوت. السرعة الحالية ${speed}x`}
          className="text-xs font-bold text-slate-400 hover:text-emerald-500 transition-colors bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full font-sans focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          {speed}x
        </button>
      )}
    </div>
  );
}
