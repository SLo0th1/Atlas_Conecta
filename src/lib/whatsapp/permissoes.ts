// Permissões por número: o filtro vem ANTES de montar qualquer mensagem. Funções puras (servem ao navegador e aos testes).
import type { Contato, Frequencia, ModeloRelatorio, PerfilContato, Permissao, ProjetoWhats } from './tipos.ts';

export const PRIORIDADES_ALTAS = ['Muito Alta', 'Alta'];
export const LIMITE_CONTATOS = 50;
export const LIMITE_EXTRAS = 50;

export const ROTULO_PERFIL: Record<PerfilContato, string> = {
  prefeito: 'Prefeito e gabinete',
  secretario: 'Secretário de um órgão',
  equipe: 'Equipe técnica',
  personalizado: 'Personalizado',
};
export const ROTULO_FREQUENCIA: Record<Frequencia, string> = { semanal: 'Semanal', diario: 'Diário', nenhum: 'Não enviar' };
export const ROTULO_MODELO: Record<ModeloRelatorio, string> = { prioritarios: 'Projetos prioritários', resumo: 'Resumo curto' };
export const DIAS_SEMANA = ['segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado', 'domingo'];

/** Permissão sugerida para cada perfil (a tela preenche e a pessoa pode ajustar). */
export function permissaoDoPerfil(perfil: PerfilContato, orgaos: string[]): Permissao {
  switch (perfil) {
    case 'prefeito':
      return { orgaos: '*', somentePrioritarios: false, projetosExtras: [], verValores: true, verCaptacao: true };
    case 'secretario':
      return { orgaos: orgaos.slice(0, 1), somentePrioritarios: false, projetosExtras: [], verValores: true, verCaptacao: false };
    case 'equipe':
      return { orgaos: orgaos.slice(0, 1), somentePrioritarios: true, projetosExtras: [], verValores: false, verCaptacao: false };
    default:
      return { orgaos: orgaos.slice(0, 1), somentePrioritarios: true, projetosExtras: [], verValores: false, verCaptacao: false };
  }
}

/** Projetos que o número pode ver; sem permissão de valores, o valor sai como null. */
export function projetosVisiveis(base: ProjetoWhats[], perm: Permissao): ProjetoWhats[] {
  const extras = new Set(perm.projetosExtras);
  return base
    .filter((p) => {
      if (extras.has(p.id)) return true;
      const orgaoOk = perm.orgaos === '*' || (p.orgao !== null && perm.orgaos.includes(p.orgao));
      const prioridadeOk = !perm.somentePrioritarios || (p.prioridade !== null && PRIORIDADES_ALTAS.includes(p.prioridade));
      return orgaoOk && prioridadeOk;
    })
    .map((p) => (perm.verValores ? p : { ...p, valor: null }));
}

/** '62 9 9123-4567', '(62) 99123-4567', '5562991234567' → '+5562991234567'; o resto volta como veio (aparado). */
export function normalizarTelefone(t: string): string {
  const d = String(t ?? '').replace(/\D/g, '');
  if (d.length === 11) return `+55${d}`;
  if (d.length === 13 && d.startsWith('55')) return `+${d}`;
  return String(t ?? '').trim();
}

const TELEFONE = /^\+55[1-9][0-9]9\d{8}$/;
const HORA = /^([01]\d|2[0-3]):[0-5]\d$/;
const PERFIS: PerfilContato[] = ['prefeito', 'secretario', 'equipe', 'personalizado'];
const FREQUENCIAS: Frequencia[] = ['semanal', 'diario', 'nenhum'];
const MODELOS: ModeloRelatorio[] = ['prioritarios', 'resumo'];

/** '+5562991234567' → '+55 62 9••••-4567' (a tela nunca mostra o número inteiro na lista). */
export function mascararTelefone(t: string): string {
  if (!TELEFONE.test(t)) return 'Número inválido';
  return `+55 ${t.slice(3, 5)} ${t[5]}••••-${t.slice(-4)}`;
}

/** Erros em português simples; lista vazia = contato válido. `outros` = demais contatos (para não repetir número). */
export function validarContato(c: unknown, orgaosValidos: string[], idsValidos: Set<string>, outros: Contato[] = []): string[] {
  if (!c || typeof c !== 'object') return ['Contato inválido.'];
  const x = c as Record<string, unknown>;
  const erros: string[] = [];
  if (typeof x.id !== 'string' || !/^[a-z0-9-]{1,40}$/.test(x.id)) erros.push('Identificador inválido.');  const rotulo = typeof x.rotulo === 'string' ? x.rotulo : '';
  if (rotulo !== rotulo.trim() || rotulo.length < 2 || rotulo.length > 60) erros.push('Informe quem é (cargo ou equipe), com 2 a 60 letras.');
  if (typeof x.telefone !== 'string' || !TELEFONE.test(x.telefone)) erros.push('Número de celular inválido: use DDD + 9 dígitos, por exemplo (62) 9 9123-4567.');
  else if (outros.some((o) => o.id !== x.id && o.telefone === x.telefone)) erros.push('Esse número já está cadastrado.');
  if (typeof x.ativo !== 'boolean') erros.push('Informe se o número está ativo.');
  if (!PERFIS.includes(x.perfil as PerfilContato)) erros.push('Perfil inválido.');

  const perm = x.permissao as Record<string, unknown> | undefined;
  if (!perm || typeof perm !== 'object') erros.push('Permissão inválida.');
  else {
    const orgaos = perm.orgaos;
    if (orgaos !== '*') {
      if (!Array.isArray(orgaos) || orgaos.length === 0) erros.push('Escolha ao menos um órgão ou marque "Todos os órgãos".');
      else if (!orgaos.every((o) => typeof o === 'string' && orgaosValidos.includes(o))) erros.push('Há órgão que não existe na carteira.');
    }
    for (const k of ['somentePrioritarios', 'verValores', 'verCaptacao'] as const) if (typeof perm[k] !== 'boolean') erros.push('Permissão inválida.');
    const extras = perm.projetosExtras;
    if (!Array.isArray(extras)) erros.push('Lista de projetos liberados inválida.');
    else {
      if (extras.length > LIMITE_EXTRAS) erros.push(`No máximo ${LIMITE_EXTRAS} projetos liberados à parte.`);
      const desconhecidos = extras.filter((e) => typeof e !== 'string' || !idsValidos.has(e));
      if (desconhecidos.length) erros.push(`Projeto não encontrado na carteira: ${desconhecidos.slice(0, 5).map(String).join(', ')}.`);
    }
  }

  const rel = x.relatorio as Record<string, unknown> | undefined;
  if (!rel || typeof rel !== 'object') erros.push('Configuração do relatório inválida.');
  else {
    if (!FREQUENCIAS.includes(rel.frequencia as Frequencia)) erros.push('Frequência do relatório inválida.');
    if (!Number.isInteger(rel.diaSemana) || (rel.diaSemana as number) < 1 || (rel.diaSemana as number) > 7) erros.push('Dia da semana inválido.');
    if (typeof rel.hora !== 'string' || !HORA.test(rel.hora)) erros.push('Horário inválido: use HH:MM.');
    if (!MODELOS.includes(rel.modelo as ModeloRelatorio)) erros.push('Modelo de relatório inválido.');
  }
  return [...new Set(erros)];
}

/** Uma linha em português do que o número pode ver. */
export function descreverPermissao(p: Permissao): string {
  const partes = [
    p.orgaos === '*' ? 'Todos os órgãos' : `Órgãos: ${p.orgaos.join(', ')}`,
    p.somentePrioritarios ? 'só prioridade Muito Alta e Alta' : 'todas as prioridades',
    p.verValores ? 'com valores' : 'sem valores',
    p.verCaptacao ? 'com captação' : 'sem captação',
  ];
  if (p.projetosExtras.length) partes.push(`+${p.projetosExtras.length} ${p.projetosExtras.length === 1 ? 'projeto liberado' : 'projetos liberados'}`);
  return partes.join(' · ');
}

export function descreverRelatorio(r: Contato['relatorio']): string {
  if (r.frequencia === 'nenhum') return 'Sem relatório automático';
  const quando = r.frequencia === 'diario' ? `Diário às ${r.hora}` : `${r.diaSemana >= 6 ? 'Todo' : 'Toda'} ${DIAS_SEMANA[r.diaSemana - 1]} às ${r.hora}`;
  return `${quando} · ${ROTULO_MODELO[r.modelo]}`;
}
