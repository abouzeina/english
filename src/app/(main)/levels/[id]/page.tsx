"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, ArrowLeft, PlayCircle } from "lucide-react";
import levelsData from "@/data/levels.json";
import lessonsData from "@/data/lessons.json";
import { Level, Lesson } from "@/types";

export default async function LevelDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const level = (levelsData as Level[]).find((l) => l.id === resolvedParams.id);

  if (!level) {
    notFound();
  }

  const levelLessons = (lessonsData as Lesson[]).filter(l => l.levelId === level.id).sort((a, b) => a.order - b.order);

  return (
    <div className="max-w-5xl mx-auto py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500 font-cairo mb-8">
        <Link href="/levels" className="hover:text-emerald-600 transition-colors">المستويات</Link>
        <ChevronRight className="w-4 h-4 rotate-180" />
        <span className="text-slate-900 dark:text-slate-200 font-bold">{level.nameAr}</span>
      </div>

      <div className="mb-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold font-sans flex items-center gap-3 mb-4">
            {level.name}
            <span className="text-2xl text-emerald-100 font-cairo">({level.nameAr})</span>
          </h1>
          <p className="text-lg md:text-xl text-emerald-50 font-cairo max-w-2xl">
            {level.descriptionAr}
          </p>
        </div>
        <div className="absolute top-0 left-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      </div>

      <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 font-cairo mb-6 flex items-center gap-2">
        <PlayCircle className="w-6 h-6 text-emerald-500" />
        دروس المستوى ({levelLessons.length})
      </h2>

      {levelLessons.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {levelLessons.map((lesson) => (
            <Link key={lesson.id} href={`/lessons/${lesson.id}`}>
              <div className="group bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-6 rounded-2xl hover:border-emerald-400 dark:hover:border-emerald-600 transition-all hover:shadow-md flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-sm font-bold text-emerald-600 dark:text-emerald-400 font-sans">
                      {lesson.order}
                    </span>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 font-sans">{lesson.title}</h3>
                  </div>
                  <h4 className="text-md font-bold text-emerald-600 dark:text-emerald-400 font-cairo mb-1">{lesson.titleAr}</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-cairo">{lesson.descriptionAr}</p>
                </div>
                <ArrowLeft className="w-5 h-5 text-slate-300 group-hover:text-emerald-500 transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-200 dark:border-slate-700 border-dashed">
          <p className="text-xl text-slate-500 font-cairo">لا توجد دروس متاحة حالياً في هذا المستوى.</p>
        </div>
      )}
    </div>
  );
}
