// Base de projetos do WhatsApp: só os campos que podem sair por mensagem. Roda no build; o farol é recalculado
// no navegador com a data de HOJE em Brasília (farolWhats), para a página publicada não ficar com a data do deploy.
import { MACROETAPAS } from '../carteira/macroetapas.ts';
import type { Carteira } from '../carteira/tipos.ts';
import { fimDaMacroetapaAtual, valorProjeto } from '../carteira/visoes.ts';
import { farolWhats } from './farol.ts';
import type { ProjetoWhats } from './tipos.ts';

export function montarBase(carteira: Carteira, hoje: string): ProjetoWhats[] {
  const rotulo = new Map(MACROETAPAS.map((m) => [m.codigo, m.rotulo]));
  return carteira.projetos.map((p) => {
    const valor = valorProjeto(p);
    const executado = p.valores.executado;
    const parcial = { macroetapa: p.macroetapa, fimEtapa: fimDaMacroetapaAtual(p), encerramento: p.datas.encerramento, pendencias: p.pendencias.length };
    return {
      id: p.id,
      nome: p.nome,
      orgao: p.orgao,
      prioridade: p.prioridade,
      etapa: p.macroetapa ? (rotulo.get(p.macroetapa) ?? p.macroetapa) : 'Sem macroetapa',
      sei: [...p.sei],
      bairro: p.bairro,
      valor,
      // % executado continua visível sem a permissão de valores: é uma proporção e não revela o R$ (decisão registrada).
      percentual: valor !== null && valor > 0 && executado !== null && executado >= 0 && executado <= valor ? Math.round((executado / valor) * 1000) / 10 : null,
      ...parcial,
      ...farolWhats(parcial, hoje),
    };
  });
}
