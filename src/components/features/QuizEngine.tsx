"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WordItem } from "@/types";
import { useWafiStore, useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/button";
import { Volume2, Trophy, RotateCcw, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuizEngineProps {
  words: WordItem[];
  lessonId: string;
}

export function QuizEngine({ words, lessonId }: QuizEngineProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  
  // Atomic Selectors
  const markLessonCompleted = useAppStore(s => s.markLessonCompleted);
  const hasHydrated = useWafiStore(s => true) ?? false;

  // Generate Questions
  const questions = useMemo(() => {
    return words.map((word) => {
      const type = Math.random() > 0.5 ? "translation" : "listening";
      const otherWords = words.filter(w => w.id !== word.id).map(w => w.ar);
      const shuffledOthers = otherWords.sort(() => 0.5 - Math.random()).slice(0, 3);
      const options = [word.ar, ...shuffledOthers].sort(() => 0.5 - Math.random());
      
      return {
        id: word.id,
        type,
        en: word.en,
        correct: word.ar,
        options,
      };
    });
  }, [words]);

  if (words.length < 2) {
    return (
      <div className="text-center py-20 text-slate-500 font-cairo">
        يحتاج هذا الدرس إلى كلمتين على الأقل لبدء الاختبار.
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];

  const playWord = (text: string) => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-US";
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  };

  const handleSelect = (option: string) => {
    if (selectedOption) return; 

    setSelectedOption(option);
    const correct = option === currentQuestion.correct;
    setIsCorrect(correct);

    if (correct) {
      setScore(s => s + 10);
      setTimeout(() => {
        handleNext();
      }, 1000);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(c => c + 1);
      setSelectedOption(null);
      setIsCorrect(null);
    } else {
      setIsFinished(true);
      markLessonCompleted(lessonId);
    }
  };

  const restart = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsCorrect(null);
    setScore(0);
    setIsFinished(false);
  };

  if (isFinished) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md mx-auto text-center py-12"
      >
        <div className="w-24 h-24 mx-auto bg-yellow-100 dark:bg-yellow-900/50 rounded-full flex items-center justify-center mb-6">
          <Trophy className="w-12 h-12 text-yellow-500" />
        </div>
        <h2 className="text-4xl font-bold font-cairo text-slate-800 dark:text-slate-100 mb-2">
          عمل رائع!
        </h2>
        <p className="text-slate-500 font-cairo mb-8 text-lg">
          لقد أكملت الاختبار بنجاح وكسبت <span className="font-bold text-emerald-600 dark:text-emerald-400">{score} XP</span>
        </p>

        <div className="flex gap-4 justify-center">
          <Button onClick={restart} variant="outline" className="rounded-xl font-cairo font-bold gap-2">
            <RotateCcw className="w-4 h-4" />
            إعادة الاختبار
          </Button>
          <Button onClick={() => window.history.back()} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-cairo font-bold">
            العودة للمستوى
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="max-w-xl mx-auto mt-4">
      <div className="mb-8">
        <div className="flex justify-between text-sm font-bold font-sans text-slate-500 mb-2">
          <span>{currentIndex + 1} / {questions.length}</span>
          <span className="text-yellow-500">{score} XP</span>
        </div>
        <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-emerald-500 rounded-full"
            initial={{ width: `${((currentIndex) / questions.length) * 100}%` }}
            animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-slate-200 dark:border-slate-700 mb-8 text-center min-h-[200px] flex flex-col items-center justify-center">
            {currentQuestion.type === "listening" ? (
              <div className="flex flex-col items-center gap-4">
                <p className="text-slate-500 font-cairo mb-2">استمع واختر الترجمة الصحيحة</p>
                <Button 
                  onClick={() => playWord(currentQuestion.en)}
                  className="w-20 h-20 rounded-full bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400"
                  variant="secondary"
                >
                  <Volume2 className="w-10 h-10" />
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <p className="text-slate-500 font-cairo mb-2">ما معنى هذه الكلمة؟</p>
                <h2 className="text-4xl font-bold font-sans text-slate-800 dark:text-slate-100">
                  {currentQuestion.en}
                </h2>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {currentQuestion.options.map((option, idx) => {
              const isSelected = selectedOption === option;
              const isCorrectOption = option === currentQuestion.correct;
              
              let stateClass = "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20";
              
              if (selectedOption) {
                if (isCorrectOption) {
                  stateClass = "bg-emerald-100 dark:bg-emerald-900 border-emerald-500 text-emerald-700 dark:text-emerald-300";
                } else if (isSelected) {
                  stateClass = "bg-red-50 dark:bg-red-900/30 border-red-500 text-red-600 dark:text-red-400";
                } else {
                  stateClass = "bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 opacity-50";
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelect(option)}
                  disabled={selectedOption !== null}
                  className={cn(
                    "p-4 rounded-2xl border-2 text-xl font-bold font-cairo transition-all duration-300",
                    stateClass
                  )}
                >
                  {option}
                </button>
              );
            })}
          </div>

          <AnimatePresence>
            {selectedOption && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 flex flex-col sm:flex-row items-center justify-between p-4 rounded-2xl border-2 gap-4"
                style={{
                  backgroundColor: isCorrect ? "var(--emerald-50)" : "var(--red-50)",
                  borderColor: isCorrect ? "var(--emerald-200)" : "var(--red-200)",
                }}
              >
                <div className="flex items-center gap-3">
                  {isCorrect ? (
                    <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                  ) : (
                    <XCircle className="w-8 h-8 text-red-500" />
                  )}
                  <div className="text-right">
                    <h4 className={cn("font-bold font-cairo text-lg", isCorrect ? "text-emerald-700" : "text-red-700")}>
                      {isCorrect ? "إجابة صحيحة!" : "حاول مرة أخرى!"}
                    </h4>
                    {!isCorrect && (
                      <p className="text-red-600 font-cairo text-sm">
                        الإجابة الصحيحة هي: {currentQuestion.correct}
                      </p>
                    )}
                  </div>
                </div>

                {!isCorrect && (
                  <Button onClick={handleNext} className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white rounded-xl font-cairo font-bold">
                    المتابعة
                  </Button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
