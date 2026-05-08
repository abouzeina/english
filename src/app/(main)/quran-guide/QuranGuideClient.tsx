"use client";

import Link from "next/link";
import { BookText, ChevronLeft, Video, BookOpen, MessageSquare } from "lucide-react";
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

const getIcon = (id: string) => {
  switch (id) {
    case 'cat_quran_online': return Video;
    case 'cat_quran_1': return MessageSquare;
    case 'cat_quran_2': return BookOpen;
    default: return BookText;
  }
};

export default function QuranGuideClient({ categories }: { categories: any[] }) {
  return (
    <div className="max-w-5xl mx-auto py-8 px-6">
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
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

      <motion.div 
        variants={container as any}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {categories.map((category) => {
          const Icon = getIcon(category.id);
          return (
            <motion.div key={category.id} variants={item as any}>
              <Link href={`/quran-guide/${category.id}`}>
                <div className="group glass-panel p-6 h-full border-slate-200 dark:border-slate-800 hover:border-teal-300 dark:hover:border-teal-700 transition-premium hover:shadow-lg hover:-translate-y-1">
                  <div className="flex justify-between items-start mb-6">
                    <div className="p-3 bg-teal-100 dark:bg-teal-900/50 text-teal-600 dark:text-teal-400 rounded-2xl group-hover:scale-110 transition-premium group-hover:rotate-3">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full font-sans text-slate-500 dark:text-slate-400 uppercase">
                      {category.slug}
                    </span>
                  </div>
                  
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 font-cairo mb-1">
                    {category.titleAr}
                  </h2>
                  <h3 className="text-sm font-medium text-slate-400 dark:text-slate-500 font-sans mb-3">
                    {category.title}
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 font-cairo text-sm mb-6 line-clamp-3">
                    {category.descriptionAr}
                  </p>
                  
                  <div className="flex justify-between items-center mt-auto pt-4 border-t border-slate-100 dark:border-slate-800/50">
                    <span className="text-xs font-bold text-teal-600 dark:text-teal-400 font-cairo bg-teal-50 dark:bg-teal-900/20 px-2 py-0.5 rounded-md">
                      تصفح الجمل
                    </span>
                    <ChevronLeft className="w-5 h-5 text-teal-500 group-hover:-translate-x-1 transition-transform rtl:rotate-180" />
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
