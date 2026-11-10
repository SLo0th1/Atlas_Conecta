// Coletor Fase 1: Fundo Nacional de Saúde (FNS) — repasses fundo a fundo por bloco/grupo e comparativo com as capitais.
// Uso: node coletores/fns.ts [anos=3]
// Fonte: docs/fontes/fns.md (API aberta, sem documentação oficial; tratada como contrato a testar a cada carga).
// Saída: data/core/fns-<ibge>.json (município piloto) e data/core/fns-capitais-<ano>.json (todas as capitais).
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const BASE = 'https://consultafns.saude.gov.br/recursos/consulta-consolidada';
const config = JSON.parse(await readFile('data/config/municipio.json', 'utf8')).municipios[0];
const IBGE: number = config.codigo_ibge;
const ibge = JSON.parse(await readFile('data/core/ibge-municipios.json', 'utf8'));
const municipios: any[] = ibge.municipios;
const anosSolicitados = Number(process.argv.find((a) => /^\d+$/.test(a)) ?? 3);
const pausa = () => new Promise((ok) => setTimeout(ok, 400)); // educado com a API

async function api(caminho: string): Promise<any> {
  for (let tentativa = 1; tentativa <= 4; tentativa++) {
    try {
      const r = await fetch(`${BASE}/${caminho}`, { headers: { accept: 'application/json' } });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return await r.json();
    } catch (e) {
      if (tentativa === 4) throw new Error(`FNS ${caminho.split('?')[0]}: ${(e as Error).message}`);
      await new Promise((ok) => setTimeout(ok, 5000 * tentativa)); // espera progressiva
    }
  }
}

const seis = (codigo: number) => String(codigo).slice(0, 6); // o FNS usa o código IBGE de 6 dígitos
const consulta = (ano: number, m: any) => `ano=${ano}&coMunicipioIbge=${seis(m.codigo_ibge)}&count=100&page=1&sgUf=${m.uf}`;
const r2 = (n: number) => Math.round(n * 100) / 100;

/** Dados de um município/ano: blocos com grupos e entidades recebedoras. */
async function municipioAno(ano: number, m: any) {
  const blocos = (await api(`repasse-bloco?${consulta(ano, m)}&coTipoRepasse=M`)).resultado ?? []; // M = repasses ao Fundo MUNICIPAL (exclui o Fundo Estadual que atua no território)
  await pausa();
  const ent = (await api(`entidades?${consulta(ano, m)}`)).resultado?.dados ?? [];
  await pausa();
  return {
    ano,
    blocos: blocos.map((b: any) => ({
      codigo: b.codigo, nome: b.nome, valor_bruto: b.vlTotal, desconto: b.vlDesconto, valor_liquido: b.vlLiquido,
      grupos: (b.repasses ?? []).map((g: any) => ({ codigo: g.codigo, nome: g.nome, valor_bruto: g.vlTotal, desconto: g.vlDesconto, valor_liquido: g.vlLiquido })),
    })),
    total_bruto: r2(blocos.reduce((s: number, b: any) => s + (b.vlTotal ?? 0), 0)),
    total_liquido: r2(blocos.reduce((s: number, b: any) => s + (b.vlLiquido ?? 0), 0)),
    entidades: ent.map((e: any) => ({
      cnpj: e.cpfCnpj, razao_social: e.razaoSocial, esfera: e.esferaAdministrativa, valor_total: e.valorTotalNumerico ?? Number(e.valorTotal ?? 0),
    })),
  };
}

const alvo = municipios.find((m) => m.codigo_ibge === IBGE);
if (!alvo) throw new Error('Município piloto não encontrado na tabela do IBGE (rode coletores/ibge-municipios.ts)');
const anoAtual = new Date().getFullYear();
const anos = Array.from({ length: anosSolicitados }, (_, i) => anoAtual - i);
const coleta = new Date().toISOString();
const prov = (extra: object = {}) => ({
  fonte: 'Ministério da Saúde — Fundo Nacional de Saúde, Consulta Consolidada Fundo a Fundo',
  url_origem: BASE,
  data_referencia: `exercícios ${anos.join(', ')} (valores até a data da coleta)`,
  data_coleta: coleta,
  id_carga: `fns-${coleta.slice(0, 10)}`,
  ...extra,
});

await mkdir('data/core', { recursive: true });

// 1) município piloto
const serie = [];
for (const ano of anos) serie.push(await municipioAno(ano, alvo));
await writeFile(
  `data/core/fns-${IBGE}.json`,
  JSON.stringify({ proveniencia: prov(), municipio: { codigo_ibge: IBGE, nome: alvo.nome, uf: alvo.uf }, anos: serie }, null, 1) + '\n',
);
console.log(`${alvo.nome}: ` + serie.map((s) => `${s.ano}=R$ ${(s.total_bruto / 1e6).toFixed(1)} mi (${s.entidades.length} entidades)`).join(' · '));

// 2) comparativo com as 27 capitais (valor total e per capita)
const capitais = municipios.filter((m) => m.capital);
for (const ano of anos) {
  const linhas = [];
  for (const cap of capitais) {
    const d = await municipioAno(ano, cap);
    linhas.push({
      codigo_ibge: cap.codigo_ibge, nome: cap.nome, uf: cap.uf, populacao: cap.populacao,
      total_bruto: d.total_bruto,
      per_capita: cap.populacao ? r2(d.total_bruto / cap.populacao) : null,
      grupos: d.blocos.flatMap((b: any) => b.grupos.map((g: any) => ({ bloco: b.nome, grupo: g.nome, valor_bruto: g.valor_bruto }))),
    });
  }
  const ordenadas = [...linhas].sort((a, b) => (b.per_capita ?? 0) - (a.per_capita ?? 0));
  const posicao = ordenadas.findIndex((l) => l.codigo_ibge === IBGE) + 1;
  await writeFile(`data/core/fns-capitais-${ano}.json`, JSON.stringify({ proveniencia: prov({ data_referencia: `exercício ${ano}` }), capitais: ordenadas }, null, 1) + '\n');
  console.log(`Capitais ${ano}: ${alvo.nome} em ${posicao}º lugar de ${linhas.length} em valor per capita`);
}
