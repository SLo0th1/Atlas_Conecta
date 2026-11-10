// Motor de parecer determinístico da guia Projetos (docs/projetos-ia.md, seção 6). Sem IA, sem armazenamento.
// Função pura: mesma entrada (projeto, contexto, hoje) = mesma saída. Dado ausente NUNCA vira 'ok'.
import { createHash } from 'node:crypto';
import type { Bloco, ContextoParecer, Gravidade, Parecer, Projeto, Resultado, ResultadoRegra, TipoAnexo } from './tipos.ts';

export const VERSAO_REGRAS = '1.0';
export const MARCADOR_AUSENTE = '[DADO NÃO DISPONÍVEL NA FONTE OFICIAL]';
/** Regra do dono: fonte com mais de 30 dias = alerta; mais de 60 dias = bloqueante. */
export const FRESCOR_ALERTA_DIAS = 30;
export const FRESCOR_BLOQUEANTE_DIAS = 60;
export const PRAZO_ALERTA_DIAS = 7;

type Regra = (p: Projeto, c: ContextoParecer, hoje: Date) => ResultadoRegra;

// ---------- utilidades ----------

const dataIso = (iso: string): number => Date.parse(`${iso.slice(0, 10)}T00:00:00Z`);
/** Dias de hoje até a data ISO (negativo = já passou). null se a data for inválida/ausente. */
const diasAte = (iso: string | null | undefined, hoje: Date): number | null => {
  if (!iso) return null;
  const t = dataIso(iso);
  return Number.isNaN(t) ? null : Math.round((t - Date.UTC(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())) / 86400000);
};
const norm = (s: string): string => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const vazio = (v: unknown): boolean => v === null || v === undefined || (typeof v === 'string' && v.trim() === '');
const brl = (n: number): string => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const pct = (n: number): string => `${n.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`;
const soma = (xs: number[]): number => xs.reduce((a, b) => a + b, 0);
const centavos = (n: number): number => Math.round(n * 100);

const regra = (
  id: string,
  titulo: string,
  gravidade: Gravidade,
  resultado: Resultado,
  mensagem: string,
  comoCorrigir: string,
  detalhes: string[] = [],
): ResultadoRegra => ({ id, titulo, gravidade, resultado, mensagem, comoCorrigir, detalhes });

const defasagem = (coleta: string | undefined, hoje: Date): number | null => {
  const d = diasAte(coleta, hoje);
  return d === null ? null : -d;
};
/** Sufixo de aviso quando a fonte usada pela regra está defasada (a regra R18 classifica a gravidade). */
const avisoFrescor = (nome: string, coleta: string | undefined, hoje: Date): string => {
  const d = defasagem(coleta, hoje);
  return d !== null && d > FRESCOR_ALERTA_DIAS ? ` Atenção: dados de ${nome} coletados há ${d} dias.` : '';
};

const textoDeBlocos = (blocos: Bloco[]): string => blocos.map((b) => b.texto).join('\n');
const textoSecao = (p: Projeto, tipo: string): string => textoDeBlocos(p.secoes.filter((s) => s.tipo === tipo).flatMap((s) => s.blocos));

/** JSON canônico (chaves ordenadas, sem undefined) para o hash. */
const canonico = (v: unknown): unknown => {
  if (Array.isArray(v)) return v.map(canonico);
  if (v && typeof v === 'object') {
    return Object.fromEntries(
      Object.entries(v as Record<string, unknown>)
        .filter(([, x]) => x !== undefined)
        .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
        .map(([k, x]) => [k, canonico(x)]),
    );
  }
  return v;
};

/** SHA-256 do conteúdo do projeto (exclui aprovação, justificativas e o rótulo de exemplo). */
export const hashConteudo = (p: Projeto): string => {
  const { aprovacao: _a, justificativas: _j, ficticio: _f, ...conteudo } = p;
  return createHash('sha256').update(JSON.stringify(canonico(conteudo))).digest('hex');
};

const escolherPrazo = (p: Projeto, c: ContextoParecer): { rotulo: string; data: string } | null => {
  const pr = c.programa?.prazos;
  if (!pr) return null;
  if (pr.proposta_ate) return { rotulo: 'proposta', data: pr.proposta_ate };
  if (pr.emendas_ate && p.emendaIndicada === 'sim') return { rotulo: 'emendas', data: pr.emendas_ate };
  if (pr.beneficiario_especifico_ate) return { rotulo: 'beneficiário específico', data: pr.beneficiario_especifico_ate };
  if (pr.emendas_ate) return { rotulo: 'emendas', data: pr.emendas_ate };
  return null;
};

const apenasEmenda = (c: ContextoParecer): boolean => {
  const pr = c.programa?.prazos;
  return !!pr && !!pr.emendas_ate && !pr.proposta_ate && !pr.beneficiario_especifico_ate;
};

const requisitosConfirmados = (c: ContextoParecer) => {
  const r = c.requisitos;
  return r && !vazio(r.confirmadoPor) && !vazio(r.confirmadoEm) ? r : undefined;
};
const SEM_REQUISITO = 'Requisitos do programa não confirmados pela equipe da prefeitura; não é possível verificar.';
const CORRIGIR_REQUISITO =
  'Peça à equipe da prefeitura para confirmar os requisitos do programa (valor mínimo/máximo, contrapartida mínima, documentos exigidos) a partir do edital.';

// ---------- as 21 regras ----------

const R01: Regra = (_p, c, hoje) => {
  const t = 'CAUC sem pendência geral';
  const corrigir = 'Regularize as pendências no CAUC (Tesouro Nacional) e rode o parecer de novo.';
  if (!c.cauc) return regra('R01', t, 'bloqueante', 'sem_dado', 'Dados do CAUC não disponíveis; regularidade não verificada.', 'Atualize a coleta do CAUC (painel Qualidade dos dados).');
  const aviso = avisoFrescor('CAUC', c.cauc.dataColeta, hoje);
  const g = norm(c.cauc.situacaoGeral);
  if (g === 'regular') return regra('R01', t, 'bloqueante', 'ok', `CAUC regular.${aviso}`, corrigir);
  if (g === 'com_pendencias') return regra('R01', t, 'bloqueante', 'falha', `CAUC com pendências.${aviso}`, corrigir);
  return regra('R01', t, 'bloqueante', 'sem_dado', `Situação geral do CAUC indisponível ("${c.cauc.situacaoGeral}").${aviso}`, 'Atualize a coleta do CAUC.');
};

const R02: Regra = (_p, c, hoje) => {
  const t = 'CAUC: pendência por item';
  if (!c.cauc) return regra('R02', t, 'alerta', 'sem_dado', 'Itens do CAUC não disponíveis.', 'Atualize a coleta do CAUC.');
  const falhas: string[] = [];
  const semDado: string[] = [];
  for (const i of c.cauc.itens) {
    const nome = `${i.item}${i.descricao ? ` (${i.descricao})` : ''}`;
    const s = norm(i.situacao);
    if (s === 'pendente' || s === 'vencido' || s === 'desconhecido') falhas.push(`CAUC com pendência no item ${nome}: ${i.situacao}`);
    else if (s === 'indisponivel' || s === 'sem_informacao') semDado.push(`Item ${nome} indisponível no CAUC; não verificável`);
    else if (s === 'regular') {
      const d = diasAte(i.validade, hoje);
      if (d !== null && d < 0) falhas.push(`Item ${nome} com validade vencida em ${i.validade}`);
    } else semDado.push(`Item ${nome} com situação não reconhecida ("${i.situacao}")`);
  }
  const aviso = avisoFrescor('CAUC', c.cauc.dataColeta, hoje);
  const corrigir = 'Regularize o item no órgão responsável e confirme no CAUC; itens indisponíveis exigem conferência manual e justificativa.';
  if (falhas.length) return regra('R02', t, 'bloqueante', 'falha', `${falhas.length} item(ns) do CAUC com pendência.${aviso}`, corrigir, [...falhas, ...semDado]);
  if (semDado.length) return regra('R02', t, 'alerta', 'sem_dado', `${semDado.length} item(ns) do CAUC não verificável(is).${aviso}`, corrigir, semDado);
  return regra('R02', t, 'bloqueante', 'ok', `Todos os itens do CAUC regulares e dentro da validade.${aviso}`, corrigir);
};

const R03: Regra = (p) => {
  const t = 'Meta sem indicador';
  const corrigir = 'Cadastre ao menos um indicador para cada meta.';
  if (!p.metas.length) return regra('R03', t, 'bloqueante', 'sem_dado', 'Nenhuma meta cadastrada; não há como verificar indicadores.', 'Cadastre as metas do plano de trabalho.');
  const sem = p.metas.filter((m) => !p.indicadores.some((i) => i.metaId === m.id));
  if (sem.length) return regra('R03', t, 'bloqueante', 'falha', `${sem.length} meta(s) sem indicador.`, corrigir, sem.map((m) => `Meta sem indicador: "${m.descricao}"`));
  return regra('R03', t, 'bloqueante', 'ok', 'Toda meta tem ao menos um indicador.', corrigir);
};

const R04: Regra = (p) => {
  const t = 'Indicador completo (meta, linha de base e valor-alvo)';
  const corrigir =
    'Vincule o indicador a uma meta e preencha linha de base e valor-alvo; linha de base sem dado oficial deve ser informada por outra fonte ou justificada.';
  if (!p.indicadores.length) return regra('R04', t, 'bloqueante', 'sem_dado', 'Nenhum indicador cadastrado.', 'Cadastre os indicadores das metas.');
  const bloq: string[] = [];
  const alerta: string[] = [];
  for (const i of p.indicadores) {
    if (!p.metas.some((m) => m.id === i.metaId)) bloq.push(`Indicador "${i.descricao}" sem meta válida`);
    if (vazio(i.valorAlvo)) bloq.push(`Indicador "${i.descricao}" sem valor-alvo`);
    if (vazio(i.linhaBase)) bloq.push(`Indicador "${i.descricao}" sem linha de base`);
    else if (typeof i.linhaBase === 'string' && i.linhaBase.includes(MARCADOR_AUSENTE)) alerta.push(`Linha de base de "${i.descricao}" sem dado na fonte oficial`);
  }
  if (bloq.length) return regra('R04', t, 'bloqueante', 'falha', `${bloq.length} problema(s) em indicadores.`, corrigir, [...bloq, ...alerta]);
  if (alerta.length) return regra('R04', t, 'alerta', 'falha', `${alerta.length} linha(s) de base sem dado oficial.`, corrigir, alerta);
  return regra('R04', t, 'bloqueante', 'ok', 'Indicadores completos.', corrigir);
};

const R05: Regra = (p, c, hoje) => {
  const t = 'Prazo da proposta aberto';
  const corrigir = 'Envie antes do prazo; se venceu, procure outra oportunidade ou aguarde nova abertura.';
  if (!c.programa) return regra('R05', t, 'alerta', 'sem_dado', 'Dados do programa não disponíveis.', 'Atualize a coleta de programas abertos.');
  const aviso = avisoFrescor('programas abertos', c.programa.dataColeta, hoje);
  const pz = escolherPrazo(p, c);
  if (!pz) return regra('R05', t, 'alerta', 'sem_dado', `O programa não informa prazo.${aviso}`, 'Confirme o prazo no edital/Transferegov e registre justificativa.');
  const d = diasAte(pz.data, hoje);
  if (d === null) return regra('R05', t, 'alerta', 'sem_dado', `Prazo de ${pz.rotulo} ilegível ("${pz.data}").${aviso}`, 'Confirme o prazo no Transferegov.');
  if (d < 0) return regra('R05', t, 'bloqueante', 'falha', `Prazo de ${pz.rotulo} venceu em ${pz.data} (${-d} dia(s) atrás).${aviso}`, corrigir);
  if (d <= PRAZO_ALERTA_DIAS) return regra('R05', t, 'alerta', 'falha', `Prazo de ${pz.rotulo} vence em ${pz.data} (faltam ${d} dia(s)).${aviso}`, corrigir);
  return regra('R05', t, 'alerta', 'ok', `Prazo de ${pz.rotulo} aberto até ${pz.data} (faltam ${d} dias).${aviso}`, corrigir);
};

const R06: Regra = (_p, c, hoje) => {
  const t = 'Proponente elegível';
  const corrigir = 'O programa não aceita município/UF do proponente; escolha outro programa.';
  if (!c.programa) return regra('R06', t, 'bloqueante', 'sem_dado', 'Dados do programa não disponíveis.', 'Atualize a coleta de programas abertos.');
  if (vazio(c.uf)) return regra('R06', t, 'bloqueante', 'sem_dado', 'UF do município não informada no contexto.', 'Informe a UF do município.');
  const aviso = avisoFrescor('programas abertos', c.programa.dataColeta, hoje);
  const municipal = c.programa.publico.some((x) => norm(x).includes('administracao publica municipal'));
  const ufOk = c.programa.ufs.map((u) => u.toUpperCase()).includes(String(c.uf).toUpperCase());
  if (!municipal) return regra('R06', t, 'bloqueante', 'falha', `O programa não inclui "Administração Pública Municipal" no público.${aviso}`, corrigir);
  if (!ufOk) return regra('R06', t, 'bloqueante', 'falha', `O programa não atende a UF ${c.uf}.${aviso}`, corrigir);
  return regra('R06', t, 'bloqueante', 'ok', `Município elegível (público municipal, UF ${c.uf}).${aviso}`, corrigir);
};

const R07: Regra = (p, c) => {
  const t = 'Programa só de emenda exige emenda indicada';
  const corrigir = 'Este programa só recebe proposta com emenda parlamentar indicada; obtenha a indicação ou escolha outro programa.';
  if (!c.programa) return regra('R07', t, 'bloqueante', 'sem_dado', 'Dados do programa não disponíveis.', 'Atualize a coleta de programas abertos.');
  if (!apenasEmenda(c)) return regra('R07', t, 'bloqueante', 'ok', 'O programa não é exclusivo de emenda.', corrigir);
  if (p.emendaIndicada === undefined) return regra('R07', t, 'bloqueante', 'sem_dado', 'Programa só de emenda e o campo "emenda indicada" não foi preenchido.', 'Preencha o campo "Emenda indicada" no projeto.');
  if (p.emendaIndicada !== 'sim') return regra('R07', t, 'bloqueante', 'falha', `Programa só de emenda e emenda indicada = "${p.emendaIndicada === 'nao' ? 'não' : 'não sei'}".`, corrigir);
  return regra('R07', t, 'bloqueante', 'ok', 'Programa só de emenda e a emenda está indicada.', corrigir);
};

const faltaAnexo = (p: Projeto, tipos: TipoAnexo[]): TipoAnexo[] => tipos.filter((t) => !p.anexos.some((a) => a.tipo === t));

const R08: Regra = (p, c) => {
  const t = 'Projeto básico / termo de referência anexado';
  const corrigir = 'Anexe o projeto básico (obras) ou o termo de referência (serviços/aquisições).';
  const req = requisitosConfirmados(c);
  const exigidos: TipoAnexo[] = [];
  if (req?.documentosExigidos?.includes('projeto_basico')) exigidos.push('projeto_basico');
  if (req?.documentosExigidos?.includes('termo_referencia')) exigidos.push('termo_referencia');
  const temAlgum = p.anexos.some((a) => a.tipo === 'projeto_basico' || a.tipo === 'termo_referencia');
  if (exigidos.length) {
    const falta = faltaAnexo(p, exigidos);
    return falta.length
      ? regra('R08', t, 'bloqueante', 'falha', `Faltam: ${falta.join(', ')}.`, corrigir, falta.map((f) => `Anexo exigido ausente: ${f}`))
      : regra('R08', t, 'bloqueante', 'ok', 'Projeto básico/termo de referência anexado.', corrigir);
  }
  if (p.objetoObraOuServico === true) {
    return temAlgum
      ? regra('R08', t, 'bloqueante', 'ok', 'Objeto de obra/serviço com projeto básico/termo de referência anexado.', corrigir)
      : regra('R08', t, 'bloqueante', 'falha', 'Objeto de obra/serviço sem projeto básico nem termo de referência.', corrigir);
  }
  if (!req) return regra('R08', t, 'alerta', 'sem_dado', SEM_REQUISITO, CORRIGIR_REQUISITO);
  if (p.objetoObraOuServico === undefined) return regra('R08', t, 'alerta', 'sem_dado', 'Não informado se o objeto envolve obra/serviço.', 'Informe no projeto se o objeto envolve obra ou serviço.');
  return regra('R08', t, 'bloqueante', 'ok', 'Requisitos confirmados não exigem projeto básico e o objeto não é obra/serviço.', corrigir);
};

const R09: Regra = (p, c) => {
  const t = 'Documentos exigidos anexados';
  const corrigir = 'Anexe cada documento exigido pelo programa.';
  const req = requisitosConfirmados(c);
  if (!req || req.documentosExigidos === undefined)
    return regra('R09', t, 'alerta', 'sem_dado', req ? 'Lista de documentos exigidos não informada.' : SEM_REQUISITO, CORRIGIR_REQUISITO);
  const falta = faltaAnexo(p, req.documentosExigidos);
  return falta.length
    ? regra('R09', t, 'bloqueante', 'falha', `${falta.length} documento(s) exigido(s) sem anexo.`, corrigir, falta.map((f) => `Documento ausente: ${f}`))
    : regra('R09', t, 'bloqueante', 'ok', 'Todos os documentos exigidos estão anexados.', corrigir);
};

const R10: Regra = (p, c) => {
  const t = 'Valor do repasse dentro da faixa do programa';
  const corrigir = 'Ajuste o valor de repasse solicitado para a faixa permitida pelo programa.';
  const req = requisitosConfirmados(c);
  if (!req || (req.valorMin === undefined && req.valorMax === undefined))
    return regra('R10', t, 'alerta', 'sem_dado', req ? 'Faixa de valor do programa não informada.' : SEM_REQUISITO, CORRIGIR_REQUISITO);
  if (!p.parcelas.length) return regra('R10', t, 'bloqueante', 'sem_dado', 'Sem parcelas; valor de repasse não calculável.', 'Cadastre o cronograma financeiro.');
  const v = soma(p.parcelas.map((x) => x.valorRepasse));
  if (req.valorMin !== undefined && centavos(v) < centavos(req.valorMin)) return regra('R10', t, 'bloqueante', 'falha', `Repasse de ${brl(v)} abaixo do mínimo de ${brl(req.valorMin)}.`, corrigir);
  if (req.valorMax !== undefined && centavos(v) > centavos(req.valorMax)) return regra('R10', t, 'bloqueante', 'falha', `Repasse de ${brl(v)} acima do máximo de ${brl(req.valorMax)}.`, corrigir);
  return regra('R10', t, 'bloqueante', 'ok', `Repasse de ${brl(v)} dentro da faixa do programa.`, corrigir);
};

const R11: Regra = (p, c) => {
  const t = 'Contrapartida mínima';
  const corrigir = 'Aumente a contrapartida até o mínimo exigido ou revise o valor global.';
  const req = requisitosConfirmados(c);
  if (!req || req.contrapartidaMinPct === undefined)
    return regra('R11', t, 'alerta', 'sem_dado', req ? 'Contrapartida mínima do programa não informada.' : SEM_REQUISITO, CORRIGIR_REQUISITO);
  if (!p.parcelas.length || !p.valorGlobal || p.valorGlobal <= 0)
    return regra('R11', t, 'bloqueante', 'sem_dado', 'Sem parcelas ou valor global; contrapartida não calculável.', 'Cadastre o cronograma financeiro e o valor global.');
  const cp = soma(p.parcelas.map((x) => x.valorContrapartida));
  const perc = (cp / p.valorGlobal) * 100;
  if (perc + 1e-9 < req.contrapartidaMinPct)
    return regra('R11', t, 'bloqueante', 'falha', `Contrapartida de ${pct(perc)} (${brl(cp)}) menor que o mínimo de ${pct(req.contrapartidaMinPct)}.`, corrigir);
  return regra('R11', t, 'bloqueante', 'ok', `Contrapartida de ${pct(perc)} atende o mínimo de ${pct(req.contrapartidaMinPct)}.`, corrigir);
};

const R12: Regra = (_p, c, hoje) => {
  const t = 'Contrapartida compatível com a capacidade fiscal';
  const corrigir = 'Reduza a despesa de pessoal conforme a LRF ou reavalie a contrapartida; registre justificativa se mantiver.';
  const s = c.siconfi;
  if (!s || vazio(s.despesaPessoalPctRcl)) return regra('R12', t, 'alerta', 'sem_dado', 'Despesa de pessoal do SICONFI não disponível.', 'Atualize a coleta do SICONFI.');
  const aviso = avisoFrescor('SICONFI', s.dataColeta, hoje);
  const d = s.despesaPessoalPctRcl as number;
  const cit = `Despesa de pessoal em ${pct(d)} da RCL`;
  const lim = (n: number | null | undefined) => (n === null || n === undefined ? 'n/d' : pct(n));
  if (s.limiteMaximoPct != null && d > s.limiteMaximoPct) return regra('R12', t, 'bloqueante', 'falha', `${cit}, acima do limite máximo de ${lim(s.limiteMaximoPct)}.${aviso}`, corrigir);
  if (s.limitePrudencialPct != null && d > s.limitePrudencialPct) return regra('R12', t, 'alerta', 'falha', `${cit}, acima do limite prudencial de ${lim(s.limitePrudencialPct)}.${aviso}`, corrigir);
  if (s.limiteAlertaPct != null && d > s.limiteAlertaPct) return regra('R12', t, 'alerta', 'falha', `${cit}, acima do limite de alerta de ${lim(s.limiteAlertaPct)}.${aviso}`, corrigir);
  if (s.limiteMaximoPct == null && s.limitePrudencialPct == null && s.limiteAlertaPct == null)
    return regra('R12', t, 'alerta', 'sem_dado', `${cit}, mas os limites da LRF não constam na fonte.${aviso}`, 'Atualize a coleta do SICONFI.');
  return regra('R12', t, 'alerta', 'ok', `${cit}, dentro dos limites (alerta ${lim(s.limiteAlertaPct)}, prudencial ${lim(s.limitePrudencialPct)}, máximo ${lim(s.limiteMaximoPct)}).${aviso}`, corrigir);
};

const R13: Regra = (p) => {
  const t = 'Cronograma coerente';
  const corrigir = 'Corrija meses das etapas e das parcelas para ficarem dentro do prazo da meta e da própria etapa.';
  if (!p.etapas.length) return regra('R13', t, 'bloqueante', 'sem_dado', 'Nenhuma etapa cadastrada.', 'Cadastre o cronograma físico.');
  const f: string[] = [];
  for (const e of p.etapas) {
    const meta = p.metas.find((m) => m.id === e.metaId);
    if (!meta) f.push(`Etapa "${e.descricao}" sem meta válida`);
    if (e.mesInicio < 1 || e.mesInicio > e.mesFim) f.push(`Etapa "${e.descricao}" com meses inválidos (${e.mesInicio} a ${e.mesFim})`);
    if (meta?.prazoMes !== undefined && e.mesFim > meta.prazoMes) f.push(`Etapa "${e.descricao}" termina no mês ${e.mesFim}, depois do prazo da meta (mês ${meta.prazoMes})`);
  }
  for (const x of p.parcelas) {
    const e = p.etapas.find((y) => y.id === x.etapaId);
    if (!e) f.push(`Parcela do mês ${x.mes} sem etapa válida`);
    else if (x.mes < e.mesInicio || x.mes > e.mesFim) f.push(`Parcela do mês ${x.mes} fora da etapa "${e.descricao}" (meses ${e.mesInicio} a ${e.mesFim})`);
  }
  return f.length
    ? regra('R13', t, 'bloqueante', 'falha', `${f.length} inconsistência(s) no cronograma.`, corrigir, f)
    : regra('R13', t, 'bloqueante', 'ok', 'Cronograma coerente.', corrigir);
};

const R14: Regra = (p) => {
  const t = 'Soma financeira confere';
  const corrigir = 'Ajuste as parcelas (repasse + contrapartida) para somar exatamente o valor global.';
  if (!p.parcelas.length || p.valorGlobal === undefined) return regra('R14', t, 'bloqueante', 'sem_dado', 'Sem parcelas ou valor global informado.', 'Cadastre o cronograma financeiro e o valor global.');
  const s = soma(p.parcelas.map((x) => x.valorRepasse + x.valorContrapartida));
  const dif = Math.abs(centavos(s) - centavos(p.valorGlobal));
  return dif > 1
    ? regra('R14', t, 'bloqueante', 'falha', `Parcelas somam ${brl(s)}, mas o valor global é ${brl(p.valorGlobal)} (diferença de ${brl(dif / 100)}).`, corrigir)
    : regra('R14', t, 'bloqueante', 'ok', `Parcelas somam ${brl(s)}, igual ao valor global.`, corrigir);
};

const OBRIGATORIAS: { tipo: string; nome: string }[] = [
  { tipo: 'identificacao', nome: 'Identificação' },
  { tipo: 'justificativa', nome: 'Justificativa' },
  { tipo: 'objeto', nome: 'Objeto' },
  { tipo: 'metas', nome: 'Metas' },
  { tipo: 'cronograma', nome: 'Cronograma' },
];

const R15: Regra = (p) => {
  const t = 'Seções obrigatórias preenchidas';
  const corrigir = 'Preencha as seções listadas.';
  const falt = OBRIGATORIAS.filter(({ tipo }) => {
    if (textoSecao(p, tipo).trim()) return false;
    if (tipo === 'metas' && p.metas.length) return false;
    if (tipo === 'cronograma' && p.etapas.length) return false;
    return true;
  });
  return falt.length
    ? regra('R15', t, 'bloqueante', 'falha', `${falt.length} seção(ões) obrigatória(s) vazia(s).`, corrigir, falt.map((x) => `Seção vazia: ${x.nome}`))
    : regra('R15', t, 'bloqueante', 'ok', 'Todas as seções obrigatórias preenchidas.', corrigir);
};

const R16: Regra = (p) => {
  const t = 'Texto de IA revisado por humano';
  const corrigir = 'Leia cada bloco gerado por IA e marque como revisado.';
  const pend = p.secoes.flatMap((s) => s.blocos.filter((b) => b.origem === 'ia' && !b.revisado).map(() => s.tipo));
  return pend.length
    ? regra('R16', t, 'bloqueante', 'falha', `${pend.length} bloco(s) de IA pendente(s) de revisão.`, corrigir, pend.map((x) => `Bloco de IA não revisado na seção ${x}`))
    : regra('R16', t, 'bloqueante', 'ok', 'Nenhum bloco de IA pendente de revisão.', corrigir);
};

const mesmoValor = (a: string | number, b: string | number): boolean =>
  typeof a === 'number' && typeof b === 'number' ? Math.abs(a - b) < 1e-9 : String(a).trim() === String(b).trim();

const R17: Regra = (p, c) => {
  const t = 'Números do texto com fonte';
  const corrigir = 'Associe cada número a uma citação de fonte oficial e confira se o valor citado ainda bate com o dado atual.';
  const cits = c.citacoes ?? [];
  const f: string[] = [];
  const sd: string[] = [];
  for (const s of p.secoes) {
    for (const n of s.numeros ?? []) {
      if (vazio(n.rotulo)) f.push(`Número "${n.texto}" (seção ${s.tipo}) sem citação`);
      else if (!cits.some((x) => x.rotulo === n.rotulo)) f.push(`Número "${n.texto}" cita [${n.rotulo}], que não existe`);
    }
  }
  for (const x of cits) {
    if (x.valorAtual === undefined || x.valorAtual === null) sd.push(`Citação [${x.rotulo}] sem valor atual para conferir`);
    else if (!mesmoValor(x.valorCitado, x.valorAtual)) f.push(`Citação [${x.rotulo}] não confere: citado ${x.valorCitado}, atual ${x.valorAtual}`);
  }
  if (f.length) return regra('R17', t, 'bloqueante', 'falha', `${f.length} problema(s) de fonte nos números.`, corrigir, [...f, ...sd]);
  if (sd.length) return regra('R17', t, 'bloqueante', 'sem_dado', `${sd.length} citação(ões) não conferível(is).`, corrigir, sd);
  return regra('R17', t, 'bloqueante', 'ok', 'Todos os números têm fonte e conferem.', corrigir);
};

const R18: Regra = (_p, c, hoje) => {
  const t = 'Fonte de dados defasada';
  const corrigir = 'Reexecute a coleta da fonte, entenda por que ficou parada (painel Qualidade dos dados) e rode o parecer de novo.';
  const fontes: { nome: string; coleta: string | undefined }[] = [];
  if (c.cauc) fontes.push({ nome: 'CAUC', coleta: c.cauc.dataColeta });
  if (c.siconfi) fontes.push({ nome: 'SICONFI', coleta: c.siconfi.dataColeta });
  if (c.programa) fontes.push({ nome: 'programas abertos', coleta: c.programa.dataColeta });
  for (const x of c.citacoes ?? []) fontes.push({ nome: `citação [${x.rotulo}] (${x.conjunto})`, coleta: x.dataColeta });
  if (!fontes.length) return regra('R18', t, 'alerta', 'sem_dado', 'Nenhuma fonte no contexto para verificar o frescor.', corrigir);
  const bloq: string[] = [];
  const alerta: string[] = [];
  const ausentes: string[] = [];
  for (const f of fontes) {
    const d = defasagem(f.coleta, hoje);
    if (d === null) ausentes.push(`Fonte ${f.nome} sem data de coleta`);
    else if (d > FRESCOR_BLOQUEANTE_DIAS) bloq.push(`Fonte ${f.nome} coletada há ${d} dias (mais de ${FRESCOR_BLOQUEANTE_DIAS})`);
    else if (d > FRESCOR_ALERTA_DIAS) alerta.push(`Fonte ${f.nome} coletada há ${d} dias (mais de ${FRESCOR_ALERTA_DIAS})`);
  }
  if (bloq.length) return regra('R18', t, 'bloqueante', 'falha', `${bloq.length} fonte(s) com mais de ${FRESCOR_BLOQUEANTE_DIAS} dias de defasagem.`, corrigir, [...bloq, ...alerta, ...ausentes]);
  if (alerta.length) return regra('R18', t, 'alerta', 'falha', `${alerta.length} fonte(s) com mais de ${FRESCOR_ALERTA_DIAS} dias de defasagem.`, corrigir, [...alerta, ...ausentes]);
  if (ausentes.length) return regra('R18', t, 'alerta', 'sem_dado', `${ausentes.length} fonte(s) sem data de coleta.`, corrigir, ausentes);
  return regra('R18', t, 'alerta', 'ok', 'Todas as fontes usadas estão atualizadas.', corrigir);
};

const R19: Regra = (p) => {
  const t = 'Marcador de dado ausente no texto final';
  const corrigir = 'Informe o dado por outra fonte oficial ou aceite a lacuna com justificativa.';
  const ocorrencias: string[] = [];
  for (const s of p.secoes)
    for (const b of s.blocos) {
      const n = b.texto.split(MARCADOR_AUSENTE).length - 1;
      if (n > 0) ocorrencias.push(`${n} ocorrência(s) do marcador na seção ${s.tipo}`);
    }
  return ocorrencias.length
    ? regra('R19', t, 'alerta', 'falha', 'Há dado indisponível no texto final.', corrigir, ocorrencias)
    : regra('R19', t, 'alerta', 'ok', 'Nenhum marcador de dado ausente no texto.', corrigir);
};

const STOP = new Set(['para', 'sobre', 'entre', 'quando', 'ainda', 'acoes', 'projeto', 'municipio', 'realizar', 'garantir', 'ampliar', 'melhorar', 'atender', 'servicos']);
const tokens = (s: string): Set<string> => new Set(norm(s).split(/[^a-z0-9]+/).filter((w) => w.length >= 5 && !STOP.has(w)));

const R20: Regra = (p) => {
  const t = 'Metas coerentes com o objeto';
  const corrigir = 'Revise se a meta realmente decorre do objeto descrito (ou ajuste o texto do objeto).';
  const objeto = textoSecao(p, 'objeto');
  if (!p.metas.length || !objeto.trim()) return regra('R20', t, 'informativo', 'sem_dado', 'Sem metas ou sem texto de objeto para comparar.', 'Preencha o objeto e as metas.');
  const ob = tokens(objeto);
  const fora = p.metas.filter((m) => ![...tokens(m.descricao)].some((w) => ob.has(w)));
  return fora.length
    ? regra('R20', t, 'informativo', 'falha', `${fora.length} meta(s) sem palavra em comum com o objeto.`, corrigir, fora.map((m) => `Meta "${m.descricao}"`))
    : regra('R20', t, 'informativo', 'ok', 'Todas as metas têm relação textual com o objeto.', corrigir);
};

const R21: Regra = (p) => {
  const t = 'Versão aprovada sem alteração';
  const corrigir = 'O conteúdo mudou depois de aprovado: rode o parecer e registre a aprovação de novo.';
  if (!p.aprovacao) return regra('R21', t, 'bloqueante', 'ok', 'Sem aprovação registrada ainda; nada a comparar (a regra passa a valer após a aprovação).', corrigir);
  if (vazio(p.aprovacao.hashConteudo)) return regra('R21', t, 'bloqueante', 'sem_dado', 'Aprovação sem o hash do conteúdo aprovado.', 'Registre a aprovação novamente.');
  return p.aprovacao.hashConteudo === hashConteudo(p)
    ? regra('R21', t, 'bloqueante', 'ok', 'Conteúdo idêntico ao aprovado.', corrigir)
    : regra('R21', t, 'bloqueante', 'falha', 'O conteúdo foi alterado depois da aprovação.', corrigir);
};

export const REGRAS: Regra[] = [R01, R02, R03, R04, R05, R06, R07, R08, R09, R10, R11, R12, R13, R14, R15, R16, R17, R18, R19, R20, R21];

// ---------- parecer final ----------

export function gerarParecer(projeto: Projeto, contexto: ContextoParecer, hoje: Date = new Date()): Parecer {
  const resultados = REGRAS.map((r) => r(projeto, contexto, hoje));
  const justificado = (id: string): boolean => !vazio(projeto.justificativas?.[id]);
  const pendente = (r: ResultadoRegra): boolean => r.resultado !== 'ok';

  const bloqueantesPendentes = resultados.filter((r) => r.gravidade === 'bloqueante' && pendente(r)).map((r) => r.id);
  const alertas = resultados.filter((r) => r.gravidade === 'alerta' && pendente(r));
  const alertasJustificados = alertas.filter((r) => justificado(r.id)).map((r) => r.id);
  const alertasPendentes = alertas.filter((r) => !justificado(r.id)).map((r) => r.id);

  const completo = bloqueantesPendentes.length === 0 && alertasPendentes.length === 0;
  const a = projeto.aprovacao;
  const aprovacaoRegistrada =
    !!a && !vazio(a.nome) && !vazio(a.cargo) && !vazio(a.data) && !vazio(a.hashConteudo) && a.hashConteudo === hashConteudo(projeto);
  const prontoParaEnvio = completo && aprovacaoRegistrada;

  const faltaParaEnvio: string[] = [];
  if (bloqueantesPendentes.length) faltaParaEnvio.push(`Resolver regras bloqueantes: ${bloqueantesPendentes.join(', ')}`);
  if (alertasPendentes.length) faltaParaEnvio.push(`Resolver ou justificar alertas: ${alertasPendentes.join(', ')}`);
  if (!aprovacaoRegistrada)
    faltaParaEnvio.push(a ? 'Aprovação inválida (nome, cargo, data ou conteúdo alterado desde a aprovação)' : 'Registrar a aprovação (nome, cargo e data)');

  const totalOk = resultados.filter((r) => r.resultado === 'ok').length;
  return {
    versaoRegras: VERSAO_REGRAS,
    geradoEm: hoje.toISOString(),
    resultados,
    totalOk,
    totalRegras: resultados.length,
    percentual: Math.round((totalOk / resultados.length) * 100),
    bloqueantesPendentes,
    alertasPendentes,
    alertasJustificados,
    completo,
    aprovacaoRegistrada,
    prontoParaEnvio,
    faltaParaEnvio,
  };
}
