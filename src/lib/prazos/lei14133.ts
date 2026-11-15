// Prazos da Lei 14.133/2021 e metas internas da prefeitura.
// Regra do dono: a lei é o limite; a prefeitura define metas MENORES para ter folga.
// Piso = prazo mínimo (não pode ser encurtado). Teto = prazo máximo (passar dele é alerta).
import metasConfig from '../../../data/config/prazos-internos.json' with { type: 'json' };
import { diasUteisEntre, formatarData, somarDiasCorridos, somarDiasUteis } from './calendario.ts';

export type TipoPrazo = 'piso' | 'teto';
export type Contagem = 'uteis' | 'corridos';
export interface Prazo {
  id: string;
  nome: string;
  tipo: TipoPrazo;
  dias: number;
  contagem: Contagem;
  referencia: string;
  quemCumpre: string;
  observacao: string;
  conferidoNoTexto: boolean;
}

const OBS = 'Conferir no texto oficial antes de usar em produção.';
const p = (id: string, nome: string, tipo: TipoPrazo, dias: number, referencia: string, quemCumpre: string, observacao = OBS): Prazo =>
  ({ id, nome, tipo, dias, contagem: 'uteis', referencia, quemCumpre, observacao, conferidoNoTexto: false });

export const PRAZOS: Prazo[] = [
  p('publicidade_bens_menor_preco', 'Publicidade do edital: bens, menor preço ou maior desconto', 'piso', 8, 'Lei 14.133, art. 55, I, a', 'Prefeitura (agente de contratação)'),
  p('publicidade_servicos_comuns_obras_comuns', 'Publicidade do edital: serviços comuns e obras comuns', 'piso', 10, 'Lei 14.133, art. 55, II, a', 'Prefeitura (agente de contratação)'),
  p('publicidade_servicos_especiais_obras_especiais', 'Publicidade do edital: serviços especiais e obras especiais', 'piso', 25, 'Lei 14.133, art. 55, II, c', 'Prefeitura (agente de contratação)'),
  p('publicidade_integrada', 'Publicidade do edital: contratação integrada', 'piso', 60, 'Lei 14.133, art. 55, II, d', 'Prefeitura (agente de contratação)'),
  p('publicidade_semi_integrada', 'Publicidade do edital: contratação semi-integrada', 'piso', 35, 'Lei 14.133, art. 55, II, d', 'Prefeitura (agente de contratação)'),
  p('publicidade_tecnica_e_preco', 'Publicidade do edital: melhor técnica ou técnica e preço', 'piso', 35, 'Lei 14.133, art. 55, III', 'Prefeitura (agente de contratação)'),
  p('recurso_razoes', 'Recurso: razões do licitante', 'piso', 3, 'Lei 14.133, art. 165, I', 'Licitante (prazo dele; a prefeitura não pode encurtar)'),
  p('contrarrazoes', 'Recurso: contrarrazões', 'piso', 3, 'Lei 14.133, art. 165, §4º', 'Demais licitantes (prazo deles; a prefeitura não pode encurtar)'),
  p('decisao_recurso', 'Decisão do recurso', 'teto', 10, 'Lei 14.133, art. 165, §2º', 'Prefeitura (autoridade competente)'),
  p('pncp_contrato_licitacao', 'Publicação do contrato no PNCP (licitação)', 'teto', 20, 'Lei 14.133, art. 94, I', 'Prefeitura'),
  p('pncp_contrato_direta', 'Publicação do contrato no PNCP (contratação direta)', 'teto', 10, 'Lei 14.133, art. 94, II', 'Prefeitura'),
];

/** Metas internas da prefeitura (dias, na mesma contagem do prazo legal). */
export const METAS: Record<string, number> = (metasConfig as { metas: Record<string, number> }).metas;
export const OBSERVACAO_METAS: string = (metasConfig as { observacao: string }).observacao;

export const buscarPrazo = (id: string): Prazo => {
  const achado = PRAZOS.find((x) => x.id === id);
  if (!achado) throw new Error(`Prazo desconhecido: ${id}`);
  return achado;
};

export type SituacaoPrazo = 'no_prazo' | 'passou_meta' | 'passou_lei' | 'concluido_no_prazo' | 'concluido_apos_meta' | 'concluido_apos_lei';

export interface Avaliacao {
  limiteLegal: string;
  limiteMeta?: string;
  situacao: SituacaoPrazo;
  diasRestantesLegais: number;
  texto: string;
}

const somar = (prazo: Prazo, inicio: string, dias: number, municipio: number): string =>
  prazo.contagem === 'uteis' ? somarDiasUteis(inicio, dias, municipio) : somarDiasCorridos(inicio, dias, municipio);

/** Compara a data de referência (hoje, ou a data de conclusão) com o limite da lei e com a meta interna. */
export function avaliarPrazo(id: string, inicio: string, hoje: string, municipio: number, concluidoEm?: string): Avaliacao {
  const prazo = buscarPrazo(id);
  const limiteLegal = somar(prazo, inicio, prazo.dias, municipio);
  const meta = prazo.tipo === 'teto' ? METAS[id] : undefined;
  const limiteMeta = meta !== undefined ? somar(prazo, inicio, meta, municipio) : undefined;
  const ref = concluidoEm ?? hoje;
  const concluido = concluidoEm !== undefined;
  const diasRestantesLegais = diasUteisEntre(hoje, limiteLegal, municipio);

  let situacao: SituacaoPrazo;
  if (ref > limiteLegal) situacao = concluido ? 'concluido_apos_lei' : 'passou_lei';
  else if (limiteMeta !== undefined && ref > limiteMeta) situacao = concluido ? 'concluido_apos_meta' : 'passou_meta';
  else situacao = concluido ? 'concluido_no_prazo' : 'no_prazo';

  const lei = formatarData(limiteLegal);
  const metaTxt = limiteMeta ? formatarData(limiteMeta) : '';
  const textos: Record<SituacaoPrazo, string> = {
    no_prazo: `No prazo. Limite da lei: ${lei}${metaTxt ? `; meta interna: ${metaTxt}` : ''}.`,
    passou_meta: `Passou da meta interna (${metaTxt}) — atenção. O limite da lei é ${lei}.`,
    passou_lei: `Passou do limite da lei (${lei}) — alerta.`,
    concluido_no_prazo: `Concluído dentro do prazo (limite da lei: ${lei}${metaTxt ? `; meta interna: ${metaTxt}` : ''}).`,
    concluido_apos_meta: `Concluído depois da meta interna (${metaTxt}), mas dentro do limite da lei (${lei}).`,
    concluido_apos_lei: `Concluído depois do limite da lei (${lei}) — fora do prazo legal.`,
  };
  return { limiteLegal, limiteMeta, situacao, diasRestantesLegais, texto: textos[situacao] };
}

/** Piso: a abertura das propostas não pode ser antes do prazo mínimo de publicidade. */
export function validarPiso(id: string, inicioPublicacao: string, dataProposta: string, municipio: number): { ok: boolean; minimo: string; texto: string } {
  const prazo = buscarPrazo(id);
  if (prazo.tipo !== 'piso') throw new Error(`Prazo não é um piso: ${id}`);
  const minimo = somar(prazo, inicioPublicacao, prazo.dias, municipio);
  const ok = dataProposta >= minimo;
  const unidade = prazo.contagem === 'uteis' ? 'dias úteis' : 'dias';
  const texto = ok
    ? `Abertura dentro do prazo mínimo: a data mínima é ${formatarData(minimo)} (${prazo.dias} ${unidade}).`
    : `A abertura não pode ser antes de ${formatarData(minimo)} (prazo mínimo de ${prazo.dias} ${unidade}).`;
  return { ok, minimo, texto };
}
