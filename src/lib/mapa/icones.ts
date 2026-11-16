// Ícones e cores do mapa das obras: uma forma por categoria (nada depende só de cor). Textos constantes, sem dados do usuário.
import type { CategoriaObra } from './tipos.ts';

/** Cores com contraste mínimo de 3:1 com o fundo claro do mapa e com o glifo branco. */
export const COR_CATEGORIA: Record<CategoriaObra, string> = {
  saude: '#c62828',
  educacao: '#1565c0',
  assistencia: '#6a1b9a',
  via: '#e65100',
  ponte: '#5d4037',
  drenagem: '#006064',
  lazer: '#2e7d32',
  cultura: '#ad1457',
  edificacao: '#455a64',
};

const NS = 'http://www.w3.org/2000/svg';
const TRACO = 'fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';

/** Desenho (viewBox 0 0 24 24, branco) de cada categoria. */
const GLIFO: Record<CategoriaObra, string> = {
  saude: '<path fill="#fff" d="M10 4h4v6h6v4h-6v6h-4v-6H4v-4h6z"/>',
  educacao: `<path ${TRACO} d="M3.5 6.5c3-1.3 6-1 8.5 1 2.5-2 5.500-2.300 8.500-1v11c-3-1.300-6-1-8.500 1-2.500-2-5.500-2.300-8.500-1z"/><path ${TRACO} d="M12 7.500v11"/>`,
  assistencia: `<path fill="#fff" d="M12 15.500s-4.500-2.800-4.500-6A2.600 2.600 0 0 1 12 7.800a2.600 2.600 0 0 1 4.500 1.700c0 3.200-4.500 6-4.500 6z"/><path ${TRACO} d="M3.500 14c2.500 4 5.500 5.500 8.500 5.500s6-1.500 8.500-5.500"/>`,
  via: `<path ${TRACO} d="M8.500 4 5 20M15.500 4 19 20"/><path ${TRACO} d="M12 5.500v2.500M12 10.500v3M12 16v2.500"/>`,
  ponte: `<path ${TRACO} d="M3 18h18M4.500 18v-3c0-4 3.400-7 7.500-7s7.500 3 7.500 7v3"/><path ${TRACO} d="M12 8v10M8 9.500V18M16 9.500V18"/>`,
  drenagem: '<path fill="#fff" d="M12 3.500c3.500 4.300 6 7.300 6 10.300a6 6 0 0 1-12 0c0-3 2.500-6 6-10.300z"/>',
  lazer: '<path fill="#fff" d="M12 3.500a5 5 0 0 0-4 8 4 4 0 0 0 3 6.900V21h2v-2.600a4 4 0 0 0 3-6.900 5 5 0 0 0-4-8z"/>',
  cultura: '<path fill="#fff" fill-rule="evenodd" d="M5 5.500h14v6.500c0 4-3 7-7 7s-7-3-7-7zM8.200 10.200a1.300 1.300 0 1 0 2.600 0 1.300 1.300 0 1 0-2.600 0zM13.200 10.200a1.300 1.300 0 1 0 2.600 0 1.300 1.300 0 1 0-2.600 0zM9 14.500c1.200 1.800 4.800 1.800 6 0-1.800.7-4.200.7-6 0z"/>',
  edificacao: '<path fill="#fff" fill-rule="evenodd" d="M6 20.500V4h12v16.500h-3.200V16H9.200v4.500zM9 7h2v2H9zM13 7h2v2h-2zM9 11h2v2H9zM13 11h2v2h-2z"/>',
};

/** Fonte SVG (string constante) do glifo de uma categoria. */
export const svgGlifo = (c: CategoriaObra): string => `<svg xmlns="${NS}" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">${GLIFO[c]}</svg>`;

/** Cria o elemento SVG sem usar innerHTML. */
export function elementoGlifo(c: CategoriaObra): SVGElement {
  const doc = new DOMParser().parseFromString(svgGlifo(c), 'image/svg+xml');
  return document.importNode(doc.documentElement, true) as unknown as SVGElement;
}
