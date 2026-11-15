import type { CodigoMacroetapa, DatasProjeto } from './tipos.ts';

/** Macroetapas oficiais, na ordem do ciclo (nomes da aba PIPELINE). `fimEm` = data prevista que encerra a macroetapa. */
export const MACROETAPAS: { codigo: CodigoMacroetapa; nome: string; rotulo: string; fimEm: keyof DatasProjeto | null }[] = [
  { codigo: '00', nome: 'Em estruturação', rotulo: '00 – Em estruturação', fimEm: 'pecas_tecnicas' },
  { codigo: '01', nome: 'Planejamento', rotulo: '01 – Planejamento', fimEm: 'planejamento' },
  { codigo: '02', nome: 'Preparatório para Contratação', rotulo: '02 – Preparatório para Contratação', fimEm: 'preparatorio' },
  { codigo: '03', nome: 'Contratação', rotulo: '03 – Contratação', fimEm: 'contratacao' },
  { codigo: '04', nome: 'Mobilização', rotulo: '04 – Mobilização', fimEm: 'mobilizacao' },
  { codigo: '05', nome: 'Execução', rotulo: '05 – Execução', fimEm: 'encerramento' },
  { codigo: '06', nome: 'Conclusão', rotulo: '06 – Conclusão', fimEm: null },
];

/** Converte o texto da planilha ("01 – Planejamento", "06 - Conclusão", "1") no código; null se não reconhecer. */
export function codigoMacroetapa(texto: unknown): CodigoMacroetapa | null {
  const m = String(texto ?? '').trim().match(/^0?([0-6])\b/);
  return m ? (`0${m[1]}` as CodigoMacroetapa) : null;
}

export const nomeMacroetapa = (c: CodigoMacroetapa | null): string => MACROETAPAS.find((m) => m.codigo === c)?.nome ?? 'Sem macroetapa';
