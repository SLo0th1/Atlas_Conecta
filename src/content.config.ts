import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';
export const collections = { insights: defineCollection({loader:glob({pattern:'**/*.md',base:'./src/content/insights'}),schema:z.object({title:z.string(),tipo:z.enum(['artigo','estudo-de-caso','guia','boletim']),date:z.coerce.date(),resumo:z.string(),tags:z.array(z.string())})}) };
