import type { APIRoute } from 'astro';
import { SITE_ENV } from 'astro:env/server';
import { robotsTxtWithSitemap } from '../lib/seo';

export const GET: APIRoute = () =>
  new Response(robotsTxtWithSitemap(SITE_ENV), { headers: { 'Content-Type': 'text/plain' } });
