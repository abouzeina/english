import { getLevels, getLessons } from "@/lib/content/loader";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const levels = await getLevels();
  
  // Fetch total counts on server
  let totalLessons = 0;
  let totalWords = 0;
  
  for (const level of levels) {
    const levelLessons = await getLessons(level.slug || level.id);
    totalLessons += levelLessons.length;
    totalWords += levelLessons.reduce((sum, l) => sum + (l.wordCount || 0), 0);
  }

  return (
    <DashboardClient 
      totalLessons={totalLessons} 
      totalWords={totalWords} 
    />
  );
}
