process.env.GOVNEXA_EXEMPLO = '1'; // usa os dados fictícios de data/exemplo
// Testes do WhatsApp da Gestão (simulação): permissão filtra ANTES de qualquer texto, validação dos números e mensagens.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import type { Carteira } from '../../src/lib/carteira/tipos.ts';
import { montarBase } from '../../src/lib/whatsapp/base.ts';
import { contatosExemplo } from '../../src/lib/whatsapp/exemplo.ts';
import { AJUDA, caber, LIMITE_MENSAGEM, montarRelatorio, procurarProjeto, responderPergunta, SEM_CAPTACAO, SEM_PROJETO } from '../../src/lib/whatsapp/mensagens.ts';
import { descreverPermissao, descreverRelatorio, mascararTelefone, normalizarTelefone, permissaoDoPerfil, projetosVisiveis, validarContato } from '../../src/lib/whatsapp/permissoes.ts';
import type { CaptacaoWhats, Contato, Permissao } from '../../src/lib/whatsapp/tipos.ts';
import { farol } from '../../src/lib/carteira/visoes.ts';
import { farolWhats, hojeEmBrasilia } from '../../src/lib/whatsapp/farol.ts';
import { CHAVE_WHATSAPP_SIMULACAO, guardarContatos, lerContatos } from '../../src/lib/whatsapp/simulacao.ts';

const HOJE = '2026-11-15';
const carteira = JSON.parse(readFileSync('data/exemplo/carteira/carteira.json', 'utf8')) as Carteira;
const base = montarBase(carteira, HOJE);
const orgaos = [...new Set(base.map((p) => p.orgao).filter((o): o is string => !!o))].sort();
const ids = new Set(base.map((p) => p.id));
const CAPTACAO: CaptacaoWhats = { emExecucao: 7, pactuado: 12_500_000, liberado: 4_000_000, saldoALiberar: 8_500_000, semDesembolso: 2 };

function contato(permissao: Partial<Permissao> = {}, outro: Partial<Contato> = {}): Contato {
  return {
    id: 'teste',
    rotulo: 'Equipe de teste',
    telefone: '+5562991234567',
    ativo: true,
    perfil: 'personalizado',
    permissao: { orgaos: '*', somentePrioritarios: false, projetosExtras: [], verValores: true, verCaptacao: true, ...permissao },
    relatorio: { frequencia: 'semanal', diaSemana: 1, hora: '08:00', modelo: 'prioritarios' },
    ...outro,
  };
}

test('base do WhatsApp não leva o responsável nem observações (dado de pessoa fica fora)', () => {
  assert.equal(base.length, carteira.projetos.length);
  for (const p of base) {
    assert.equal('responsavel' in p, false);
    assert.equal('observacao' in p, false);
    assert.equal('atualizacao' in p, false);
  }
  const p905 = base.find((p) => p.id === 'P-905')!;
  assert.match(p905.etapa, /^05 – /);
});

test('permissão por órgão, prioridade e projetos extras; sem valores o R$ some', () => {
  const soSeinfra = projetosVisiveis(base, { orgaos: ['SEINFRA'], somentePrioritarios: false, projetosExtras: [], verValores: true, verCaptacao: false });
  assert.ok(soSeinfra.length > 0);
  assert.ok(soSeinfra.every((p) => p.orgao === 'SEINFRA'));

  const prioritarios = projetosVisiveis(base, { orgaos: '*', somentePrioritarios: true, projetosExtras: [], verValores: true, verCaptacao: false });
  assert.ok(prioritarios.every((p) => p.prioridade === 'Muito Alta' || p.prioridade === 'Alta'));
  assert.equal(prioritarios.length, base.filter((p) => p.prioridade === 'Muito Alta' || p.prioridade === 'Alta').length);

  const comExtra = projetosVisiveis(base, { orgaos: ['SEINFRA'], somentePrioritarios: true, projetosExtras: ['P-902'], verValores: true, verCaptacao: false });
  assert.ok(comExtra.some((p) => p.id === 'P-902'), 'projeto extra (SME, Média) entra mesmo fora do filtro');

  const semValores = projetosVisiveis(base, { orgaos: '*', somentePrioritarios: false, projetosExtras: [], verValores: false, verCaptacao: false });
  assert.ok(semValores.every((p) => p.valor === null));
  assert.ok(base.some((p) => p.valor !== null), 'a base tem valores (o teste acima não passa por acaso)');
});

test('relatório sem permissão de valores não mostra R$; com permissão mostra', () => {
  const sem = montarRelatorio(contato({ verValores: false, verCaptacao: true }), base, CAPTACAO, HOJE);
  assert.doesNotMatch(sem, /R\$/);
  assert.match(sem, /Convênios em execução:\* 7/);
  const com = montarRelatorio(contato(), base, CAPTACAO, HOJE);
  assert.match(com, /R\$/);
  assert.match(com, /^\*GovNexa · Projetos prioritários\*\n15\/11\/2026 · Equipe de teste/);
});

test('relatório só fala dos projetos visíveis (órgão de fora nunca aparece)', () => {
  const c = contato({ orgaos: ['SEINFRA'], verCaptacao: false });
  const texto = montarRelatorio(c, base, CAPTACAO, HOJE);
  for (const p of base.filter((x) => x.orgao !== 'SEINFRA')) assert.ok(!texto.includes(p.nome), `${p.nome} vazou no relatório da SEINFRA`);
  assert.doesNotMatch(texto, /Convênios/, 'sem permissão de captação, o bloco não aparece');
  const resumo = montarRelatorio(c, base, CAPTACAO, HOJE, 'resumo');
  assert.match(resumo, /Resumo da carteira/);
  assert.match(resumo, /Em execução: \d+ · entregas em 30 dias: \d+/);
});

test('pergunta sobre projeto de outro órgão recebe a MESMA resposta de inexistente (não revela que existe)', () => {
  const c = contato({ orgaos: ['SEINFRA'] });
  const outro = base.find((p) => p.orgao === 'SMS')!;
  assert.equal(responderPergunta(outro.nome, c, base, CAPTACAO, HOJE), SEM_PROJETO);
  assert.equal(responderPergunta(outro.id, c, base, CAPTACAO, HOJE), SEM_PROJETO);
  if (outro.sei.length) assert.equal(responderPergunta(outro.sei[0], c, base, CAPTACAO, HOJE), SEM_PROJETO);
  assert.equal(responderPergunta('Projeto que não existe xyz', c, base, CAPTACAO, HOJE), SEM_PROJETO);
});

test('pergunta por nome, código e SEI devolve o detalhe do projeto visível', () => {
  const c = contato();
  const p = base.find((x) => x.id === 'P-905')!;
  const porNome = responderPergunta(`como está a ${p.nome.toLowerCase()}?`, c, base, CAPTACAO, HOJE);
  assert.match(porNome, new RegExp(`^\\*${p.nome}\\*`));
  assert.match(responderPergunta('aquisição de equipamentos', c, base, CAPTACAO, HOJE), /^Encontrei \d+ projetos/, 'nome incompleto com mais de um resultado pede para escolher');
  assert.match(responderPergunta('p905', c, base, CAPTACAO, HOJE), /Código no GovNexa: P-905/);
  assert.match(responderPergunta('P-905', c, base, CAPTACAO, HOJE), /Código no GovNexa: P-905/);
  assert.match(responderPergunta(`SEI ${p.sei[0]}`, c, base, CAPTACAO, HOJE), /Código no GovNexa: P-905/);
  const varios = responderPergunta('ponte', c, base, CAPTACAO, HOJE);
  assert.match(varios, /^Encontrei 2 projetos/);
});

test('captação: sem permissão recusa; com permissão resume; valores só com verValores', () => {
  assert.equal(responderPergunta('como estão as emendas?', contato({ verCaptacao: false }), base, CAPTACAO, HOJE), SEM_CAPTACAO);
  const com = responderPergunta('convênios', contato(), base, CAPTACAO, HOJE);
  assert.match(com, /Convênios em execução:\* 7/);
  assert.match(com, /saldo a liberar R\$ 8,5 mi/);
  assert.doesNotMatch(responderPergunta('convênios', contato({ verValores: false }), base, CAPTACAO, HOJE), /R\$/);
  assert.match(responderPergunta('convênios', contato(), base, null, HOJE), /não estão disponíveis/);
});

test('ajuda, atrasados, entregas e execução', () => {
  const c = contato();
  assert.equal(responderPergunta('', c, base, CAPTACAO, HOJE), AJUDA);
  assert.equal(responderPergunta('Bom dia!', c, base, CAPTACAO, HOJE), AJUDA);
  const atrasados = responderPergunta('o que está atrasado?', c, base, CAPTACAO, HOJE);
  const vermelhos = base.filter((p) => p.macroetapa !== '06' && p.farol === 'vermelho');
  if (vermelhos.length) assert.match(atrasados, new RegExp(`^\\*${vermelhos.length} projetos? com prazo vencido\\*`));
  else assert.match(atrasados, /Nenhum projeto com prazo vencido/);
  assert.match(responderPergunta('próximas entregas', c, base, CAPTACAO, HOJE), /entrega/i);
  assert.match(responderPergunta('obras em execução', c, base, CAPTACAO, HOJE), /execução/);
  assert.match(responderPergunta('relatório', c, base, CAPTACAO, HOJE), /^\*GovNexa/);
});

test('procurarProjeto exige todas as palavras e ignora as vazias', () => {
  assert.deepEqual(procurarProjeto('qual a situação da obra', base), []);
  assert.equal(procurarProjeto('ponte exemplo j', base).length >= 1, true);
});

test('caber corta no fim de linha e avisa', () => {
  const longo = Array.from({ length: 400 }, (_, i) => `linha ${i} com algum texto`).join('\n');
  const r = caber(longo);
  assert.ok(r.length <= LIMITE_MENSAGEM);
  assert.match(r, /mensagem resumida/);
  assert.equal(caber('curto'), 'curto');
});

test('telefone: normaliza, valida e mascara', () => {
  assert.equal(normalizarTelefone('(62) 9 9123-4567'), '+5562991234567');
  assert.equal(normalizarTelefone('55 62 99123 4567'), '+5562991234567');
  assert.equal(normalizarTelefone('1234'), '1234');
  assert.equal(mascararTelefone('+5562991234567'), '+55 62 9••••-4567');
  assert.equal(mascararTelefone('123'), 'Número inválido');
});

test('validarContato: aceita os exemplos e recusa campos ruins com mensagem clara', () => {
  const exemplos = contatosExemplo(orgaos);
  assert.equal(exemplos.length, 3);
  for (const c of exemplos) assert.deepEqual(validarContato(c, orgaos, ids, exemplos), [], c.id);
  const erros = (c: unknown): string => validarContato(c, orgaos, ids, exemplos).join(' | ');
  assert.match(erros(contato({}, { telefone: '+556233334444' })), /celular inválido/);
  assert.match(erros(contato({}, { telefone: '+5562900000001' })), /já está cadastrado/);
  assert.match(erros(contato({}, { rotulo: 'x' })), /2 a 60/);
  assert.match(erros(contato({ orgaos: [] })), /ao menos um órgão/);
  assert.match(erros(contato({ orgaos: ['XYZ'] })), /não existe na carteira/);
  assert.match(erros(contato({ projetosExtras: ['P-99999'] })), /não encontrado na carteira: P-99999/);
  assert.match(erros(contato({}, { relatorio: { frequencia: 'semanal', diaSemana: 8, hora: '25:00', modelo: 'prioritarios' } })), /Dia da semana inválido.*Horário inválido/);
  assert.match(erros(contato({}, { id: '<script>' })), /Identificador inválido/);
  assert.deepEqual(validarContato(null, orgaos, ids), ['Contato inválido.']);
  assert.deepEqual(validarContato(contato(), orgaos, ids, exemplos), []);
});

test('farolWhats dá o mesmo resultado que farol() da carteira em várias datas (recalculado no navegador)', () => {
  for (const dia of ['2025-01-01', '2026-06-15', HOJE, '2027-03-01', '2029-01-01']) {
    const b = montarBase(carteira, '2000-01-01');
    for (const p of carteira.projetos) {
      const w = b.find((x) => x.id === p.id)!;
      const f = farol(p, dia);
      assert.deepEqual(farolWhats(w, dia), { farol: f.cor, motivo: f.motivo }, `${p.id} em ${dia}`);
    }
  }
});

test('hoje em Brasília: 01h30 UTC ainda é o dia anterior', () => {
  assert.equal(hojeEmBrasilia(new Date('2026-11-16T01:30:00Z')), '2026-11-15');
  assert.equal(hojeEmBrasilia(new Date('2026-11-16T03:30:00Z')), '2026-11-16');
});

test('nome de projeto com palavra-chave ("Recursos", "Entrega") é achado pelo nome antes das palavras-chave', () => {
  const extra = { ...base[0], id: 'P-7001', nome: 'Centro de Recursos Hídricos', orgao: 'SEINFRA' };
  const b2 = [...base, extra];
  const c = contato({ verCaptacao: false });
  assert.match(responderPergunta('como está o centro de recursos hídricos?', c, b2, CAPTACAO, HOJE), /^\*Centro de Recursos Hídricos\*/);
  // sem permissão para o projeto: não aparece (cai na regra de captação, sem revelar o projeto)
  const soSme = contato({ orgaos: ['SME'], verCaptacao: false });
  assert.equal(responderPergunta('centro de recursos hídricos', soSme, b2, CAPTACAO, HOJE), SEM_CAPTACAO);
});

test('lerContatos: id repetido fica só o primeiro; tudo inválido volta aos exemplos; vazio de propósito fica vazio', () => {
  const guardado: Record<string, string> = {};
  (globalThis as { sessionStorage?: unknown }).sessionStorage = { getItem: (k: string) => guardado[k] ?? null, setItem: (k: string, v: string) => { guardado[k] = v; } };
  try {
    const exemplos = contatosExemplo(orgaos);
    const ok = (c: unknown, outros: Contato[]): boolean => validarContato(c, orgaos, ids, outros).length === 0;
    const a = contato({}, { id: 'a', telefone: '+5562991111111' });
    const a2 = contato({}, { id: 'a', telefone: '+5562992222222', rotulo: 'Outro' });
    guardarContatos([a, a2]);
    assert.deepEqual(lerContatos(exemplos, ok).map((c) => c.rotulo), ['Equipe de teste']);
    guardado[CHAVE_WHATSAPP_SIMULACAO] = JSON.stringify([{ id: 'x' }, 'lixo']);
    assert.equal(lerContatos(exemplos, ok), exemplos);
    guardarContatos([]);
    assert.deepEqual(lerContatos(exemplos, ok), []);
    guardado[CHAVE_WHATSAPP_SIMULACAO] = '{quebrado';
    assert.equal(lerContatos(exemplos, ok), exemplos);
  } finally {
    delete (globalThis as { sessionStorage?: unknown }).sessionStorage;
  }
});

test('rótulo com espaço nas pontas não é aceito (a tela grava aparado)', () => {
  assert.match(validarContato(contato({}, { rotulo: '  Gabinete  ' }), orgaos, ids).join(' '), /2 a 60/);
});

test('descrições em português e permissões sugeridas por perfil', () => {
  assert.equal(descreverPermissao(permissaoDoPerfil('prefeito', orgaos)), 'Todos os órgãos · todas as prioridades · com valores · com captação');
  assert.equal(descreverPermissao(permissaoDoPerfil('equipe', ['SME'])), 'Órgãos: SME · só prioridade Muito Alta e Alta · sem valores · sem captação');
  assert.equal(descreverRelatorio({ frequencia: 'semanal', diaSemana: 1, hora: '08:00', modelo: 'prioritarios' }), 'Toda segunda às 08:00 · Projetos prioritários');
  assert.equal(descreverRelatorio({ frequencia: 'semanal', diaSemana: 6, hora: '09:00', modelo: 'resumo' }), 'Todo sábado às 09:00 · Resumo curto');
  assert.equal(descreverRelatorio({ frequencia: 'nenhum', diaSemana: 1, hora: '08:00', modelo: 'resumo' }), 'Sem relatório automático');
});
