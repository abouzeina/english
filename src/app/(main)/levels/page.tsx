import { getLevels, getLessons } from "@/lib/content/loader";
import LevelsClient from "./LevelsClient";

export default async function LevelsPage() {
  const levels = await getLevels();
  
  // Fetch metadata in parallel on server
  const levelsWithMetadata = await Promise.all(levels.map(async (level) => {
    const levelLessons = await getLessons(level.slug || level.id);
    const totalWords = levelLessons.reduce((sum, l) => sum + (l.wordCount || 0), 0);
    return { ...level, lessonCount: levelLessons.length, totalWords };
  }));

  return <LevelsClient levelsWithMetadata={levelsWithMetadata} />;
}
