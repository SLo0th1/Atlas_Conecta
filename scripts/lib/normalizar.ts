// Normalizações compartilhadas pelos importadores (carteira e cronogramas).

export const semAcento = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');
/** Texto de cabeçalho para comparação: sem quebras/espaços múltiplos, sem acento, minúsculas, sem ponto final. */
export const normCab = (s: unknown) =>
  semAcento(String(s ?? ''))
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/[.\s]+$/, '');

/** Valor "cru" da célula: fórmula → resultado, rich text → texto junto, erro → null. */
export function bruto(v: unknown): unknown {
  if (v === null || v === undefined) return null;
  if (v instanceof Date || typeof v === 'number' || typeof v === 'string' || typeof v === 'boolean') return v;
  if (typeof v === 'object') {
    const o = v as Record<string, unknown>;
    if ('result' in o) return bruto(o.result);
    if ('formula' in o || 'sharedFormula' in o) return null;
    if (Array.isArray(o.richText)) return (o.richText as { text?: string }[]).map((t) => t.text ?? '').join('');
    if ('error' in o) return null;
    if ('text' in o) return bruto(o.text);
  }
  return null;
}

export function texto(v: unknown): string | null {
  let b = bruto(v);
  if (b instanceof Date) b = isoData(b);
  if (b === null || typeof b === 'boolean') return null;
  const t = String(b)
    .replace(/\r?\n|\r/g, '; ')
    .replace(/\s+/g, ' ')
    .replace(/(; )+/g, '; ')
    .trim();
  return t === '' ? null : t;
}

export function isoData(d: Date): string {
  const x = new Date(d.getTime());
  if (x.getUTCHours() >= 12) x.setUTCDate(x.getUTCDate() + 1);
  return x.toISOString().slice(0, 10);
}

export function numero(v: unknown, campo: string, pend: string[]): number | null {
  const b = bruto(v);
  if (b === null) return null;
  if (typeof b === 'number') return Number.isFinite(b) ? b : null;
  if (typeof b !== 'string') return null;
  const s = b.replace(/R\$/gi, '').replace(/\s+/g, '');
  if (s === '' || s === '-' || s === '—') return null;
  let n: number | null = null;
  if (/^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) n = Number(s.replace(/,/g, ''));
  else if (/^-?\d+(\.\d+)?$/.test(s)) n = Number(s);
  else if (/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(s) || /^-?\d+,\d+$/.test(s)) n = Number(s.replace(/\./g, '').replace(',', '.'));
  if (n === null || !Number.isFinite(n)) {
    pend.push(`Valor não reconhecido em ${campo}`);
    return null;
  }
  return n;
}

export function dataIso(v: unknown, campo: string, pend: string[]): string | null {
  const b = bruto(v);
  if (b === null) return null;
  if (b instanceof Date) return isoData(b);
  if (typeof b === 'number' && b >= 20000 && b <= 80000) return new Date(Date.UTC(1899, 11, 30) + Math.floor(b) * 86400000).toISOString().slice(0, 10); // serial do Excel
  if (typeof b === 'string') {
    const s = b.trim();
    if (s === '' || s === '-' || s === '—') return null;
    if (/^\d{5}(\.\d+)?$/.test(s) && Number(s) >= 20000 && Number(s) <= 80000) return dataIso(Number(s), campo, pend);
    const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  }
  pend.push(`Data não reconhecida em ${campo}`);
  return null;
}

export function simNao(v: unknown): boolean | null {
  const t = texto(v);
  if (t === null) return null;
  const n = normCab(t);
  if (n === 'sim') return true;
  if (n === 'nao') return false;
  return null;
}

export function extrairSei(t: string | null): string[] {
  if (!t) return [];
  const out: string[] = [];
  for (const m of t.matchAll(/\d{2}\.?\d{1,2}\.?\d{9}-?\d/g)) {
    const d = m[0].replace(/\D/g, '');
    const dv = d.slice(-1);
    const num = d.slice(-10, -1);
    const ano = d.slice(0, 2);
    const orgao = d.slice(2, -10);
    const s = `${ano}.${orgao}.${num}-${dv}`;
    if (!out.includes(s)) out.push(s);
  }
  return out;
}

export const STOP = new Set(['de', 'da', 'do', 'das', 'dos', 'para', 'com']);
export const palavras = (s: string) =>
  new Set(
    semAcento(s)
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length >= 3 && !STOP.has(w)),
  );
export function jaccard(a: Set<string>, b: Set<string>) {
  if (a.size === 0 || b.size === 0) return 0;
  let i = 0;
  for (const x of a) if (b.has(x)) i++;
  return i / (a.size + b.size - i);
}
