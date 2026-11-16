// Farol e data de hoje do WhatsApp, sem dependências (roda no build e no navegador).
import type { CorFarol, ProjetoWhats } from './tipos.ts';

const dia = (iso: string): number => Date.parse(`${iso.slice(0, 10)}T00:00:00Z`);

/** Mesma regra de farol() (carteira/visoes.ts), sobre os campos do WhatsApp. */
export function farolWhats(p: Pick<ProjetoWhats, 'macroetapa' | 'fimEtapa' | 'encerramento' | 'pendencias'>, hoje: string): { farol: CorFarol; motivo: string } {
  if (p.macroetapa !== '06') {
    if (p.fimEtapa && p.fimEtapa < hoje) return { farol: 'vermelho', motivo: 'Prazo da macroetapa vencido' };
    if (p.encerramento && p.encerramento < hoje) return { farol: 'vermelho', motivo: 'Entrega prevista vencida' };
  }
  if (p.pendencias) return { farol: 'amarelo', motivo: `Dados incompletos: ${p.pendencias} pendência(s)` };
  if (p.macroetapa !== '06' && p.fimEtapa && Math.round((dia(p.fimEtapa) - dia(hoje)) / 86400000) <= 15) return { farol: 'amarelo', motivo: 'Prazo da macroetapa em até 15 dias' };
  return { farol: 'verde', motivo: 'No prazo' };
}

/** Data de hoje no fuso de Brasília ('AAAA-MM-DD'). */
export const hojeEmBrasilia = (agora: Date = new Date()): string =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(agora);
