export function withBase(path: string, base: string = import.meta.env.BASE_URL): string {
  if (!path.startsWith('/')) return path;
  const b = base.replace(/\/$/, '');
  if (path === '/') return b || '/';
  return b + path;
}

export function mediaUrl(path: string, base?: string): string {
  return withBase('/' + path.replace(/^\//, ''), base);
}
