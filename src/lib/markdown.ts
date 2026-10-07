import { Marked, Renderer } from 'marked';
import { withBase, isExternal } from './paths';

export function renderMd(md: string, base?: string, opts: { demote?: number } = {}): string {
  const marked = new Marked({
    gfm: true,
    walkTokens(token) {
      if (token.type === 'link') token.href = withBase(token.href, base);
      // demote: shift heading levels (e.g. a homepage slide's "# …" inside a card) so each page
      // keeps a single h1. The words are untouched.
      if (token.type === 'heading' && opts.demote) token.depth = Math.min(6, token.depth + opts.demote);
    },
    renderer: {
      // Wix opens every external http(s) link in a new tab (see linkAttrs in ./paths).
      link(token) {
        if (!isExternal(token.href)) return false;
        const html = Renderer.prototype.link.call(this, token);
        return html.replace(/^<a /, '<a target="_blank" rel="noopener noreferrer" ');
      },
    },
  });
  // marked treats U+00A0 as whitespace, so a Wix line holding only a no-break space (Wix's blank
  // line after a hard break) would vanish; as an entity it stays text and renders the same character.
  return marked.parse(md.replace(/ /g, '&nbsp;'), { async: false }) as string;
}
