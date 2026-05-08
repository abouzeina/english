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
  const filePath = path.join(CONTENT_DIR, slug, 'metadata.json');
  if (fs.existsSync(filePath)) {
    return await loadFromCache(`level_${slug}`, filePath);
  }
  
  // Fallback: If not found, check if 'slug' is actually an ID and find its real slug
  const levels = await getLevels();
  const level = levels.find(l => l.id === slug || l.slug === slug);
  if (level && level.slug !== slug) {
    return getLevel(level.slug);
  }
  
  return null;
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

export async function getSubcategoryWords(categoryId: string, subId: string) {
  const category = await getCategoryWords(categoryId);
  if (!category || !category.subcategories) return null;
  
  const sub = category.subcategories.find(s => s.id === subId);
  if (!sub) return null;
  
  return {
    category,
    subcategory: sub
  };
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
  
  const normalizeText = (t: string) => {
    if (!t) return "";
    return t
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
      .replace(/['"‘“”’]/g, "'") // Normalize smart quotes
      .toLowerCase()
      .trim();
  };

  const q = normalizeText(query);
  if (q.length < 2) return [];

  const seen = new Set<string>();
  const results: any[] = [];

  for (const w of cachedSearchIndex!) {
    const en = normalizeText(w.en);
    const ar = normalizeText(w.ar);
    
    // Strict matching logic to prevent "o" from matching "Good morning"
    const isEnMatch = en === q || en.startsWith(q) || en.includes(` ${q}`);
    const isArMatch = ar.includes(q);

    if (isEnMatch || isArMatch) {
      const uniqueKey = `${en}|${ar}`;
      if (!seen.has(uniqueKey)) {
        seen.add(uniqueKey);
        results.push(w);
      }
    }
    
    if (results.length >= 30) break; // Cap results early for performance
  }

  // Sort: exact match first, then prefix, then rest
  return results.sort((a, b) => {
    const aEn = normalizeText(a.en);
    const bEn = normalizeText(b.en);
    if (aEn === q && bEn !== q) return -1;
    if (bEn === q && aEn !== q) return 1;
    if (aEn.startsWith(q) && !bEn.startsWith(q)) return -1;
    if (!aEn.startsWith(q) && bEn.startsWith(q)) return 1;
    // Deterministic tie-breaker
    return aEn.localeCompare(bEn);
  });
}
