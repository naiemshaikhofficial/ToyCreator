import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL && !process.env.NEXT_PUBLIC_SITE_URL.includes('localhost')
      ? process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')
      : 'https://creators.producertoy.com';

  return {
    rules: [
      {
        userAgent: ['Googlebot', 'Bingbot', 'Applebot'],
        allow: '/',
        disallow: [
          '/dashboard/',
          '/api/',
          '/_next/',
        ],
      },
      {
        userAgent: [
          'GPTBot',
          'ChatGPT-User',
          'PerplexityBot',
          'ClaudeBot',
          'Claude-SearchBot',
          'Google-Extended',
          'Applebot-Extended',
        ],
        allow: '/',
        disallow: [
          '/dashboard/',
          '/api/',
          '/_next/',
        ],
      },
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard/',
          '/api/',
          '/_next/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
