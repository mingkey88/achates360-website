import { Marked } from 'marked';
import { withBase } from './paths';

export function renderMd(md: string, base?: string): string {
  const marked = new Marked({
    gfm: true,
    walkTokens(token) {
      if (token.type === 'link') token.href = withBase(token.href, base);
    },
  });
  // marked treats U+00A0 as whitespace, so a Wix line holding only a no-break space (Wix's blank
  // line after a hard break) would vanish; as an entity it stays text and renders the same character.
  return marked.parse(md.replace(/\u00a0/g, '&nbsp;'), { async: false }) as string;
}
