"use client";

import Link from "next/link";
import { ChevronRight, ArrowLeft, PlayCircle } from "lucide-react";
import { motion } from "framer-motion";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const item = {
  hidden: { opacity: 0, x: -10 },
  show: { opacity: 1, x: 0, transition: { duration: 0.3, ease: "easeOut" as any } }
};

export default function LevelDetailClient({ level, levelLessons, totalWords }: { level: any, levelLessons: any[], totalWords: number }) {
  return (
    <div className="max-w-5xl mx-auto py-8 px-6">
      {/* Breadcrumb */}
      <motion.div 
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 text-sm text-slate-500 font-cairo mb-8"
      >
        <Link href="/levels" className="hover:text-emerald-600 transition-colors">المستويات</Link>
        <ChevronRight className="w-4 h-4 rotate-180" />
        <span className="text-slate-900 dark:text-slate-200 font-bold">{level.nameAr}</span>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" as any }}
        className="mb-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden"
      >
        <div className="relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold font-cairo flex items-center gap-3 mb-4">
            {level.nameAr}
            <span className="text-2xl text-emerald-100 font-sans opacity-80">({level.name})</span>
          </h1>
          <p className="text-lg md:text-xl text-emerald-50 font-cairo max-w-2xl mb-6">
            {level.descriptionAr}
          </p>
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-bold font-cairo">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
            يحتوي هذا المستوى على {totalWords} كلمة تعليمية
          </div>
        </div>
        <div className="absolute top-0 left-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      </motion.div>

      <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 font-cairo mb-6 flex items-center gap-2">
        <PlayCircle className="w-6 h-6 text-emerald-500" />
        وحدات المستوى ({levelLessons.length})
      </h2>

      {levelLessons.length > 0 ? (
        <motion.div 
          variants={container as any}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {levelLessons.map((lesson) => (
            <motion.div key={lesson.id} variants={item as any}>
              <Link href={`/lessons/${lesson.slug || lesson.id}?level=${level.slug || level.id}`}>
                <div className="group bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-6 rounded-2xl hover:border-emerald-400 dark:hover:border-emerald-600 transition-all hover:shadow-md flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-sm font-bold text-emerald-600 dark:text-emerald-400 font-sans">
                        {lesson.order}
                      </span>
                      <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 font-cairo">{lesson.titleAr}</h3>
                    </div>
                    <h4 className="text-sm font-medium text-slate-400 dark:text-slate-500 font-sans mb-3">{lesson.title}</h4>
                    <div className="flex items-center gap-4">
                      <p className="text-sm text-slate-500 dark:text-slate-400 font-cairo flex-1">{lesson.descriptionAr}</p>
                      <span className="text-xs font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-3 py-1 rounded-lg font-cairo">
                        {lesson.wordCount || 0} كلمة
                      </span>
                    </div>
                  </div>
                  <ArrowLeft className="w-5 h-5 text-slate-300 group-hover:text-emerald-500 transition-colors rtl:rotate-180" />
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <div className="text-center py-20 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-200 dark:border-slate-700 border-dashed">
          <p className="text-xl text-slate-500 font-cairo">لا توجد وحدات تعليمية متاحة حالياً في هذا المستوى.</p>
        </div>
      )}
    </div>
  );
}
