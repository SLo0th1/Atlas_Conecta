import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
export default defineConfig({ site: 'https://atlas.gestaonexus.com.br', trailingSlash:'always', integrations:[sitemap({ filter: (page) => !/^\/(plataforma|entrar)(\/|$)/.test(new URL(page).pathname) })] });
