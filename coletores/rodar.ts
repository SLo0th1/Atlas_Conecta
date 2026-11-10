// Executa um coletor com tentativas repetidas e REGISTRA o resultado (inclusive o motivo da falha) em data/core/status-coletas.json.
// Uso: node coletores/rodar.ts <nome> <script.ts> [argumentos do script...]
// Sempre termina com código 0 (a rotina diária continua); o painel "Qualidade dos dados" e os alertas mostram falhas e o motivo.
import { spawnSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const [nome, script, ...args] = process.argv.slice(2);
if (!nome || !script) {
  console.error('Uso: node coletores/rodar.ts <nome> <script.ts> [argumentos...]');
  process.exit(2);
}
const TENTATIVAS = Number(process.env.RODAR_TENTATIVAS ?? 3);
const ESPERA_S = Number(process.env.RODAR_ESPERA_S ?? 30);
const caminho = 'data/core/status-coletas.json';

let erro: string | null = null;
let tentativas = 0;
let ok = false;
for (let i = 1; i <= TENTATIVAS && !ok; i++) {
  tentativas = i;
  const r = spawnSync(process.execPath, [script, ...args], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  process.stdout.write(r.stdout ?? '');
  if (r.status === 0) ok = true;
  else {
    const saida = `${r.stderr ?? ''}${r.error ? String(r.error) : ''}`.trim();
    // Guarda só o essencial do erro: a linha "Error: ..." (ou as últimas linhas), sem caminhos longos nem segredos
    const linhas = saida.split('\n').map((l) => l.trim()).filter(Boolean);
    const bruta = linhas.find((l) => /error|erro|timeout|HTTP \d{3}/i.test(l)) ?? linhas.slice(-1)[0] ?? `saiu com código ${r.status}`;
    // Não grava caminhos de disco (nem do computador, nem do servidor): só o motivo
    erro = bruta
      .replace(/[A-Za-z]:\\[^'"\s]*/g, '<caminho>')
      .replace(/\/(home|Users|tmp|opt)\/[^'"\s]*/g, '<caminho>')
      .slice(0, 400);
    console.error(`[${nome}] tentativa ${i}/${TENTATIVAS} falhou: ${erro}`);
    if (i < TENTATIVAS) await new Promise((fim) => setTimeout(fim, ESPERA_S * 1000));
  }
}

type Entrada = { script: string; ultima_tentativa: string; resultado: 'ok' | 'falha'; tentativas: number; erro: string | null; ultimo_sucesso: string | null };
const status: { atualizado_em: string; coletores: Record<string, Entrada> } = existsSync(caminho)
  ? JSON.parse(await readFile(caminho, 'utf8'))
  : { atualizado_em: '', coletores: {} };
const agora = new Date().toISOString();
status.coletores[nome] = {
  script, ultima_tentativa: agora, resultado: ok ? 'ok' : 'falha', tentativas, erro: ok ? null : erro,
  ultimo_sucesso: ok ? agora : (status.coletores[nome]?.ultimo_sucesso ?? null),
};
status.atualizado_em = agora;
await mkdir('data/core', { recursive: true });
await writeFile(caminho, JSON.stringify(status, null, 1) + '\n');
if (!ok) console.error(`::warning::Coletor ${nome} falhou após ${tentativas} tentativas: ${erro}`);
