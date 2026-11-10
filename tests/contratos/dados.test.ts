// Testes de contrato dos dados coletados (Plano Mestre, Parte 8): avisam quando uma fonte muda de forma ou quando
// a proveniência obrigatória some. Execução: npm run test:dados  (usa node:test, sem navegador).
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { test } from 'node:test';

const dir = 'data/core';
const arquivos = readdirSync(dir).filter((f) => f.endsWith('.json'));
const le = (f: string) => JSON.parse(readFileSync(`${dir}/${f}`, 'utf8'));
const camposProveniencia = ['fonte', 'url_origem', 'data_referencia', 'data_coleta', 'id_carga'];

test('todo conjunto coletado guarda a proveniência obrigatória', () => {
  for (const f of arquivos) {
    const j = le(f);
    if (!j.proveniencia) continue; // arquivos de configuração/derivados sem proveniência própria
    for (const c of camposProveniencia) assert.ok(j.proveniencia[c] !== undefined && j.proveniencia[c] !== '', `${f}: proveniencia.${c} ausente`);
    assert.ok(!Number.isNaN(Date.parse(j.proveniencia.data_coleta)), `${f}: data_coleta inválida`);
  }
});

test('nenhum dado bancário ou CPF nos arquivos versionados', () => {
  const proibidos = [/"(cd_)?agencia"/i, /"(cd_)?conta"/i, /"nm_banco"/i, /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/];
  for (const f of arquivos) {
    const texto = readFileSync(`${dir}/${f}`, 'utf8');
    for (const re of proibidos) {
      assert.ok(!re.test(texto), `${f}: padrão proibido ${re}`);
    }
  }
});

test('IBGE: 27 capitais e o município piloto com população', () => {
  const j = le('ibge-municipios.json');
  assert.equal(j.municipios.filter((m: any) => m.capital).length, 27);
  const g = j.municipios.find((m: any) => m.codigo_ibge === 5208707);
  assert.equal(g?.nome, 'Goiânia');
  assert.ok(g.populacao > 1_000_000);
});

test('CAUC: 28 itens, cada um com situação reconhecida', () => {
  const j = le('cauc-5208707.json');
  assert.equal(j.itens.length, 28);
  const validas = ['regular', 'vencido', 'pendente', 'indisponivel', 'sem_informacao', 'desconhecido'];
  for (const i of j.itens) assert.ok(validas.includes(i.situacao), `item ${i.item}: situação ${i.situacao}`);
  assert.ok(j.itens.filter((i: any) => i.situacao === 'desconhecido').length <= 2, 'muitas células com formato desconhecido: o layout do CSV pode ter mudado');
});

test('Acompanhamento: saldo a liberar = repasse − desembolsado (conferência interna)', () => {
  const j = le('acompanhamento-5208707.json');
  assert.ok(j.convenios.length > 50);
  for (const c of j.convenios) {
    if (c.valor_repasse === null || c.saldo_a_liberar === null) continue;
    const esperado = Math.round((c.valor_repasse - (c.valor_desembolsado ?? 0)) * 100) / 100;
    assert.ok(Math.abs(c.saldo_a_liberar - esperado) < 0.02, `convênio ${c.nr_convenio}: saldo ${c.saldo_a_liberar} ≠ ${esperado}`);
  }
});

test('Programas abertos: prazos, tema e texto oficial', () => {
  const j = le('programas-abertos-5208707.json');
  assert.ok(j.programas.length >= 10, 'poucos programas: a fonte pode ter mudado');
  for (const p of j.programas) {
    assert.ok(p.codigo && p.nome, 'programa sem código ou nome');
    assert.ok(p.prazos.proposta_ate || p.prazos.emendas_ate || p.prazos.beneficiario_especifico_ate, `${p.codigo}: sem prazo`);
  }
  const comTexto = j.programas.filter((p: any) => p.texto_oficial?.descricao).length;
  assert.ok(comTexto / j.programas.length > 0.6, 'texto oficial ausente na maioria dos programas (API mudou?)');
});

test('SICONFI e FNS: indicadores essenciais presentes', () => {
  const s = le('siconfi-5208707.json');
  assert.equal(s.avisos.length, 0, `SICONFI com avisos: ${s.avisos}`);
  assert.ok(s.rgf.despesa_pessoal_pct_rcl > 0 && s.rgf.despesa_pessoal_pct_rcl < 100);
  const f = le('fns-capitais-2026.json');
  assert.equal(f.capitais.length, 27);
});
