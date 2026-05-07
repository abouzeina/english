import fs from 'fs';
import path from 'path';
import { Level, Lesson, WordItem, Category } from '@/types';

const CONTENT_DIR = path.join(process.cwd(), 'src/data/content');

// In-memory cache for metadata
const cache: Record<string, any> = {};

async function loadFromCache(key: string, filePath: string) {
  if (cache[key]) return cache[key];
  if (!fs.existsSync(filePath)) return null;
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  cache[key] = data;
  return data;
}

export async function getLevels(): Promise<Level[]> {
  return (await loadFromCache('levels', path.join(CONTENT_DIR, 'levels.json'))) || [];
}

export async function getLevel(slug: string): Promise<Level | null> {
  return await loadFromCache(`level_${slug}`, path.join(CONTENT_DIR, slug, 'metadata.json'));
}

export async function getLessons(levelSlug: string): Promise<Lesson[]> {
  return (await loadFromCache(`lessons_${levelSlug}`, path.join(CONTENT_DIR, levelSlug, 'lessons-index.json'))) || [];
}

export async function getLesson(levelSlug: string, lessonSlug: string): Promise<(Lesson & { words: WordItem[] }) | null> {
  // Words/Lessons are larger, so we only cache metadata/indices, but we can cache these too if memory allows.
  const filePath = path.join(CONTENT_DIR, levelSlug, 'lessons', `${lessonSlug}.json`);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

export async function getCategories(): Promise<Category[]> {
  return (await loadFromCache('categories', path.join(CONTENT_DIR, 'categories.json'))) || [];
}

export async function getCategoryWords(categoryId: string): Promise<(Category & { words: WordItem[] }) | null> {
  const filePath = path.join(CONTENT_DIR, 'categories', `${categoryId}.json`);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

let cachedSearchIndex: any[] | null = null;

export async function searchWords(query: string): Promise<any[]> {
  if (!cachedSearchIndex) {
    const filePath = path.join(CONTENT_DIR, 'search-index.json');
    if (fs.existsSync(filePath)) {
      cachedSearchIndex = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } else {
      cachedSearchIndex = [];
    }
  }
  
  const q = query.toLowerCase();
  return cachedSearchIndex!.filter((w: any) => 
    w.en.toLowerCase().includes(q) || 
    w.ar.includes(q)
  ).slice(0, 50);
}
