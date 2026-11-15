process.env.GOVNEXA_EXEMPLO = '1'; // usa os dados fictícios de data/exemplo
// Testes do mapa das obras: abreviações de bairro, categoria, situação, validação, localização e sobreposição. Data fixa.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import type { Carteira, Projeto } from '../../src/lib/carteira/tipos.ts';
import { categoriaObra, espalharSobrepostos, expandirBairro, semTipoDeBairro, localizarProjeto, situacaoMapa, validarLocalizacao, type GeoBairros } from '../../src/lib/mapa/geo.ts';
import { obrasDoMapa } from '../../src/lib/mapa/obras.ts';
import type { Localizacao } from '../../src/lib/mapa/tipos.ts';

const HOJE = '2026-11-15';
const carteira = JSON.parse(readFileSync('data/exemplo/carteira/carteira.json', 'utf8')) as Carteira;

function proj(id: string, mudar: (p: Projeto) => void = () => {}): Projeto {
  const p = JSON.parse(JSON.stringify(carteira.projetos[0])) as Projeto;
  p.id = id;
  p.nome = `Projeto ${id}`;
  p.orgao = 'SEINFRA';
  p.detalhamento = null;
  p.bairro = null;
  p.localizacao = null;
  p.macroetapa = '05';
  p.pendencias = [];
  p.valores = { ...p.valores, total: 1000, obra: 1000, projeto: null, executado: null };
  mudar(p);
  return p;
}
const cart = (...projetos: Projeto[]): Carteira => ({ ...carteira, projetos });
const ponto = (lat = -16.68, lng = -49.25): Localizacao => ({ tipo: 'ponto', ponto: { lat, lng }, endereco: null });
const trecho = (rua = 'Avenida T-7') => ({ rua, de: null, ate: null, linha: [{ lat: -16.7, lng: -49.27 }, { lat: -16.71, lng: -49.26 }] });

test('expandirBairro: abreviações no início ou isoladas', () => {
  assert.equal(expandirBairro('S Oeste'), 'Setor Oeste');
  assert.equal(expandirBairro('Jd Goiás'), 'Jardim Goiás');
  assert.equal(expandirBairro('Bro Feliz'), 'Bairro Feliz');
  assert.equal(expandirBairro('Res Solar Ville'), 'Residencial Solar Ville');
  assert.equal(expandirBairro('Vl Nova'), 'Vila Nova');
  assert.equal(expandirBairro('jd Goiás'), 'Jardim Goiás');
  assert.equal(expandirBairro('Setor Bueno'), 'Setor Bueno');
  assert.equal(expandirBairro('Centro'), 'Centro');
});

test('categoriaObra: uma regra por categoria e precedência', () => {
  const c = (mudar: (p: Projeto) => void) => categoriaObra(proj('P-1', mudar));
  assert.equal(c((p) => { p.detalhamento = 'OAE'; }), 'ponte');
  assert.equal(c((p) => { p.nome = 'Viaduto da Avenida X'; }), 'ponte');
  assert.equal(c((p) => { p.detalhamento = 'RECAPEAMENTO'; }), 'via');
  assert.equal(c((p) => { p.detalhamento = 'CALÇADA'; }), 'via');
  assert.equal(c((p) => { p.nome = 'Pavimentação do Bairro Y'; }), 'via');
  assert.equal(c((p) => { p.detalhamento = 'ALAGAMENTO'; }), 'drenagem');
  assert.equal(c((p) => { p.nome = 'Galeria pluvial'; }), 'drenagem');
  assert.equal(c((p) => { p.orgao = 'SMS'; }), 'saude');
  assert.equal(c((p) => { p.nome = 'Reforma da UBS Central'; }), 'saude');
  assert.equal(c((p) => { p.orgao = 'SME'; }), 'educacao');
  assert.equal(c((p) => { p.nome = 'Construção de CMEI'; }), 'educacao');
  assert.equal(c((p) => { p.orgao = 'SEMASDH'; }), 'assistencia');
  assert.equal(c((p) => { p.nome = 'Reforma do CRAS Norte'; }), 'assistencia');
  assert.equal(c((p) => { p.detalhamento = 'PARQUE'; }), 'lazer');
  assert.equal(c((p) => { p.orgao = 'AMMA'; }), 'lazer');
  assert.equal(c((p) => { p.orgao = 'SECULT'; }), 'cultura');
  assert.equal(c((p) => { p.detalhamento = 'MONUMENTO'; }), 'cultura');
  assert.equal(c(() => {}), 'edificacao');
  // precedência: ponte vence saúde; via vence saúde
  assert.equal(c((p) => { p.nome = 'Reforma da UBS'; p.detalhamento = 'OAE'; }), 'ponte');
  assert.equal(c((p) => { p.orgao = 'SMS'; p.nome = 'PAVIMENTAÇÃO do acesso'; }), 'via');
});

test('situacaoMapa por macroetapa', () => {
  const s = (m: Projeto['macroetapa']) => situacaoMapa({ macroetapa: m });
  assert.equal(s('05'), 'execucao');
  assert.equal(s('04'), 'mobilizacao');
  assert.equal(s('02'), 'contratacao');
  assert.equal(s('03'), 'contratacao');
  assert.equal(s('00'), 'planejamento');
  assert.equal(s('01'), 'planejamento');
  assert.equal(s('06'), 'concluida');
  assert.equal(s(null), 'sem');
});

test('validarLocalizacao', () => {
  assert.deepEqual(validarLocalizacao(ponto()), []);
  assert.ok(validarLocalizacao(ponto(-23.55, -46.63)).length > 0, 'ponto fora de Goiânia');
  assert.ok(validarLocalizacao({ tipo: 'ponto', ponto: { lat: 'x', lng: -49.25 }, endereco: null }).length > 0, 'latitude não numérica');
  assert.ok(validarLocalizacao({ tipo: 'trechos', trechos: [] }).length > 0, 'trechos vazio');
  assert.ok(validarLocalizacao({ tipo: 'trechos', trechos: [trecho('  ')] }).length > 0, 'trecho sem rua');
  assert.ok(validarLocalizacao({ tipo: 'trechos', trechos: [{ ...trecho(), linha: [{ lat: -16.7, lng: -49.27 }] }] }).length > 0, 'trecho com 1 ponto');
  assert.ok(validarLocalizacao({ tipo: 'trechos', trechos: Array.from({ length: 21 }, () => trecho()) }).length > 0, '21 trechos');
  assert.deepEqual(validarLocalizacao({ tipo: 'trechos', trechos: [trecho()] }), []);
  assert.ok(validarLocalizacao(null).length > 0);
  assert.ok(validarLocalizacao({ tipo: 'outro' }).length > 0);
});

test('localizarProjeto: simulada > cadastrada > bairro > nada', () => {
  const geo: GeoBairros = { bairros: { 'Bairro A': { busca: 'Bairro A', lat: -16.6, lng: -49.2, encontrado: true }, 'Bairro B': { busca: 'Bairro B', encontrado: false } } };
  const sim = ponto(-16.69, -49.26);
  const cad = ponto(-16.67, -49.24);
  const base = proj('P-1', (p) => { p.bairro = 'Bairro A'; p.localizacao = cad; });
  assert.deepEqual(localizarProjeto(base, geo, sim), { localizacao: sim, precisao: 'cadastrada' });
  assert.deepEqual(localizarProjeto(base, geo), { localizacao: cad, precisao: 'cadastrada' });
  const soBairro = proj('P-2', (p) => { p.bairro = 'Bairro A'; });
  assert.deepEqual(localizarProjeto(soBairro, geo), { localizacao: { tipo: 'ponto', ponto: { lat: -16.6, lng: -49.2 }, endereco: null }, precisao: 'bairro' });
  assert.equal(localizarProjeto(proj('P-3', (p) => { p.bairro = 'Bairro B'; }), geo), null);
  assert.equal(localizarProjeto(proj('P-4'), geo), null);
  // simulada inválida é ignorada
  assert.deepEqual(localizarProjeto(base, geo, ponto(0, 0)), { localizacao: cad, precisao: 'cadastrada' });
});

test('espalharSobrepostos', () => {
  const um = espalharSobrepostos([{ id: 'a', ponto: { lat: -16.7, lng: -49.2 } }]);
  assert.deepEqual(um.get('a'), { lat: -16.7, lng: -49.2 });
  const itens = ['c', 'a', 'b'].map((id) => ({ id, ponto: { lat: -16.7, lng: -49.2 } }));
  const r = espalharSobrepostos(itens);
  assert.deepEqual(r.get('a'), { lat: -16.7, lng: -49.2 }); // o primeiro (por id) fica no ponto original
  const chaves = new Set([...r.values()].map((p) => `${p.lat.toFixed(6)},${p.lng.toFixed(6)}`));
  assert.equal(chaves.size, 3);
  assert.deepEqual([...espalharSobrepostos(itens.slice().reverse()).entries()].sort(), [...r.entries()].sort());
});

test('obrasDoMapa: semLocal e percentual coerente', () => {
  const geo: GeoBairros = { bairros: { 'Bairro A': { busca: 'Bairro A', lat: -16.6, lng: -49.2, encontrado: true } } };
  const comLocal = proj('P-1', (p) => { p.localizacao = ponto(); p.valores = { ...p.valores, total: 1000, obra: 1000, executado: 250 }; });
  const incoerente = proj('P-2', (p) => { p.localizacao = { tipo: 'trechos', trechos: [trecho()] }; p.valores = { ...p.valores, total: 1000, obra: 1000, executado: 5000 }; });
  const bairro1 = proj('P-3', (p) => { p.bairro = 'Bairro A'; });
  const bairro2 = proj('P-4', (p) => { p.bairro = 'Bairro A'; });
  const sem = proj('P-5');
  const r = obrasDoMapa(cart(comLocal, incoerente, bairro1, bairro2, sem), geo, HOJE);
  assert.equal(r.semLocal, 1);
  assert.equal(r.obras.length, 4);
  const por = (id: string) => r.obras.find((o) => o.id === id)!;
  assert.equal(por('P-1').percentual, 25);
  assert.equal(por('P-2').percentual, null);
  assert.equal(por('P-1').precisao, 'cadastrada');
  assert.equal(por('P-3').precisao, 'bairro');
  assert.equal(por('P-1').situacao, 'execucao');
  assert.equal(por('P-1').foto, null);
  // os dois do mesmo bairro não ficam um sobre o outro
  const a = por('P-3').localizacao;
  const b = por('P-4').localizacao;
  assert.ok(a.tipo === 'ponto' && b.tipo === 'ponto' && (a.ponto.lat !== b.ponto.lat || a.ponto.lng !== b.ponto.lng));
});

test('semTipoDeBairro e abreviações novas', () => {
  assert.equal(semTipoDeBairro('Bairro Santa Genoveva'), 'Santa Genoveva');
  assert.equal(semTipoDeBairro('Sítio de Recreio Ipê'), 'Ipê');
  assert.equal(semTipoDeBairro('Santa Rita'), null);
  assert.equal(semTipoDeBairro('Setor'), null);
  assert.equal(expandirBairro('Prq Atheneu'), 'Parque Atheneu');
  assert.equal(expandirBairro('Vlg Casa Grande'), 'Village Casa Grande');
  assert.equal(expandirBairro('St. Sol Nascente'), 'Setor Sol Nascente');
});
