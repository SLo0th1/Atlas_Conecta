// Central de alertas (Gestão, Fase 4): junta numa lista única os alertas de prazo e de risco de todos os módulos.
// Funções puras: os dados e o dia de referência (`hoje`, ISO 'AAAA-MM-DD') entram por parâmetro; nada lê arquivo nem relógio.
// Regra do dono: só alerta o que os dados realmente têm; o que ainda não tem fonte vai para "Ainda sem fonte de dados".
// Nunca expõe nomes de pessoas (o campo `responsavel` dos projetos e das etapas não é lido aqui).
import type { Carteira, Projeto } from '../carteira/tipos.ts';
import { fimDaMacroetapaAtual, saldoSemFonte } from '../carteira/visoes.ts';
import { nomeMacroetapa } from '../carteira/macroetapas.ts';
import type { Cronograma } from '../cronograma/tipos.ts';
import { diasEntre, itensParados } from '../cronograma/visoes.ts';
import { adicionarDias, diasUteisEntre, formatarData } from '../prazos/calendario.ts';
import { avaliarPrazo, buscarPrazo } from '../prazos/lei14133.ts';

export type Gravidade = 'vermelho' | 'amarelo';
export type TipoAlerta =
  | 'clausula'
  | 'vigencia'
  | 'edital'
  | 'homologacao'
  | 'inicio-obra'
  | 'fim-obra'
  | 'prazo-lei'
  | 'sem-fonte'
  | 'parada'
  | 'defasado';

/** Tipos na ordem da tela. `principal` = um dos cinco alertas principais do Fluxo. */
export const TIPOS: { id: TipoAlerta; nome: string; principal: boolean }[] = [
  { id: 'clausula', nome: 'Cláusula suspensiva', principal: true },
  { id: 'vigencia', nome: 'Vigência de convênio', principal: false },
  { id: 'edital', nome: 'Edital na praça', principal: true },
  { id: 'homologacao', nome: 'Homologação e contrato', principal: true },
  { id: 'inicio-obra', nome: 'Início de obra', principal: true },
  { id: 'fim-obra', nome: 'Fim de obra', principal: true },
  { id: 'prazo-lei', nome: 'Prazo da Lei 14.133', principal: false },
  { id: 'sem-fonte', nome: 'Saldo sem fonte', principal: false },
  { id: 'parada', nome: 'Etapa parada', principal: false },
  { id: 'defasado', nome: 'Dado defasado', principal: false },
];
export const nomeTipo = (t: TipoAlerta): string => TIPOS.find((x) => x.id === t)?.nome ?? t;

// Limites das regras (provisórios; ajustáveis pela gestão). Mesmos valores já usados nos alertas da Captação.
export const DIAS_SEM_DESEMBOLSO = 180;
export const DIAS_VIGENCIA_AVISO = 90;
export const DIAS_VIGENCIA_VERMELHO = 30;
export const DIAS_AVISO_OBRA = 30;
export const DIAS_PARADA_VERMELHO = 30;
export const DIAS_CARTEIRA_DEFASADA = 7;

export interface AlertaCentral {
  id: string;
  tipo: TipoAlerta;
  gravidade: Gravidade;
  titulo: string;
  detalhe: string;
  /** Por que o alerta foi gerado (regra aplicada), em português simples. */
  regra: string;
  projeto: { id: string; nome: string } | null;
  convenio: string | null;
  /** Sigla do órgão da prefeitura; null quando não há (convênios e fontes de dados). */
  orgao: string | null;
  prazo: string | null;
  /** Dias corridos de hoje até o prazo: negativo = vencido há N dias; positivo = faltam N dias. */
  dias: number | null;
  /** Mesma contagem em dias úteis (feriados nacionais e municipais). */
  diasUteis: number | null;
  acao: string;
  link: string;
}

/** Convênio como vem da coleta do Transferegov (datas 'dd/mm/aaaa'). */
export interface ConvenioEntrada {
  nr_convenio: string | number;
  objeto?: string | null;
  orgao_superior?: string | null;
  situacao?: string | null;
  assinatura?: string | null;
  vigencia_fim?: string | null;
  valor_repasse?: number | null;
  valor_desembolsado?: number | null;
}

/** Fonte de dados avaliada (mesma forma de avaliarFontes em src/lib/dados/qualidade.ts). */
export interface FonteAvaliada {
  id: string;
  nome: string;
  situacao: string;
  idade: number | null;
  limite: number;
  motivo: string;
  acao: string;
}

/** Evento de licitação com prazo da Lei 14.133 (início da contagem). Ainda sem fonte: virá do PNCP / módulo Contratação. */
export interface EventoPrazo {
  prazoId: string;
  inicio: string;
  concluidoEm?: string;
  projetoId: string | null;
  descricao: string;
}

export interface SemFonte {
  tipo: TipoAlerta;
  titulo: string;
  falta: string;
  hoje: string;
}

export interface EntradaCentral {
  carteira: Carteira;
  cronogramas: Cronograma[];
  /** Data da importação dos cronogramas (ISO); null se não houver. */
  cronogramasImportadosEm: string | null;
  /** null = a coleta de convênios ainda não existe. */
  convenios: ConvenioEntrada[] | null;
  fontes: FonteAvaliada[];
  eventosLei: EventoPrazo[];
  hoje: string;
  municipio: number;
}

export interface CentralAlertas {
  hoje: string;
  alertas: AlertaCentral[];
  porTipo: { tipo: TipoAlerta; nome: string; total: number; vermelho: number; amarelo: number }[];
  porOrgao: { orgao: string; total: number; vermelho: number }[];
  totais: { total: number; vermelho: number; amarelo: number };
  semFonte: SemFonte[];
}

export const SEM_ORGAO = 'Sem órgão da prefeitura';
const URL = {
  carteira: '/plataforma/projetos-carteira/',
  parado: '/plataforma/projetos-parado/',
  acompanhamento: '/plataforma/captacao-acompanhamento/',
  qualidade: '/plataforma/captacao-qualidade/',
  log: '/plataforma/projetos-log/',
  prazos: '/plataforma/licitacoes-prazos/',
};
const linkProjeto = (p: Projeto): string => `${URL.carteira}?q=${encodeURIComponent(p.nome)}`;

/** 'dd/mm/aaaa' → ISO; ISO passa direto; outro formato → null. */
export function paraIso(v: string | null | undefined): string | null {
  if (!v) return null;
  const s = String(v).trim();
  const br = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (br) return `${br[3]}-${br[2]}-${br[1]}`;
  return /^\d{4}-\d{2}-\d{2}/.test(s) ? s.slice(0, 10) : null;
}

/**
 * Regra do Fluxo: prazo da prefeitura (meta) × prazo da lei ou do instrumento (teto).
 * Passou do teto = vermelho; passou da meta (sem passar do teto) = amarelo; senão, sem alerta (null).
 */
export function gravidadeMetaTeto(hoje: string, meta: string | null, teto: string | null): Gravidade | null {
  if (teto && hoje > teto) return 'vermelho';
  if (meta && hoje > meta) return 'amarelo';
  return null;
}

const pl = (n: number, um: string, varios: string): string => `${n} ${n === 1 ? um : varios}`;
/** "vencido há 3 dias", "vence hoje", "faltam 12 dias". */
export function textoDias(dias: number | null): string {
  if (dias === null) return 'sem prazo';
  if (dias < 0) return `vencido há ${pl(-dias, 'dia', 'dias')}`;
  if (dias === 0) return 'vence hoje';
  return `${dias === 1 ? 'falta' : 'faltam'} ${pl(dias, 'dia', 'dias')}`;
}

const curto = (s: string | null | undefined, n: number): string => {
  const t = String(s ?? '').replace(/\s+/g, ' ').trim();
  return t.length > n ? `${t.slice(0, n - 1)}…` : t;
};
const reais = (n: number): string => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

type Base = Omit<AlertaCentral, 'dias' | 'diasUteis'>;
function comDias(a: Base, hoje: string, municipio: number): AlertaCentral {
  return {
    ...a,
    dias: a.prazo ? diasEntre(hoje, a.prazo) : null,
    diasUteis: a.prazo ? diasUteisEntre(hoje, a.prazo, municipio) : null,
  };
}

/** Cláusula suspensiva (indício) e vigência dos convênios em execução. */
export function alertasConvenios(convenios: ConvenioEntrada[], hoje: string): Base[] {
  const saida: Base[] = [];
  for (const c of convenios.filter((x) => /^Em execu/i.test(x.situacao ?? ''))) {
    const nr = String(c.nr_convenio);
    const objeto = curto(c.objeto, 90);
    const fim = paraIso(c.vigencia_fim);
    const assinatura = paraIso(c.assinatura);
    const faltam = fim ? diasEntre(hoje, fim) : null;

    if ((c.valor_desembolsado ?? 0) === 0 && assinatura && diasEntre(assinatura, hoje) > DIAS_SEM_DESEMBOLSO) {
      const semDesembolso = diasEntre(assinatura, hoje);
      const vermelho = faltam !== null && faltam <= DIAS_VIGENCIA_AVISO;
      saida.push({
        id: `clausula-${nr}`,
        tipo: 'clausula',
        gravidade: vermelho ? 'vermelho' : 'amarelo',
        titulo: `Convênio ${nr} assinado há ${semDesembolso} dias e sem nenhum desembolso`,
        detalhe: `${objeto}. Concedente: ${c.orgao_superior ?? 'não informado'}. Repasse pactuado: ${reais(c.valor_repasse ?? 0)}.`,
        regra: `Sem nenhum desembolso há mais de ${DIAS_SEM_DESEMBOLSO} dias costuma indicar cláusula suspensiva não cumprida. Fica vermelho quando a vigência termina em ${DIAS_VIGENCIA_AVISO} dias ou menos (risco de perder o recurso).`,
        projeto: null,
        convenio: nr,
        orgao: null,
        prazo: fim,
        acao: 'Confirmar com a secretaria e com o concedente qual exigência falta (projeto, licença, área, licitação) e cumprir antes do fim da vigência.',
        link: URL.acompanhamento,
      });
    }

    if (faltam !== null && faltam <= DIAS_VIGENCIA_AVISO) {
      const vencida = faltam < 0;
      saida.push({
        id: `vigencia-${nr}`,
        tipo: 'vigencia',
        gravidade: faltam <= DIAS_VIGENCIA_VERMELHO ? 'vermelho' : 'amarelo',
        titulo: vencida ? `Vigência do convênio ${nr} já terminou` : `Vigência do convênio ${nr} termina em ${pl(faltam, 'dia', 'dias')}`,
        detalhe: `${objeto}. Vigência até ${formatarData(fim as string)}.`,
        regra: `Avisar quando faltarem ${DIAS_VIGENCIA_AVISO} dias ou menos para o fim da vigência; vermelho com ${DIAS_VIGENCIA_VERMELHO} dias ou menos.`,
        projeto: null,
        convenio: nr,
        orgao: null,
        prazo: fim,
        acao: vencida ? 'Conferir no Transferegov se houve prorrogação; se não, tratar a prestação de contas.' : 'Avaliar se o objeto termina a tempo; se não, pedir prorrogação (termo aditivo) ao concedente antes do vencimento.',
        link: URL.acompanhamento,
      });
    }
  }
  return saida;
}

/** Datas previstas da planilha: fim da contratação, início e fim de obra. */
export function alertasObra(carteira: Carteira, hoje: string): Base[] {
  const saida: Base[] = [];
  const aviso = adicionarDias(hoje, DIAS_AVISO_OBRA);
  const regra = (marco: string) => `Data prevista de ${marco} (planilha): vermelho quando já passou; amarelo quando faltam ${DIAS_AVISO_OBRA} dias ou menos.`;
  const gravidade = (data: string): Gravidade | null => (data < hoje ? 'vermelho' : data <= aviso ? 'amarelo' : null);
  for (const p of carteira.projetos) {
    const base = { projeto: { id: p.id, nome: p.nome }, convenio: null, orgao: p.orgao, link: linkProjeto(p) };
    const etapa = nomeMacroetapa(p.macroetapa);

    if (p.macroetapa === '03' && p.datas.contratacao) {
      const g = gravidade(p.datas.contratacao);
      if (g)
        saida.push({
          ...base, id: `homologacao-${p.id}`, tipo: 'homologacao', gravidade: g,
          titulo: g === 'vermelho' ? 'Contratação passou da data prevista' : 'Contratação perto da data prevista',
          detalhe: `Em ${etapa}. Fim previsto da contratação (homologação e assinatura do contrato): ${formatarData(p.datas.contratacao)}.`,
          regra: regra('fim da contratação'), prazo: p.datas.contratacao,
          acao: 'Conferir em que fase está a licitação (julgamento, recurso, homologação) e o que falta para assinar o contrato.',
        });
    }

    if ((p.macroetapa === '03' || p.macroetapa === '04') && p.datas.mobilizacao) {
      const g = gravidade(p.datas.mobilizacao);
      if (g)
        saida.push({
          ...base, id: `inicio-obra-${p.id}`, tipo: 'inicio-obra', gravidade: g,
          titulo: g === 'vermelho' ? 'Obra ainda não começou e a data prevista passou' : 'Início de obra previsto para breve',
          detalhe: `Em ${etapa}. Início previsto da obra (fim da mobilização): ${formatarData(p.datas.mobilizacao)}.`,
          regra: regra('início da obra'), prazo: p.datas.mobilizacao,
          acao: g === 'vermelho' ? 'Verificar a ordem de serviço e a mobilização da empresa; atualizar a data prevista se mudou.' : 'Confirmar ordem de serviço, canteiro e equipe da empresa contratada.',
        });
    }

    if (p.macroetapa === '05' && p.datas.encerramento) {
      const g = gravidade(p.datas.encerramento);
      if (g)
        saida.push({
          ...base, id: `fim-obra-${p.id}`, tipo: 'fim-obra', gravidade: g,
          titulo: g === 'vermelho' ? 'Obra passou da data prevista de entrega' : 'Entrega da obra prevista para breve',
          detalhe: `Em execução. Entrega prevista: ${formatarData(p.datas.encerramento)}.`,
          regra: regra('entrega da obra'), prazo: p.datas.encerramento,
          acao: g === 'vermelho' ? 'Conferir o andamento físico e a necessidade de aditivo de prazo dentro do limite legal.' : 'Preparar o recebimento da obra (vistoria, termo de recebimento) e a comunicação da entrega.',
        });
    }
  }
  return saida;
}

/** Valor do projeto ainda sem fonte (captado + contrapartida + custeio municipal não cobrem o total). */
export function alertasSemFonte(carteira: Carteira): Base[] {
  const saida: Base[] = [];
  for (const p of carteira.projetos) {
    if (p.macroetapa === '06') continue;
    const saldo = saldoSemFonte(p);
    if (saldo === null || saldo <= 0) continue;
    const avancado = p.macroetapa === '03' || p.macroetapa === '04' || p.macroetapa === '05';
    saida.push({
      id: `sem-fonte-${p.id}`, tipo: 'sem-fonte', gravidade: avancado ? 'vermelho' : 'amarelo',
      titulo: `${reais(saldo)} ainda sem fonte de recurso`,
      detalhe: `Em ${nomeMacroetapa(p.macroetapa)}. O total do projeto não está coberto por recurso captado, contrapartida e custeio do município.`,
      regra: 'Vermelho quando o projeto já está em contratação, mobilização ou execução (não pode seguir sem fonte); amarelo nas fases anteriores.',
      projeto: { id: p.id, nome: p.nome }, convenio: null, orgao: p.orgao, prazo: fimDaMacroetapaAtual(p),
      acao: 'Definir a fonte (captação externa, contrapartida ou custeio) antes da próxima etapa.',
      link: linkProjeto(p),
    });
  }
  return saida;
}

/** Etapas dos cronogramas com prazo vencido, uma linha por cronograma (a mais antiga em destaque). */
export function alertasParadas(cronogramas: Cronograma[], carteira: Carteira, hoje: string): Base[] {
  const saida: Base[] = [];
  for (const c of cronogramas) {
    const doCrono = itensParados([c], hoje);
    if (!doCrono.length) continue;
    const antigo = doCrono.reduce((m, i) => (i.dias > m.dias ? i : m), doCrono[0]);
    const p = carteira.projetos.find((x) => x.id === c.projeto_id) ?? null;
    saida.push({
      id: `parada-${c.id}`, tipo: 'parada', gravidade: antigo.dias > DIAS_PARADA_VERMELHO ? 'vermelho' : 'amarelo',
      titulo: `${pl(doCrono.length, 'etapa atrasada', 'etapas atrasadas')} no cronograma`,
      detalhe: `${curto(c.titulo, 90)}. Mais antiga: "${antigo.etapa}"${antigo.unidade ? ` (com ${antigo.unidade})` : ''}, atrasada há ${pl(antigo.dias, 'dia', 'dias')}.`,
      regra: `Etapa com fim previsto vencido (ou início previsto vencido sem começar). Vermelho quando a mais antiga passa de ${DIAS_PARADA_VERMELHO} dias.`,
      projeto: p ? { id: p.id, nome: p.nome } : null, convenio: null, orgao: p?.orgao ?? null,
      prazo: adicionarDias(hoje, -antigo.dias),
      acao: 'Cobrar a unidade com a etapa mais antiga e redistribuir a carga se preciso (sem punição).',
      link: URL.parado,
    });
  }
  return saida;
}

/** Dado defasado: fontes federais e a carga da planilha (carteira e cronogramas). */
export function alertasDefasados(fontes: FonteAvaliada[], cargas: { nome: string; importadoEm: string | null }[], hoje: string): Base[] {
  const saida: Base[] = [];
  for (const f of fontes.filter((x) => x.situacao !== 'Em dia')) {
    const critico = f.situacao === 'Vencido: muito defasada' || f.situacao === 'Sem carga';
    saida.push({
      id: `defasado-${f.id}`, tipo: 'defasado', gravidade: critico ? 'vermelho' : 'amarelo',
      titulo: `Fonte ${f.nome}: ${f.situacao.replace(/^[^:]+: /, '').toLowerCase()}${f.idade !== null ? ` (coleta há ${pl(f.idade, 'dia', 'dias')})` : ''}`,
      detalhe: f.motivo,
      regra: `Limite desta fonte: ${pl(f.limite, 'dia', 'dias')}; vermelho acima do dobro ou sem nenhuma carga.`,
      projeto: null, convenio: null, orgao: null, prazo: null, acao: f.acao, link: URL.qualidade,
    });
  }
  for (const c of cargas) {
    if (!c.importadoEm) continue;
    const importado = c.importadoEm.slice(0, 10);
    const idade = diasEntre(importado, hoje);
    if (idade <= DIAS_CARTEIRA_DEFASADA) continue;
    saida.push({
      id: `defasado-${c.nome.toLowerCase().replace(/\W+/g, '-')}`, tipo: 'defasado',
      gravidade: idade > DIAS_CARTEIRA_DEFASADA * 2 ? 'vermelho' : 'amarelo',
      titulo: `${c.nome} sem nova carga há ${pl(idade, 'dia', 'dias')}`,
      detalhe: `Última importação da planilha: ${formatarData(importado)}. Datas e valores podem estar desatualizados.`,
      regra: `A planilha deve ser importada pelo menos a cada ${DIAS_CARTEIRA_DEFASADA} dias; vermelho acima de ${DIAS_CARTEIRA_DEFASADA * 2}.`,
      projeto: null, convenio: null, orgao: null, prazo: adicionarDias(importado, DIAS_CARTEIRA_DEFASADA),
      acao: 'Importar a versão mais recente da planilha e conferir o histórico de alterações.',
      link: URL.log,
    });
  }
  return saida;
}

/** Prazos da Lei 14.133 por licitação: meta da prefeitura × teto da lei (passar do teto = vermelho). */
export function alertasPrazoLei(eventos: EventoPrazo[], carteira: Carteira, hoje: string, municipio: number): Base[] {
  const saida: Base[] = [];
  for (const e of eventos) {
    if (e.concluidoEm) continue;
    const prazo = buscarPrazo(e.prazoId);
    if (prazo.tipo !== 'teto') continue;
    const av = avaliarPrazo(e.prazoId, e.inicio, hoje, municipio);
    const g = gravidadeMetaTeto(hoje, av.limiteMeta ?? null, av.limiteLegal);
    if (!g) continue;
    const p = carteira.projetos.find((x) => x.id === e.projetoId) ?? null;
    saida.push({
      id: `prazo-lei-${e.prazoId}-${e.projetoId ?? 'sem'}-${e.inicio}`, tipo: 'prazo-lei', gravidade: g,
      titulo: `${prazo.nome}: ${g === 'vermelho' ? 'passou do limite da lei' : 'passou da meta da prefeitura'}`,
      detalhe: `${e.descricao}. ${av.texto}`,
      regra: `${prazo.referencia}: ${prazo.dias} dias úteis (teto). Meta da prefeitura menor que a lei; passar do teto é vermelho, passar só da meta é amarelo.`,
      projeto: p ? { id: p.id, nome: p.nome } : null, convenio: null, orgao: p?.orgao ?? null,
      prazo: g === 'vermelho' ? av.limiteLegal : (av.limiteMeta as string),
      acao: g === 'vermelho' ? 'Concluir o ato imediatamente e registrar a justificativa do atraso.' : 'Concluir o ato antes do limite da lei.',
      link: URL.prazos,
    });
  }
  return saida;
}

/** O que ainda não tem dado para gerar alerta (nunca inventar números). */
export function pendenciasDeFonte(e: Pick<EntradaCentral, 'convenios' | 'eventosLei'>): SemFonte[] {
  const lista: SemFonte[] = [
    {
      tipo: 'edital', titulo: 'Edital na praça',
      falta: 'Data de publicação do edital e data de abertura das propostas de cada licitação.',
      hoje: 'Não há alerta deste tipo. A data chegará do PNCP ou do módulo Contratação (Fase 4).',
    },
    {
      tipo: 'homologacao', titulo: 'Homologação (data real)',
      falta: 'Data real de homologação de cada licitação.',
      hoje: 'O alerta usa a data prevista de fim da contratação da planilha.',
    },
    {
      tipo: 'clausula', titulo: 'Cláusula suspensiva (prazo do instrumento)',
      falta: 'Prazo da cláusula e lista de exigências de cada convênio.',
      hoje: `O alerta usa um indício: convênio em execução sem nenhum desembolso há mais de ${DIAS_SEM_DESEMBOLSO} dias.`,
    },
  ];
  if (!e.eventosLei.length)
    lista.push({
      tipo: 'prazo-lei', titulo: 'Prazos da Lei 14.133 por licitação',
      falta: 'Datas de cada ato da licitação (recurso, publicação do contrato no PNCP).',
      hoje: 'A regra meta × teto, com dias úteis e feriados, já está pronta na tela Prazos da Lei 14.133 e entra aqui quando as datas existirem.',
    });
  if (e.convenios === null)
    lista.push({
      tipo: 'vigencia', titulo: 'Convênios (Transferegov)',
      falta: 'A coleta de convênios ainda não foi feita.',
      hoje: 'Sem alertas de cláusula suspensiva e de vigência até a primeira coleta.',
    });
  return lista;
}

const ORDEM_GRAVIDADE: Record<Gravidade, number> = { vermelho: 0, amarelo: 1 };
/** Vermelho antes de amarelo; dentro da mesma cor, o prazo mais antigo primeiro (sem prazo por último). */
export function ordenar(lista: AlertaCentral[]): AlertaCentral[] {
  return [...lista].sort((a, b) => {
    const g = ORDEM_GRAVIDADE[a.gravidade] - ORDEM_GRAVIDADE[b.gravidade];
    if (g) return g;
    const pa = a.prazo ?? '9999-12-31';
    const pb = b.prazo ?? '9999-12-31';
    if (pa !== pb) return pa < pb ? -1 : 1;
    return a.titulo.localeCompare(b.titulo, 'pt-BR') || a.id.localeCompare(b.id);
  });
}

export function contarPorTipo(lista: AlertaCentral[]): CentralAlertas['porTipo'] {
  return TIPOS.map((t) => {
    const l = lista.filter((a) => a.tipo === t.id);
    return { tipo: t.id, nome: t.nome, total: l.length, vermelho: l.filter((a) => a.gravidade === 'vermelho').length, amarelo: l.filter((a) => a.gravidade === 'amarelo').length };
  });
}

export function contarPorOrgao(lista: AlertaCentral[]): CentralAlertas['porOrgao'] {
  const mapa = new Map<string, { total: number; vermelho: number }>();
  for (const a of lista) {
    const k = a.orgao ?? SEM_ORGAO;
    const v = mapa.get(k) ?? { total: 0, vermelho: 0 };
    v.total++;
    if (a.gravidade === 'vermelho') v.vermelho++;
    mapa.set(k, v);
  }
  return [...mapa.entries()]
    .map(([orgao, v]) => ({ orgao, ...v }))
    .sort((a, b) => (a.orgao === SEM_ORGAO ? 1 : 0) - (b.orgao === SEM_ORGAO ? 1 : 0) || b.total - a.total || a.orgao.localeCompare(b.orgao, 'pt-BR'));
}

export function montarCentral(e: EntradaCentral): CentralAlertas {
  const base: Base[] = [
    ...(e.convenios ? alertasConvenios(e.convenios, e.hoje) : []),
    ...alertasObra(e.carteira, e.hoje),
    ...alertasPrazoLei(e.eventosLei, e.carteira, e.hoje, e.municipio),
    ...alertasSemFonte(e.carteira),
    ...alertasParadas(e.cronogramas, e.carteira, e.hoje),
    ...alertasDefasados(e.fontes, [
      { nome: 'Carteira de projetos', importadoEm: e.carteira.fonte.importado_em },
      { nome: 'Cronogramas', importadoEm: e.cronogramasImportadosEm },
    ], e.hoje),
  ];
  const alertas = ordenar(base.map((a) => comDias(a, e.hoje, e.municipio)));
  return {
    hoje: e.hoje,
    alertas,
    porTipo: contarPorTipo(alertas),
    porOrgao: contarPorOrgao(alertas),
    totais: { total: alertas.length, vermelho: alertas.filter((a) => a.gravidade === 'vermelho').length, amarelo: alertas.filter((a) => a.gravidade === 'amarelo').length },
    semFonte: pendenciasDeFonte(e),
  };
}
