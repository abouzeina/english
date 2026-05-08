import { getCategories } from "@/lib/content/loader";
import QuranGuideClient from "./QuranGuideClient";

export default async function QuranGuidePage() {
  const allCategories = await getCategories();
  const quranCategories = allCategories.filter(c => c.type === 'quran');
  
  return <QuranGuideClient categories={quranCategories} />;
}
