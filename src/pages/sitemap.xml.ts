import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import modules from '../data/modules.json';
import offers from '../data/offers.json';
export const GET: APIRoute = async ({ site }) => {
  const paths = ['/', '/compradores/', '/setor-publico/', '/fornecedores/', '/insights/', '/sobre/', '/privacidade/', '/termos/', '/demonstracao/', ...['artigo','estudo-de-caso','guia','boletim'].map(t=>`/tipo/${t}/`), ...(await getCollection('insights')).map(e=>`/insights/${e.id}/`), ...modules.map(m=>`/plataforma/${m.slug ? `${m.slug}/` : ''}`), ...offers.map(o=>`/plataforma/oferta-${o.id}/`)];
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map(path=>`<url><loc>${new URL(path,site)}</loc></url>`).join('')}</urlset>`, {headers:{'Content-Type':'application/xml'}});
};
