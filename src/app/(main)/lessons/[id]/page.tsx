import { notFound } from "next/navigation";
import { getLesson, getLevels } from "@/lib/content/loader";
import { LessonViewer } from "@/components/features/LessonViewer";

export default async function LessonPage({ 
  params,
  searchParams 
}: { 
  params: Promise<{ id: string }>,
  searchParams: Promise<{ level?: string }>
}) {
  const resolvedParams = await params;
  const resolvedSearch = await searchParams;
  const lessonIdOrSlug = resolvedParams.id;
  let levelSlug = resolvedSearch.level;

  // If levelSlug is missing, we try to find it (for direct links/bookmarks)
  if (!levelSlug) {
    const levels = await getLevels();
    // This is a bit slow but necessary for fallback
    // In production, we'd have a lessonId -> levelId map
    for (const level of levels) {
       const lesson = await getLesson(level.slug || level.id, lessonIdOrSlug);
       if (lesson) {
          levelSlug = level.slug || level.id;
          break;
       }
    }
  }

  if (!levelSlug) notFound();

  const lessonWithWords = await getLesson(levelSlug, lessonIdOrSlug);

  if (!lessonWithWords) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-background">
      <LessonViewer 
        lesson={lessonWithWords} 
        words={lessonWithWords.words} 
        levelSlug={levelSlug}
      />
    </div>
  );
}
