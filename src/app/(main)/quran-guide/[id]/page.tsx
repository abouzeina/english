import { getCategoryWords } from "@/lib/content/loader";
import { Flashcard } from "@/components/features/Flashcard";
import { ChevronRight, ChevronLeft, BookText } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function CategoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const category = await getCategoryWords(resolvedParams.id);

  if (!category) {
    notFound();
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-6">
      {/* Header */}
      <div className="mb-8">
        <Link 
          href="/quran-guide" 
          className="inline-flex items-center gap-2 text-slate-500 hover:text-teal-600 transition-colors font-cairo mb-6 group"
        >
          <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          العودة للدليل
        </Link>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-teal-100 dark:bg-teal-900/50 rounded-2xl text-teal-600 dark:text-teal-400">
              <BookText className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold font-cairo text-slate-900 dark:text-white mb-1">
                {category.titleAr}
              </h1>
              <p className="text-slate-500 dark:text-slate-400 font-sans text-sm">
                {category.title}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-2xl">
            <span className="text-sm font-bold text-slate-600 dark:text-slate-300 font-cairo">
              {category.subcategories 
                ? category.subcategories.reduce((acc, sub) => acc + sub.wordCount, 0)
                : category.words.length} جملة
            </span>
          </div>
        </div>
      </div>

      {/* Subcategory Cards */}
      {category.subcategories && category.subcategories.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {category.subcategories.map((sub) => (
            <Link key={sub.id} href={`/quran-guide/${category.id}/${sub.id}`}>
              <div className="group glass-panel p-6 h-full border-slate-200 dark:border-slate-800 hover:border-teal-300 dark:hover:border-teal-700 transition-premium hover:shadow-lg hover:-translate-y-1">
                <div className="flex justify-between items-start mb-6">
                  <div className="p-3 bg-teal-100 dark:bg-teal-900/50 text-teal-600 dark:text-teal-400 rounded-2xl group-hover:scale-110 transition-premium group-hover:rotate-3">
                    <BookText className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full font-sans text-slate-500 dark:text-slate-400">
                    {sub.words.length} جملة
                  </span>
                </div>
                
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 font-cairo mb-2 group-hover:text-teal-600 transition-colors">
                  {sub.titleAr}
                </h2>
                <h3 className="text-sm font-medium text-slate-400 dark:text-slate-500 font-sans mb-4 line-clamp-1">
                  {(sub as any).titleEn || category.title}
                </h3>
                
                <div className="flex justify-between items-center mt-auto pt-4 border-t border-slate-100 dark:border-slate-800/50">
                  <span className="text-xs font-bold text-teal-600 dark:text-teal-400 font-cairo bg-teal-50 dark:bg-teal-900/20 px-2 py-0.5 rounded-md">
                    تصفح الجمل
                  </span>
                  <ChevronLeft className="w-5 h-5 text-teal-500 group-hover:-translate-x-1 transition-transform rtl:rotate-180" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : category.words && category.words.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {category.words.map((item) => (
            <Flashcard key={item.id} {...item} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center bg-slate-50 dark:bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 text-slate-400">
            <BookText className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold font-cairo text-slate-800 dark:text-slate-200 mb-2">
            قريباً إن شاء الله
          </h3>
          <p className="text-slate-500 dark:text-slate-400 font-cairo max-w-sm">
            سيتم إضافة الجمل والعبارات لهذا القسم قريباً. ترقبوا التحديثات!
          </p>
        </div>
      )}
    </div>
  );
}
