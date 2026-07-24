---
title: This Website
subtitle: A custom Astro and TypeScript portfolio site
summary: A custom Astro and TypeScript portfolio site for showing some of my work. It's what you're looking at right now.
brow: personal-site.md
order: 8
featured: true
types:
  - Full-Stack
tags:
  - Astro
  - TypeScript
  - CSS
  - Markdown
image: /assets/personal-portfolio-site/personal-portfolio-site-hero.gif
imageAlt: Animated preview of Shawn Guo's personal portfolio website
github: https://github.com/L1Ryx/personal-site
---

## Overview

This site is a custom portfolio built to show off my projects and games. I wanted the structure to stay simple (relatively!).

New project pages are Markdown files, so updating the portfolio usually means adding one content entry instead of touching layout code. I'd love to chat if you're looking to create something similar for your portfolio!

## Content System

Projects are managed through Astro content collections. The schema keeps each entry consistent: title, summary, ordering, category filters, tags, contributors, images, and optional links.

```ts
const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    brow: z.string().optional(),
    subtitle: z.string(),
    order: z.number(),
    types: z.array(z.string()),
    tags: z.array(z.string()),
    image: z.string(),
    imageAlt: z.string(),
    github: z.string().optional(),
  }),
});
```

The projects page then sorts entries by frontmatter and builds the filter list from the content itself.

```ts
const projects = (await getCollection('projects'))
  .sort((a, b) => a.data.order - b.data.order);

const projectTypes = new Set(projects.flatMap((project) => project.data.types));
const types = ['All Projects', ...Array.from(projectTypes)];
```
