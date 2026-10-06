import type { APIRoute } from 'astro';
import { SITE_ENV } from 'astro:env/server';
import { robotsTxt } from '../lib/seo';

export const GET: APIRoute = () =>
  new Response(robotsTxt(SITE_ENV), { headers: { 'Content-Type': 'text/plain' } });
