import { MetadataRoute } from 'next';
import levelsData from '@/data/levels.json';
import lessonsData from '@/data/lessons.json';

const BASE_URL = 'https://english-platform.vercel.app'; // Update this when deploying

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    '',
    '/levels',
    '/quran-guide',
    '/dashboard',
    '/favorites'
  ].map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  const levelRoutes = levelsData.map((level) => ({
    url: `${BASE_URL}/levels/${level.id}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  const lessonRoutes = lessonsData.map((lesson) => ({
    url: `${BASE_URL}/lessons/${lesson.id}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  return [...routes, ...levelRoutes, ...lessonRoutes];
}
