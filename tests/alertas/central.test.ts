process.env.GOVNEXA_EXEMPLO = '1'; // usa os dados fictícios de data/exemplo
// Testes da Central de alertas (Gestão). Data de referência fixa; cada regra tem um caso que falha se ela for removida.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import type { Carteira, Projeto } from '../../src/lib/carteira/tipos.ts';
import type { Cronograma } from '../../src/lib/cronograma/tipos.ts';
import { itensParados } from '../../src/lib/cronograma/visoes.ts';
import {
  type AlertaCentral,
  type ConvenioEntrada,
  type EntradaCentral,
  type FonteAvaliada,
  gravidadeMetaTeto,
  montarCentral,
  ordenar,
  SEM_ORGAO,
  textoDias,
} from '../../src/lib/alertas/central.ts';

const HOJE = '2026-11-15';
const IBGE = 5208707;
const carteira = JSON.parse(readFileSync('data/exemplo/carteira/carteira.json', 'utf8')) as Carteira;
const cronos = JSON.parse(readFileSync('data/exemplo/cronogramas/cronogramas.json', 'utf8')) as { fonte: { importado_em: string }; cronogramas: Cronograma[] };

const entrada = (mudar: Partial<EntradaCentral> = {}): EntradaCentral => ({
  carteira,
  cronogramas: cronos.cronogramas,
  cronogramasImportadosEm: cronos.fonte.importado_em,
  convenios: [],
  fontes: [],
  eventosLei: [],
  hoje: HOJE,
  municipio: IBGE,
  ...mudar,
});
const doTipo = (l: AlertaCentral[], tipo: string) => l.filter((a) => a.tipo === tipo);
const achar = (l: AlertaCentral[], id: string) => l.find((a) => a.id === id);
function proj(id: string, mudar: (p: Projeto) => void): Projeto {
  const p = JSON.parse(JSON.stringify(carteira.projetos[0])) as Projeto;
  p.id = id;
  p.nome = `Projeto ${id}`;
  p.valores = { ...p.valores, total: 1000, captado: null, contrapartida: null, custeio_municipio: 1000 };
  mudar(p);
  return p;
}
const cart = (...projetos: Projeto[]): Carteira => ({ ...carteira, projetos });

test('homologação e contrato: fim da contratação previsto vencido = vermelho; em até 30 dias = amarelo; com dias úteis', () => {
  const { alertas } = montarCentral(entrada());
  const h = doTipo(alertas, 'homologacao');
  assert.deepEqual(h.map((a) => [a.projeto?.id, a.gravidade]).sort(), [['P-903', 'vermelho'], ['P-910', 'amarelo']]);
  const p910 = achar(alertas, 'homologacao-P-910')!;
  assert.equal(p910.prazo, '2026-11-28');
  assert.equal(p910.dias, 13);
  // 16 a 28/11: sem fins de semana e sem o feriado de 20/11 (Consciência Negra) = 9 dias úteis
  assert.equal(p910.diasUteis, 9);
  assert.equal(p910.orgao, 'SEINFRA');
  assert.match(p910.link, /^\/plataforma\/projetos-carteira\/\?q=/);
});

test('início de obra: projeto em contratação ou mobilização com início previsto vencido = vermelho', () => {
  const { alertas } = montarCentral(entrada());
  const i = doTipo(alertas, 'inicio-obra');
  assert.deepEqual(i.map((a) => [a.projeto?.id, a.gravidade]).sort(), [['P-903', 'vermelho'], ['P-904', 'vermelho']]);
  // P-911 (mobilização, início em 2027-01-06) está fora da janela de 30 dias
  assert.equal(achar(alertas, 'inicio-obra-P-911'), undefined);
  const perto = montarCentral(entrada({ carteira: cart(proj('P-1', (p) => { p.macroetapa = '04'; p.datas.mobilizacao = '2026-12-01'; })) }));
  assert.equal(achar(perto.alertas, 'inicio-obra-P-1')?.gravidade, 'amarelo');
});

test('fim de obra: só em execução; vencido = vermelho, em até 30 dias = amarelo, longe = sem alerta', () => {
  const c = cart(
    proj('P-A', (p) => { p.macroetapa = '05'; p.datas.encerramento = '2026-11-01'; }),
    proj('P-B', (p) => { p.macroetapa = '05'; p.datas.encerramento = '2026-12-01'; }),
    proj('P-C', (p) => { p.macroetapa = '05'; p.datas.encerramento = '2027-06-01'; }),
    proj('P-D', (p) => { p.macroetapa = '06'; p.datas.encerramento = '2026-11-01'; }),
  );
  const { alertas } = montarCentral(entrada({ carteira: c, cronogramas: [] }));
  assert.deepEqual(doTipo(alertas, 'fim-obra').map((a) => [a.projeto?.id, a.gravidade, a.dias]), [['P-A', 'vermelho', -14], ['P-B', 'amarelo', 16]]);
});

test('saldo sem fonte: vermelho a partir da contratação, amarelo antes; concluído e sem dado de fonte ficam de fora', () => {
  const { alertas } = montarCentral(entrada());
  const s = doTipo(alertas, 'sem-fonte');
  assert.deepEqual(s.map((a) => [a.projeto?.id, a.gravidade]).sort(), [['P-902', 'amarelo'], ['P-910', 'vermelho']]);
  assert.match(achar(alertas, 'sem-fonte-P-910')!.titulo, /5\.950\.000/);
  const c = cart(
    proj('P-X', (p) => { p.macroetapa = '06'; p.valores.custeio_municipio = 10; }),
    proj('P-Y', (p) => { p.macroetapa = '01'; p.valores.custeio_municipio = null; }),
  );
  assert.equal(doTipo(montarCentral(entrada({ carteira: c, cronogramas: [] })).alertas, 'sem-fonte').length, 0);
});

test('etapa parada: um alerta por cronograma, com a etapa mais antiga e o órgão do projeto', () => {
  const { alertas } = montarCentral(entrada());
  const p = doTipo(alertas, 'parada');
  assert.equal(p.length, 2);
  for (const a of p) {
    const c = cronos.cronogramas.find((x) => `parada-${x.id}` === a.id)!;
    const itens = itensParados([c], HOJE);
    const maior = Math.max(...itens.map((i) => i.dias));
    assert.match(a.titulo, new RegExp(`^${itens.length} etapas atrasadas`));
    assert.equal(a.dias, -maior);
    assert.equal(a.gravidade, maior > 30 ? 'vermelho' : 'amarelo');
    assert.equal(a.orgao, carteira.projetos.find((x) => x.id === c.projeto_id)!.orgao);
  }
  assert.equal(doTipo(montarCentral(entrada({ hoje: '2026-01-01' })).alertas, 'parada').length, 0);
});

test('dado defasado: fontes federais e carga da planilha (7 dias = amarelo; acima de 14 = vermelho)', () => {
  const fontes: FonteAvaliada[] = [
    { id: 'cauc', nome: 'CAUC', situacao: 'Vencido: muito defasada', idade: 9, limite: 3, motivo: 'm1', acao: 'a1' },
    { id: 'fns', nome: 'FNS', situacao: 'Atenção: defasada', idade: 4, limite: 3, motivo: 'm2', acao: 'a2' },
    { id: 'siconfi', nome: 'SICONFI', situacao: 'Em dia', idade: 1, limite: 45, motivo: 'm3', acao: 'a3' },
  ];
  const r = montarCentral(entrada({ fontes, cronogramasImportadosEm: '2026-11-07T00:00:00Z', carteira: { ...carteira, fonte: { ...carteira.fonte, importado_em: '2026-10-20T00:00:00Z' } } }));
  const d = doTipo(r.alertas, 'defasado');
  assert.equal(achar(d, 'defasado-cauc')?.gravidade, 'vermelho');
  assert.equal(achar(d, 'defasado-fns')?.gravidade, 'amarelo');
  assert.equal(achar(d, 'defasado-siconfi'), undefined);
  assert.equal(achar(d, 'defasado-carteira-de-projetos')?.gravidade, 'vermelho'); // 26 dias
  assert.equal(achar(d, 'defasado-cronogramas')?.gravidade, 'amarelo'); // 8 dias
  assert.equal(doTipo(montarCentral(entrada()).alertas, 'defasado').length, 0); // exemplo importado em 15/11
});

test('convênios: cláusula suspensiva (indício) e vigência, só para convênios em execução', () => {
  const conv = (nr: string, m: Partial<ConvenioEntrada>): ConvenioEntrada => ({ nr_convenio: nr, objeto: `Objeto ${nr}`, orgao_superior: 'MINISTERIO X', situacao: 'Em execução', assinatura: '01/01/2025', vigencia_fim: '31/12/2028', valor_repasse: 100, valor_desembolsado: 0, ...m });
  const convenios = [
    conv('1', {}), // sem desembolso há mais de 180 dias, vigência longe: amarelo
    conv('2', { vigencia_fim: '05/12/2026' }), // sem desembolso e vigência em 20 dias: cláusula vermelha + vigência vermelha
    conv('3', { valor_desembolsado: 50, vigencia_fim: '14/01/2027' }), // vigência em 60 dias: amarela
    conv('4', { assinatura: '01/09/2026' }), // assinado há pouco: sem alerta
    conv('5', { situacao: 'Convênio Anulado', vigencia_fim: '20/11/2026' }), // fora de execução: ignorado
    conv('6', { valor_desembolsado: 50, vigencia_fim: '01/11/2026' }), // vigência já terminou: vermelha
    conv('7', { valor_desembolsado: null }), // desembolso não informado na coleta: NÃO conta como "sem desembolso"
  ];
  const { alertas } = montarCentral(entrada({ convenios }));
  assert.deepEqual(doTipo(alertas, 'clausula').map((a) => [a.convenio, a.gravidade]).sort(), [['1', 'amarelo'], ['2', 'vermelho']]);
  assert.deepEqual(doTipo(alertas, 'vigencia').map((a) => [a.convenio, a.gravidade]).sort(), [['2', 'vermelho'], ['3', 'amarelo'], ['6', 'vermelho']]);
  assert.equal(achar(alertas, 'vigencia-2')?.prazo, '2026-12-05');
  assert.equal(achar(alertas, 'clausula-1')?.orgao, null);
});

test('prazo da Lei 14.133: passou da meta = amarelo; passou do teto da lei = vermelho; concluído não alerta', () => {
  // Decisão do recurso: teto de 10 dias úteis, meta da prefeitura de 5. Início em 03/11/2026: meta 10/11, teto 17/11.
  const ev = [{ prazoId: 'decisao_recurso', inicio: '2026-11-03', projetoId: 'P-903', descricao: 'Recurso do pregão' }];
  const g = (hoje: string) => doTipo(montarCentral(entrada({ eventosLei: ev, hoje, cronogramas: [], carteira: cart() })).alertas, 'prazo-lei').map((a) => a.gravidade);
  assert.deepEqual(g('2026-11-05'), []);
  assert.deepEqual(g('2026-11-13'), ['amarelo']);
  assert.deepEqual(g('2026-11-20'), ['vermelho']);
  assert.deepEqual(doTipo(montarCentral(entrada({ eventosLei: [{ ...ev[0], concluidoEm: '2026-11-04' }], hoje: '2026-11-20' })).alertas, 'prazo-lei'), []);
  assert.equal(gravidadeMetaTeto('2026-11-20', '2026-11-10', '2026-11-17'), 'vermelho');
  assert.equal(gravidadeMetaTeto('2026-11-11', '2026-11-10', '2026-11-17'), 'amarelo');
  assert.equal(gravidadeMetaTeto('2026-11-10', '2026-11-10', '2026-11-17'), null);
  assert.equal(gravidadeMetaTeto('2026-11-20', null, '2026-11-17'), 'vermelho');
});

test('ordem: vermelho antes de amarelo; dentro da cor, prazo mais antigo primeiro e sem prazo por último', () => {
  const { alertas } = montarCentral(entrada({ convenios: [{ nr_convenio: '9', situacao: 'Em execução', assinatura: '01/01/2025', vigencia_fim: '31/12/2028', valor_desembolsado: 0 }] }));
  const primeiroAmarelo = alertas.findIndex((a) => a.gravidade === 'amarelo');
  assert.ok(primeiroAmarelo > 0);
  assert.ok(alertas.slice(primeiroAmarelo).every((a) => a.gravidade === 'amarelo'));
  for (const cor of ['vermelho', 'amarelo']) {
    const prazos = alertas.filter((a) => a.gravidade === cor).map((a) => a.prazo ?? '9999-12-31');
    assert.deepEqual(prazos, [...prazos].sort());
  }
  const base = { detalhe: '', regra: '', projeto: null, convenio: null, orgao: null, dias: null, diasUteis: null, acao: '', link: '' };
  const l = ordenar([
    { ...base, id: 'a', tipo: 'defasado', gravidade: 'amarelo', titulo: 'a', prazo: null },
    { ...base, id: 'b', tipo: 'defasado', gravidade: 'amarelo', titulo: 'b', prazo: '2026-01-01' },
    { ...base, id: 'c', tipo: 'defasado', gravidade: 'vermelho', titulo: 'c', prazo: '2027-01-01' },
  ]);
  assert.deepEqual(l.map((a) => a.id), ['c', 'b', 'a']);
});

test('contagens por tipo e por órgão batem com a lista; sem órgão fica por último', () => {
  const r = montarCentral(entrada({ convenios: [{ nr_convenio: '9', situacao: 'Em execução', assinatura: '01/01/2025', vigencia_fim: '31/12/2028', valor_desembolsado: 0 }] }));
  assert.equal(r.porTipo.reduce((s, t) => s + t.total, 0), r.alertas.length);
  assert.equal(r.porOrgao.reduce((s, o) => s + o.total, 0), r.alertas.length);
  for (const t of r.porTipo) assert.equal(t.total, t.vermelho + t.amarelo);
  assert.equal(r.totais.vermelho, r.alertas.filter((a) => a.gravidade === 'vermelho').length);
  assert.equal(r.porOrgao.at(-1)?.orgao, SEM_ORGAO);
  const seinfra = r.porOrgao.find((o) => o.orgao === 'SEINFRA')!;
  assert.equal(seinfra.total, r.alertas.filter((a) => a.orgao === 'SEINFRA').length);
});

test('sem fonte de dados: edital na praça e prazos por licitação aparecem; sem coleta de convênios também', () => {
  const r = montarCentral(entrada({ convenios: null }));
  const tipos = r.semFonte.map((s) => s.tipo);
  assert.ok(tipos.includes('edital'));
  assert.ok(tipos.includes('prazo-lei'));
  assert.ok(tipos.includes('vigencia'));
  assert.equal(doTipo(r.alertas, 'edital').length, 0);
  assert.equal(doTipo(r.alertas, 'clausula').length + doTipo(r.alertas, 'vigencia').length, 0);
  const comEventos = montarCentral(entrada({ eventosLei: [{ prazoId: 'decisao_recurso', inicio: '2026-11-03', projetoId: null, descricao: 'x' }] }));
  assert.ok(!comEventos.semFonte.some((s) => s.tipo === 'prazo-lei'));
  assert.ok(!comEventos.semFonte.some((s) => s.tipo === 'vigencia'));
});

test('nenhum nome de pessoa: o campo responsável nunca aparece', () => {
  const r = montarCentral(entrada());
  const texto = JSON.stringify(r);
  assert.ok(!texto.includes('responsavel'));
  const nomes = new Set<string>();
  for (const p of carteira.projetos) {
    if (p.responsavel) nomes.add(p.responsavel);
    if (p.atualizacao.responsavel) nomes.add(p.atualizacao.responsavel);
  }
  for (const c of cronos.cronogramas) for (const f of c.fases) for (const e of f.etapas) if (e.responsavel) nomes.add(e.responsavel);
  assert.ok(nomes.size > 0, 'o exemplo deveria ter responsáveis para o teste valer');
  for (const n of nomes) assert.ok(!texto.includes(n), `nome apareceu: ${n}`);
});

test('texto dos dias', () => {
  assert.equal(textoDias(-1), 'vencido há 1 dia');
  assert.equal(textoDias(-5), 'vencido há 5 dias');
  assert.equal(textoDias(0), 'vence hoje');
  assert.equal(textoDias(1), 'falta 1 dia');
  assert.equal(textoDias(12), 'faltam 12 dias');
  assert.equal(textoDias(null), 'sem prazo');
});
