import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
// Nomes de arquivo do build só com 0-9 e a-f: a Vercel deixou de servir um pacote cujo nome terminava em "_" (simulacao.mqF-P3E_.js → 404) e o mapa ficou em branco.
export default defineConfig({ site: 'https://atlas.gestaonexus.com.br', trailingSlash:'always', vite:{ build:{ rollupOptions:{ output:{ hashCharacters:'hex' } } } }, integrations:[sitemap({ filter: (page) => !/^\/(plataforma|entrar)(\/|$)/.test(new URL(page).pathname) })] });
