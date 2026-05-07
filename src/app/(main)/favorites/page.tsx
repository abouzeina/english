"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HeartOff, Loader2 } from "lucide-react";
import { useWafiStore } from "@/store/useAppStore";
import { Flashcard } from "@/components/features/Flashcard";
import { WordItem } from "@/types";
import { fetchWordsByIds } from "@/lib/content/actions";
import { GuestNotice } from "@/components/auth/guest-notice";

export default function FavoritesPage() {
  const favorites = useWafiStore(s => s.favorites) || [];
  const [favoriteWords, setFavoriteWords] = useState<WordItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (favorites.length > 0) {
      setIsLoading(true);
      fetchWordsByIds(favorites).then(words => {
        setFavoriteWords(words);
        setIsLoading(false);
      });
    } else {
      setFavoriteWords([]);
    }
  }, [favorites]);

  return (
    <div className="max-w-6xl mx-auto py-8 px-6">
      <GuestNotice />
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

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary opacity-20" />
          <p className="mt-4 text-sm font-cairo text-muted-foreground">جاري تحميل المفضلة...</p>
        </div>
      ) : favoriteWords.length > 0 ? (
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
