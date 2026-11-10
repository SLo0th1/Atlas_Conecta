// DADOS FICTÍCIOS DE EXEMPLO. Nada aqui é projeto real, valor real ou pessoa real.
// Servem para testes e para a guia Projetos mostrar o parecer sem gravar nada (decisão do dono: sem persistência real).
import { hashConteudo } from './parecer.ts';
import type { ContextoParecer, Projeto } from './tipos.ts';

/** Data de referência dos exemplos (use como `hoje` em gerarParecer). */
export const HOJE_EXEMPLO = new Date(2026, 10, 9);

/** Contexto oficial FICTÍCIO: CAUC regular, SICONFI abaixo dos limites, programa aberto, requisitos confirmados. */
export const contextoExemploRegular: ContextoParecer = {
  uf: 'GO',
  cauc: {
    situacaoGeral: 'regular',
    dataReferencia: '2026-11-08',
    dataColeta: '2026-11-08T10:00:00Z',
    itens: [
      { item: '1.2', descricao: 'Regularidade no pagamento de precatórios judiciais', situacao: 'regular', validade: '2026-12-31' },
      { item: '1.3', descricao: 'Regularidade quanto a Contribuições para o FGTS', situacao: 'regular', validade: '2026-12-31' },
    ],
  },
  siconfi: {
    exercicio: 2026,
    receitaCorrenteLiquida: 1_000_000_000,
    despesaPessoalPctRcl: 42,
    limiteAlertaPct: 48.6,
    limitePrudencialPct: 51.3,
    limiteMaximoPct: 54,
    execucaoReceitaPct: 60,
    dataColeta: '2026-11-07T10:00:00Z',
  },
  programa: {
    codigo: 'EXEMPLO-0001',
    publico: ['Administração Pública Municipal'],
    ufs: ['GO', 'MG'],
    prazos: { proposta_ate: '2026-12-20', emendas_ate: null, beneficiario_especifico_ate: null },
    dataColeta: '2026-11-05T10:00:00Z',
  },
  requisitos: {
    confirmadoPor: 'Equipe de captação (exemplo)',
    confirmadoEm: '2026-11-06',
    valorMin: 500_000,
    valorMax: 2_000_000,
    contrapartidaMinPct: 2,
    documentosExigidos: ['projeto_basico', 'certidao'],
  },
  citacoes: [{ rotulo: 'F1', conjunto: 'cnes', valorCitado: 5207, valorAtual: 5207, dataColeta: '2026-11-06T10:00:00Z' }],
};

/** Contexto FICTÍCIO com problemas: CAUC com pendência, SICONFI acima do limite, fontes velhas. */
export const contextoExemploComFalhas: ContextoParecer = {
  uf: 'GO',
  cauc: {
    situacaoGeral: 'com_pendencias',
    dataColeta: '2026-08-01T10:00:00Z',
    itens: [
      { item: '1.3', descricao: 'Regularidade quanto a Contribuições para o FGTS', situacao: 'pendente', validade: null },
      { item: '1.1', descricao: 'Regularidade quanto a Tributos federais', situacao: 'indisponivel', validade: null },
    ],
  },
  siconfi: { ...contextoExemploRegular.siconfi, despesaPessoalPctRcl: 52, dataColeta: '2026-09-20T10:00:00Z' },
  programa: { ...contextoExemploRegular.programa!, prazos: { proposta_ate: '2026-11-12', emendas_ate: null, beneficiario_especifico_ate: null } },
  requisitos: undefined,
  citacoes: [{ rotulo: 'F1', conjunto: 'cnes', valorCitado: 5000, valorAtual: 5207, dataColeta: '2026-11-06T10:00:00Z' }],
};

/** Projeto FICTÍCIO completo, com aprovação registrada (parecer completo e pronto para envio com o contexto regular). */
export function projetoExemploCompleto(): Projeto {
  const base: Projeto = {
    ficticio: true,
    id: 'EXEMPLO-A',
    titulo: '[EXEMPLO FICTÍCIO] Reforma da unidade básica de saúde modelo',
    programaCodigo: 'EXEMPLO-0001',
    secretaria: 'Secretaria Modelo',
    valorGlobal: 1_021_000,
    objetoObraOuServico: true,
    secoes: [
      { tipo: 'identificacao', blocos: [{ texto: 'Município modelo, secretaria modelo (exemplo).', origem: 'humano', revisado: true }] },
      {
        tipo: 'justificativa',
        blocos: [{ texto: 'O município possui 5.207 estabelecimentos de saúde cadastrados [F1].', origem: 'humano', revisado: true }],
        numeros: [{ texto: '5.207', rotulo: 'F1' }],
      },
      { tipo: 'objeto', blocos: [{ texto: 'Reforma da unidade básica de saúde para ampliar o atendimento à população.', origem: 'humano', revisado: true }] },
      { tipo: 'metas', blocos: [{ texto: 'Uma meta de reforma.', origem: 'humano', revisado: true }] },
      { tipo: 'cronograma', blocos: [{ texto: 'Seis meses em duas etapas.', origem: 'humano', revisado: true }] },
    ],
    metas: [{ id: 'm1', descricao: 'Reformar a unidade básica de saúde', unidade: 'unidade', quantidade: 1, prazoMes: 6 }],
    indicadores: [{ id: 'i1', metaId: 'm1', descricao: 'Unidades reformadas', linhaBase: 0, valorAlvo: 1 }],
    etapas: [
      { id: 'e1', metaId: 'm1', descricao: 'Obras civis', mesInicio: 1, mesFim: 3 },
      { id: 'e2', metaId: 'm1', descricao: 'Acabamento e entrega', mesInicio: 4, mesFim: 6 },
    ],
    parcelas: [
      { etapaId: 'e1', mes: 2, valorRepasse: 500_000, valorContrapartida: 10_500 },
      { etapaId: 'e2', mes: 5, valorRepasse: 500_000, valorContrapartida: 10_500 },
    ],
    anexos: [
      { tipo: 'projeto_basico', nome: 'projeto-basico-exemplo.pdf' },
      { tipo: 'certidao', nome: 'certidao-exemplo.pdf' },
    ],
    justificativas: {},
  };
  return { ...base, aprovacao: { nome: 'Pessoa Exemplo', cargo: 'Gestor Exemplo', data: '2026-11-09', hashConteudo: hashConteudo(base) } };
}

/** Projeto FICTÍCIO com várias falhas (sem aprovação). Use com contextoExemploComFalhas. */
export function projetoExemploComFalhas(): Projeto {
  return {
    ficticio: true,
    id: 'EXEMPLO-B',
    titulo: '[EXEMPLO FICTÍCIO] Projeto incompleto',
    programaCodigo: 'EXEMPLO-0001',
    valorGlobal: 900_000,
    objetoObraOuServico: true,
    secoes: [
      { tipo: 'identificacao', blocos: [{ texto: 'Identificação de exemplo.', origem: 'humano', revisado: true }] },
      {
        tipo: 'justificativa',
        blocos: [
          { texto: 'Há 5.000 estabelecimentos [F1] e ainda 12 leitos. Leitos SUS: [DADO NÃO DISPONÍVEL NA FONTE OFICIAL].', origem: 'ia', revisado: false },
        ],
        numeros: [{ texto: '5.000', rotulo: 'F1' }, { texto: '12' }],
      },
      { tipo: 'objeto', blocos: [{ texto: 'Construção de praça pública.', origem: 'humano', revisado: true }] },
    ],
    metas: [
      { id: 'm1', descricao: 'Ampliar vagas em creches', prazoMes: 4 },
      { id: 'm2', descricao: 'Construir praça pública', prazoMes: 6 },
    ],
    indicadores: [{ id: 'i1', metaId: 'm2', descricao: 'Praças construídas', linhaBase: '[DADO NÃO DISPONÍVEL NA FONTE OFICIAL]', valorAlvo: null }],
    etapas: [{ id: 'e1', metaId: 'm1', descricao: 'Obras', mesInicio: 2, mesFim: 8 }],
    parcelas: [{ etapaId: 'e1', mes: 10, valorRepasse: 400_000, valorContrapartida: 0 }],
    anexos: [],
    justificativas: {},
  };
}
