import type { APIRoute } from 'astro';
import { routes, absolute, type Alternates } from '../i18n/site';
import { features, featurePath } from '../content/features';

/**
 * XML sitemap generated from the route table, so every page (and only real pages) is listed,
 * with its FR/EN alternates. /app/ is the tool itself and is listed once.
 */
const PRIORITY: Record<string, number> = { home: 1, features: 0.9, howItWorks: 0.8, faq: 0.8 };

export const GET: APIRoute = () => {
  const entries: { alt: Alternates; priority: number }[] = [
    ...Object.entries(routes).map(([key, alt]) => ({ alt, priority: PRIORITY[key] ?? 0.5 })),
    ...features.map((f) => ({ alt: { fr: featurePath(f, 'fr'), en: featurePath(f, 'en') }, priority: 0.8 })),
  ];

  const urls = entries.flatMap(({ alt, priority }) =>
    (['fr', 'en'] as const).map(
      (lang) => `  <url>
    <loc>${absolute(alt[lang])}</loc>
    <xhtml:link rel="alternate" hreflang="fr" href="${absolute(alt.fr)}"/>
    <xhtml:link rel="alternate" hreflang="en" href="${absolute(alt.en)}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${absolute(alt.fr)}"/>
    <priority>${priority.toFixed(1)}</priority>
  </url>`,
    ),
  );
  urls.push(`  <url>
    <loc>${absolute('/app/')}</loc>
    <priority>0.9</priority>
  </url>`);

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>
`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
