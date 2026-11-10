// Deriva do arquivo completo do Transferegov um resumo ENXUTO para as telas e o build (só a esfera municipal).
// Uso: node coletores/derivar-acompanhamento.ts   (rode depois de coletores/transferegov-convenios.ts)
// Saída: data/core/acompanhamento-<ibge>.json (pequeno, seguro para versionar: dados públicos, sem dados bancários).
import { readFile, writeFile } from 'node:fs/promises';

const config = JSON.parse(await readFile('data/config/municipio.json', 'utf8')).municipios[0];
const IBGE: number = config.codigo_ibge;
const t = JSON.parse(await readFile(`data/core/transferegov-${IBGE}.json`, 'utf8'));
const propostas = new Map<string, any>(t.propostas.map((p: any) => [p.id_proposta, p]));
const porConvenio = <T extends { nr_convenio: string }>(l: T[]) => { const m = new Map<string, T[]>(); for (const x of l) (m.get(x.nr_convenio) ?? m.set(x.nr_convenio, []).get(x.nr_convenio)!).push(x); return m; };
const desembolsos = porConvenio<any>(t.desembolsos);
const empenhos = porConvenio<any>(t.empenhos);
const aditivos = porConvenio<any>(t.aditivos);
const emendasPorProposta = new Map<string, any[]>();
for (const e of t.emendas) (emendasPorProposta.get(e.id_proposta) ?? emendasPorProposta.set(e.id_proposta, []).get(e.id_proposta)!).push(e);
const convenios = t.convenios
  .filter((c: any) => c.esfera === 'municipal')
  .map((c: any) => {
    const p = propostas.get(c.id_proposta) ?? {};
    return {
      nr_convenio: c.nr_convenio,
      objeto: (p.objeto ?? '').slice(0, 900),
      proponente: p.proponente_nome ?? null,
      orgao_superior: p.orgao_superior ?? null,
      orgao: p.orgao ?? null,
      modalidade: p.modalidade ?? null,
      situacao: c.situacao,
      assinatura: c.assinatura,
      vigencia_fim: c.vigencia_fim,
      limite_prestacao_contas: c.limite_prestacao_contas,
      valor_global: c.valor_global,
      valor_repasse: c.valor_repasse,
      valor_contrapartida: c.valor_contrapartida,
      valor_desembolsado: c.valor_desembolsado ?? c.desembolsado_conferido ?? 0,
      saldo_a_liberar: c.saldo_a_liberar,
      qtd_aditivos: c.qtd_aditivos,
      // Detalhe financeiro e de execução (somente convênios em execução, para manter o arquivo enxuto)
      ...(/^Em execu/i.test(c.situacao ?? '')
        ? {
            desembolsos: (desembolsos.get(c.nr_convenio) ?? []).map((d: any) => ({ data: d.data, valor: d.valor })),
            empenhos: (empenhos.get(c.nr_convenio) ?? []).map((e: any) => ({ numero: e.numero, data: e.data, situacao: e.situacao, valor: e.valor })),
            aditivos: (aditivos.get(c.nr_convenio) ?? []).map((a: any) => ({ numero: a.numero, tipo: a.tipo, assinatura: a.assinatura, inicio: a.inicio, fim: a.fim, valor_global: a.valor_global, valor_repasse: a.valor_repasse })),
            emendas: (emendasPorProposta.get(c.id_proposta) ?? []).map((e: any) => ({ numero: e.numero, parlamentar: e.parlamentar, tipo_parlamentar: e.tipo_parlamentar, impositivo: e.impositivo, valor_repasse: e.valor_repasse })),
          }
        : {}),
    };
  });
await writeFile(
  `data/core/acompanhamento-${IBGE}.json`,
  JSON.stringify({ proveniencia: t.proveniencia, municipio: t.municipio, resumo: t.resumo.por_esfera.municipal, nota: t.resumo.nota, convenios }, null, 1) + '\n',
);
console.log(`acompanhamento: ${convenios.length} convênios municipais`);
