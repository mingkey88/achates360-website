import { getCollection } from 'astro:content';
import { SITE_ENV } from 'astro:env/server';
import { assertPublishable } from './placeholders';
import { makeText } from './strings';

const NAMES = ['services', 'process', 'timeline', 'stats', 'clients', 'testimonials', 'strings'] as const;
type ExtrasName = (typeof NAMES)[number];

async function load() {
  const data = (name: ExtrasName) => getCollection(name).then((es) => es.map((e) => e.data as any));
  const [services, process, timeline, stats, clients, testimonials, strings] = await Promise.all(NAMES.map(data));
  const groups = {
    services: services.sort((a, b) => a.order - b.order),
    process: process.sort((a, b) => a.step - b.step),
    timeline: timeline.sort((a, b) => a.order - b.order),
    stats: stats.sort((a, b) => a.order - b.order),
    clients, testimonials, strings,
  };
  assertPublishable(groups, SITE_ENV);
  return { ...groups, text: makeText(strings) };
}

let cached: ReturnType<typeof load> | undefined;
/** All redesign content, checked once per build: a production build with placeholders throws here. */
export function loadExtras() {
  return (cached ??= load());
}
export type Extras = Awaited<ReturnType<typeof load>>;
