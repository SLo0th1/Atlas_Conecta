// Deriva do arquivo completo do Transferegov um resumo ENXUTO para as telas e o build (só a esfera municipal).
// Uso: node coletores/derivar-acompanhamento.ts   (rode depois de coletores/transferegov-convenios.ts)
// Saída: data/core/acompanhamento-<ibge>.json (pequeno, seguro para versionar: dados públicos, sem dados bancários).
import { readFile, writeFile } from 'node:fs/promises';

const config = JSON.parse(await readFile('data/config/municipio.json', 'utf8')).municipios[0];
const IBGE: number = config.codigo_ibge;
const t = JSON.parse(await readFile(`data/core/transferegov-${IBGE}.json`, 'utf8'));
const propostas = new Map<string, any>(t.propostas.map((p: any) => [p.id_proposta, p]));
const convenios = t.convenios
  .filter((c: any) => c.esfera === 'municipal')
  .map((c: any) => {
    const p = propostas.get(c.id_proposta) ?? {};
    return {
      nr_convenio: c.nr_convenio,
      objeto: (p.objeto ?? '').slice(0, 300),
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
    };
  });
await writeFile(
  `data/core/acompanhamento-${IBGE}.json`,
  JSON.stringify({ proveniencia: t.proveniencia, municipio: t.municipio, resumo: t.resumo.por_esfera.municipal, nota: t.resumo.nota, convenios }, null, 1) + '\n',
);
console.log(`acompanhamento: ${convenios.length} convênios municipais`);
