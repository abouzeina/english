"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HeartOff, Search } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { Flashcard } from "@/components/features/Flashcard";
import wordsData from "@/data/words.json";
import { WordItem } from "@/types";

export default function FavoritesPage() {
  const { favorites } = useAppStore();

  const allWords = useMemo(() => {
    return wordsData as WordItem[];
  }, []);

  const favoriteWords = useMemo(() => {
    return allWords.filter(w => favorites.includes(w.id));
  }, [allWords, favorites]);

  return (
    <div className="max-w-6xl mx-auto py-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white font-cairo mb-4">
          المفضلة
        </h1>
        <p className="text-slate-600 dark:text-slate-400 font-cairo">
          قائمة بالكلمات والجمل التي قمت بحفظها للرجوع إليها لاحقاً.
        </p>
      </motion.div>

      {favoriteWords.length > 0 ? (
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
          layout
        >
          <AnimatePresence>
            {favoriteWords.map((word, idx) => (
              <motion.div
                key={word.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
                transition={{ delay: idx * 0.05 }}
                layout
              >
                <Flashcard {...word} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-20 text-center bg-slate-50 dark:bg-slate-800/30 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800"
        >
          <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-full mb-4">
            <HeartOff className="w-8 h-8 text-slate-400" />
          </div>
          <h2 className="text-2xl font-bold font-cairo text-slate-700 dark:text-slate-300 mb-2">لا توجد عناصر في المفضلة</h2>
          <p className="text-slate-500 font-cairo max-w-md">
            اضغط على علامة القلب في أي بطاقة لحفظها هنا لسهولة الوصول إليها لاحقاً.
          </p>
        </motion.div>
      )}
    </div>
  );
}
