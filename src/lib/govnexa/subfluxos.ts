// Fluxos detalhados (subprocessos) das etapas do mapa geral (guia Projetos › Fluxo do sistema).
// Cada subfluxo detalha uma caixa do mapa geral, do início ao fim, com as EXCEÇÕES aceitas e como ficam registradas.
// Regra do dono (15/11/2026): exceção pode ser aceita, mas sempre fica registrada (motivo, quem aceitou, quando),
// para garantia do processo e para evolução. Conteúdo a partir das transcrições, das planilhas e da Lei 14.133.

import type { Ligacao, Situacao, Tela } from './fluxo.ts';

export type TipoNoSub = 'inicio' | 'tarefa' | 'decisao' | 'excecao' | 'fim';
export interface NoSub {
  id: string;
  raia: string; // id de uma raia do próprio subfluxo
  linha: number;
  tipo: TipoNoSub;
  titulo: string;
  oQue: string;
  valida: string[];
  quem: string;
  situacao: Situacao;
  fase: string;
  telas: Tela[];
  /** Só para tipo 'excecao': quando a exceção é aceita e o que fica registrado. */
  excecao?: { aceitaQuando: string; registro: string };
}
export interface Subfluxo {
  id: string;
  /** id do nó do mapa geral que este subfluxo detalha */
  no: string;
  titulo: string;
  resumo: string;
  raias: { id: string; nome: string; descricao: string }[];
  nos: NoSub[];
  ligacoes: Ligacao[];
}

const T = {
  novo: { rotulo: 'Novo projeto', url: '/plataforma/projetos-novo/' },
  carteira: { rotulo: 'Carteira de projetos', url: '/plataforma/projetos-carteira/' },
  kanban: { rotulo: 'Kanban por macroetapa', url: '/plataforma/projetos-kanban/' },
  pendencias: { rotulo: 'Pendências de etapa', url: '/plataforma/projetos-pendencias/' },
  log: { rotulo: 'Histórico de alterações', url: '/plataforma/projetos-log/' },
  excecoes: { rotulo: 'Histórico: somente exceções', url: '/plataforma/projetos-log/?excecoes=1' },
  cronogramas: { rotulo: 'Cronogramas', url: '/plataforma/projetos-cronogramas/' },
  acompanhamento: { rotulo: 'Acompanhamento de convênios', url: '/plataforma/captacao-acompanhamento/' },
  alertas: { rotulo: 'Alertas da Captação', url: '/plataforma/captacao-alertas/' },
  processos: { rotulo: 'Processos / Licitações', url: '/plataforma/processos/' },
  parecer: { rotulo: 'Projetos (parecer de elegibilidade)', url: '/plataforma/captacao-projetos/' },
  oportunidades: { rotulo: 'Oportunidades', url: '/plataforma/captacao-oportunidades/' },
  sala: { rotulo: 'Sala de guerra', url: '/plataforma/projetos-sala/' },
  parado: { rotulo: 'Onde está parado', url: '/plataforma/projetos-parado/' },
} satisfies Record<string, Tela>;

const EXC = 'Exceção aceita e registrada';

export const SUBFLUXOS: Subfluxo[] = [
  // 1) CADASTRO DO PROJETO
  {
    id: 'cadastro', no: 'cadastro', titulo: 'Cadastro do projeto',
    resumo: 'Como um projeto passa a existir no sistema: pela tela Novo projeto ou pela carga da planilha, com validação, compromisso e pendências de dado registradas.',
    raias: [
      { id: 'quem', nome: 'Quem cadastra', descricao: 'Gestão de portfólio ou responsável pelo projeto.' },
      { id: 'sistema', nome: 'Sistema', descricao: 'Regras, validações e registro no histórico.' },
      { id: 'resultado', nome: 'Resultado', descricao: 'Onde o projeto aparece depois do cadastro.' },
    ],
    nos: [
      { id: 'c-inicio', raia: 'quem', linha: 1, tipo: 'inicio', titulo: 'Início: nova demanda', oQue: 'Chega uma necessidade de obra ou serviço (secretaria, gabinete ou equipe técnica).', valida: ['Quem demanda'], quem: 'Secretaria demandante', situacao: 'disponivel', fase: 'Etapa 1.5', telas: [T.novo] },
      { id: 'c-origem', raia: 'quem', linha: 2, tipo: 'decisao', titulo: 'Entrada pela planilha ou pela tela?', oQue: 'Projetos já existentes entram pela carga da planilha; projetos novos, pela tela Novo projeto.', valida: ['Arquivo da planilha conferido (carga)', 'Ou formulário preenchido (tela)'], quem: 'Gestão de portfólio', situacao: 'disponivel', fase: 'Fase 1 / Etapa 1.5', telas: [T.novo, T.carteira] },
      { id: 'c-ident', raia: 'quem', linha: 3, tipo: 'tarefa', titulo: 'Identificação', oQue: 'Nome, órgão, responsável, tipo e detalhamento, região, bairro, processo SEI e observação.', valida: ['Nome e órgão obrigatórios', 'SEI no formato AA.N.NNNNNNNNN-D'], quem: 'Quem cadastra', situacao: 'simulacao', fase: 'Etapa 1.5', telas: [T.novo] },
      { id: 'c-dup', raia: 'sistema', linha: 3, tipo: 'decisao', titulo: 'Já existe projeto parecido?', oQue: 'O sistema compara nome, SEI e local com a carteira para evitar projeto duplicado.', valida: ['Mesmo SEI', 'Nome muito parecido no mesmo órgão'], quem: 'Sistema', situacao: 'planejado', fase: 'Etapa 1.5 (com o banco)', telas: [T.carteira] },
      { id: 'c-dup-exc', raia: 'sistema', linha: 4, tipo: 'excecao', titulo: 'Criar mesmo parecido', oQue: 'Quando a equipe confirma que são projetos diferentes (ex.: duas UBS no mesmo programa), o cadastro segue.', valida: ['Motivo informado'], quem: 'Gestão de portfólio', situacao: 'planejado', fase: 'Etapa 1.5 (com o banco)', telas: [T.excecoes], excecao: { aceitaQuando: 'Os projetos são de fato diferentes (local, escopo ou fonte distintos).', registro: `${EXC}: "projeto possivelmente duplicado", com o projeto parecido, o motivo, quem confirmou e quando.` } },
      { id: 'c-comp', raia: 'quem', linha: 5, tipo: 'decisao', titulo: 'Compromisso do projeto?', oQue: 'Decidido (executa com ou sem recurso externo), Condicionado (só executa se vier recurso externo: o projeto "desejo") ou Ideia (ainda não avaliado).', valida: ['Um dos três compromissos'], quem: 'Gestão de portfólio', situacao: 'simulacao', fase: 'Etapa 1.5', telas: [T.novo] },
      { id: 'c-valores', raia: 'quem', linha: 6, tipo: 'tarefa', titulo: 'Valores, recurso, prioridade e datas', oQue: 'Valor estimado e origem do valor, recurso (municipal, federal, programa, termo), prioridade, tipo de contratação e datas previstas de cada macroetapa.', valida: ['Datas em ordem', 'Valor com origem'], quem: 'Quem cadastra', situacao: 'simulacao', fase: 'Etapa 1.5', telas: [T.novo] },
      { id: 'c-valida', raia: 'sistema', linha: 7, tipo: 'decisao', titulo: 'Dados completos?', oQue: 'O sistema confere os obrigatórios e lista o que falta (região, valor, origem do valor, datas).', valida: ['Nome e órgão (bloqueiam)', 'Demais campos (geram pendência)'], quem: 'Sistema', situacao: 'simulacao', fase: 'Etapa 1.5', telas: [T.novo] },
      { id: 'c-pend-exc', raia: 'sistema', linha: 8, tipo: 'excecao', titulo: 'Cadastrar com pendências de dado', oQue: 'O projeto pode nascer incompleto (é comum na estruturação); cada falta vira pendência visível na ficha e no farol amarelo.', valida: ['Pendências listadas'], quem: 'Quem cadastra', situacao: 'simulacao', fase: 'Etapa 1.5', telas: [T.carteira, T.excecoes], excecao: { aceitaQuando: 'Faltam dados não obrigatórios (região, valor, origem do valor, datas).', registro: `${EXC}: cada pendência fica no projeto (farol amarelo) e no histórico até ser resolvida.` } },
      { id: 'c-cria', raia: 'sistema', linha: 9, tipo: 'tarefa', titulo: 'Cria em 00 – Em estruturação', oQue: 'O projeto recebe um código (P-N), nasce em 00 – Em estruturação e o cadastro é registrado no histórico (quem, quando, campos).', valida: ['Histórico "Projeto incluído"'], quem: 'Sistema', situacao: 'simulacao', fase: 'Etapa 1.5 (grava com o banco)', telas: [T.log] },
      { id: 'c-fim', raia: 'resultado', linha: 10, tipo: 'fim', titulo: 'Projeto na carteira', oQue: 'Aparece na Carteira, no Kanban (coluna Em estruturação), no Gantt e no Início; segue para a movimentação de etapas.', valida: ['Visível em todas as telas'], quem: 'Todos', situacao: 'disponivel', fase: 'Fase 1', telas: [T.carteira, T.kanban] },
    ],
    ligacoes: [
      { de: 'c-inicio', para: 'c-origem' },
      { de: 'c-origem', para: 'c-ident', rotulo: 'tela' },
      { de: 'c-origem', para: 'c-dup', rotulo: 'planilha' },
      { de: 'c-ident', para: 'c-dup' },
      { de: 'c-dup', para: 'c-dup-exc', rotulo: 'sim' },
      { de: 'c-dup', para: 'c-comp', rotulo: 'não' },
      { de: 'c-dup-exc', para: 'c-comp' },
      { de: 'c-comp', para: 'c-valores' },
      { de: 'c-valores', para: 'c-valida' },
      { de: 'c-valida', para: 'c-pend-exc', rotulo: 'não' },
      { de: 'c-valida', para: 'c-cria', rotulo: 'sim' },
      { de: 'c-pend-exc', para: 'c-cria' },
      { de: 'c-cria', para: 'c-fim' },
    ],
  },

  // 1b) PROJETO × OPORTUNIDADE (Captação ↔ Projetos, nos dois sentidos)
  {
    id: 'oportunidade', no: 'casamento', titulo: 'Projeto × oportunidade',
    resumo: 'Nos dois sentidos: projeto da carteira sem fonte encontra uma oportunidade; oportunidade sem projeto sugere criar um. A equipe sempre confirma; projeto criado às pressas para caber no prazo é exceção registrada.',
    raias: [
      { id: 'sistema', nome: 'Sistema', descricao: 'Cruzamento e sugestões.' },
      { id: 'captacao', nome: 'Captação', descricao: 'Confirmação e proposta.' },
      { id: 'projetos', nome: 'Projetos', descricao: 'Projeto existente ou novo.' },
    ],
    nos: [
      { id: 'o-inicio', raia: 'sistema', linha: 1, tipo: 'inicio', titulo: 'Início: programa aberto ou projeto sem fonte', oQue: 'Um programa ou edital abre, ou um projeto da carteira precisa de recurso externo.', valida: ['Programa com prazo', 'Projeto com saldo sem fonte'], quem: 'Sistema', situacao: 'disponivel', fase: 'Captação', telas: [T.oportunidades] },
      { id: 'o-cruza', raia: 'sistema', linha: 2, tipo: 'tarefa', titulo: 'Cruzar oportunidades × carteira', oQue: 'Compara tema, tipo de obra, valor, região e prazo de cada oportunidade com os projetos da carteira.', valida: ['Compatibilidade de tema e valor', 'Requisitos do programa (parecer)'], quem: 'Sistema', situacao: 'planejado', fase: 'Fase 4', telas: [T.oportunidades, T.parecer] },
      { id: 'o-tem', raia: 'sistema', linha: 3, tipo: 'decisao', titulo: 'Há projeto compatível?', oQue: 'Se existe projeto na carteira que atende à oportunidade.', valida: ['Projeto ainda sem fonte para o valor'], quem: 'Sistema', situacao: 'planejado', fase: 'Fase 4', telas: [T.carteira] },
      { id: 'o-sugere', raia: 'captacao', linha: 4, tipo: 'tarefa', titulo: 'Sugerir o projeto existente', oQue: 'Mostra os projetos compatíveis para a oportunidade (e as oportunidades para cada projeto).', valida: ['Par sugerido, nunca afirmado'], quem: 'Sistema; captação', situacao: 'planejado', fase: 'Fase 4', telas: [T.oportunidades, T.carteira] },
      { id: 'o-novo', raia: 'projetos', linha: 4, tipo: 'tarefa', titulo: 'Sugerir criar um projeto', oQue: 'Oportunidade sem projeto: sugere cadastrar um projeto para usar o recurso (ex.: uma praça para um programa de praças).', valida: ['Interesse da secretaria'], quem: 'Captação; gestão de portfólio', situacao: 'planejado', fase: 'Fase 4', telas: [T.novo] },
      { id: 'o-prazo', raia: 'projetos', linha: 5, tipo: 'decisao', titulo: 'Dá tempo de estruturar no prazo do programa?', oQue: 'A janela costuma ir de 5 dias a 2 meses.', valida: ['Prazo de envio × tempo de estruturação'], quem: 'Gestão de portfólio', situacao: 'planejado', fase: 'Fase 4', telas: [T.novo] },
      { id: 'o-relampago', raia: 'projetos', linha: 6, tipo: 'excecao', titulo: 'Projeto criado às pressas para a oportunidade', oQue: 'Cadastrado para caber no prazo, mesmo sem estudo completo; o que faltar vira pendência.', valida: ['Motivo e programa'], quem: 'Gestão de portfólio', situacao: 'planejado', fase: 'Fase 4', telas: [T.excecoes], excecao: { aceitaQuando: 'A oportunidade é estratégica e a janela é curta (de 5 dias a 2 meses), mesmo sem estudo completo.', registro: `${EXC}: projeto nascido para a oportunidade, com o programa, o prazo e o que ficou para depois (estudos, orçamento).` } },
      { id: 'o-confirma', raia: 'captacao', linha: 7, tipo: 'decisao', titulo: 'Equipe confirma o par?', oQue: 'A captação confirma ou descarta cada sugestão.', valida: ['Motivo do descarte'], quem: 'Captação', situacao: 'planejado', fase: 'Fase 4', telas: [T.oportunidades] },
      { id: 'o-descarta', raia: 'sistema', linha: 8, tipo: 'fim', titulo: 'Fim: sugestão descartada', oQue: 'Fica registrada com o motivo, para melhorar as próximas sugestões.', valida: ['Motivo registrado'], quem: 'Captação', situacao: 'planejado', fase: 'Fase 4', telas: [T.log] },
      { id: 'o-proposta', raia: 'captacao', linha: 8, tipo: 'tarefa', titulo: 'Preparar e enviar a proposta', oQue: 'Formulário padrão do concedente (Transferegov), com justificativa e indicadores; no futuro, com apoio de IA e revisão humana.', valida: ['Dentro do prazo do programa', 'Requisitos do programa confirmados'], quem: 'Captação', situacao: 'planejado', fase: 'Fase 4 (IA na Fase 5)', telas: [T.parecer] },
      { id: 'o-fim', raia: 'captacao', linha: 9, tipo: 'fim', titulo: 'Fim: proposta enviada', oQue: 'Segue para o convênio (e, se houver, a cláusula suspensiva).', valida: [], quem: 'Captação', situacao: 'planejado', fase: 'Fase 4', telas: [T.acompanhamento] },
    ],
    ligacoes: [
      { de: 'o-inicio', para: 'o-cruza' },
      { de: 'o-cruza', para: 'o-tem' },
      { de: 'o-tem', para: 'o-sugere', rotulo: 'sim' },
      { de: 'o-tem', para: 'o-novo', rotulo: 'não' },
      { de: 'o-novo', para: 'o-prazo' },
      { de: 'o-prazo', para: 'o-relampago', rotulo: 'não' },
      { de: 'o-prazo', para: 'o-confirma', rotulo: 'sim' },
      { de: 'o-relampago', para: 'o-confirma' },
      { de: 'o-sugere', para: 'o-confirma' },
      { de: 'o-confirma', para: 'o-descarta', rotulo: 'não' },
      { de: 'o-confirma', para: 'o-proposta', rotulo: 'sim' },
      { de: 'o-proposta', para: 'o-fim' },
    ],
  },

  // 2) MUDANÇA DE ETAPA (portão e movimentação)
  {
    id: 'movimentacao', no: 'portao', titulo: 'Mudança de etapa do projeto',
    resumo: 'Como o projeto anda ou volta de macroetapa por qualquer caminho, sempre pela mesma regra; forçar é exceção registrada.',
    raias: [
      { id: 'pedido', nome: 'Pedido', descricao: 'De onde vem a mudança.' },
      { id: 'regra', nome: 'Regra (portão)', descricao: 'O que o sistema confere.' },
      { id: 'efeito', nome: 'Efeito', descricao: 'O que muda e onde fica registrado.' },
    ],
    nos: [
      { id: 'm-inicio', raia: 'pedido', linha: 1, tipo: 'inicio', titulo: 'Início: pedido de mudança', oQue: 'Arrastar o card no Kanban, novo passo na ficha, aprovar/reprovar na área de pendências ou documento-chave do SEI.', valida: ['Origem do pedido'], quem: 'Responsável; gestão; sistema (SEI)', situacao: 'simulacao', fase: 'Etapa 1.5', telas: [T.kanban, T.pendencias] },
      { id: 'm-sentido', raia: 'regra', linha: 2, tipo: 'decisao', titulo: 'Avançar ou voltar?', oQue: 'Avançar segue para o portão; voltar exige motivo.', valida: ['Sentido da mudança'], quem: 'Sistema', situacao: 'simulacao', fase: 'Etapa 1.5', telas: [T.kanban] },
      { id: 'm-volta', raia: 'efeito', linha: 3, tipo: 'tarefa', titulo: 'Volta uma etapa com motivo', oQue: 'Reprovação ou retrabalho: o projeto volta e o motivo fica no histórico.', valida: ['Motivo obrigatório'], quem: 'Gestão de portfólio', situacao: 'simulacao', fase: 'Etapa 1.5', telas: [T.log] },
      { id: 'm-pula', raia: 'regra', linha: 3, tipo: 'decisao', titulo: 'Uma etapa por vez?', oQue: 'O projeto avança uma macroetapa por vez.', valida: ['Próxima etapa = atual + 1'], quem: 'Sistema', situacao: 'simulacao', fase: 'Etapa 1.5', telas: [T.kanban] },
      { id: 'm-portao', raia: 'regra', linha: 4, tipo: 'decisao', titulo: 'Requisitos da próxima etapa cumpridos?', oQue: 'Ex.: para Contratação, tem projeto e origem do recurso; se federal, termo de compromisso; para Mobilização, tipo de contratação e data prevista.', valida: ['Lista do que falta'], quem: 'Sistema', situacao: 'simulacao', fase: 'Etapa 1.5', telas: [T.pendencias] },
      { id: 'm-forca', raia: 'efeito', linha: 5, tipo: 'excecao', titulo: 'Forçar com motivo', oQue: 'Pular etapa ou avançar sem todos os requisitos (ex.: decisão de governo, urgência legal).', valida: ['Motivo obrigatório'], quem: 'Gestão de portfólio', situacao: 'simulacao', fase: 'Etapa 1.5', telas: [T.excecoes], excecao: { aceitaQuando: 'Há justificativa de gestão para seguir sem o requisito ou pular etapa.', registro: `${EXC}: "forçado", com o que faltava, o motivo, quem e quando; aparece no filtro de exceções do histórico.` } },
      { id: 'm-avanca', raia: 'efeito', linha: 6, tipo: 'tarefa', titulo: 'Avança e registra', oQue: 'Muda a macroetapa, atualiza Kanban, Gantt, painel e registra no histórico (de → para, origem, quem, quando).', valida: ['Histórico "Mudança de etapa"'], quem: 'Sistema', situacao: 'simulacao', fase: 'Etapa 1.5', telas: [T.log, T.kanban] },
      { id: 'm-fim', raia: 'efeito', linha: 7, tipo: 'fim', titulo: 'Fim: projeto na nova etapa', oQue: 'O cronograma e os alertas passam a valer para a nova etapa.', valida: [], quem: 'Todos', situacao: 'simulacao', fase: 'Etapa 1.5', telas: [T.cronogramas] },
    ],
    ligacoes: [
      { de: 'm-inicio', para: 'm-sentido' },
      { de: 'm-sentido', para: 'm-volta', rotulo: 'voltar' },
      { de: 'm-sentido', para: 'm-pula', rotulo: 'avançar' },
      { de: 'm-pula', para: 'm-forca', rotulo: 'não' },
      { de: 'm-pula', para: 'm-portao', rotulo: 'sim' },
      { de: 'm-portao', para: 'm-forca', rotulo: 'não' },
      { de: 'm-portao', para: 'm-avanca', rotulo: 'sim' },
      { de: 'm-forca', para: 'm-avanca' },
      { de: 'm-volta', para: 'm-fim' },
      { de: 'm-avanca', para: 'm-fim' },
    ],
  },

  // 3) CLÁUSULA SUSPENSIVA
  {
    id: 'clausula', no: 'clausula', titulo: 'Cláusula suspensiva do convênio',
    resumo: 'O convênio é assinado, mas o recurso só é liberado depois de cumprir as exigências no prazo; prorrogação é exceção registrada.',
    raias: [
      { id: 'captacao', nome: 'Captação', descricao: 'Convênio, prazos e concedente.' },
      { id: 'projeto', nome: 'Projeto', descricao: 'Exigências viram tarefas do cronograma.' },
      { id: 'controle', nome: 'Controle', descricao: 'Alertas e decisões.' },
    ],
    nos: [
      { id: 'k-inicio', raia: 'captacao', linha: 1, tipo: 'inicio', titulo: 'Início: convênio assinado com cláusula', oQue: 'O concedente se compromete com o recurso, condicionado às exigências.', valida: ['Prazo da cláusula no instrumento'], quem: 'Captação', situacao: 'planejado', fase: 'Fase 4', telas: [T.acompanhamento] },
      { id: 'k-exig', raia: 'captacao', linha: 2, tipo: 'tarefa', titulo: 'Registrar exigências e prazo', oQue: 'Projeto executivo, orçamento, licença ambiental, titularidade da área, termo de referência.', valida: ['Cada exigência com prazo'], quem: 'Captação', situacao: 'planejado', fase: 'Fase 4', telas: [T.acompanhamento] },
      { id: 'k-tarefas', raia: 'projeto', linha: 3, tipo: 'tarefa', titulo: 'Exigências viram tarefas', oQue: 'Cada exigência é ligada à etapa do cronograma do projeto (ex.: licença ambiental), com responsável.', valida: ['Responsável e data'], quem: 'Responsável do projeto', situacao: 'planejado', fase: 'Fase 4', telas: [T.cronogramas] },
      { id: 'k-alerta', raia: 'controle', linha: 4, tipo: 'tarefa', titulo: 'Alertas a 90, 60, 30 e 15 dias', oQue: 'E alerta quando a tarefa ligada atrasa a ponto de comprometer o prazo.', valida: ['Prazo da prefeitura menor que o do concedente'], quem: 'Sistema', situacao: 'planejado', fase: 'Fase 4', telas: [T.alertas] },
      { id: 'k-cumprida', raia: 'controle', linha: 5, tipo: 'decisao', titulo: 'Cumprida no prazo?', oQue: 'Todas as exigências entregues e aceitas pelo concedente.', valida: ['Aceite do concedente'], quem: 'Captação', situacao: 'planejado', fase: 'Fase 4', telas: [T.acompanhamento] },
      { id: 'k-prorroga', raia: 'controle', linha: 6, tipo: 'excecao', titulo: 'Pedir prorrogação', oQue: 'Quando a norma e o concedente permitem, pede-se prorrogação do prazo com justificativa.', valida: ['Justificativa e novo prazo'], quem: 'Captação; secretário', situacao: 'planejado', fase: 'Fase 4', telas: [T.excecoes], excecao: { aceitaQuando: 'A norma do concedente permite e há justificativa (fato externo, órgão licenciador).', registro: `${EXC}: pedido, justificativa, novo prazo, quem pediu e a resposta do concedente.` } },
      { id: 'k-sala', raia: 'controle', linha: 7, tipo: 'tarefa', titulo: 'Risco de perda: sala de guerra', oQue: 'Sem prazo e sem prorrogação, o caso vai para a Sala de guerra como crise.', valida: ['Escalonamento'], quem: 'Gestão de portfólio', situacao: 'simulacao', fase: 'Etapa 1.5', telas: [T.sala] },
      { id: 'k-libera', raia: 'captacao', linha: 8, tipo: 'tarefa', titulo: 'Recurso liberado', oQue: 'Cláusula cumprida: o projeto pode seguir para a contratação com a fonte garantida.', valida: ['Liberação registrada'], quem: 'Captação', situacao: 'planejado', fase: 'Fase 4', telas: [T.acompanhamento] },
      { id: 'k-fim', raia: 'captacao', linha: 9, tipo: 'fim', titulo: 'Fim: convênio apto', oQue: 'Ou convênio extinto (perda), registrado com a causa para aprendizado.', valida: [], quem: 'Captação', situacao: 'planejado', fase: 'Fase 4', telas: [T.log] },
    ],
    ligacoes: [
      { de: 'k-inicio', para: 'k-exig' },
      { de: 'k-exig', para: 'k-tarefas' },
      { de: 'k-tarefas', para: 'k-alerta' },
      { de: 'k-alerta', para: 'k-cumprida' },
      { de: 'k-cumprida', para: 'k-libera', rotulo: 'sim' },
      { de: 'k-cumprida', para: 'k-prorroga', rotulo: 'não' },
      { de: 'k-prorroga', para: 'k-tarefas', rotulo: 'aceita' },
      { de: 'k-prorroga', para: 'k-sala', rotulo: 'negada' },
      { de: 'k-sala', para: 'k-fim', rotulo: 'perda' },
      { de: 'k-libera', para: 'k-fim' },
    ],
  },

  // 4) LICITAÇÃO — FASE EXTERNA
  {
    id: 'licitacao', no: 'julgamento', titulo: 'Licitação: fase externa (Lei 14.133)',
    resumo: 'Da publicação à homologação, com a ordem de colocados; licitação deserta ou fracassada e anulação são exceções registradas.',
    raias: [
      { id: 'agente', nome: 'Agente de contratação', descricao: 'Condução da licitação.' },
      { id: 'licitantes', nome: 'Licitantes', descricao: 'Empresas participantes.' },
      { id: 'autoridade', nome: 'Autoridade e PGM', descricao: 'Decisões, recursos e homologação.' },
    ],
    nos: [
      { id: 'l-inicio', raia: 'agente', linha: 1, tipo: 'inicio', titulo: 'Início: edital aprovado', oQue: 'Fase interna concluída e parecer jurídico favorável.', valida: ['Despacho de autorização'], quem: 'SECAP', situacao: 'planejado', fase: 'Fase 4', telas: [T.processos] },
      { id: 'l-pub', raia: 'agente', linha: 2, tipo: 'tarefa', titulo: 'Publicar edital', oQue: 'PNCP, Diário Oficial e jornal; começa o prazo mínimo de publicidade.', valida: ['Prazo mínimo (piso legal) — não pode ser encurtado'], quem: 'Agente de contratação', situacao: 'planejado', fase: 'Fase 4', telas: [T.processos] },
      { id: 'l-propostas', raia: 'licitantes', linha: 3, tipo: 'decisao', titulo: 'Houve propostas válidas?', oQue: 'Sessão pública: recebimento das propostas.', valida: ['Propostas aceitáveis'], quem: 'Licitantes; agente', situacao: 'planejado', fase: 'Fase 4', telas: [T.processos] },
      { id: 'l-deserta', raia: 'agente', linha: 4, tipo: 'excecao', titulo: 'Deserta ou fracassada: relicitar', oQue: 'Sem propostas (deserta) ou nenhuma aceitável (fracassada): revisar edital/orçamento e republicar.', valida: ['Causa identificada'], quem: 'Agente; SECAP', situacao: 'planejado', fase: 'Fase 4', telas: [T.excecoes], excecao: { aceitaQuando: 'Sempre que a licitação termina sem vencedor.', registro: `${EXC}: "relicitar", com a causa (preço, exigência, prazo), as mudanças feitas e a nova data.` } },
      { id: 'l-ordem', raia: 'agente', linha: 5, tipo: 'tarefa', titulo: 'Ordenar e julgar propostas', oQue: 'Ordem completa de colocados com empresa e valor; o prefeito vê quem está à frente.', valida: ['Proposta abaixo de 75% do orçado: possível inexequível'], quem: 'Agente de contratação', situacao: 'planejado', fase: 'Fase 4', telas: [T.processos] },
      { id: 'l-hab', raia: 'licitantes', linha: 6, tipo: 'decisao', titulo: 'Colocado habilitado?', oQue: 'Habilitação técnica, econômica e fiscal do colocado da vez.', valida: ['Documentos de habilitação'], quem: 'Agente; licitante', situacao: 'planejado', fase: 'Fase 4', telas: [T.processos] },
      { id: 'l-proximo', raia: 'licitantes', linha: 7, tipo: 'tarefa', titulo: 'Chamar o próximo colocado', oQue: 'Inabilitado: chama o seguinte (já houve caso de chegar ao 7º); cada tentativa fica registrada.', valida: ['Motivo da inabilitação'], quem: 'Agente de contratação', situacao: 'planejado', fase: 'Fase 4', telas: [T.processos] },
      { id: 'l-recurso', raia: 'autoridade', linha: 8, tipo: 'decisao', titulo: 'Houve recurso?', oQue: 'Intenção, razões e contrarrazões (3 + 3 dias úteis); decisão em até 10 dias úteis.', valida: ['Prazos legais (teto) e metas internas menores'], quem: 'Autoridade; PGM', situacao: 'planejado', fase: 'Fase 4', telas: [T.parado] },
      { id: 'l-anula', raia: 'autoridade', linha: 9, tipo: 'excecao', titulo: 'Anular ou revogar', oQue: 'Vício insanável (anulação) ou interesse público superveniente (revogação).', valida: ['Fundamentação'], quem: 'Autoridade competente', situacao: 'planejado', fase: 'Fase 4', telas: [T.excecoes], excecao: { aceitaQuando: 'Há vício insanável ou razão de interesse público, com fundamentação.', registro: `${EXC}: ato, fundamento, quem decidiu e quando; o projeto volta para 02 – Preparatório.` } },
      { id: 'l-homol', raia: 'autoridade', linha: 10, tipo: 'tarefa', titulo: 'Homologar e adjudicar', oQue: 'Resultado final; economia = estimado − contratado.', valida: ['Valor homologado'], quem: 'Autoridade competente', situacao: 'planejado', fase: 'Fase 4', telas: [T.processos] },
      { id: 'l-fim', raia: 'autoridade', linha: 11, tipo: 'fim', titulo: 'Fim: segue para mobilização', oQue: 'Garantia, contrato, publicação no PNCP e ordem de serviço.', valida: [], quem: 'SECAP', situacao: 'planejado', fase: 'Fase 4', telas: [T.kanban] },
    ],
    ligacoes: [
      { de: 'l-inicio', para: 'l-pub' },
      { de: 'l-pub', para: 'l-propostas' },
      { de: 'l-propostas', para: 'l-deserta', rotulo: 'não' },
      { de: 'l-deserta', para: 'l-pub', rotulo: 'republicar' },
      { de: 'l-propostas', para: 'l-ordem', rotulo: 'sim' },
      { de: 'l-ordem', para: 'l-hab' },
      { de: 'l-hab', para: 'l-proximo', rotulo: 'não' },
      { de: 'l-proximo', para: 'l-hab' },
      { de: 'l-hab', para: 'l-recurso', rotulo: 'sim' },
      { de: 'l-recurso', para: 'l-anula', rotulo: 'procedente grave' },
      { de: 'l-recurso', para: 'l-homol', rotulo: 'não / improcedente' },
      { de: 'l-homol', para: 'l-fim' },
    ],
  },

  // 5) SALA DE GUERRA
  {
    id: 'sala', no: 'sala', titulo: 'Sala de guerra (PMI)',
    resumo: 'Da sugestão do sistema ao encerramento com lições aprendidas; prorrogar o prazo da missão é exceção registrada.',
    raias: [
      { id: 'sistema', nome: 'Sistema', descricao: 'Sugestões, indicadores e pauta.' },
      { id: 'equipe', nome: 'Equipe da sala', descricao: 'Ações, reuniões e decisões.' },
      { id: 'escalonamento', nome: 'Escalonamento', descricao: 'Secretário e gabinete.' },
    ],
    nos: [
      { id: 's-inicio', raia: 'sistema', linha: 1, tipo: 'inicio', titulo: 'Início: candidato sugerido', oQue: 'Prioridade alta com prazo vencido, ritmo vermelho, etapa parada há mais de 30 dias, contratação com saldo sem fonte ou entrega próxima em risco.', valida: ['Motivos e peso'], quem: 'Sistema', situacao: 'simulacao', fase: 'Etapa 1.5', telas: [T.sala] },
      { id: 's-abre', raia: 'equipe', linha: 2, tipo: 'decisao', titulo: 'Abrir sala?', oQue: 'Missão (objetivo crítico com prazo) ou crise (problema que ameaça o projeto).', valida: ['Objetivo, prazo, dono, cadência'], quem: 'Gestão de portfólio', situacao: 'simulacao', fase: 'Etapa 1.5', telas: [T.sala] },
      { id: 's-raid', raia: 'equipe', linha: 3, tipo: 'tarefa', titulo: 'Montar o quadro RAID', oQue: 'Riscos, ações (responsável e prazo), problemas e decisões. Projetos podem ser incluídos na sala (busca por nome, ID, órgão ou SEI) ou retirados dela com motivo; tudo fica no histórico.', valida: ['Toda ação com responsável e prazo', 'Retirar projeto exige motivo', 'A sala tem ao menos um projeto'], quem: 'Equipe da sala', situacao: 'simulacao', fase: 'Etapa 1.5', telas: [T.sala] },
      { id: 's-reuniao', raia: 'equipe', linha: 4, tipo: 'tarefa', titulo: 'Reuniões na cadência', oQue: 'Pauta gerada: objetivo e prazo, ações vencidas, problemas, riscos altos, decisões pendentes e o que mudou.', valida: ['Decisões e encaminhamentos registrados'], quem: 'Equipe da sala', situacao: 'simulacao', fase: 'Etapa 1.5', telas: [T.sala] },
      { id: 's-escala', raia: 'escalonamento', linha: 5, tipo: 'decisao', titulo: 'Precisa escalar?', oQue: 'Bloqueio fora do alcance da equipe sobe para o secretário (nível 2) ou o gabinete (nível 3).', valida: ['Nível de escalonamento'], quem: 'Dono da sala', situacao: 'simulacao', fase: 'Etapa 1.5', telas: [T.sala] },
      { id: 's-prorroga', raia: 'escalonamento', linha: 6, tipo: 'excecao', titulo: 'Prorrogar o prazo da missão', oQue: 'Quando o objetivo continua válido mas o prazo não será cumprido.', valida: ['Novo prazo e motivo'], quem: 'Secretário ou gabinete', situacao: 'simulacao', fase: 'Etapa 1.5', telas: [T.excecoes], excecao: { aceitaQuando: 'O objetivo segue válido e há causa identificada para o atraso.', registro: `${EXC}: prazo anterior, novo prazo, motivo e quem aprovou.` } },
      { id: 's-resolvido', raia: 'equipe', linha: 7, tipo: 'decisao', titulo: 'Objetivo alcançado?', oQue: 'A missão foi cumprida ou a crise resolvida.', valida: ['Evidência do resultado'], quem: 'Dono da sala', situacao: 'simulacao', fase: 'Etapa 1.5', telas: [T.sala] },
      { id: 's-encerra', raia: 'equipe', linha: 8, tipo: 'tarefa', titulo: 'Encerrar com lições aprendidas', oQue: 'Resultado e lições aprendidas, para não repetir o problema (PMI).', valida: ['Ao menos uma lição'], quem: 'Equipe da sala', situacao: 'simulacao', fase: 'Etapa 1.5', telas: [T.sala, T.log] },
      { id: 's-fim', raia: 'sistema', linha: 9, tipo: 'fim', titulo: 'Fim: sala encerrada', oQue: 'Fica na lista de encerradas, com todo o histórico.', valida: [], quem: 'Todos', situacao: 'simulacao', fase: 'Etapa 1.5', telas: [T.sala] },
    ],
    ligacoes: [
      { de: 's-inicio', para: 's-abre' },
      { de: 's-abre', para: 's-raid', rotulo: 'sim' },
      { de: 's-raid', para: 's-reuniao' },
      { de: 's-reuniao', para: 's-escala' },
      { de: 's-escala', para: 's-prorroga', rotulo: 'prazo' },
      { de: 's-escala', para: 's-resolvido', rotulo: 'não' },
      { de: 's-prorroga', para: 's-reuniao' },
      { de: 's-resolvido', para: 's-reuniao', rotulo: 'não' },
      { de: 's-resolvido', para: 's-encerra', rotulo: 'sim' },
      { de: 's-encerra', para: 's-fim' },
    ],
  },
];

/** Subfluxo que detalha um nó do mapa geral (ou undefined). */
export const subfluxoDoNo = (noId: string): Subfluxo | undefined => SUBFLUXOS.find((s) => s.no === noId);
