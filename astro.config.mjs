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
  trailingSlash: 'never',
  build: { format: 'file', inlineStylesheets: 'always' },
  env: {
    schema: {
      SITE_ENV: envField.enum({
        context: 'server', access: 'public',
        values: ['staging', 'production'], default: 'staging',
      }),
      PUBLIC_FORM_ENDPOINT: envField.string({ context: 'client', access: 'public', optional: true }),
    },
  },
});
