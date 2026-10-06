import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';
import type { SchemaContext } from 'astro:content';

type ImageFunction = SchemaContext['image'];

const seo = (image: ImageFunction) => z.object({
  title: z.string(),
  description: z.string(),
  ogImage: image().optional(),
}).strict();

const galleryItem = (image: ImageFunction) => z.object({
  title: z.string(),
  description: z.string(),
  href: z.string().optional(),
  thumb: image(),
  alt: z.string(),
  video: z.string().optional(),
}).strict();

const linkedImage = (image: ImageFunction) => z.object({
  src: image(), alt: z.string(), href: z.string().optional(),
}).strict();

const block = (image: ImageFunction) => z.discriminatedUnion('type', [
  z.object({ type: z.literal('text'), md: z.string() }).strict(),
  z.object({ type: z.literal('image'), src: image(), alt: z.string(), href: z.string().optional() }).strict(),
  z.object({ type: z.literal('gallery'), items: z.array(galleryItem(image)) }).strict(),
  z.object({ type: z.literal('video'), src: z.string(), poster: image() }).strict(),
  z.object({ type: z.literal('embed'), provider: z.enum(['vimeo', 'youtube']), id: z.string() }).strict(),
  z.object({ type: z.literal('link'), href: z.string(), label: z.string() }).strict(),
]);

const media = (image: ImageFunction) => z.discriminatedUnion('type', [
  z.object({ type: z.literal('image'), src: image(), alt: z.string() }).strict(),
  z.object({ type: z.literal('video'), src: z.string(), poster: image() }).strict(),
]);

const menuItem = z.object({ label: z.string(), target: z.string() }).strict();

const projects = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/projects' }),
  schema: ({ image }) => z.object({
    title: z.string(),
    client: z.string().optional(),
    copyright: z.string().optional(),
    heroCaption: z.string().optional(),
    categories: z.array(z.string()),
    listed: z.boolean(),
    order: z.number().optional(),
    hero: media(image).optional(),
    badges: z.array(linkedImage(image)),
    backLink: z.object({ label: z.string(), href: z.string() }).strict().optional(),
    seo: seo(image),
    blocks: z.array(block(image)),
  }).strict(),
});

const cards = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/cards' }),
  schema: ({ image }) => z.object({
    name: z.string(),
    blurb: z.string(),
    role: z.string(),
    qr: linkedImage(image),
    photo: linkedImage(image),
    links: z.array(z.object({ label: z.string(), href: z.string() }).strict()),
    phone: z.object({ display: z.string(), href: z.string() }).strict(),
    email: z.object({ display: z.string(), href: z.string() }).strict(),
    vcard: z.object({ label: z.string(), href: z.string() }).strict(),
    seo: seo(image),
  }).strict(),
});

const basic = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/basic' }),
  schema: ({ image }) => z.object({ seo: seo(image), blocks: z.array(block(image)) }).strict(),
});

const formSchema = z.object({
  fields: z.array(z.object({
    name: z.string(), type: z.string(), label: z.string(), required: z.boolean(),
    placeholder: z.string().optional(),
  }).strict()),
  groups: z.array(z.object({ name: z.string(), label: z.string(), required: z.boolean(), options: z.array(z.string()) }).strict()),
  submitLabel: z.string(),
}).strict();

const home = defineCollection({
  loader: glob({ pattern: 'home.md', base: './src/content/home' }),
  schema: ({ image }) => z.object({
    seo: seo(image),
    menu: z.array(menuItem),
    slides: z.array(z.object({
      id: z.string(),
      media: media(image),
      badges: z.array(linkedImage(image)),
      md: z.string().optional(),
      cta: z.object({ label: z.string(), href: z.string() }).strict().optional(),
    }).strict()),
    allProjects: z.object({ md: z.string(), items: z.array(galleryItem(image)) }).strict(),
    contact: z.object({ md: z.array(z.string()), form: formSchema }).strict(),
  }).strict(),
});

const projectsIndex = defineCollection({
  loader: glob({ pattern: 'projects.md', base: './src/content/projectsIndex' }),
  schema: ({ image }) => z.object({
    seo: seo(image),
    menu: z.array(menuItem),
    sections: z.array(z.object({ id: z.string(), heading: z.string(), items: z.array(galleryItem(image)) }).strict()),
  }).strict(),
});

const site = defineCollection({
  loader: glob({ pattern: 'site.md', base: './src/content/site' }),
  schema: ({ image }) => z.object({
    logo: z.object({ src: image(), alt: z.string(), href: z.string() }).strict(),
    footer: z.array(block(image)),
  }).strict(),
});

export const collections = { projects, cards, basic, home, projectsIndex, site };
