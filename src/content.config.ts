import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const projects = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
	schema: z.object({
		title: z.string(),
		summary: z.string(),
		brow: z.string().optional(),
		role: z.string().optional(),
		subtitle: z.string(),
		order: z.number(),
		featured: z.boolean().default(false),
		types: z.array(z.string()),
		tags: z.array(z.string()),
		contributors: z
			.array(z.object({
				name: z.string(),
				role: z.string(),
			}))
			.default([]),
		image: z.string(),
		imageAlt: z.string(),
		demoVideo: z.string().optional(),
		github: z.string().optional(),
		liveDemo: z.string().optional(),
		external: z.string().optional(),
	}),
});

export const collections = { projects };
