// Testes do calendário de dias úteis e dos prazos da Lei 14.133 (piso, teto e metas internas).
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { diasUteisEntre, ehDiaUtil, feriados, pascoa, somarDiasCorridos, somarDiasUteis } from '../../src/lib/prazos/calendario.ts';
import { METAS, PRAZOS, avaliarPrazo, validarPiso } from '../../src/lib/prazos/lei14133.ts';

const GYN = 5208707;

test('Páscoa de 2024 a 2027', () => {
  assert.equal(pascoa(2024), '2024-03-31');
  assert.equal(pascoa(2025), '2025-04-20');
  assert.equal(pascoa(2026), '2026-04-05');
  assert.equal(pascoa(2027), '2027-03-28');
});

test('feriados móveis derivados da Páscoa e feriados de Goiânia', () => {
  const f = feriados(2026, GYN);
  const datas = new Map(f.map((x) => [x.data, x]));
  assert.ok(datas.has('2026-02-16') && datas.has('2026-02-17'), 'Carnaval');
  assert.equal(datas.get('2026-02-16')!.nome, 'Carnaval (ponto facultativo)');
  assert.equal(datas.get('2026-04-03')!.nome, 'Sexta-feira Santa');
  assert.equal(datas.get('2026-06-04')!.nome, 'Corpus Christi (ponto facultativo)');
  assert.equal(datas.get('2026-05-24')!.abrangencia, 'municipal');
  assert.equal(datas.get('2026-10-24')!.nome, 'Aniversário de Goiânia');
  assert.equal(datas.get('2026-11-20')!.abrangencia, 'nacional');
  assert.equal(f.filter((x) => x.movel).length, 4);
  assert.deepEqual(f.map((x) => x.data), [...f.map((x) => x.data)].sort());
  assert.equal(feriados(2026, 1).some((x) => x.abrangencia === 'municipal'), false, 'sem cadastro, só os nacionais');
});

test('dia útil: fim de semana e feriados', () => {
  assert.equal(ehDiaUtil('2026-11-13', GYN), true);
  assert.equal(ehDiaUtil('2026-11-14', GYN), false);
  assert.equal(ehDiaUtil('2026-11-20', GYN), false);
  assert.equal(ehDiaUtil('2027-11-15', GYN), false); // segunda-feira, Proclamação da República
});

test('somar dias úteis atravessa fim de semana e feriado (15/11 e 20/11/2026)', () => {
  assert.equal(somarDiasUteis('2026-11-13', 1, GYN), '2026-11-16');
  assert.equal(somarDiasUteis('2026-11-12', 2, GYN), '2026-11-16');
  assert.equal(somarDiasUteis('2026-11-19', 1, GYN), '2026-11-23'); // 20/11 feriado + fim de semana
  assert.equal(somarDiasUteis('2026-11-13', 10, GYN), '2026-11-30');
  assert.equal(somarDiasUteis('2027-11-12', 1, GYN), '2027-11-16'); // 15/11/2027 é feriado
  assert.equal(somarDiasUteis('2026-11-13', 0, GYN), '2026-11-13');
});

test('dias corridos: vencimento em dia não útil prorroga', () => {
  assert.equal(somarDiasCorridos('2026-11-13', 1), '2026-11-16'); // sábado -> segunda
  assert.equal(somarDiasCorridos('2026-11-18', 2), '2026-11-23'); // 20/11 feriado -> próximo útil
  assert.equal(somarDiasCorridos('2026-11-10', 3), '2026-11-13');
});

test('dias úteis entre duas datas', () => {
  assert.equal(diasUteisEntre('2026-11-13', '2026-11-30', GYN), 10);
  assert.equal(diasUteisEntre('2026-11-30', '2026-11-13', GYN), -10);
  assert.equal(diasUteisEntre('2026-11-13', '2026-11-13', GYN), 0);
});

test('catálogo de prazos: 11 itens, pisos e tetos, metas menores que a lei', () => {
  assert.equal(PRAZOS.length, 11);
  assert.equal(new Set(PRAZOS.map((p) => p.id)).size, 11);
  assert.equal(PRAZOS.filter((p) => p.tipo === 'piso').length, 8);
  for (const p of PRAZOS) assert.equal(p.conferidoNoTexto, false);
  for (const [id, meta] of Object.entries(METAS)) {
    const p = PRAZOS.find((x) => x.id === id)!;
    assert.equal(p.tipo, 'teto', `${id} só teto tem meta`);
    assert.ok(meta < p.dias, `${id}: meta menor que a lei`);
  }
});

test('avaliarPrazo: cada situação (decisão do recurso, início 13/11/2026)', () => {
  const av = (hoje: string, fim?: string) => avaliarPrazo('decisao_recurso', '2026-11-13', hoje, GYN, fim);
  const a = av('2026-11-20');
  assert.equal(a.limiteLegal, '2026-11-30');
  assert.equal(a.limiteMeta, '2026-11-23');
  assert.equal(a.situacao, 'no_prazo');
  assert.equal(a.diasRestantesLegais, 6);
  assert.equal(av('2026-11-24').situacao, 'passou_meta');
  assert.equal(av('2026-11-30').situacao, 'passou_meta');
  const l = av('2026-12-01');
  assert.equal(l.situacao, 'passou_lei');
  assert.equal(l.diasRestantesLegais, -1);
  assert.match(l.texto, /alerta/);
  assert.equal(av('2026-12-10', '2026-11-23').situacao, 'concluido_no_prazo');
  assert.equal(av('2026-12-10', '2026-11-24').situacao, 'concluido_apos_meta');
  assert.equal(av('2026-12-10', '2026-12-02').situacao, 'concluido_apos_lei');
});

test('avaliarPrazo: PNCP com meta de 10 e de 5 dias úteis', () => {
  const a = avaliarPrazo('pncp_contrato_direta', '2026-11-13', '2026-11-16', GYN);
  assert.equal(a.limiteMeta, '2026-11-23'); // 5 úteis: 16,17,18,19,23
  assert.equal(a.limiteLegal, '2026-11-30'); // 10 úteis
  assert.equal(avaliarPrazo('pncp_contrato_licitacao', '2026-11-13', '2026-11-16', GYN).situacao, 'no_prazo');
});

test('validarPiso: abertura no prazo mínimo e cedo demais', () => {
  const ok = validarPiso('publicidade_bens_menor_preco', '2026-11-13', '2026-11-26', GYN);
  assert.equal(ok.ok, true);
  assert.equal(ok.minimo, '2026-11-26');
  const cedo = validarPiso('publicidade_bens_menor_preco', '2026-11-13', '2026-11-25', GYN);
  assert.equal(cedo.ok, false);
  assert.equal(cedo.texto, 'A abertura não pode ser antes de 26/11/2026 (prazo mínimo de 8 dias úteis).');
  assert.throws(() => validarPiso('decisao_recurso', '2026-11-13', '2026-12-30', GYN));
});
