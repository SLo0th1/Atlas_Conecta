// Monta o site com os dados FICTÍCIOS de data/exemplo (usado pelos testes de interface), mesmo havendo carga real no repositório.
import { spawnSync } from 'node:child_process';
const r = spawnSync('npx', ['astro', 'build'], { stdio: 'inherit', shell: true, env: { ...process.env, GOVNEXA_EXEMPLO: '1' } });
process.exit(r.status ?? 1);
