'use server';

import * as loader from './loader';
import { WordItem } from '@/types';

/**
 * SERVER ACTIONS
 * These can be safely imported by Client Components.
 */

export async function getLevels() {
  return loader.getLevels();
}

export async function getLessons(levelSlug: string) {
  return loader.getLessons(levelSlug);
}

export async function searchWords(query: string) {
  return loader.searchWords(query);
}

export async function fetchWordsByIds(ids: string[]): Promise<WordItem[]> {
  const levels = await loader.getLevels();
  const index = await loader.searchWords(""); // Load full index
  const found = index.filter((w: any) => ids.includes(w.id));
  
  const results: WordItem[] = [];
  const levelLessonMap: Record<string, Set<string>> = {};
  
  found.forEach((f: any) => {
    const key = `${f.levelId}/${f.lessonId}`;
    if (!levelLessonMap[key]) levelLessonMap[key] = new Set();
    levelLessonMap[key].add(f.id);
  });

  for (const key in levelLessonMap) {
    const [levelId, lessonId] = key.split('/');
    const level = levels.find(l => l.id === levelId);
    if (!level) continue;
    
    const lessons = await loader.getLessons(level.slug || level.id);
    const lesson = lessons.find(l => l.id === lessonId);
    if (!lesson) continue;

    const fullLesson = await loader.getLesson(level.slug || level.id, lesson.slug || lesson.id);
    if (fullLesson) {
       results.push(...fullLesson.words.filter(w => ids.includes(w.id)));
    }
  }

  return results;
}
