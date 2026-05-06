import { notFound } from "next/navigation";
import lessonsData from "@/data/lessons.json";
import wordsData from "@/data/words.json";
import { Lesson, WordItem } from "@/types";
import { LessonViewer } from "@/components/features/LessonViewer";

export default async function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  
  const lesson = (lessonsData as Lesson[]).find((l) => l.id === resolvedParams.id);

  if (!lesson) {
    notFound();
  }

  const words = (wordsData as WordItem[]).filter(w => w.lessonId === lesson.id);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-background">
      <LessonViewer lesson={lesson} words={words} />
    </div>
  );
}
