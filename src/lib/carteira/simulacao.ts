// Ajudantes do MODO SIMULAÇÃO da movimentação (1.5): as regras reais (aplicarEvento) são aplicadas na página,
// mas nada é gravado até o banco de dados ser configurado. Usado pelo Kanban e pelas Pendências de etapa.
import { MACROETAPAS } from './macroetapas.ts';
import { aplicarEvento, type OrigemEvento, type ResultadoMovimentacao } from './movimentacao.ts';
import type { CodigoMacroetapa, Projeto } from './tipos.ts';

export const AVISO_SIMULACAO = 'Modo simulação: as regras são aplicadas, mas nada é gravado até o banco de dados ser configurado.';
export const AUTOR_SIMULACAO = 'Simulação';

export const nomeEtapa = (c: CodigoMacroetapa | null): string => MACROETAPAS.find((m) => m.codigo === c)?.nome ?? 'Sem macroetapa';

export function proximaEtapa(c: CodigoMacroetapa | null): CodigoMacroetapa | null {
  if (c === null) return '00';
  const i = MACROETAPAS.findIndex((m) => m.codigo === c);
  return i >= 0 && i < MACROETAPAS.length - 1 ? MACROETAPAS[i + 1].codigo : null;
}
export function etapaAnterior(c: CodigoMacroetapa | null): CodigoMacroetapa | null {
  const i = MACROETAPAS.findIndex((m) => m.codigo === c);
  return i > 0 ? MACROETAPAS[i - 1].codigo : null;
}

/** Aplica a movimentação pela regra única do sistema, com autor "Simulação". */
export function simularMovimento(p: Projeto, para: CodigoMacroetapa, origem: OrigemEvento, motivo = '', forcar = false): ResultadoMovimentacao {
  return aplicarEvento(p, {
    tipo: 'mover_macroetapa',
    projeto_id: p.id,
    origem,
    autor: AUTOR_SIMULACAO,
    em: new Date().toISOString(),
    para,
    ...(motivo.trim() ? { motivo: motivo.trim() } : {}),
    ...(forcar ? { forcar: true } : {}),
  });
}

let temporizador: ReturnType<typeof setTimeout> | undefined;
/** Mostra um aviso no #toast da plataforma. */
export function avisar(texto: string): void {
  const toast = document.querySelector<HTMLElement>('#toast');
  if (!toast) return;
  toast.textContent = texto;
  toast.hidden = false;
  clearTimeout(temporizador);
  temporizador = setTimeout(() => {
    toast.hidden = true;
  }, 8000);
}

/** Preenche a área de erro do diálogo com a mensagem e a lista de requisitos que faltam. */
export function mostrarErro(area: HTMLElement, erro: string, faltando?: string[]): void {
  area.replaceChildren();
  const t = document.createElement('p');
  t.textContent = erro;
  area.append(t);
  if (faltando?.length) {
    const ul = document.createElement('ul');
    for (const f of faltando) {
      const li = document.createElement('li');
      li.textContent = f;
      ul.append(li);
    }
    area.append(ul);
  }
  area.hidden = false;
}
