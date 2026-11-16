// Modelos de mensagem do WhatsApp Business para aprovação da Meta.
// Mensagens que o sistema envia sem o número ter escrito antes (janela de 24 h fechada) precisam de modelo aprovado.
export interface BotaoModelo { tipo: 'QUICK_REPLY'; texto: string }
export interface ModeloMeta {
  nome: string;
  categoria: 'UTILITY';
  idioma: 'pt_BR';
  corpo: string;
  exemplos: string[];
  rodape?: string;
  botoes?: BotaoModelo[];
}

const RODAPE = 'GovNexa · Prefeitura de Goiânia';

export const MODELOS_META: ModeloMeta[] = [
  {
    nome: 'relatorio_semanal_projetos',
    categoria: 'UTILITY',
    idioma: 'pt_BR',
    corpo: 'Olá! Este é o relatório {{1}} do GovNexa ({{2}}). Projetos em andamento: {{3}}. Com prazo vencido: {{4}}. Entregas nos próximos 30 dias: {{5}}. Para ver os detalhes, responda RELATÓRIO ou pergunte sobre um projeto.',
    exemplos: ['semanal', '16/11/2026', '42', '5', '3'],
    rodape: RODAPE,
    botoes: [{ tipo: 'QUICK_REPLY', texto: 'Relatório' }, { tipo: 'QUICK_REPLY', texto: 'Atrasados' }],
  },
  {
    nome: 'alerta_prazo_vencido',
    categoria: 'UTILITY',
    idioma: 'pt_BR',
    corpo: 'Atenção: o projeto {{1}} ({{2}}) está com {{3}}. Para detalhes, responda com o código {{4}}.',
    exemplos: ['Ponte Exemplo B', 'SMS', 'prazo da macroetapa vencido', 'P-901'],
    rodape: RODAPE,
  },
  {
    nome: 'confirmacao_cadastro',
    categoria: 'UTILITY',
    idioma: 'pt_BR',
    corpo: 'Seu número foi autorizado no GovNexa para receber relatórios de projetos da Prefeitura ({{1}}). Para parar de receber, responda SAIR.',
    exemplos: ['Gabinete do prefeito'],
    rodape: RODAPE,
  },
];

const VARIAVEL = /\{\{(\d+)\}\}/g;
const numerosDasVariaveis = (corpo: string): number[] => [...corpo.matchAll(VARIAVEL)].map((m) => Number(m[1]));

/** Erros (em português) pelas regras da Meta; lista vazia = modelo válido. */
export function validarModelo(m: ModeloMeta): string[] {
  const erros: string[] = [];
  if (!/^[a-z0-9_]{1,512}$/.test(m.nome)) erros.push('O nome deve ter só letras minúsculas sem acento, números e sublinhado (até 512 caracteres).');
  if (m.corpo.length > 1024) erros.push('O corpo passa de 1024 caracteres.');
  const nums = numerosDasVariaveis(m.corpo);
  if (nums.some((n, i) => n !== i + 1)) erros.push('As variáveis devem ser numeradas em sequência a partir de {{1}}, sem pular.');
  if (/^\s*\{\{\d+\}\}/.test(m.corpo)) erros.push('O corpo não pode começar com uma variável.');
  if (/\{\{\d+\}\}\s*$/.test(m.corpo)) erros.push('O corpo não pode terminar com uma variável.');
  if (m.exemplos.length !== nums.length) erros.push('É preciso um exemplo para cada variável.');
  if ((m.rodape ?? '').length > 60) erros.push('O rodapé passa de 60 caracteres.');
  const botoes = m.botoes ?? [];
  if (botoes.length > 3) erros.push('No máximo 3 botões de resposta rápida.');
  if (botoes.some((b) => b.tipo !== 'QUICK_REPLY')) erros.push('Só botões de resposta rápida são aceitos aqui.');
  if (botoes.some((b) => b.texto.length === 0 || b.texto.length > 25)) erros.push('O texto de cada botão deve ter de 1 a 25 caracteres.');
  return erros;
}

/** Troca {{n}} pelo valor n do vetor (variável sem valor fica como está). */
export function preencherModelo(m: ModeloMeta, valores: string[]): string {
  return m.corpo.replace(VARIAVEL, (t, n: string) => valores[Number(n) - 1] ?? t);
}
