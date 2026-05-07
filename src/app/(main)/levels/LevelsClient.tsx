"use client";

import Link from "next/link";
import { Book, ChevronLeft } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as any } }
};

export default function LevelsClient({ levelsWithMetadata }: { levelsWithMetadata: any[] }) {
  return (
    <div className="max-w-5xl mx-auto py-8 px-6">
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
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

      <motion.div 
        variants={container as any}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {levelsWithMetadata.map((level: any) => (
          <motion.div key={level.id} variants={item as any}>
            <Link href={`/levels/${level.slug || level.id}`}>
              <div className="group glass-panel p-6 h-full border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 transition-premium hover:shadow-lg hover:-translate-y-1">
                <div className="flex justify-between items-start mb-6">
                  <div className="p-3 bg-emerald-100 dark:bg-emerald-900/50 rounded-2xl text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-premium group-hover:rotate-3">
                    <Book className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full font-sans text-slate-500 dark:text-slate-400 uppercase">
                    {level.slug}
                  </span>
                </div>
                
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 font-cairo mb-1">{level.nameAr}</h2>
                <h3 className="text-sm font-medium text-slate-400 dark:text-slate-500 font-sans mb-3">{level.name}</h3>
                <p className="text-slate-500 dark:text-slate-400 font-cairo text-sm mb-6 line-clamp-2">{level.descriptionAr}</p>
                
                <div className="flex justify-between items-center mt-auto pt-4 border-t border-slate-100 dark:border-slate-800/50">
                  <div className="flex gap-3">
                    <span className="text-xs font-bold text-slate-500 font-cairo">{level.lessonCount} دروس</span>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-cairo bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-md">
                      {level.totalWords} كلمة
                    </span>
                  </div>
                  <ChevronLeft className="w-5 h-5 text-emerald-500 group-hover:-translate-x-1 transition-transform rtl:rotate-180" />
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
