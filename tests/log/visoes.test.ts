process.env.GOVNEXA_EXEMPLO = '1'; // usa os dados fictícios de data/exemplo, não a carga real
// Testes das visões puras do histórico de alterações (filtro, resumo e CSV). Dados fictícios.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import type { RegistroLog } from '../../src/lib/log/tipos.ts';
import { diaLocal, filtrarLog, paraCsv, resumoRegistro } from '../../src/lib/log/visoes.ts';

const base = { origem: 'ficha' as const, autor: 'Pessoa Fictícia 1' };
const regs: RegistroLog[] = [
  { ...base, id: 'a', projeto_id: 'P-900', projeto_nome: 'Unidade de Saúde Exemplo A', tipo: 'mover_macroetapa', de: '00', para: '01', em: '2026-10-05T13:10:00Z', origem: 'kanban' },
  { ...base, id: 'b', projeto_id: 'P-901', projeto_nome: 'Ponte Exemplo B', tipo: 'atualizar_campos', em: '2026-10-09T17:05:00Z', autor: 'Pessoa Fictícia 2', motivo: 'Orçamento revisado após medição', campos: [{ campo: 'valores.obra', antes: 1000000, depois: 1200000 }] },
  { ...base, id: 'c', projeto_id: 'P-902', projeto_nome: 'Corredor Exemplo C', tipo: 'registrar_passo', descricao: 'Reunião com a comunidade realizada', em: '2026-10-10T02:30:00Z', origem: 'sei' },
  { ...base, id: 'd', projeto_id: '*', tipo: 'carga', descricao: 'Carga da planilha exemplo: 3 projetos (carga inicial)', em: '2026-10-01T12:00:00Z', origem: 'importacao', autor: 'Importação da planilha' },
  { ...base, id: 'e', projeto_id: 'P-900', projeto_nome: 'Unidade de Saúde Exemplo A', tipo: 'pendencia', descricao: 'Pendência reprovada: Falta ordem', de: '05', para: '04', em: '2026-11-01T15:00:00Z', origem: 'pendencia' },
];
const ids = (l: RegistroLog[]) => l.map((r) => r.id);

test('filtrarLog: sem filtro devolve tudo', () => {
  assert.deepEqual(ids(filtrarLog(regs, {})), ['a', 'b', 'c', 'd', 'e']);
});

test('filtrarLog: datas inclusivas por dia (horário de Brasília)', () => {
  assert.equal(diaLocal('2026-10-10T02:30:00Z'), '2026-10-09'); // 23:30 do dia anterior em Brasília
  assert.deepEqual(ids(filtrarLog(regs, { de: '2026-10-09', ate: '2026-10-09' })), ['b', 'c']);
  assert.deepEqual(ids(filtrarLog(regs, { de: '2026-10-05', ate: '2026-10-05' })), ['a']);
  assert.deepEqual(ids(filtrarLog(regs, { de: '2026-10-10' })), ['e']);
  assert.deepEqual(ids(filtrarLog(regs, { ate: '2026-10-01' })), ['d']);
});

test('filtrarLog: projeto casa ID ou parte do nome, sem acento nem maiúsculas', () => {
  assert.deepEqual(ids(filtrarLog(regs, { projeto: 'P-900' })), ['a', 'e']);
  assert.deepEqual(ids(filtrarLog(regs, { projeto: 'p-901' })), ['b']);
  assert.deepEqual(ids(filtrarLog(regs, { projeto: 'saude' })), ['a', 'e']);
  assert.deepEqual(ids(filtrarLog(regs, { projeto: 'inexistente' })), []);
});

test('filtrarLog: pessoa, ação e origem', () => {
  assert.deepEqual(ids(filtrarLog(regs, { autor: 'Pessoa Fictícia 2' })), ['b']);
  assert.deepEqual(ids(filtrarLog(regs, { acao: 'mover_macroetapa' })), ['a']);
  assert.deepEqual(ids(filtrarLog(regs, { acao: 'registrar_passo' })), ['c']);
  assert.deepEqual(ids(filtrarLog(regs, { acao: 'resolver_pendencia' })), ['e']); // 'pendencia' do motor
  assert.deepEqual(ids(filtrarLog(regs, { origem: 'importacao' })), ['d']);
});

test('filtrarLog: texto sem acento busca descrição, motivo, campos e nome', () => {
  assert.deepEqual(ids(filtrarLog(regs, { texto: 'REUNIAO' })), ['c']);
  assert.deepEqual(ids(filtrarLog(regs, { texto: 'orcamento revisado' })), ['b']);
  assert.deepEqual(ids(filtrarLog(regs, { texto: 'valor da obra' })), ['b']);
  assert.deepEqual(ids(filtrarLog(regs, { texto: 'ponte' })), ['b']);
  assert.deepEqual(ids(filtrarLog(regs, { texto: 'planejamento' })), ['a']); // nome da etapa no resumo
});

test('filtrarLog: combinação de filtros', () => {
  assert.deepEqual(ids(filtrarLog(regs, { projeto: 'P-900', origem: 'pendencia' })), ['e']);
  assert.deepEqual(ids(filtrarLog(regs, { projeto: 'P-900', origem: 'importacao' })), []);
  assert.deepEqual(ids(filtrarLog(regs, { de: '2026-10-01', ate: '2026-10-09', autor: 'Pessoa Fictícia 1', acao: 'mover_macroetapa' })), ['a']);
});

test('resumoRegistro: etapa, campos, passo e carga', () => {
  assert.equal(resumoRegistro(regs[0]), 'Em estruturação → Planejamento');
  assert.equal(resumoRegistro(regs[1]), 'Valor da obra: R$ 1.000.000 → R$ 1.200.000');
  assert.equal(resumoRegistro(regs[2]), 'Reunião com a comunidade realizada');
  assert.equal(resumoRegistro(regs[3]), 'Carga da planilha exemplo: 3 projetos (carga inicial)');
  assert.equal(resumoRegistro(regs[4]), 'Pendência reprovada: Falta ordem (Execução → Mobilização)');
  const dois: RegistroLog = { ...regs[1], campos: [{ campo: 'tipo_contratacao', antes: null, depois: 'LICITAÇÃO' }, { campo: 'tem_projeto', antes: false, depois: true }] };
  assert.equal(resumoRegistro(dois), 'Tipo de contratação: vazio → LICITAÇÃO (e mais 1 campo)');
  const primeira: RegistroLog = { ...regs[0], de: null };
  assert.equal(resumoRegistro(primeira), 'Sem etapa → Planejamento');
});

test('paraCsv: separador ;, aspas duplicadas e proteção contra fórmula', () => {
  const perigosos: RegistroLog[] = [
    { ...base, id: 'x', projeto_id: 'P-1', projeto_nome: '=SOMA(A1)', tipo: 'registrar_passo', descricao: 'Disse "olá"; depois saiu', em: '2026-10-05T13:10:00Z' },
    { ...base, id: 'y', projeto_id: 'P-2', projeto_nome: '+cmd', tipo: 'registrar_passo', descricao: '@alvo', motivo: '-1+1', em: '2026-10-05T13:11:00Z', autor: '\tTab' },
  ];
  const linhas = paraCsv(perigosos).split('\r\n');
  assert.equal(linhas[0], '"Data e hora";"Projeto (ID)";"Nome do projeto";"Ação";"O que mudou";"Motivo";"Por";"Origem";"Forçado"');
  assert.equal(linhas[1], '"05/10/2026 10:10";"P-1";"\'=SOMA(A1)";"Passo registrado";"Disse ""olá""; depois saiu";"";"Pessoa Fictícia 1";"Ficha do projeto";"Não"');
  assert.ok(linhas[2].includes(';"\'+cmd";'));
  assert.ok(linhas[2].includes(';"\'@alvo";"\'-1+1";"\'\tTab";'));
  assert.equal(linhas[3], '');
});

test('o histórico de exemplo é válido e só tem dados fictícios', () => {
  const j = JSON.parse(readFileSync('data/exemplo/historico/historico.json', 'utf8')) as { registros: RegistroLog[] };
  assert.ok(j.registros.length >= 20);
  assert.equal(new Set(j.registros.map((r) => r.id)).size, j.registros.length);
  assert.ok(j.registros.some((r) => r.tipo === 'carga' && r.projeto_id === '*'));
  for (const r of j.registros) assert.match(r.autor, /^(Pessoa Fictícia \d|Importação da planilha)$/);
  assert.ok(j.registros.every((r) => r.em >= '2026-10-01' && r.em < '2026-12-01'));
});
