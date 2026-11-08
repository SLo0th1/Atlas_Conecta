import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
export const GET: APIRoute = async ({ site }) => {
  const paths = ['/', '/compradores/', '/setor-publico/', '/fornecedores/', '/insights/', '/sobre/', '/privacidade/', '/termos/', '/demonstracao/', ...['artigo','estudo-de-caso','guia','boletim'].map(t=>`/tipo/${t}/`), ...(await getCollection('insights')).map(e=>`/insights/${e.id}/`)];
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map(path=>`<url><loc>${new URL(path,site)}</loc></url>`).join('')}</urlset>`, {headers:{'Content-Type':'application/xml'}});
};
