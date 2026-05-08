import { getSubcategoryWords } from "@/lib/content/loader";
import { Flashcard } from "@/components/features/Flashcard";
import { ChevronRight, BookText } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function SubcategoryDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string; subId: string }> 
}) {
  const { id, subId } = await params;
  const data = await getSubcategoryWords(id, subId);

  if (!data) {
    notFound();
  }

  const { category, subcategory } = data;

  return (
    <div className="max-w-5xl mx-auto py-8 px-6">
      {/* Header */}
      <div className="mb-8">
        <Link 
          href={`/quran-guide/${id}`} 
          className="inline-flex items-center gap-2 text-slate-500 hover:text-teal-600 transition-colors font-cairo mb-6 group"
        >
          <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          العودة لـ {category.titleAr}
        </Link>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-teal-100 dark:bg-teal-900/50 rounded-2xl text-teal-600 dark:text-teal-400">
              <BookText className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold font-cairo text-slate-900 dark:text-white mb-1">
                {subcategory.titleAr}
              </h1>
              <p className="text-slate-500 dark:text-slate-400 font-sans text-sm">
                {(subcategory as any).titleEn || category.title}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-2xl">
            <span className="text-sm font-bold text-slate-600 dark:text-slate-300 font-cairo">
              {subcategory.words.length} جملة
            </span>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {subcategory.words.map((item: any) => (
          <Flashcard 
            key={item.id} 
            {...item} 
            tags={item.note ? [item.note] : []}
          />
        ))}
      </div>
    </div>
  );
}
