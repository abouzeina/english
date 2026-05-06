"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Book, ChevronLeft } from "lucide-react";
import levelsData from "@/data/levels.json";
import lessonsData from "@/data/lessons.json";
import { Level, Lesson } from "@/types";

export default function LevelsPage() {
  const levels = levelsData as Level[];
  const lessons = lessonsData as Lesson[];

  return (
    <div className="max-w-5xl mx-auto py-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white font-cairo mb-4">
          المستويات الدراسية
        </h1>
        <p className="text-slate-600 dark:text-slate-400 font-cairo">
          اختر مستواك الحالي وابدأ رحلة التعلم. تم تصميم كل مستوى ليتناسب مع احتياجاتك.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {levels.map((level, idx) => {
          const levelLessons = lessons.filter(l => l.levelId === level.id);
          return (
            <motion.div
              key={level.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Link href={`/levels/${level.id}`}>
                <div className="group glass-panel p-6 h-full border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all hover:shadow-lg hover:-translate-y-1">
                  <div className="flex justify-between items-start mb-6">
                    <div className="p-3 bg-emerald-100 dark:bg-emerald-900/50 rounded-2xl text-emerald-600 dark:text-emerald-400">
                      <Book className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full font-sans text-slate-500 dark:text-slate-400">
                      {level.slug.toUpperCase()}
                    </span>
                  </div>
                  
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 font-sans mb-1">{level.name}</h2>
                  <h3 className="text-lg font-bold text-emerald-600 dark:text-emerald-400 font-cairo mb-3">{level.nameAr}</h3>
                  <p className="text-slate-500 dark:text-slate-400 font-cairo text-sm mb-6">{level.descriptionAr}</p>
                  
                  <div className="flex justify-between items-center mt-auto pt-4 border-t border-slate-100 dark:border-slate-800/50">
                    <span className="text-sm font-bold text-slate-500 font-cairo">{levelLessons.length} دروس</span>
                    <ChevronLeft className="w-5 h-5 text-emerald-500 group-hover:-translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
