// Guia "Projetos" (MVP sem IA e sem gravar nada): mostra, sobre 2 projetos de EXEMPLO FICTÍCIO, como o parecer automático
// funciona (21 regras determinísticas). Decisão do dono (2026-11-10): nenhum projeto real é gravado até novo direcionamento.
import type { Detalhe, Secao } from '../dados/detalhes.ts';
import type { Modulo } from '../dados/tipos.ts';
import { HOJE_EXEMPLO, contextoExemploComFalhas, contextoExemploRegular, projetoExemploComFalhas, projetoExemploCompleto } from './exemplo.ts';
import { gerarParecer } from './parecer.ts';
import type { ResultadoRegra } from './tipos.ts';

const lista = (rs: ResultadoRegra[]) => rs.map((r) => `${r.id} — ${r.titulo}: ${r.mensagem}${r.comoCorrigir ? ` Como corrigir: ${r.comoCorrigir}` : ''}`);

export function montarProjetos(): Modulo {
  const casos = [
    { p: projetoExemploCompleto(), c: contextoExemploRegular },
    { p: projetoExemploComFalhas(), c: contextoExemploComFalhas },
  ];
  const linhas: (string | number)[][] = [];
  const detalhes: Detalhe[] = [];
  for (const { p, c } of casos) {
    const par = gerarParecer(p, c, HOJE_EXEMPLO);
    const falhas = par.resultados.filter((r) => r.resultado !== 'ok');
    const bloqueantes = falhas.filter((r) => r.gravidade === 'bloqueante');
    const alertas = falhas.filter((r) => r.gravidade === 'alerta');
    const info = falhas.filter((r) => r.gravidade === 'informativo');
    linhas.push([
      p.id, p.titulo, p.programaCodigo, p.secretaria ?? '—', `${par.percentual}% (${par.totalOk} de ${par.totalRegras} regras)`,
      par.prontoParaEnvio ? 'Pronto para envio' : `Atenção: ${par.bloqueantesPendentes.length} bloqueante(s) pendente(s)`,
    ]);
    const secoes: Secao[] = [
      { titulo: 'Aviso', texto: 'EXEMPLO FICTÍCIO para demonstrar o parecer automático. Nenhum projeto real é gravado e não há IA nesta etapa: o parecer é calculado por 21 regras determinísticas.' },
      {
        titulo: 'Resultado do parecer',
        itens: [`${par.percentual}% das regras atendidas (${par.totalOk} de ${par.totalRegras})`, `Parecer completo: ${par.completo ? 'sim' : 'não'}`, `Pronto para envio: ${par.prontoParaEnvio ? 'sim' : 'não'}`, ...par.faltaParaEnvio.map((f) => `Falta: ${f}`)],
      },
      ...(bloqueantes.length ? [{ titulo: `Bloqueantes (${bloqueantes.length}): impedem o envio`, itens: lista(bloqueantes) }] : []),
      ...(alertas.length ? [{ titulo: `Alertas (${alertas.length}): precisam de correção ou de justificativa`, itens: lista(alertas) }] : []),
      ...(info.length ? [{ titulo: `Informativos (${info.length})`, itens: lista(info) }] : []),
      { titulo: `Regras atendidas (${par.totalOk})`, itens: par.resultados.filter((r) => r.resultado === 'ok').map((r) => `${r.id} — ${r.titulo}`) },
      { titulo: 'Como o parecer funciona', texto: 'Compara o projeto com os requisitos do programa (confirmados pela equipe da prefeitura), a regularidade do município no CAUC, a capacidade fiscal (SICONFI) e a atualidade das fontes. Dado ausente nunca conta como atendido. O botão de envio só libera com parecer completo e aprovação registrada.' },
    ];
    detalhes.push({ titulo: p.titulo, secoes });
  }
  return {
    slug: 'captacao-projetos', title: 'Projetos', group: 'Captação',
    columns: ['Código', 'Projeto (exemplo fictício)', 'Programa', 'Secretaria', 'Parecer', 'Situação'],
    rows: linhas, detalhes, fields: [], source: 'captacao-projetos',
    fonte: 'EXEMPLOS FICTÍCIOS: demonstram o parecer automático (21 regras, sem IA). Nenhum projeto real é gravado até novo direcionamento do dono. Clique em "Ver detalhes" para ver cada regra.',
  };
}
