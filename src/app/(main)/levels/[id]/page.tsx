import { notFound } from "next/navigation";
import { getLevel, getLessons } from "@/lib/content/loader";
import LevelDetailClient from "./LevelDetailClient";

export default async function LevelDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const levelIdOrSlug = resolvedParams.id;
  
  const level = await getLevel(levelIdOrSlug);

  if (!level) {
    notFound();
  }

  const levelLessons = (await getLessons(levelIdOrSlug)).sort((a, b) => a.order - b.order);
  const totalWords = levelLessons.reduce((sum, l) => sum + (l.wordCount || 0), 0);

  return <LevelDetailClient level={level} levelLessons={levelLessons} totalWords={totalWords} />;
}
