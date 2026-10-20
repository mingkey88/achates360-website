import { defineConfig, envField } from 'astro/config';
import { writeFile } from 'node:fs/promises';
import { sitemapXml, SITEMAP_EXCLUDED } from './src/lib/seo.ts';

const SITE_ENV = process.env.SITE_ENV ?? 'staging';
const production = SITE_ENV === 'production';

const site = production ? 'https://www.achates360.com' : 'https://mingkey88.github.io';
const base = production ? '/' : '/achates360-website';

// /sitemap.xml (the path Wix uses): every built page at its canonical, slash-less URL, written once
// the build knows its pages. Endpoints (robots.txt) and the 404 / alias pages stay out.
const sitemap = {
  name: 'achates-sitemap',
  hooks: {
    'astro:build:done': async ({ dir, pages }) => {
      const root = new URL(base.replace(/\/?$/, '/'), site).href;
      const urls = pages
        .map((p) => '/' + p.pathname.replace(/\/$/, ''))
        .filter((p) => !/\.(txt|xml)$/.test(p) && !SITEMAP_EXCLUDED.has(p))
        .map((p) => (p === '/' ? root : root + p.slice(1)));
      await writeFile(new URL('sitemap.xml', dir), sitemapXml(urls));
    },
  },
};

export default defineConfig({
  site,
  base,
  integrations: [sitemap],
  // Encoder settings (image audit, 12 Oct 2026): AVIF first (ui/Pic.astro), WebP as the fallback.
  // 4:4:4 chroma keeps coloured type and fine lines crisp in design work; smartSubsample does the
  // same for WebP.
  image: {
    service: {
      entrypoint: 'astro/assets/services/sharp',
      config: {
        avif: { quality: 60, effort: 4, chromaSubsampling: '4:4:4' },
        webp: { quality: 82, effort: 5, smartSubsample: true },
      },
    },
  },
  trailingSlash: 'never',
  build: { format: 'file', inlineStylesheets: 'always' },
  env: {
    schema: {
      SITE_ENV: envField.enum({
        context: 'server', access: 'public',
        values: ['staging', 'production'], default: 'staging',
      }),
      PUBLIC_FORM_ENDPOINT: envField.string({ context: 'client', access: 'public', optional: true }),
      // Cloudflare Web Analytics site token (Cloudflare dashboard → Web Analytics → Add a site). Unset =
      // no beacon. Leave unset once the site is on Cloudflare Pages with analytics switched on there
      // (Cloudflare injects the beacon itself; setting both counts every visit twice).
      PUBLIC_CF_ANALYTICS_TOKEN: envField.string({ context: 'server', access: 'public', optional: true }),
    },
  },
});
