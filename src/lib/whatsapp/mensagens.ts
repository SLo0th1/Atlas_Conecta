// Textos do WhatsApp: relatório automático e respostas a perguntas, sempre montados com os projetos JÁ filtrados pela permissão.
// Simulação sem IA: as perguntas são entendidas por palavras-chave. Na versão real, uma IA entende a pergunta livre,
// mas só recebe o resultado de projetosVisiveis() — nunca a carteira inteira.
import { projetosVisiveis } from './permissoes.ts';
import type { CaptacaoWhats, Contato, ModeloRelatorio, ProjetoWhats } from './tipos.ts';

/** Limite de texto de uma mensagem do WhatsApp. */
export const LIMITE_MENSAGEM = 4096;
const MAX_ITENS = 5;
const DIAS_ENTREGA = 30;

const semAcento = (s: string): string => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const dataBR = (iso: string): string => `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;
const somaDias = (iso: string, n: number): string => new Date(Date.parse(`${iso.slice(0, 10)}T00:00:00Z`) + n * 86400000).toISOString().slice(0, 10);
const RANK: Record<string, number> = { 'Muito Alta': 0, Alta: 1, 'Média': 2, Baixa: 3 };
const rank = (p: ProjetoWhats): number => (p.prioridade !== null && p.prioridade in RANK ? RANK[p.prioridade] : 4);
const porPrioridade = (a: ProjetoWhats, b: ProjetoWhats): number => rank(a) - rank(b) || a.nome.localeCompare(b.nome, 'pt-BR');
const porEntrega = (a: ProjetoWhats, b: ProjetoWhats): number => (a.encerramento ?? '9999') < (b.encerramento ?? '9999') ? -1 : (a.encerramento ?? '9999') > (b.encerramento ?? '9999') ? 1 : a.nome.localeCompare(b.nome, 'pt-BR');
const EMOJI = { vermelho: '🔴', amarelo: '🟡', verde: '🟢' } as const;

/** R$ abreviado: 'R$ 1,3 bi', 'R$ 350 mi', 'R$ 12,5 mil'. */
export function reaisCurto(n: number): string {
  const f = (v: number, s: string): string => `R$ ${v.toLocaleString('pt-BR', { maximumFractionDigits: v >= 100 ? 0 : 1 })} ${s}`;
  const a = Math.abs(n);
  if (a >= 1e9) return f(n / 1e9, 'bi');
  if (a >= 1e6) return f(n / 1e6, 'mi');
  if (a >= 1e3) return f(n / 1e3, 'mil');
  return `R$ ${n.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`;
}
const pct = (n: number): string => `${n.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;

/** Corta no fim de uma linha para caber numa mensagem, avisando que foi resumida. */
export function caber(texto: string, limite: number = LIMITE_MENSAGEM): string {
  if (texto.length <= limite) return texto;
  const aviso = '\n… (mensagem resumida; veja tudo no GovNexa)';
  const corte = texto.lastIndexOf('\n', limite - aviso.length);
  return texto.slice(0, corte > 0 ? corte : limite - aviso.length) + aviso;
}

const lista = (itens: ProjetoWhats[], linha: (p: ProjetoWhats) => string): string[] => {
  const l = itens.slice(0, MAX_ITENS).map((p) => `• ${linha(p)}`);
  if (itens.length > MAX_ITENS) l.push(`  e mais ${itens.length - MAX_ITENS}`);
  return l;
};
const comOrgao = (p: ProjetoWhats): string => (p.orgao ? `${p.nome} (${p.orgao})` : p.nome);
const qtd = (n: number, um: string, varios: string): string => `${n} ${n === 1 ? um : varios}`;

function blocoCaptacao(contato: Contato, captacao: CaptacaoWhats | null): string[] {
  if (!contato.permissao.verCaptacao || !captacao) return [];
  const linhas = [`*Convênios em execução:* ${captacao.emExecucao}`];
  if (contato.permissao.verValores) linhas.push(`Pactuado ${reaisCurto(captacao.pactuado)} · liberado ${reaisCurto(captacao.liberado)} · saldo a liberar ${reaisCurto(captacao.saldoALiberar)}`);
  if (captacao.semDesembolso > 0) linhas.push(`${qtd(captacao.semDesembolso, 'convênio assinado ainda sem', 'convênios assinados ainda sem')} nenhum repasse`);
  return ['', ...linhas];
}

/** Relatório automático do número (texto no formato do WhatsApp: *negrito*). `hoje` = ISO 'AAAA-MM-DD'. */
export function montarRelatorio(contato: Contato, base: ProjetoWhats[], captacao: CaptacaoWhats | null, hoje: string, modelo: ModeloRelatorio = contato.relatorio.modelo): string {
  const visiveis = projetosVisiveis(base, contato.permissao);
  const ativos = visiveis.filter((p) => p.macroetapa !== '06').sort(porPrioridade);
  const vermelhos = ativos.filter((p) => p.farol === 'vermelho');
  const amarelos = ativos.filter((p) => p.farol === 'amarelo');
  const verdes = ativos.filter((p) => p.farol === 'verde');
  const execucao = ativos.filter((p) => p.macroetapa === '05').sort(porEntrega);
  const limite = somaDias(hoje, DIAS_ENTREGA);
  const entregas = ativos.filter((p) => p.encerramento !== null && p.encerramento >= hoje && p.encerramento <= limite).sort(porEntrega);
  const total = ativos.reduce((s, p) => s + (p.valor ?? 0), 0);

  const l: string[] = [`*GovNexa · ${modelo === 'resumo' ? 'Resumo da carteira' : 'Projetos prioritários'}*`, `${dataBR(hoje)} · ${contato.rotulo}`, ''];
  if (!ativos.length) {
    l.push('Nenhum projeto em andamento entre os que este número acompanha.');
    return caber([...l, ...blocoCaptacao(contato, captacao)].join('\n'));
  }
  l.push(`📊 *${qtd(ativos.length, 'projeto em andamento', 'projetos em andamento')}*${contato.permissao.verValores && total > 0 ? ` · ${reaisCurto(total)}` : ''}`);
  l.push(`${EMOJI.vermelho} ${vermelhos.length} com prazo vencido · ${EMOJI.amarelo} ${amarelos.length} em atenção · ${EMOJI.verde} ${verdes.length} no prazo`);

  if (modelo === 'resumo') {
    l.push(`Em execução: ${execucao.length} · entregas em ${DIAS_ENTREGA} dias: ${entregas.length}`);
  } else {
    if (vermelhos.length) l.push('', '*Atenção (prazo vencido)*', ...lista(vermelhos, (p) => `${comOrgao(p)}: ${p.motivo.toLowerCase()}`));
    if (execucao.length) l.push('', '*Em execução*', ...lista(execucao, (p) => `${p.nome}: ${p.percentual !== null ? `${pct(p.percentual)} executado` : 'execução sem medição'}${p.encerramento ? ` · entrega ${dataBR(p.encerramento)}` : ''}`));
    if (entregas.length) l.push('', `*Entregas nos próximos ${DIAS_ENTREGA} dias*`, ...lista(entregas, (p) => `${p.nome}: ${dataBR(p.encerramento as string)}`));
  }
  l.push(...blocoCaptacao(contato, captacao));
  l.push('', 'Responda com o nome do projeto, o número do SEI ou "ajuda".');
  return caber(l.join('\n'));
}

export const AJUDA = [
  '*O que posso responder*',
  '• o nome de um projeto, o código (P-123) ou o número do SEI',
  '• "relatório": o resumo de hoje',
  '• "atrasados": projetos com prazo vencido',
  '• "entregas": o que termina nos próximos 30 dias',
  '• "execução": obras em execução',
  '• "convênios" ou "emendas": captação de recursos (se o seu número tiver permissão)',
].join('\n');

export const SEM_PROJETO = 'Não encontrei esse projeto entre os que você pode consultar. Envie o nome, o código (P-123), o número do SEI ou "ajuda".';
export const SEM_CAPTACAO = 'Seu número não tem permissão para consultar a captação de recursos. Peça a liberação à equipe do GovNexa.';

const PALAVRAS_VAZIAS = new Set(['como', 'esta', 'estao', 'qual', 'quais', 'obra', 'obras', 'projeto', 'projetos', 'sobre', 'andamento', 'situacao', 'quero', 'saber', 'para', 'pela', 'pelo', 'esse', 'essa', 'isso', 'informacao', 'informacoes', 'favor', 'status', 'anda', 'andando', 'mais']);

export function detalheProjeto(p: ProjetoWhats): string {
  const l = [`*${p.nome}*`, [p.orgao, p.etapa].filter(Boolean).join(' · '), `Situação: ${EMOJI[p.farol]} ${p.motivo}`];
  if (p.prioridade) l.push(`Prioridade: ${p.prioridade}`);
  if (p.percentual !== null) l.push(`Executado: ${pct(p.percentual)}`);
  if (p.encerramento) l.push(`Entrega prevista: ${dataBR(p.encerramento)}`);
  if (p.valor !== null) l.push(`Valor: ${reaisCurto(p.valor)}`);
  if (p.sei.length) l.push(`SEI: ${p.sei.join(', ')}`);
  l.push(`Código no GovNexa: ${p.id}`);
  return l.join('\n');
}

/** Procura um projeto SÓ entre os visíveis: quem não tem permissão recebe a mesma resposta de "não encontrado" (não revela que existe). */
/** Código (P-123) ou número do SEI na mensagem: lista do que achou; null se a mensagem não traz nenhum dos dois. */
export function porCodigoOuSei(texto: string, visiveis: ProjetoWhats[]): ProjetoWhats[] | null {
  const t = semAcento(texto);
  const codigo = t.match(/\bp\s*-?\s*(\d{1,6})\b/);
  if (codigo) {
    const p = visiveis.find((x) => x.id === `P-${Number(codigo[1])}`);
    return p ? [p] : [];
  }
  const digitos = t.replace(/\D/g, '');
  if (digitos.length >= 10) return visiveis.filter((x) => x.sei.some((s) => s.replace(/\D/g, '') === digitos));
  return null;
}

const plano = (s: string): string => ` ${semAcento(s).replace(/[^a-z0-9]+/g, ' ').trim()} `;
/** Projetos cujo nome COMPLETO está escrito na mensagem; havendo mais de um, fica o de nome mais longo. */
export function porNomeCompleto(texto: string, visiveis: ProjetoWhats[]): ProjetoWhats[] {
  const t = plano(texto);
  const exatos = visiveis.filter((x) => t.includes(plano(x.nome)));
  const maior = Math.max(0, ...exatos.map((x) => plano(x.nome).length));
  return exatos.filter((x) => plano(x.nome).length === maior);
}

/** Busca solta: todas as palavras significativas aparecem no nome. */
function porPalavras(texto: string, visiveis: ProjetoWhats[]): ProjetoWhats[] {
  const termos = semAcento(texto).split(/[^a-z0-9]+/).filter((w) => w.length >= 3 && !PALAVRAS_VAZIAS.has(w));
  if (!termos.length) return [];
  return visiveis.filter((x) => {
    const nome = semAcento(x.nome);
    return termos.every((w) => nome.includes(w));
  });
}

export function procurarProjeto(texto: string, visiveis: ProjetoWhats[]): ProjetoWhats[] {
  const direto = porCodigoOuSei(texto, visiveis);
  if (direto !== null) return direto;
  const completo = porNomeCompleto(texto, visiveis);
  if (completo.length === 1) return completo;
  return porPalavras(texto, visiveis);
}

function respostaAchados(achados: ProjetoWhats[]): string {
  if (achados.length === 1) return detalheProjeto(achados[0]);
  if (!achados.length) return SEM_PROJETO;
  const ord = [...achados].sort(porPrioridade);
  return caber([`Encontrei ${achados.length} projetos. Responda com o código do que você quer:`, ...ord.slice(0, 8).map((p) => `• ${p.id}: ${p.nome}`), ...(ord.length > 8 ? [`  e mais ${ord.length - 8}; escreva mais palavras do nome`] : [])].join('\n'));
}

/** Resposta à mensagem enviada pelo número (simulação por palavras-chave). */
export function responderPergunta(texto: string, contato: Contato, base: ProjetoWhats[], captacao: CaptacaoWhats | null, hoje: string): string {
  const original = String(texto ?? '').slice(0, 500).trim();
  const t = semAcento(original);
  const visiveis = projetosVisiveis(base, contato.permissao);
  const ativos = visiveis.filter((p) => p.macroetapa !== '06');

  if (!t || /^(ajuda|menu|oi|ola|bom dia|boa tarde|boa noite)\b/.test(t)) return AJUDA;
  // Código, SEI e nome completo vêm antes das palavras-chave ("Centro de Recursos Hídricos" não vira pergunta de captação).
  const direto = porCodigoOuSei(original, visiveis);
  if (direto !== null) return respostaAchados(direto);
  const completo = porNomeCompleto(original, visiveis);
  if (completo.length === 1) return detalheProjeto(completo[0]);
  if (/\b(relatorio|resumo)\b/.test(t)) return montarRelatorio(contato, base, captacao, hoje);
  if (/(emenda|convenio|captac|recurso|repasse)/.test(t)) {
    if (!contato.permissao.verCaptacao) return SEM_CAPTACAO;
    if (!captacao) return 'Os dados de captação não estão disponíveis agora.';
    return caber([...blocoCaptacao(contato, captacao).slice(1), '', 'Emendas parlamentares entram quando a coleta de emendas estiver ligada ao GovNexa.'].join('\n'));
  }
  if (/(atrasad|vencid|vermelh|parad)/.test(t)) {
    const v = ativos.filter((p) => p.farol === 'vermelho').sort(porPrioridade);
    if (!v.length) return 'Nenhum projeto com prazo vencido entre os que você acompanha. 🟢';
    return caber([`*${qtd(v.length, 'projeto com prazo vencido', 'projetos com prazo vencido')}*`, ...v.slice(0, 10).map((p) => `• ${comOrgao(p)}: ${p.motivo.toLowerCase()}`), ...(v.length > 10 ? [`  e mais ${v.length - 10}`] : [])].join('\n'));
  }
  if (/(entrega|inaugur|proxim|termina)/.test(t)) {
    const limite = somaDias(hoje, DIAS_ENTREGA);
    const e = ativos.filter((p) => p.encerramento !== null && p.encerramento >= hoje && p.encerramento <= limite).sort(porEntrega);
    if (!e.length) return `Nenhuma entrega prevista nos próximos ${DIAS_ENTREGA} dias entre os projetos que você acompanha.`;
    return caber([`*Entregas nos próximos ${DIAS_ENTREGA} dias*`, ...e.slice(0, 10).map((p) => `• ${p.nome}: ${dataBR(p.encerramento as string)}`), ...(e.length > 10 ? [`  e mais ${e.length - 10}`] : [])].join('\n'));
  }
  if (/\bexecuc/.test(t)) {
    const x = ativos.filter((p) => p.macroetapa === '05').sort(porEntrega);
    if (!x.length) return 'Nenhuma obra em execução entre os projetos que você acompanha.';
    return caber([`*${qtd(x.length, 'obra em execução', 'obras em execução')}*`, ...x.slice(0, 10).map((p) => `• ${p.nome}: ${p.percentual !== null ? `${pct(p.percentual)} executado` : 'sem medição'}`), ...(x.length > 10 ? [`  e mais ${x.length - 10}`] : [])].join('\n'));
  }
  return respostaAchados(porPalavras(original, visiveis));
}
