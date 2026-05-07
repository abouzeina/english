import { MetadataRoute } from 'next';
import { getLevels } from '@/lib/content/loader';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://english-pifq.vercel.app'; // Replace with your domain if different

  // Base routes
  const routes = [
    '',
    '/levels',
    '/login',
    '/signup',
    '/profile',
    '/quran-guide',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  // Dynamic Level routes
  const levels = await getLevels();
  const levelRoutes = levels.map((level) => ({
    url: `${baseUrl}/levels/${level.slug || level.id}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  return [...routes, ...levelRoutes];
}
