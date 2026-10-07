// @ts-nocheck -- this repo has no @types/node; vitest runs it fine and it is not shipped.
// Content rules for src/content/extras (spec §6.3), checked against the exported project files.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { parse } from 'yaml';

const root = new URL('../content/', import.meta.url);
const extras = (name: string): any[] => parse(readFileSync(new URL(`extras/${name}.yaml`, root), 'utf8'));
const front = (slug: string): any => parse(readFileSync(new URL(`projects/${slug}.md`, root), 'utf8').split(/^---$/m)[1]);
const slugs = readdirSync(new URL('projects/', root)).map((f) => f.replace(/\.md$/, ''));
const projects = slugs.map(front);
const FILES = ['services', 'process', 'timeline', 'stats', 'clients', 'testimonials', 'strings'];

describe('every extras entry', () => {
  for (const f of FILES) {
    it(`${f}.yaml: states placeholder explicitly and has a unique id`, () => {
      const items = extras(f);
      expect(items.length).toBeGreaterThan(0);
      for (const i of items) expect(typeof i.placeholder, `${f}/${i.id}`).toBe('boolean');
      expect(new Set(items.map((i) => i.id)).size).toBe(items.length);
    });
  }
});

describe('references to real content', () => {
  it('services and timeline point at existing projects that have a hero', () => {
    for (const i of [...extras('services'), ...extras('timeline')]) {
      expect(existsSync(new URL(`projects/${i.project}.md`, root)), i.project).toBe(true);
      expect(front(i.project).hero, `${i.project} has no hero`).toBeTruthy();
    }
  });
  it('timeline projects have a copyright year to show', () => {
    for (const i of extras('timeline')) expect(front(i.project).copyright, i.project).toMatch(/\d{4}/);
  });
  it('service tags are existing project category names, verbatim', () => {
    const categories = new Set(projects.flatMap((p) => p.categories ?? []));
    for (const s of extras('services')) for (const t of s.tags) expect(categories.has(t), t).toBe(true);
  });
  it('client names match a project client field exactly', () => {
    const names = new Set(projects.map((p) => p.client).filter(Boolean));
    for (const c of extras('clients')) expect(names.has(c.name), c.name).toBe(true);
  });
});

describe('testimonials', () => {
  it('placeholders never carry a real-looking name or role', () => {
    for (const t of extras('testimonials').filter((t) => t.placeholder)) {
      expect(t.name).toBe('Client name');
      expect(t.role).toBe('Role, Company');
    }
  });
});
