// Coletor Fase 1: Portal da Transparência (CGU) — convênios do município, para conciliar com o Transferegov.
// Uso (só no GitHub Actions, onde existe o segredo): PORTAL_TRANSPARENCIA_CHAVE=... node coletores/portal-transparencia.ts
// Fonte: docs/fontes/portal-transparencia.md. Saída: data/core/portal-transparencia-convenios-<ibge>.json
// A chave vem SOMENTE da variável de ambiente e nunca é impressa nem gravada.
// LGPD: CPF não é gravado; só CNPJ de pessoa jurídica.
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const CHAVE = process.env.PORTAL_TRANSPARENCIA_CHAVE;
if (!CHAVE) throw new Error('Variável PORTAL_TRANSPARENCIA_CHAVE ausente');
const BASE = 'https://api.portaldatransparencia.gov.br/api-de-dados';
const config = JSON.parse(await readFile('data/config/municipio.json', 'utf8')).municipios[0];
const IBGE: number = config.codigo_ibge;
const INTERVALO_MS = 1100; // ~55 requisições/min, bem abaixo do limite diário informado (400/min; não verificado oficialmente)
const MAX_PAGINAS = 400; // trava de segurança

async function pagina(n: number): Promise<any[]> {
  for (let tentativa = 1; tentativa <= 5; tentativa++) {
    try {
      const r = await fetch(`${BASE}/convenios?codigoIBGE=${IBGE}&pagina=${n}`, { headers: { 'chave-api-dados': CHAVE!, accept: 'application/json' } });
      if (r.status === 429) throw new Error('HTTP 429 (limite de requisições)');
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return (await r.json()) as any[];
    } catch (e) {
      if (tentativa === 5) throw new Error(`convenios pagina ${n}: ${(e as Error).message}`);
      await new Promise((ok) => setTimeout(ok, 15000 * tentativa)); // espera progressiva
    }
  }
  return [];
}

const bruto: any[] = [];
for (let n = 1; n <= MAX_PAGINAS; n++) {
  const itens = await pagina(n);
  if (itens.length === 0) break;
  bruto.push(...itens);
  if (n % 20 === 0) console.log(`página ${n}: ${bruto.length} convênios até agora`);
  await new Promise((ok) => setTimeout(ok, INTERVALO_MS));
}

const cnpjDe = (c: any): string | null => {
  const f: string = c?.cnpjFormatado ?? '';
  return /\d/.test(f) && !/\*/.test(f) ? f.replace(/\D/g, '') : null; // pessoa física vem mascarada/em branco no CNPJ
};
const convenios = bruto.map((c) => ({
  id: c.id,
  numero: c.dimConvenio?.numero ?? null,
  numero_processo: c.numeroProcesso ?? null,
  situacao: c.situacao ?? null,
  objeto: c.dimConvenio?.objeto ?? null,
  data_publicacao: c.dataPublicacao ?? null,
  vigencia_inicio: c.dataInicioVigencia ?? null,
  vigencia_fim: c.dataFinalVigencia ?? null,
  data_ultima_liberacao: c.dataUltimaLiberacao ?? null,
  convenente_cnpj: cnpjDe(c.convenente),
  convenente_nome: c.convenente?.nome ?? null,
  convenente_tipo: c.convenente?.tipo ?? null,
  orgao: c.orgao?.nome ?? null,
  orgao_maximo: c.orgao?.orgaoMaximo?.nome ?? null,
  funcao: c.subfuncao?.funcao?.descricaoFuncao ?? null,
  subfuncao: c.subfuncao?.descricaoSubfuncap ?? null,
  tipo_instrumento: c.tipoInstrumento?.descricao ?? null,
  valor: c.valor ?? null,
  valor_liberado: c.valorLiberado ?? null,
  valor_contrapartida: c.valorContrapartida ?? null,
  valor_ultima_liberacao: c.valorDaUltimaLiberacao ?? null,
}));

const r2 = (n: number) => Math.round(n * 100) / 100;
const coleta = new Date().toISOString();
await mkdir('data/core', { recursive: true });
await writeFile(
  `data/core/portal-transparencia-convenios-${IBGE}.json`,
  JSON.stringify(
    {
      proveniencia: {
        fonte: 'CGU — Portal da Transparência, API de dados (convênios)',
        url_origem: `${BASE}/convenios?codigoIBGE=${IBGE}`,
        data_referencia: 'situação na data da coleta',
        data_coleta: coleta,
        id_carga: `portal-transparencia-${coleta.slice(0, 10)}`,
      },
      municipio: { codigo_ibge: IBGE },
      resumo: {
        convenios: convenios.length,
        valor_total: r2(convenios.reduce((s, c) => s + (c.valor ?? 0), 0)),
        valor_liberado: r2(convenios.reduce((s, c) => s + (c.valor_liberado ?? 0), 0)),
      },
      convenios,
    },
    null,
    1,
  ) + '\n',
);
console.log(`Concluído: ${convenios.length} convênios; total liberado R$ ${r2(convenios.reduce((s, c) => s + (c.valor_liberado ?? 0), 0))}`);
