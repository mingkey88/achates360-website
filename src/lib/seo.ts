export type SiteEnv = 'staging' | 'production';

export function robotsMeta(env: SiteEnv): string | null {
  return env === 'production' ? null : 'noindex, nofollow';
}

export function robotsTxt(env: SiteEnv): string {
  return env === 'production' ? 'User-agent: *\nAllow: /\n' : 'User-agent: *\nDisallow: /\n';
}
