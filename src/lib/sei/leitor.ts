// Leitor da página pública de um processo no SEI (md_pesq_processo_exibir.php).
// Função pura sobre o HTML (sem DOM), para rodar igual no servidor, no script de linha de comando e nos testes.
// Lê três tabelas da página: tblCabecalho, tblDocumentos e tblHistorico. Página sem elas (captcha, erro, link vencido) = null.
import type { AndamentoSei, DocumentoSei, ProcessoSei } from './tipos.ts';

export const TAMANHO_MAXIMO_PAGINA = 5_000_000; // caracteres; a maior página testada tinha ~400 mil
export const LIMITE_LINHAS = 5_000; // por tabela

const BASICAS: Record<string, string> = { nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
const ENTIDADES: Record<string, string> = { ordm: 'º', ordf: 'ª', deg: '°', ndash: '–', mdash: '—' };
// Letras acentuadas do português. O nome diferencia maiúscula de minúscula: &Aacute; = Á, &aacute; = á.
const MARCAS: Record<string, string> = { acute: '́', grave: '̀', circ: '̂', tilde: '̃', uml: '̈', cedil: '̧' };
const ACENTOS: Record<string, string[]> = { a: ['acute', 'grave', 'circ', 'tilde', 'uml'], e: ['acute', 'grave', 'circ', 'uml'], i: ['acute', 'grave', 'circ', 'uml'], o: ['acute', 'grave', 'circ', 'tilde', 'uml'], u: ['acute', 'grave', 'circ', 'uml'], c: ['cedil'], n: ['tilde'] };
for (const [l, lista] of Object.entries(ACENTOS))
  for (const a of lista) {
    ENTIDADES[l + a] = (l + MARCAS[a]).normalize('NFC');
    ENTIDADES[l.toUpperCase() + a] = (l.toUpperCase() + MARCAS[a]).normalize('NFC');
  }

export function decodificarEntidades(s: string): string {
  return s.replace(/&(#x[0-9a-f]{1,6}|#\d{1,7}|[a-z]{2,8}|#39);/gi, (m, nome: string) => {
    if (Object.hasOwn(ENTIDADES, nome)) return ENTIDADES[nome];
    const n = nome.toLowerCase();
    if (Object.hasOwn(BASICAS, n)) return BASICAS[n];
    if (n === '#39') return "'";
    if (n.startsWith('#x')) return codigo(parseInt(n.slice(2), 16), m);
    if (n.startsWith('#')) return codigo(parseInt(n.slice(1), 10), m);
    return m;
  });
}
const codigo = (c: number, original: string): string => {
  if (!Number.isFinite(c) || c < 0 || c > 0x10ffff) return original;
  if (c === 13 || c === 10 || c === 9) return ' ';
  if (c < 32 || (c >= 127 && c < 160)) return '';
  return String.fromCodePoint(c);
};

/** Texto visível de um trecho de HTML: sem tags, com entidades decodificadas e espaços normalizados. */
export function textoDe(html: string): string {
  return decodificarEntidades(html.replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, ' ').replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]*>/g, ' '))
    .replace(/[\u0000-\u001f\u007f-\u009f]/g, ' ') // caractere de controle nunca chega à tela nem ao terminal
    .replace(/\s+/g, ' ')
    .trim();
}

/** Trecho da tabela com o id dado (do `<table` até o `</table>`); null se não houver. */
export function tabelaPorId(html: string, id: string): string | null {
  const m = new RegExp(`<table\\b[^>]*(?<![\\w-])id=["']${id}["'][^>]*>`, 'i').exec(html);
  if (!m) return null;
  const fim = html.indexOf('</table>', m.index);
  return html.slice(m.index, fim === -1 ? undefined : fim);
}

/** Linhas da tabela (sem as de cabeçalho), cada uma como lista do HTML interno das células.
 * A página do SEI às vezes não fecha o `<td>` (ex.: documento restrito); por isso a célula vai até o próximo `<td` ou `</tr>`. */
export function linhasDaTabela(tabela: string): string[][] {
  const linhas: string[][] = [];
  for (const tr of tabela.split(/<tr\b/i).slice(1)) {
    if (linhas.length >= LIMITE_LINHAS) break;
    const corpo = tr.slice(tr.indexOf('>') + 1);
    if (/<th\b/i.test(corpo) && !/<td\b/i.test(corpo)) continue;
    const celulas = [...corpo.matchAll(/<td\b[^>]*>([\s\S]*?)(?=<td\b|<\/tr>|$)/gi)].map((m) => m[1].replace(/<\/td>\s*$/i, ''));
    if (celulas.length) linhas.push(celulas);
  }
  return linhas;
}

/** "24/07/2026" → "2026-07-24"; com hora, "12/11/2026 12:00" → "2026-11-12T12:00". Inválida = null. */
export function dataIso(texto: string, comHora = false): string | null {
  const m = texto.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2}))?/);
  if (!m) return null;
  const [, d, mes, a, h, min] = m;
  const dt = new Date(Date.UTC(+a, +mes - 1, +d));
  if (dt.getUTCFullYear() !== +a || dt.getUTCMonth() !== +mes - 1 || dt.getUTCDate() !== +d) return null;
  const dia = `${a}-${mes}-${d}`;
  if (!comHora) return dia;
  if (h === undefined) return `${dia}T00:00`;
  if (+h > 23 || +min > 59) return null;
  return `${dia}T${h}:${min}`;
}

/** Tira do texto e-mails, números com cara de CPF, logins entre parênteses e o nome que vem depois de "atribuído para",
 * "assinado por", "pelo usuário" etc. (andamentos às vezes citam servidores). A unidade ("pela unidade X") continua,
 * e "devolvido por falta de..." não é tratado como nome. */
export function semDadoPessoal(texto: string): string {
  return texto
    .replace(/(^|[\s(])(atribu[íi]d[oa] (?:para|a|ao|à)|designad[oa] (?:para|a)|encaminhad[oa] para|respons[áa]vel:?|(?:assinad|gerad|cancelad|alterad|inclu[íi]d|exclu[íi]d|autenticad)[oa](?: [^.;,()]{0,60}?)? por|pel[oa] usu[áa]ri[oa]|ao usu[áa]rio|à usu[áa]ria|para o usu[áa]rio|para a usu[áa]ria)\s+(?!(?:a |o )?unidade\b)[^.;,()]+/gi, '$1$2 [pessoa]')
    .replace(/\(\s*[a-z0-9_-]+[._][a-z0-9._-]{1,38}\s*\)/gi, '') // login com ponto ou sublinhado, ex.: (fulano.tal)
    .replace(/[\w.+-]+@[\w-]+(\.[\w-]+)+/g, '[e-mail]')
    .replace(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, '[CPF]');
}

const total = (html: string, rotulo: string): number | null => {
  const m = new RegExp(`${rotulo}\\s*\\((\\d+)\\s+registros?\\)`, 'i').exec(html);
  return m ? Number(m[1]) : null;
};

function lerCabecalho(tabela: string | null): Pick<ProcessoSei, 'numero' | 'tipo' | 'geradoEm'> {
  const saida: Pick<ProcessoSei, 'numero' | 'tipo' | 'geradoEm'> = { numero: null, tipo: null, geradoEm: null };
  if (!tabela) return saida;
  for (const [rot, val] of linhasDaTabela(tabela)) {
    const r = textoDe(rot ?? '').toLowerCase();
    const v = textoDe(val ?? '');
    if (r.startsWith('processo')) saida.numero = v || null;
    else if (r.startsWith('tipo')) saida.tipo = v || null;
    else if (r.startsWith('data de gera')) saida.geradoEm = dataIso(v);
    // "Interessados" fica de fora de propósito: pode trazer nome de pessoa.
  }
  return saida;
}

function lerDocumentos(tabela: string): DocumentoSei[] {
  const docs: DocumentoSei[] = [];
  for (const c of linhasDaTabela(tabela)) {
    if (c.length < 6) continue;
    const numero = textoDe(c[1]).match(/\d+/)?.[0];
    if (!numero) continue;
    const publico = /md_pesq_documento_consulta_externa\.php/i.test(c[1]) && !/documento_restrito/i.test(c[1]);
    docs.push({ numero, tipo: textoDe(c[2]), data: dataIso(textoDe(c[3])), unidade: textoDe(c[5]), publico });
  }
  return docs;
}

function lerAndamentos(tabela: string): AndamentoSei[] {
  const lista: AndamentoSei[] = [];
  for (const c of linhasDaTabela(tabela)) {
    if (c.length < 3) continue;
    const dataHora = dataIso(textoDe(c[0]), true);
    if (!dataHora) continue;
    lista.push({ dataHora, unidade: textoDe(c[1]), descricao: semDadoPessoal(textoDe(c[2])) });
  }
  // A página já vem do mais recente para o mais antigo; ordenar garante isso mesmo se mudar (sort estável).
  return lista.sort((a, b) => (a.dataHora < b.dataHora ? 1 : a.dataHora > b.dataHora ? -1 : 0));
}

/** Lê a página do processo. null = não é a página de um processo (captcha, erro, link vencido ou página grande demais). */
export function lerPaginaProcesso(html: string): ProcessoSei | null {
  if (typeof html !== 'string' || html.length > TAMANHO_MAXIMO_PAGINA) return null;
  const docs = tabelaPorId(html, 'tblDocumentos');
  const hist = tabelaPorId(html, 'tblHistorico');
  if (docs === null || hist === null) return null;
  return {
    ...lerCabecalho(tabelaPorId(html, 'tblCabecalho')),
    totalDocumentos: total(docs, 'Lista de Protocolos'),
    totalAndamentos: total(hist, 'Lista de Andamentos'),
    documentos: lerDocumentos(docs),
    andamentos: lerAndamentos(hist),
  };
}
