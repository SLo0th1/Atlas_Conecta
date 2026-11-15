// Testes do importador da carteira com planilha SINTÉTICA (nenhum dado real).
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, test } from 'node:test';
import ExcelJS from 'exceljs';
import { importarCarteira } from '../../scripts/importar-carteira.ts';

const dir = mkdtempSync(join(tmpdir(), 'govnexa-teste-'));
const planilha = join(dir, 'sintetica.xlsx');
const saida = join(dir, 'saida');
let carteira: Awaited<ReturnType<typeof importarCarteira>>['carteira'];
let relatorio: any;

const CAB_PIPE = [
  'ID', 'Orgão', 'Responsável Acompanhamento', 'Nome do Projeto', 'Tipo de Projeto', 'SEI', 'Observação', 'Macroetapa',
  'Detalhamento Tipo de Projeto', 'Região', 'Bairro', 'Corredor', 'Origem do Valor', 'Tem projeto',
  'Valor Estimado Execução Projeto', 'Valor Estimado Execução Obra', 'Valor Executado', 'Valor em Captação ', 'Valor Captado',
  'Contrapartida Obrigatória', 'Custeio Municipio', 'Origem do Recurso', 'TIPO DO RECURSO', 'SITUAÇÃO', 'Fonte / Programa ',
  'Unidade Financiadora', 'Sugestão de Financiar', 'Status do Projeto',
  'Data Início do Projeto\n(Chegada da demanda na SECAP)', 'Entrega de Peças Técnicas\n(Projetos, Especificações e Orçamentos)',
  'Previsão Planejamento', 'Previsão Preparatório', 'Previsão Contratação', 'Previsão Mobilizaçao', 'Previsão Execução\n(DIAS)',
  'Previsão Encerramento', 'Termo de compromisso', 'Prioridade', 'Número Termo', 'TIPO DE CONTRATAÇÃO', 'ÓRGÃO DA CONTRATAÇÃO',
  'SOLICITAÇÕES FINANCEIRAS', 'VALOR TOTAL ', 'VALOR COM SOLICITAÇÃO FINANCEIRA',
  'Valor Subtotal\n2026', 'Valor Subtotal\n2027', 'Valor Subtotal\n2028',
  ' Recursos Federais\n2026.', ' Recursos Federais\n2027 ', ' Recursos Federais\n2028 ',
  ' Recursos Municipais\n2026 ', ' Recursos Municipais\n2027 ', ' Recursos Municipais\n2028 ',
  ' Recursos - Outros\n2026 ', ' Recursos - Outros\n2027 ', ' Recursos - Outros\n2028 ',
  'Responsável pela Atualização', 'Data da última Atualização',
];
const CAB_BASE = [
  'ID', 'Tipo', 'Situação', 'Observação', 'SEI', 'Local', 'Reunião 01-01-2026', 'Região', 'Providências', 'Previsão de entrega', 'Ano',
  'Cron. Físico 2026', 'Cron. Físico 2027', 'Cron. Físico 2028', 'Cron. Físico 2029',
  'Cron. Financ. 2026', 'Cron. Financ. 2027', 'Cron. Financ. 2028', 'Cron. Financ. 2029',
  'Campinas', 'Central', 'Leste', 'Macambira Cascavel', 'Meia Ponte', 'Mendanha', 'Noroeste', 'Norte', 'Oeste', 'Sudeste', 'Sudoeste', 'Sul', 'Várias/Não definido',
];

function linhaPipe(v: Record<string, unknown>): unknown[] {
  return CAB_PIPE.map((c) => {
    const chave = c.replace(/\s+/g, ' ').trim();
    return v[chave] ?? null;
  });
}

before(async () => {
  const wb = new ExcelJS.Workbook();
  const p = wb.addWorksheet('PIPELINE');
  p.addRow(CAB_PIPE);
  p.addRow(
    linhaPipe({
      ID: 1, Orgão: 'ORG1', 'Responsável Acompanhamento': 'Zeca Teste', Observação: 'obs sigilosa', 'Responsável pela Atualização': 'Ana Teste', 'Nome do Projeto': 'Reforma da escola modelo central', SEI: '26.1.000012345-6', Macroetapa: '06 - Conclusão', Região: '-', Corredor: 'Não',
      'Valor Estimado Execução Obra': '7,740,474.25', 'VALOR TOTAL': '7.740.474,25', 'Valor Executado': '-', 'Origem do Valor': 'Federal', 'Tem projeto': 'Sim',
      'Data Início do Projeto (Chegada da demanda na SECAP)': new Date('2026-03-10T19:00:00.000Z'),
      'Valor Subtotal 2026': 7740474.25, 'Recursos Federais 2026.': 7740474.25,
    }),
  );
  p.addRow(
    linhaPipe({
      ID: 2, Orgão: 'ORG2', 'Nome do Projeto': 'Pavimentação do corredor norte', SEI: '2026 sem numero', Macroetapa: '01 – Planejamento', Região: 'Norte',
      'Valor Estimado Execução Obra': 1000, 'VALOR TOTAL': 1000, 'Origem do Valor': 'Municipal',
      'Entrega de Peças Técnicas (Projetos, Especificações e Orçamentos)': '15/05/2026', 'Previsão Planejamento': '01/04/2026',
      'Valor Subtotal 2026': 400,
    }),
  );
  p.addRow(
    linhaPipe({
      ID: 3, Orgão: 'ORG1', 'Nome do Projeto': 'Praça do bairro sul', SEI: '-', Macroetapa: '03 – Contratação', Região: 'Sul',
      'Valor Estimado Execução Obra': 500, 'VALOR TOTAL': 500, 'Origem do Valor': 'Municipal',
    }),
  );
  p.addRow(['TOTAL', null, null, null, null, null, null, null, null, null, null, null, null, null, null, 9999]); // sem ID

  const b = wb.addWorksheet('BASE_OPERACIONAL');
  b.addRow(['Cabeçalho de cima']);
  b.addRow([]);
  b.addRow([]);
  b.addRow(CAB_BASE);
  const linhaBase = (id: number, sei: string | null, local: string, extra: Record<string, unknown> = {}) =>
    CAB_BASE.map((c) => {
      if (c === 'ID') return id;
      if (c === 'SEI') return sei;
      if (c === 'Local') return local;
      return extra[c] ?? null;
    });
  b.addRow(linhaBase(10, '26.1.000012345-6', 'qualquer', { Situação: 'Em obra', 'Reunião 01-01-2026': 'ok', Providências: 'prov sigilosa', 'Cron. Físico 2026': 0.5, 'Cron. Financ. 2026': 100, Norte: 20, Ano: 2026 }));
  b.addRow(linhaBase(11, null, 'Pavimentação do corredor norte'));
  b.addRow(linhaBase(12, null, 'Algo totalmente diferente xyz'));
  await wb.xlsx.writeFile(planilha);
  const r = await importarCarteira({ planilha, saida, agora: new Date('2026-01-01T12:00:00Z') });
  carteira = r.carteira;
  relatorio = r.relatorio;
});

after(() => rmSync(dir, { recursive: true, force: true }));

test('projetos, linhas ignoradas e números em formatos diferentes', () => {
  assert.equal(carteira.projetos.length, 3);
  assert.equal(relatorio.abas.PIPELINE.ignoradas.length, 1);
  assert.match(relatorio.abas.PIPELINE.ignoradas[0].motivo, /sem ID/);
  const p1 = carteira.projetos[0];
  assert.equal(p1.id, 'P-1');
  assert.equal(p1.valores.obra, 7740474.25);
  assert.equal(p1.valores.total, 7740474.25);
  assert.equal(p1.valores.executado, null);
  assert.equal(p1.macroetapa, '06');
  assert.equal(p1.regiao, null);
  assert.equal(p1.corredor, null);
  assert.equal(p1.tem_projeto, true);
  assert.equal(p1.por_ano['2026'].federal, 7740474.25);
});

test('data às 19h vira o dia seguinte e SEI sem pontos é normalizado', () => {
  const p1 = carteira.projetos[0];
  assert.equal(p1.datas.inicio, '2026-03-11');
  assert.deepEqual(p1.sei, ['26.1.000012345-6']);
});

test('pendências: SEI inválido, datas fora de ordem, soma por ano e sem região', () => {
  const p1 = carteira.projetos[0];
  const p2 = carteira.projetos[1];
  assert.ok(p1.pendencias.includes('Sem região'));
  assert.ok(p2.pendencias.includes('SEI inválido'));
  assert.ok(p2.pendencias.includes('Datas previstas fora de ordem'));
  assert.ok(p2.pendencias.includes('Soma por ano diferente do valor total'));
  assert.ok(!p1.pendencias.includes('Datas previstas fora de ordem'));
  assert.ok(relatorio.pendencias_por_tipo['SEI inválido'] >= 1);
});

test('base operacional: casamento por SEI, por nome e um sem par', () => {
  assert.equal(relatorio.abas.BASE_OPERACIONAL.registros, 3);
  assert.equal(relatorio.abas.BASE_OPERACIONAL.casadas_sei, 1);
  assert.equal(relatorio.abas.BASE_OPERACIONAL.casadas_nome, 1);
  assert.equal(relatorio.abas.BASE_OPERACIONAL.sem_par.length, 1);
  assert.equal(relatorio.abas.BASE_OPERACIONAL.sem_par[0].id_base, '12');
  const o1 = carteira.projetos[0].operacional!;
  assert.equal(o1.casamento, 'sei');
  assert.equal(o1.situacao, 'Em obra');
  assert.equal(o1.reuniao, 'ok');
  assert.equal(o1.ano, '2026');
  assert.equal(o1.cronograma_fisico['2026'], 0.5);
  assert.equal(o1.regioes['Norte'], 20);
  assert.equal(carteira.projetos[1].operacional!.casamento, 'nome');
  assert.equal(carteira.projetos[2].operacional, null);
});

test('arquivos de saída existem e conciliação tem as regras', () => {
  const c = JSON.parse(readFileSync(join(saida, 'carteira.json'), 'utf8'));
  assert.equal(c.projetos.length, 3);
  assert.equal(c.fonte.ficticio, false);
  assert.equal(relatorio.conciliacao.length, 4);
  assert.equal(relatorio.conciliacao[0].ok, true);
  assert.match(readFileSync(join(saida, 'conciliacao.md'), 'utf8'), /Conferências/);
});

test('baixar-dados sem variáveis usa o exemplo e sai com código 0', () => {
  const env = Object.fromEntries(Object.entries(process.env).filter(([k]) => !k.startsWith('GOVNEXA_')));
  const r = spawnSync(process.execPath, ['scripts/baixar-dados.mjs'], { env, encoding: 'utf8' });
  assert.equal(r.status, 0);
  assert.match(r.stdout, /usando dados de exemplo/);
});

test('SEI "-" é ausente, sem pendência', () => {
  assert.deepEqual(carteira.projetos[2].sei, []);
  assert.ok(!carteira.projetos[2].pendencias.includes('SEI inválido'));
});

test('conciliação de fontes só nos projetos com fonte e linha informativa', () => {
  const info = relatorio.conciliacao.find((c: any) => c.informativo);
  assert.equal(info.encontrado, 2);
  assert.equal(relatorio.conciliacao[2].ok, true);
});

test('anonimizar: responsáveis viram rótulos e textos livres somem', async () => {
  const s2 = join(dir, 'anon');
  const r = await importarCarteira({ planilha, saida: s2, agora: new Date('2026-01-01T12:00:00Z'), anonimizar: true });
  const bruto = readFileSync(join(s2, 'carteira.json'), 'utf8') + readFileSync(join(s2, 'importacao.json'), 'utf8');
  for (const nome of ['Zeca Teste', 'Ana Teste', 'obs sigilosa', 'prov sigilosa']) assert.ok(!bruto.includes(nome), nome);
  const p1 = r.carteira.projetos[0];
  assert.equal(p1.atualizacao.responsavel, 'Responsável 1'); // ordem alfabética: Ana < Zeca
  assert.equal(p1.responsavel, 'Responsável 2');
  assert.equal(p1.observacao, null);
  assert.equal(p1.operacional!.providencias, null);
  assert.equal(p1.operacional!.reuniao, null);
  assert.equal((r.carteira.fonte as any).anonimizado, true);
  assert.equal((r.relatorio as any).anonimizado, true);
});

test('duas importações seguidas registram carga, criado, removido, campos e etapa no historico.json, sem apagar o anterior', async () => {
  const s3 = join(dir, 'historico');
  await importarCarteira({ planilha, saida: s3, agora: new Date('2026-02-01T12:00:00Z') });
  const h1 = JSON.parse(readFileSync(join(s3, 'historico.json'), 'utf8')).registros;
  assert.equal(h1.length, 1);
  assert.equal(h1[0].tipo, 'carga');
  assert.equal(h1[0].projeto_id, '*');
  assert.equal(h1[0].origem, 'importacao');
  assert.equal(h1[0].autor, 'Importação da planilha');
  assert.match(h1[0].descricao, /sintetica\.xlsx: 3 projetos \(carga inicial\)/);

  // segunda planilha: P-1 muda o valor da obra, P-2 só avança de macroetapa, P-3 sai e P-4 entra
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(planilha);
  const ws = wb.getWorksheet('PIPELINE')!;
  const coluna = (nome: string) => (ws.getRow(1).values as unknown[]).indexOf(nome);
  ws.getRow(2).getCell(coluna('Valor Estimado Execução Obra')).value = 8000000;
  ws.getRow(3).getCell(coluna('Macroetapa')).value = '02 – Preparatório para Contratação';
  ws.getRow(4).getCell(coluna('ID')).value = 4;
  const planilha2 = join(dir, 'sintetica.xlsx.nova.xlsx');
  await wb.xlsx.writeFile(planilha2);
  await importarCarteira({ planilha: planilha2, saida: s3, agora: new Date('2026-02-02T12:00:00Z'), autor: 'Pessoa Fictícia 9' });

  const h2 = JSON.parse(readFileSync(join(s3, 'historico.json'), 'utf8')).registros as any[];
  assert.deepEqual(h2[0], h1[0]); // o anterior continua igual e no mesmo lugar
  const novos = h2.slice(1);
  assert.deepEqual(novos.map((r) => r.tipo).sort(), ['atualizar_campos', 'carga', 'criado', 'mover_macroetapa', 'removido']);
  assert.ok(novos.every((r) => r.autor === 'Pessoa Fictícia 9' && r.origem === 'importacao' && r.em === '2026-02-02T12:00:00.000Z'));
  const por = (t: string) => novos.find((r) => r.tipo === t);
  assert.equal(por('criado').projeto_id, 'P-4');
  assert.equal(por('removido').projeto_id, 'P-3');
  assert.equal(por('mover_macroetapa').projeto_id, 'P-2');
  assert.equal(por('mover_macroetapa').de, '01');
  assert.equal(por('mover_macroetapa').para, '02');
  assert.equal(por('atualizar_campos').projeto_id, 'P-1');
  assert.deepEqual(por('atualizar_campos').campos, [{ campo: 'valores.obra', antes: 7740474.25, depois: 8000000 }]);
  assert.equal(por('carga').projeto_id, '*');
  assert.match(por('carga').descricao, /nova\.xlsx: 3 projetos \(1 incluídos, 2 alterados, 1 retirados\)/);
  assert.equal(new Set(h2.map((r) => r.id)).size, h2.length);
});
