// Baixa os dados reais da carteira (repositório privado) no build. Sem variáveis, usa os dados de exemplo.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const token = process.env.GOVNEXA_DADOS_TOKEN;
const repo = process.env.GOVNEXA_DADOS_REPO;
const ref = process.env.GOVNEXA_DADOS_REF || 'main';

if (!repo || !token) {
  console.log('GovNexa: usando dados de exemplo (GOVNEXA_DADOS_REPO/TOKEN não definidos).');
  process.exit(0);
}
if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) {
  console.error('GovNexa: GOVNEXA_DADOS_REPO inválido (use dono/repo).');
  process.exit(1);
}

const resposta = await fetch('https://api.github.com/repos/' + repo + '/tarball/' + encodeURIComponent(ref), {
  headers: {
    Authorization: 'Bearer ' + token,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'govnexa-build',
  },
  redirect: 'follow',
});
if (resposta.status !== 200) {
  console.error(`GovNexa: falha ao baixar dados (HTTP ${resposta.status}).`);
  process.exit(1);
}

const arquivo = join(tmpdir(), `govnexa-dados-${process.pid}.tar.gz`);
writeFileSync(arquivo, Buffer.from(await resposta.arrayBuffer()));
const destino = '.govnexa-dados';
rmSync(destino, { recursive: true, force: true });
mkdirSync(destino, { recursive: true });
const tarBin = process.platform === 'win32' ? 'C:/Windows/System32/tar.exe' : 'tar';
try {
  execFileSync(tarBin, ['-xzf', arquivo, '-C', destino, '--strip-components=1'], { stdio: 'ignore' });
} catch {
  console.error('GovNexa: falha ao extrair os dados baixados.');
  process.exit(1);
} finally {
  rmSync(arquivo, { force: true });
}

let n = null;
for (const d of readdirSync(destino, { withFileTypes: true })) {
  const f = join(destino, d.name, 'carteira.json');
  if (d.isDirectory() && existsSync(f)) {
    n = JSON.parse(readFileSync(f, 'utf8')).projetos.length;
    break;
  }
}
if (n === null) {
  console.error('GovNexa: carteira.json não encontrado nos dados baixados.');
  process.exit(1);
}
console.log(`GovNexa: dados reais carregados (${n} projetos).`);
