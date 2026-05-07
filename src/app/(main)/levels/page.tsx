import Link from "next/link";
import { Book, ChevronLeft } from "lucide-react";
import { getLevels } from "@/lib/content/loader";
import { getLessons } from "@/lib/content/loader";

export default async function LevelsPage() {
  const levels = await getLevels();
  
  // We can fetch lesson counts in parallel
  const levelsWithMetadata = await Promise.all(levels.map(async (level) => {
    const levelLessons = await getLessons(level.slug || level.id);
    const totalWords = levelLessons.reduce((sum, l) => sum + (l.wordCount || 0), 0);
    return { ...level, lessonCount: levelLessons.length, totalWords };
  }));

  return (
    <div className="max-w-5xl mx-auto py-8 px-6">
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white font-cairo mb-4">
          المستويات الدراسية
        </h1>
        <p className="text-slate-600 dark:text-slate-400 font-cairo">
          اختر مستواك الحالي وابدأ رحلة التعلم. تم تصميم كل مستوى ليتناسب مع احتياجاتك.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {levelsWithMetadata.map((level) => (
          <Link key={level.id} href={`/levels/${level.slug || level.id}`}>
            <div className="group glass-panel p-6 h-full border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all hover:shadow-lg hover:-translate-y-1">
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-emerald-100 dark:bg-emerald-900/50 rounded-2xl text-emerald-600 dark:text-emerald-400">
                  <Book className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full font-sans text-slate-500 dark:text-slate-400 uppercase">
                  {level.slug}
                </span>
              </div>
              
              <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 font-cairo mb-1">{level.nameAr}</h2>
              <h3 className="text-sm font-medium text-slate-400 dark:text-slate-500 font-sans mb-3">{level.name}</h3>
              <p className="text-slate-500 dark:text-slate-400 font-cairo text-sm mb-6">{level.descriptionAr}</p>
              
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
        ))}
      </div>
    </div>
  );
}
