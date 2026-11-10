// Funções de formatação compartilhadas pelas guias do bloco Captação.
import { dados } from './index.ts';

export const hoje = new Date();

/** Dias entre a data de referência (hoje) e uma data ISO (aaaa-mm-dd) ou dd/mm/aaaa. Negativo = já passou. */
export const diasAte = (iso: string | null | undefined, ref: Date = hoje): number | null => {
  if (!iso) return null;
  const d = /^\d{2}\/\d{2}\/\d{4}$/.test(iso) ? `${iso.slice(6)}-${iso.slice(3, 5)}-${iso.slice(0, 2)}` : iso.slice(0, 10);
  const t = Date.parse(`${d}T00:00:00Z`);
  return Number.isNaN(t) ? null : Math.round((t - Date.UTC(ref.getFullYear(), ref.getMonth(), ref.getDate())) / 86400000);
};

export const br = (iso: string | null | undefined): string => {
  if (!iso) return '—';
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(iso)) return iso;
  const [a, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${a}`;
};

export const curto = (s: string | null | undefined, n = 90): string =>
  ((s ?? '').replace(/\s+/g, ' ').trim().slice(0, n) + ((s ?? '').length > n ? '…' : '')) || '—';

export const reais = (n: number): string => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

export const nomeTema = (id: string): string => (dados.listarTemas().find((t) => t.id === id)?.nome ?? id).replace(/ e manejo.*$/i, '');
