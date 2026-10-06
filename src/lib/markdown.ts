import { Marked } from 'marked';
import { withBase } from './paths';

export function renderMd(md: string, base?: string): string {
  const marked = new Marked({
    gfm: true,
    walkTokens(token) {
      if (token.type === 'link') token.href = withBase(token.href, base);
    },
  });
  return marked.parse(md, { async: false }) as string;
}
