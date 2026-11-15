// Ajudantes do MODO SIMULAÇÃO da Sala de guerra (navegador): nada é gravado no servidor; o registro vai para a
// sessionStorage no mesmo formato do histórico de alterações e aparece na tela "Histórico de alterações" com o selo de simulação.
import { AUTOR_SIMULACAO, CHAVE_LOG_SIMULACAO } from '../carteira/simulacao.ts';

export const AVISO_SIMULACAO_SALA = 'Modo simulação: nada é gravado até o banco de dados ser configurado.';
export type TipoRegistroSala = 'sala_aberta' | 'sala_reuniao' | 'sala_item' | 'sala_encerrada';

const LIMITE = 200;

/** Guarda um registro de simulação da sala na sessão do navegador. Devolve false se a sessão não estiver disponível. */
export function registrarSimulacaoSala(tipo: TipoRegistroSala, projetoId: string, projetoNome: string | null, descricao: string, motivo = ''): boolean {
  try {
    const atual = JSON.parse(sessionStorage.getItem(CHAVE_LOG_SIMULACAO) || '[]');
    const lista: unknown[] = Array.isArray(atual) ? atual : [];
    const em = new Date().toISOString();
    const registro = {
      id: `sala-${projetoId}-${em}-${lista.length + 1}`,
      projeto_id: projetoId,
      projeto_nome: projetoNome,
      tipo,
      origem: 'ficha',
      autor: AUTOR_SIMULACAO,
      em,
      descricao,
      ...(motivo.trim() ? { motivo: motivo.trim() } : {}),
      simulado: true,
    };
    sessionStorage.setItem(CHAVE_LOG_SIMULACAO, JSON.stringify([...lista, registro].slice(-LIMITE)));
    return true;
  } catch {
    return false;
  }
}
