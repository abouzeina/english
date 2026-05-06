"use client";

import { motion } from "framer-motion";
import { BookText } from "lucide-react";
import categoriesData from "@/data/categories.json";
import wordsData from "@/data/words.json";
import { Category, WordItem } from "@/types";
import { Flashcard } from "@/components/features/Flashcard";

export default function QuranGuidePage() {
  const quranCategories = (categoriesData as Category[]).filter(c => c.type === 'quran');
  const allWords = wordsData as WordItem[];

  return (
    <div className="max-w-5xl mx-auto py-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12 bg-gradient-to-bl from-teal-700 to-emerald-900 rounded-3xl p-8 md:p-12 text-white shadow-xl relative overflow-hidden"
      >
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
          <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl">
            <BookText className="w-12 h-12 text-teal-100" />
          </div>
          <div className="text-center md:text-right">
            <h1 className="text-3xl md:text-5xl font-bold font-cairo mb-4">
              دليل معلمي القرآن
            </h1>
            <p className="text-teal-100 font-cairo text-lg max-w-2xl">
              مصطلحات التجويد وجمل الشرح الأساسية التي يحتاجها المعلم أثناء تدريس القرآن الكريم لغير الناطقين بالعربية.
            </p>
          </div>
        </div>
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-teal-500 opacity-20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-emerald-500 opacity-20 rounded-full blur-3xl"></div>
      </motion.div>

      <div className="space-y-16">
        {quranCategories.map((category, idx) => {
          const categoryWords = allWords.filter(w => w.categoryId === category.id);
          if (categoryWords.length === 0) return null;

          return (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <div className="flex items-center gap-4 mb-6">
                <h2 className="text-2xl font-bold font-cairo text-slate-800 dark:text-slate-100">
                  {category.titleAr}
                </h2>
                <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1"></div>
                <span className="text-sm font-sans font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                  {category.title}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categoryWords.map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: (idx * 0.1) + (i * 0.05) }}
                  >
                    <Flashcard {...item} />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
