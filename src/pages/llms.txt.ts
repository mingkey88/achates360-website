import type { APIRoute } from 'astro';
import { getCollection, getEntry } from 'astro:content';
import { withBase } from '../lib/paths';
import { slugOf } from '../lib/next-project';
import { firstYear } from '../lib/meta';
import { visibleBlocks } from '../lib/visibility';
import { llmsTxt, lead, plain } from '../lib/llms';
import { homeKey } from '../lib/seo';

// /llms.txt for AI answer engines (lib/llms.ts). Listed case studies only, in the homepage list's
// order; each one's lead is the opening of its own first visible paragraph.
export const GET: APIRoute = async ({ site }) => {
  const abs = (p: string) => new URL(withBase(p), site).href;
  const home = (await getEntry('home', 'home'))!.data;
  const about = (await getEntry('basic', 'about'))!.data;
  const siteData = (await getEntry('site', 'site'))!.data;
  const all = new Map((await getCollection('projects')).filter((e) => e.data.listed).map((e) => [e.id, e.data]));
  const order = [...new Set(home.allProjects.items.map((i) => slugOf(i.href)).filter((s): s is string => s !== null && all.has(s)))];
  const aboutText = visibleBlocks(about.blocks as any[], about.pageBackground).filter((b) => b.type === 'text').map((b) => plain(b.md)).filter((t) => t.length > 40);
  const footerMd = (siteData.footer as any[]).filter((b) => b.type === 'text').map((b) => b.md).join('\n');
  const categories = [...new Set([...all.values()].flatMap((p) => p.categories))].sort();
  const txt = llmsTxt({
    summary: home.seo.description,
    about: aboutText.slice(0, 3),
    homeUrl: homeKey(abs('/')),
    email: footerMd.match(/mailto:([^)\s]+)/)?.[1],
    pages: [['About', '/about'], ['Services', '/services'], ['Projects', '/projects'], ['Contact', '/contact']].map(([name, p]) => ({ name, url: abs(p) })),
    services: categories.map((name) => ({ name, categories: [] })),
    clients: [],
    projects: order.map((slug) => {
      const p = all.get(slug)!;
      const first = visibleBlocks(p.blocks as any[], p.pageBackground).find((b) => b.type === 'text' && plain(b.md).length > 60);
      return { title: p.title, url: abs(`/${slug}`), client: p.client, year: firstYear(p.copyright) ?? undefined, categories: p.categories, lead: first ? lead(plain(first.md)) : undefined };
    }),
  });
  return new Response(txt, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
