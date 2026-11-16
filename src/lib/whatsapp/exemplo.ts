// Números de EXEMPLO (fictícios, faixa 9 0000-000X) para a simulação. Rótulos são cargos, nunca nomes de pessoas.
import { permissaoDoPerfil } from './permissoes.ts';
import type { Contato } from './tipos.ts';

/** `orgaos` = siglas que existem na carteira carregada; o secretário de exemplo fica com a SEINFRA se ela existir. */
export function contatosExemplo(orgaos: string[]): Contato[] {
  const seinfra = orgaos.includes('SEINFRA') ? ['SEINFRA'] : orgaos.slice(0, 1);
  return [
    {
      id: 'exemplo-gabinete',
      rotulo: 'Gabinete do prefeito (exemplo)',
      telefone: '+5562900000001',
      ativo: true,
      perfil: 'prefeito',
      permissao: permissaoDoPerfil('prefeito', orgaos),
      relatorio: { frequencia: 'semanal', diaSemana: 1, hora: '08:00', modelo: 'prioritarios' },
    },
    {
      id: 'exemplo-seinfra',
      rotulo: 'Secretaria de Infraestrutura (exemplo)',
      telefone: '+5562900000002',
      ativo: true,
      perfil: 'secretario',
      permissao: { ...permissaoDoPerfil('secretario', seinfra), orgaos: seinfra },
      relatorio: { frequencia: 'semanal', diaSemana: 1, hora: '08:30', modelo: 'prioritarios' },
    },
    {
      id: 'exemplo-captacao',
      rotulo: 'Equipe de captação (exemplo)',
      telefone: '+5562900000003',
      ativo: true,
      perfil: 'personalizado',
      permissao: { orgaos: '*', somentePrioritarios: true, projetosExtras: [], verValores: false, verCaptacao: true },
      relatorio: { frequencia: 'diario', diaSemana: 1, hora: '07:30', modelo: 'resumo' },
    },
  ];
}
