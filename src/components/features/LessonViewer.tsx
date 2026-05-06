"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Layers, Headphones, HelpCircle, ChevronRight } from "lucide-react";
import { Lesson, WordItem } from "@/types";
import { Flashcard } from "@/components/features/Flashcard";
import { Button } from "@/components/ui/button";
import { useWafiStore, useAppStore } from "@/store/useAppStore";
import Link from "next/link";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";

const ListeningMode = dynamic(() => import("./ListeningMode").then(m => m.ListeningMode), {
  loading: () => <div className="py-20 text-center font-cairo text-slate-500 animate-pulse">جاري تحميل مسجل الصوت...</div>
});

const QuizEngine = dynamic(() => import("./QuizEngine").then(m => m.QuizEngine), {
  loading: () => <div className="py-20 text-center font-cairo text-slate-500 animate-pulse">جاري تحميل نظام الاختبار...</div>
});

interface LessonViewerProps {
  lesson: Lesson;
  words: WordItem[];
}

export function LessonViewer({ lesson, words }: LessonViewerProps) {
  const [activeMode, setActiveMode] = useState<"flashcards" | "listening" | "quiz">("flashcards");
  
  // Atomic Selectors
  const completedLessons = useWafiStore(s => s.completedLessons) || [];
  const markLessonCompleted = useAppStore(s => s.markLessonCompleted);
  
  const isCompleted = completedLessons.includes(lesson.id);

  const modes = [
    { id: "flashcards", label: "البطاقات", icon: Layers },
    { id: "listening", label: "الاستماع", icon: Headphones },
    { id: "quiz", label: "الاختبار", icon: HelpCircle },
  ] as const;

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 pb-32 md:pb-8">
      <div className="flex items-center gap-2 text-sm text-slate-500 font-cairo mb-6">
        <Link href={`/levels/${lesson.levelId}`} className="hover:text-emerald-600 transition-colors">
          رجوع للمستوى
        </Link>
        <ChevronRight className="w-4 h-4 rotate-180" />
        <span className="text-slate-900 dark:text-slate-200 font-bold">{lesson.titleAr}</span>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white font-sans flex items-center gap-3">
          {lesson.title}
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400 font-cairo">
          {lesson.descriptionAr}
        </p>
      </div>

      <div className="hidden md:flex bg-slate-100 dark:bg-slate-800/50 p-1 rounded-2xl mb-8 w-fit">
        {modes.map((mode) => {
          const Icon = mode.icon;
          return (
            <button
              key={mode.id}
              onClick={() => setActiveMode(mode.id)}
              className={cn(
                "flex items-center gap-2 px-6 py-3 rounded-xl font-cairo font-bold transition-all",
                activeMode === mode.id
                  ? "bg-white dark:bg-slate-700 text-emerald-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              )}
            >
              <Icon className="w-5 h-5" />
              {mode.label}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeMode}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeMode === "flashcards" && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {words.map((word, idx) => (
                  <motion.div 
                    key={word.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Flashcard {...word} />
                  </motion.div>
                ))}
              </div>

              <div className="mt-12 flex justify-center">
                <Button
                  size="lg"
                  variant={isCompleted ? "secondary" : "default"}
                  className={cn(
                    "font-cairo font-bold rounded-xl gap-2 transition-all duration-300",
                    isCompleted ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400" : "bg-emerald-600 hover:bg-emerald-700 text-white"
                  )}
                  onClick={() => markLessonCompleted(lesson.id)}
                  disabled={isCompleted}
                >
                  {isCompleted ? "تم إنجاز الدرس بنجاح!" : "تحديد كدرس مكتمل"}
                </Button>
              </div>
            </div>
          )}

          {activeMode === "listening" && <ListeningMode words={words} />}
          {activeMode === "quiz" && <QuizEngine words={words} lessonId={lesson.id} />}
        </motion.div>
      </AnimatePresence>

      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 pb-safe z-50">
        <div className="flex justify-around p-2">
          {modes.map((mode) => {
            const Icon = mode.icon;
            const isActive = activeMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => setActiveMode(mode.id)}
                className={cn(
                  "flex flex-col items-center justify-center w-full py-2 px-1 rounded-xl transition-all",
                  isActive ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20" : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
                )}
              >
                <Icon className={cn("w-6 h-6 mb-1 transition-transform", isActive && "scale-110")} />
                <span className="text-[10px] font-cairo font-bold">{mode.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
