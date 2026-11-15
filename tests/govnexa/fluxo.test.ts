// Testes do mapa do Fluxo, dos fluxos detalhados e do mapa de impacto (a proteção: tela nova sem lugar no mapa falha aqui).
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import modules from '../../src/data/modules.json' with { type: 'json' };
import { catalogoCompleto } from '../../src/lib/govnexa/catalogo.ts';
import { LIGACOES, NOS } from '../../src/lib/govnexa/fluxo.ts';
import { ARQUIVOS_DO_FLUXO, COMPONENTES, TRANSVERSAL, casa, etapasAfetadas } from '../../src/lib/govnexa/impacto.ts';
import { SUBFLUXOS } from '../../src/lib/govnexa/subfluxos.ts';

// Arquivos do repositório (versionados e não ignorados), em caminhos com "/".
function arquivosDoRepositorio(): string[] {
  try {
    const saida = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    const lista = saida.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lista.length > 0) return lista;
  } catch {
    /* sem git: percorre as pastas */
  }
  const out: string[] = [];
  const ignorar = new Set(['node_modules', '.git', 'dist', '.astro', 'test-results']);
  const andar = (dir: string, rel: string) => {
    for (const nome of readdirSync(dir)) {
      if (ignorar.has(nome)) continue;
      const abs = join(dir, nome);
      const r = rel ? `${rel}/${nome}` : nome;
      if (statSync(abs).isDirectory()) andar(abs, r);
      else out.push(r);
    }
  };
  andar(process.cwd(), '');
  return out;
}
const ARQUIVOS = arquivosDoRepositorio();

test('(a) toda etapa do mapa geral tem entrada em COMPONENTES e vice-versa', () => {
  const ids = NOS.map((n) => n.id).sort();
  assert.deepEqual(Object.keys(COMPONENTES).sort(), ids);
});

test('(b) todo padrão de COMPONENTES e TRANSVERSAL casa com ao menos um arquivo existente', () => {
  const padroes: [string, string][] = [
    ...Object.entries(COMPONENTES).flatMap(([etapa, ps]) => ps.map((p): [string, string] => [`COMPONENTES.${etapa}`, p])),
    ...TRANSVERSAL.map((p): [string, string] => ['TRANSVERSAL', p]),
    ...ARQUIVOS_DO_FLUXO.map((p): [string, string] => ['ARQUIVOS_DO_FLUXO', p]),
  ];
  const semArquivo = padroes.filter(([, p]) => !ARQUIVOS.some((a) => casa(a, p)));
  assert.deepEqual(semArquivo, [], `padrões sem nenhum arquivo: ${JSON.stringify(semArquivo)}`);
});

test('(c) toda tela dos módulos Projetos e Captação aparece em alguma etapa do Fluxo (geral ou detalhado)', () => {
  // O próprio mapa do Fluxo é a tela que mostra as etapas; as demais precisam ter um lugar nele.
  const ISENTAS = new Set(['projetos-fluxo']);
  const urls = new Set<string>();
  for (const n of NOS) for (const t of n.telas) urls.add(t.url.split('?')[0]);
  for (const s of SUBFLUXOS) for (const n of s.nos) for (const t of n.telas) urls.add(t.url.split('?')[0]);
  const faltando = catalogoCompleto(modules as { slug: string; group: string }[])
    .filter((m) => (m.group === 'Projetos' || m.group === 'Captação') && !ISENTAS.has(m.slug))
    .filter((m) => !urls.has(`/plataforma/${m.slug}/`))
    .map((m) => m.slug);
  assert.deepEqual(faltando, [], `telas sem lugar no Fluxo (acrescente em fluxo.ts ou subfluxos.ts): ${faltando.join(', ')}`);
});

test('(d) ligações dos fluxos detalhados apontam para nós existentes, sem nós sobrepostos e exceções com registro', () => {
  assert.ok(SUBFLUXOS.length >= 6);
  assert.equal(new Set(SUBFLUXOS.map((s) => s.id)).size, SUBFLUXOS.length);
  for (const s of SUBFLUXOS) {
    const ids = s.nos.map((n) => n.id);
    assert.equal(new Set(ids).size, ids.length, `${s.id}: id de nó repetido`);
    const raias = new Set(s.raias.map((r) => r.id));
    const posicoes = new Set<string>();
    for (const n of s.nos) {
      assert.ok(raias.has(n.raia), `${s.id}/${n.id}: raia inexistente (${n.raia})`);
      const pos = `${n.raia}@${n.linha}`;
      assert.ok(!posicoes.has(pos), `${s.id}: nós sobrepostos em ${pos}`);
      posicoes.add(pos);
      if (n.tipo === 'excecao') {
        assert.ok(n.excecao && n.excecao.aceitaQuando.trim() && n.excecao.registro.trim(), `${s.id}/${n.id}: exceção sem "aceita quando" e "registro"`);
      }
    }
    for (const l of s.ligacoes) {
      assert.ok(ids.includes(l.de), `${s.id}: ligação de nó inexistente ${l.de}`);
      assert.ok(ids.includes(l.para), `${s.id}: ligação para nó inexistente ${l.para}`);
    }
    assert.ok(s.nos.some((n) => n.tipo === 'inicio') && s.nos.some((n) => n.tipo === 'fim'), `${s.id}: precisa de início e fim`);
  }
  // mesma verificação no mapa geral
  const idsGeral = NOS.map((n) => n.id);
  for (const l of LIGACOES) {
    assert.ok(idsGeral.includes(l.de) && idsGeral.includes(l.para), `mapa geral: ligação inválida ${l.de} → ${l.para}`);
  }
  const posGeral = NOS.map((n) => `${n.raia}@${n.linha}`);
  assert.equal(new Set(posGeral).size, posGeral.length, 'mapa geral: nós sobrepostos');
});

test('(e) todo fluxo detalhado detalha um nó que existe no mapa geral', () => {
  for (const s of SUBFLUXOS) assert.ok(NOS.some((n) => n.id === s.no), `${s.id}: nó ${s.no} não existe em fluxo.ts`);
});

test('(f) etapasAfetadas: etapas, transversal, Fluxo atualizado e arquivos sem mapa', () => {
  const r = etapasAfetadas(['src/components/carteira/NovoProjeto.astro', 'src/lib/log/visoes.ts', 'src/layouts/Platform.astro', 'src/lib/arquivo-novo-sem-mapa.ts']);
  assert.ok(r.etapas.includes('cadastro'));
  assert.ok(r.etapas.includes('log'));
  assert.deepEqual(r.transversal, ['src/layouts/Platform.astro']);
  assert.deepEqual(r.semMapa, ['src/lib/arquivo-novo-sem-mapa.ts']);
  assert.equal(r.fluxoAtualizado, false);
  const r2 = etapasAfetadas(['src/lib/sala/simulacao.ts', 'src/lib/govnexa/subfluxos.ts']);
  assert.deepEqual(r2.etapas, ['sala']);
  assert.equal(r2.fluxoAtualizado, true);
  assert.deepEqual(etapasAfetadas(['README.md']), { etapas: [], transversal: [], fluxoAtualizado: false, semMapa: [] });
});
