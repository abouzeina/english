import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/profile/', '/dashboard/', '/api/'],
    },
    sitemap: 'https://english-pifq.vercel.app/sitemap.xml',
  };
}
