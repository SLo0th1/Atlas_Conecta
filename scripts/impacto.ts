// Mapa de impacto: dado o que mudou (em relação à main), diz quais etapas do Fluxo foram afetadas,
// quais fluxos detalhados as contêm, se a mudança é transversal e se o Fluxo foi atualizado junto.
// Uso: npm run impacto            (arquivos alterados em relação à main + working tree)
//      npm run impacto -- a.ts b.ts   (lista dada por argumentos)
// É um lembrete: o código de saída é sempre 0.
import { execFileSync } from 'node:child_process';
import { NOS } from '../src/lib/govnexa/fluxo.ts';
import { etapasAfetadas } from '../src/lib/govnexa/impacto.ts';
import { SUBFLUXOS } from '../src/lib/govnexa/subfluxos.ts';

function git(args: string[]): string {
  try {
    return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    return '';
  }
}

function arquivosAlterados(): string[] {
  const conjunto = new Set<string>();
  let base = git(['diff', '--name-only', 'origin/main...HEAD']);
  if (!base.trim()) base = git(['diff', '--name-only', 'main...HEAD']);
  for (const l of base.split('\n')) if (l.trim()) conjunto.add(l.trim());
  for (const l of git(['status', '--porcelain']).split('\n')) {
    if (l.length < 4) continue;
    const caminho = l.slice(3).trim();
    const destino = caminho.includes(' -> ') ? caminho.split(' -> ')[1] : caminho;
    conjunto.add(destino.replace(/^"|"$/g, ''));
  }
  return [...conjunto].sort();
}

const args = process.argv.slice(2).filter((a) => !a.startsWith('-'));
const arquivos = args.length > 0 ? args : arquivosAlterados();
const r = etapasAfetadas(arquivos);
const titulo = (id: string) => NOS.find((n) => n.id === id)?.titulo ?? '(etapa desconhecida)';
const subs = SUBFLUXOS.filter((s) => r.etapas.includes(s.no));
const lista = (itens: string[]) => (itens.length ? itens.map((x) => `  - ${x}`).join('\n') : '  (nenhum)');

console.log(`Arquivos alterados: ${arquivos.length}`);
console.log(`Etapas do mapa geral afetadas (${r.etapas.length}):\n${lista(r.etapas.map((id) => `${id} — ${titulo(id)}`))}`);
console.log(`Fluxos detalhados que contêm essas etapas (${subs.length}):\n${lista(subs.map((s) => `${s.id} — ${s.titulo} (detalha ${s.no})`))}`);
console.log(`Mudança transversal (afeta o sistema inteiro) (${r.transversal.length}):\n${lista(r.transversal)}`);
console.log(`Fluxo atualizado junto: ${r.fluxoAtualizado ? 'sim' : 'não'}`);
console.log(`Arquivos sem mapa (${r.semMapa.length}):\n${lista(r.semMapa)}`);
if (r.etapas.length > 0 && !r.fluxoAtualizado) {
  console.log(`\nRevise o Fluxo: estas etapas foram afetadas: ${r.etapas.join(', ')}.`);
}
