import { BookText } from "lucide-react";
import { getCategories, getCategoryWords } from "@/lib/content/loader";
import { Flashcard } from "@/components/features/Flashcard";

export default async function QuranGuidePage() {
  const allCategories = await getCategories();
  const quranCategories = allCategories.filter(c => c.type === 'quran');
  
  // Fetch words for each category in parallel
  const categoriesWithWords = await Promise.all(
    quranCategories.map(async (cat) => {
      const data = await getCategoryWords(cat.id);
      return data;
    })
  );

  const filteredCategories = categoriesWithWords.filter(c => c !== null && c.words.length > 0);

  return (
    <div className="max-w-5xl mx-auto py-8 px-6">
      <div className="mb-12 bg-gradient-to-bl from-teal-700 to-emerald-900 rounded-3xl p-8 md:p-12 text-white shadow-xl relative overflow-hidden">
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
      </div>

      <div className="space-y-16">
        {filteredCategories.map((category) => (
          <div key={category!.id}>
            <div className="flex items-center gap-4 mb-6">
              <h2 className="text-2xl font-bold font-cairo text-slate-800 dark:text-slate-100">
                {category!.titleAr}
              </h2>
              <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1"></div>
              <span className="text-sm font-sans font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full uppercase">
                {category!.title}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {category!.words.map((item) => (
                <Flashcard key={item.id} {...item} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
