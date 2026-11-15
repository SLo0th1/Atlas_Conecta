// Ponto único de acesso aos dados. Por enquanto sempre o JSON (somente leitura).
// Quando houver DATABASE_URL e um driver PostgreSQL instalado, aqui entra:
//   if (process.env.DATABASE_URL) return criarRepositorioPostgres(clienteDoDriver, municipioAtivo().codigo_ibge);
// (o cliente do driver só precisa ter query(sql, params) -> { rows }; ver postgres.ts).
import { criarRepositorioJson } from './json.ts';
import type { RepositorioProjetos } from './tipos.ts';

export function repositorio(): RepositorioProjetos {
  return criarRepositorioJson();
}
