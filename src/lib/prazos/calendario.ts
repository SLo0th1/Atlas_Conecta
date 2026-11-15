// Calendário de dias úteis (puro, sem fuso: tudo em UTC, datas ISO 'AAAA-MM-DD').
import config from '../../../data/config/feriados.json' with { type: 'json' };

export type Abrangencia = 'nacional' | 'estadual' | 'municipal';
export interface Feriado { data: string; nome: string; abrangencia: Abrangencia; movel: boolean }

const MS_DIA = 86_400_000;
const paraMs = (iso: string): number => {
  const [a, m, d] = iso.split('-').map(Number);
  return Date.UTC(a, m - 1, d);
};
const paraIso = (ms: number): string => new Date(ms).toISOString().slice(0, 10);
const doisDig = (n: number): string => String(n).padStart(2, '0');

/** Soma (ou subtrai) dias corridos a uma data ISO, sem regra de prorrogação. */
export function adicionarDias(iso: string, n: number): string {
  return paraIso(paraMs(iso) + n * MS_DIA);
}

/** Domingo da Páscoa (algoritmo de Meeus/Butcher), em ISO. */
export function pascoa(ano: number): string {
  const a = ano % 19;
  const b = Math.floor(ano / 100);
  const c = ano % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return `${ano}-${doisDig(mes)}-${doisDig(dia)}`;
}

const FIXOS: [string, string][] = [
  ['01-01', 'Confraternização Universal'],
  ['04-21', 'Tiradentes'],
  ['05-01', 'Dia do Trabalho'],
  ['09-07', 'Independência do Brasil'],
  ['10-12', 'Nossa Senhora Aparecida'],
  ['11-02', 'Finados'],
  ['11-15', 'Proclamação da República'],
  ['11-20', 'Consciência Negra'],
  ['12-25', 'Natal'],
];

interface MunicipioFeriados { codigo_ibge: number; conferir?: string; feriados: { mes_dia: string; nome: string; abrangencia: Abrangencia }[] }
const MUNICIPIOS = (config as { municipios: MunicipioFeriados[] }).municipios;

/** Aviso a exibir junto da lista de feriados do município (vazio se não houver cadastro). */
export function avisoFeriados(municipio: number): string {
  return MUNICIPIOS.find((m) => m.codigo_ibge === municipio)?.conferir ?? 'Confirmar com a prefeitura o decreto de feriados e pontos facultativos do ano';
}

/** Feriados e pontos facultativos do ano, em ordem de data. */
export function feriados(ano: number, municipio: number): Feriado[] {
  const p = pascoa(ano);
  const lista: Feriado[] = FIXOS.map(([md, nome]) => ({ data: `${ano}-${md}`, nome, abrangencia: 'nacional', movel: false }));
  lista.push(
    { data: adicionarDias(p, -48), nome: 'Carnaval (ponto facultativo)', abrangencia: 'nacional', movel: true },
    { data: adicionarDias(p, -47), nome: 'Carnaval (ponto facultativo)', abrangencia: 'nacional', movel: true },
    { data: adicionarDias(p, -2), nome: 'Sexta-feira Santa', abrangencia: 'nacional', movel: true },
    { data: adicionarDias(p, 60), nome: 'Corpus Christi (ponto facultativo)', abrangencia: 'nacional', movel: true },
  );
  const local = MUNICIPIOS.find((m) => m.codigo_ibge === municipio);
  for (const f of local?.feriados ?? []) lista.push({ data: `${ano}-${f.mes_dia}`, nome: f.nome, abrangencia: f.abrangencia, movel: false });
  return lista.sort((x, y) => x.data.localeCompare(y.data));
}

const cache = new Map<string, Set<string>>();
function conjuntoDoAno(ano: number, municipio: number): Set<string> {
  const chave = `${municipio}:${ano}`;
  let s = cache.get(chave);
  if (!s) cache.set(chave, (s = new Set(feriados(ano, municipio).map((f) => f.data))));
  return s;
}

export function ehDiaUtil(data: string, municipio: number): boolean {
  const dow = new Date(paraMs(data)).getUTCDay();
  if (dow === 0 || dow === 6) return false;
  return !conjuntoDoAno(Number(data.slice(0, 4)), municipio).has(data);
}

/** Próximo dia útil igual ou posterior à data (prorrogação do vencimento). */
function proximoUtil(data: string, municipio: number): string {
  let d = data;
  while (!ehDiaUtil(d, municipio)) d = adicionarDias(d, 1);
  return d;
}

/** Contagem processual: exclui o dia do início, conta só dias úteis e inclui o do vencimento. */
export function somarDiasUteis(inicio: string, n: number, municipio: number): string {
  let d = inicio;
  let restante = n;
  while (restante > 0) {
    d = adicionarDias(d, 1);
    if (ehDiaUtil(d, municipio)) restante--;
  }
  return proximoUtil(d, municipio);
}

/** Dias corridos: exclui o dia do início; vencimento em dia não útil prorroga para o próximo útil. */
export function somarDiasCorridos(inicio: string, n: number, municipio: number = 0): string {
  return proximoUtil(adicionarDias(inicio, n), municipio);
}

/** Dias úteis de a (exclusive) até b (inclusive). Negativo se b for anterior a a. */
export function diasUteisEntre(a: string, b: string, municipio: number): number {
  if (a === b) return 0;
  const sinal = a < b ? 1 : -1;
  const [de, ate] = sinal === 1 ? [a, b] : [b, a];
  let n = 0;
  for (let d = adicionarDias(de, 1); d <= ate; d = adicionarDias(d, 1)) if (ehDiaUtil(d, municipio)) n++;
  return sinal * n;
}

export function formatarData(iso: string): string {
  const [a, m, d] = iso.split('-');
  return `${d}/${m}/${a}`;
}
