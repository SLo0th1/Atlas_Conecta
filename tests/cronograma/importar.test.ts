// Testes do importador de cronogramas com planilha SINTÉTICA (nenhum dado real).
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, test } from 'node:test';
import ExcelJS from 'exceljs';
import { importarCronogramas } from '../../scripts/importar-cronogramas.ts';

const dir = mkdtempSync(join(tmpdir(), 'govnexa-cron-'));
const planilha = join(dir, 'sintetica.xlsx');
const carteiraJson = join(dir, 'carteira.json');
const AGORA = new Date('2026-06-15T12:00:00.000Z');
const D = (s: string) => new Date(`${s}T19:00:00.000Z`); // datas às 19h, como na planilha real
const CAB = ['NOME DO MARCO', 'ÁREA - RESPONSÁVEIS', 'SITUAÇÃO', 'DURAÇÃO (DIAS) PREVISTO', 'DATA INÍCIO PREVISTO', 'DATA TÉRMINO PREVISTO', 'DATA INÍCIO REALIZADO', 'DATA TÉRMINO REALIZADO', '% PREVISTO'];
let cron: Awaited<ReturnType<typeof importarCronogramas>>;
let anon: Awaited<ReturnType<typeof importarCronogramas>>;

function aba(wb: ExcelJS.Workbook, nome: string, titulo: string, endereco: string, seiTxt: string, linhas: unknown[][]) {
  const ws = wb.addWorksheet(nome);
  ws.addRow([titulo]);
  ws.addRow([endereco]);
  ws.addRow([seiTxt]);
  ws.addRow(CAB);
  for (const l of linhas) ws.addRow(l);
}

before(async () => {
  const wb = new ExcelJS.Workbook();
  aba(wb, 'Praça Alfa', 'Praça Alfa', 'Rua Sintética 100', 'Processo SEI 26.1.000012345-6', [
    ['Etapas iniciais', null, null, null, null, null, null, null, null],
    ['Elaborar projeto', 'Zeca Teste - SECAP/GEPP', 'Concluído', 10, D('2026-01-05'), D('2026-01-15'), D('2026-01-05'), D('2026-01-14'), 1],
    ['Validar projeto', 'Ana Teste - PGM', 'Concluído', 5, D('2026-01-16'), D('2026-01-20'), D('2026-01-16'), null, 1],
    ['2ª entrega do projeto', 'ZECA TESTE', 'Em andamento', 5, D('2026-05-01'), D('2026-05-10'), D('2026-05-02'), null, 0.5],
    ['Contratação', null, null, null, null, null, null, null, null],
    ['Publicar edital', 'SECAP/GEPP', null, 7, D('2026-06-01'), D('2026-06-10'), null, null, 0],
    ['Assinar contrato', 'Maria Sintética', null, 3, D('2026-09-01'), D('2026-09-05'), null, null, 0],
  ]);
  aba(wb, 'Escola Beta', 'Reforma da escola modelo central', 'Av. Fictícia 5', 'sem sei aqui', [
    ['Primeira etapa', 'Pedro Teste - SECAP', null, 4, D('2026-03-01'), D('2026-02-20'), null, null, 0],
    ['Etapa sem dono', null, 'Não Iniciado', null, 46000, '-', null, null, 0],
    ['Fase sem etapas', null, null, null, null, null, null, null, null],
    [null, null, null, null, 'LICITAÇÃO (Inserir submarcos)', null, null, null, null],
    ['EXECUÇÃO DA OBRA (Inserir submarcos)', 'EXECUÇÃO DA OBRA (Inserir submarcos)', null, null, 'EXECUÇÃO DA OBRA (Inserir submarcos)', 'EXECUÇÃO DA OBRA (Inserir submarcos)', null, null, null],
    ['Etapa da obra', 'Pedro Teste - SECAP', null, 3, D('2026-08-01'), D('2026-08-04'), null, null, 0],
    ['Orientação de Cores', null, null, null, null, null, null, null, null],
    ['Etapa depois da legenda', 'Pedro Teste - SECAP', null, 3, D('2026-08-01'), D('2026-08-04'), null, null, 0],
    [null, null, null, null, 'OBS: texto', null, null, null, null],
  ]);
  aba(wb, 'Cópia de Praça Alfa', 'Cópia', 'x', 'x', [['Etapa', 'Alguém - X', null, 1, D('2026-01-01'), D('2026-01-02'), null, null, 0]]);
  aba(wb, 'Sugestão de modelo', 'Modelo', 'x', 'x', [['Etapa', 'Alguém - X', null, 1, D('2026-01-01'), D('2026-01-02'), null, null, 0]]);
  await wb.xlsx.writeFile(planilha);
  const proj = (id: string, nome: string, sei: string[]) => ({ id, nome, sei });
  writeFileSync(
    carteiraJson,
    JSON.stringify({ projetos: [proj('P-1', 'Obra da praça principal', ['26.1.000012345-6']), proj('P-2', 'Reforma da escola modelo central', []), proj('P-3', 'Pavimentação rua distante', [])] }),
    'utf8',
  );
  cron = await importarCronogramas({ planilha, saida: join(dir, 'saida'), carteira: carteiraJson, agora: AGORA });
  anon = await importarCronogramas({ planilha, saida: join(dir, 'saida-anon'), carteira: carteiraJson, agora: AGORA, anonimizar: true });
});
after(() => rmSync(dir, { recursive: true, force: true }));

const etapas = (c: any) => c.fases.flatMap((f: any) => f.etapas);

test('abas de cópia ou modelo são ignoradas e registradas', () => {
  assert.equal(cron.cronogramas.cronogramas.length, 2);
  assert.equal(cron.relatorio.abas.lidas, 2);
  assert.deepEqual(cron.relatorio.abas.ignoradas.map((i) => i.motivo), ['cópia ou modelo', 'cópia ou modelo']);
});

test('cabeçalho do cronograma, fases e etapas', () => {
  const c = cron.cronogramas.cronogramas[0];
  assert.equal(c.id, 'C-praca-alfa');
  assert.equal(c.titulo, 'Praça Alfa');
  assert.equal(c.endereco, 'Rua Sintética 100');
  assert.deepEqual(c.sei, ['26.1.000012345-6']);
  assert.deepEqual(c.fases.map((f) => f.nome), ['Etapas iniciais', 'Contratação']);
  assert.equal(etapas(c).length, 5);
  const e = etapas(c)[0];
  assert.equal(e.nome, 'Elaborar projeto');
  assert.equal(e.fase, 'Etapas iniciais');
  assert.equal(e.responsavel, 'Zeca Teste');
  assert.equal(e.unidade, 'SECAP/GEPP');
  assert.equal(e.inicio_previsto, '2026-01-06'); // 19h vira o dia seguinte
  assert.equal(e.duracao_prevista, 10);
  assert.deepEqual(e.origem, { aba: 'Praça Alfa', linha: 6 });
});

test('responsável sem separador: só unidade ou só pessoa', () => {
  const e = etapas(cron.cronogramas.cronogramas[0]);
  assert.equal(e[2].responsavel, null);
  assert.equal(e[2].unidade, 'ZECA TESTE');
  assert.equal(e[3].unidade, 'SECAP/GEPP');
  assert.equal(e[4].responsavel, 'Maria Sintética');
  assert.equal(e[4].unidade, null);
});

test('status calculado e ciclo', () => {
  const e = etapas(cron.cronogramas.cronogramas[0]);
  assert.equal(e[0].status, 'concluida');
  assert.equal(e[1].status, 'atrasada'); // iniciada, sem término real, previsto 21/01 já passou
  assert.equal(e[2].status, 'atrasada'); // iniciada, previsto 11/05 já passou
  assert.equal(e[3].status, 'inicio_atrasado');
  assert.equal(e[4].status, 'a_fazer');
  assert.equal(e[2].ciclo, 2);
  assert.equal(e[0].ciclo, null);
});

test('pendências da etapa', () => {
  const e = etapas(cron.cronogramas.cronogramas[0]);
  assert.ok(e[1].pendencias.includes('Concluída na planilha sem data de término real'));
  assert.ok(e[1].pendencias.includes('Situação da planilha diferente da calculada'));
  assert.ok(!e[2].pendencias.includes('Situação da planilha diferente da calculada')); // "em andamento" equivale a atrasada
  assert.deepEqual(e[0].pendencias, []);
  const b = etapas(cron.cronogramas.cronogramas[1])[0];
  assert.ok(b.pendencias.includes('Término antes do início'));
});

test('casamento com a carteira: por SEI e por nome', () => {
  const [a, b] = cron.cronogramas.cronogramas;
  assert.deepEqual([a.projeto_id, a.casamento], ['P-1', 'sei']);
  assert.deepEqual([b.projeto_id, b.casamento], ['P-2', 'nome']);
  assert.deepEqual(cron.relatorio.casamento, { sei: 1, nome: 1, sem_par: 0 });
});

test('sem carteira correspondente gera pendência do cronograma', async () => {
  const r = await importarCronogramas({ planilha, saida: join(dir, 'saida-sem'), carteira: join(dir, 'nao-existe.json'), agora: AGORA });
  assert.ok(r.cronogramas.cronogramas.every((c) => c.projeto_id === null && c.pendencias.includes('Sem projeto correspondente na carteira')));
});

test('arquivos gravados e anonimização', () => {
  const json = readFileSync(join(dir, 'saida', 'cronogramas.json'), 'utf8');
  assert.ok(json.includes('Zeca Teste'));
  const anonJson = readFileSync(join(dir, 'saida-anon', 'cronogramas.json'), 'utf8');
  for (const n of ['Zeca Teste', 'Ana Teste', 'Maria Sintética', 'Pedro Teste', 'Rua Sintética', 'Av. Fictícia']) assert.ok(!anonJson.includes(n), n);
  assert.equal(anon.cronogramas.fonte.anonimizado, true);
  assert.ok(anon.cronogramas.cronogramas.every((c) => c.endereco === null));
  assert.equal(etapas(anon.cronogramas.cronogramas[0])[0].responsavel, 'Responsável 4'); // ordem alfabética: Ana, Maria, Pedro, Zeca
  const md = readFileSync(join(dir, 'saida', 'cronogramas-conciliacao.md'), 'utf8');
  assert.ok(md.includes('cópia ou modelo'));
});

test('data serial do Excel, "-" sem pendência, etapa sem responsável e fase vazia descartada', () => {
  const b = cron.cronogramas.cronogramas[1];
  assert.equal(etapas(b).length, 3);
  const e = etapas(b)[1];
  assert.equal(e.nome, 'Etapa sem dono');
  assert.equal(e.inicio_previsto, '2025-12-09');
  assert.equal(e.fim_previsto, null);
  assert.deepEqual(e.pendencias, ['Sem responsável']);
  assert.equal(e.status, 'inicio_atrasado');
  assert.ok(!b.fases.some((f) => f.nome === 'Fase sem etapas'));
  assert.equal(cron.relatorio.fases_vazias_descartadas, 2);
});

test('título de fase em célula de data e legenda no fim da aba', () => {
  const b = cron.cronogramas.cronogramas[1];
  assert.deepEqual(b.fases.map((f) => f.nome), ['Geral', 'EXECUÇÃO DA OBRA']);
  assert.equal(etapas(b)[2].nome, 'Etapa da obra');
  assert.equal(etapas(b)[2].fase, 'EXECUÇÃO DA OBRA');
  assert.ok(etapas(b).every((e: any) => !e.pendencias.some((p: string) => p.startsWith('Data não reconhecida'))));
  assert.ok(!etapas(b).some((e: any) => e.nome === 'Etapa depois da legenda'));
  assert.equal(cron.relatorio.linhas_legenda_ignoradas, 3);
});
