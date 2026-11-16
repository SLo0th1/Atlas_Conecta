// Página FICTÍCIA de um processo no SEI, com a mesma estrutura da página pública real (tabelas tblCabecalho,
// tblDocumentos e tblHistorico). Usada na tela de demonstração e nos testes. Números, unidades e códigos são inventados.

export interface DocExemplo { numero: string; tipo: string; data: string; unidade: string; publico: boolean }
export interface AndExemplo { dataHora: string; unidade: string; descricao: string }

export const DOCUMENTOS_EXEMPLO: DocExemplo[] = [
  { numero: '90000001', tipo: 'Documento de Formalização da Demanda', data: '01/07/2026', unidade: 'SEC-EXEMPLO/GERPLAN', publico: true },
  { numero: '90000002', tipo: 'Anexo Documento de Formalização de Demanda', data: '01/07/2026', unidade: 'SEC-EXEMPLO/GERPLAN', publico: true },
  { numero: '90000003', tipo: 'Estudo Técnico Preliminar - ETP', data: '15/07/2026', unidade: 'SEC-EXEMPLO/GERPLAN', publico: true },
  { numero: '90000004', tipo: 'Termo de Referência', data: '20/07/2026', unidade: 'SEC-EXEMPLO/GERPLAN', publico: false },
  { numero: '90000005', tipo: 'Matriz de Risco 3', data: '20/07/2026', unidade: 'SEC-EXEMPLO/GERPLAN', publico: true },
  { numero: '90000006', tipo: 'Mapa de Preços', data: '28/07/2026', unidade: 'SEC-EXEMPLO/GERCOMP', publico: false },
  { numero: '90000007', tipo: 'Minuta de Contrato 2', data: '05/08/2026', unidade: 'SEC-EXEMPLO/GERCOMP', publico: true },
  { numero: '90000008', tipo: 'Despacho 41', data: '06/08/2026', unidade: 'SEC-EXEMPLO/GAB', publico: true },
  { numero: '90000009', tipo: 'Parecer Jurídico 120', data: '19/08/2026', unidade: 'PROCURADORIA/CONTRAT', publico: false },
  { numero: '90000010', tipo: 'Edital', data: '25/08/2026', unidade: 'SEC-EXEMPLO/CPL', publico: true },
  { numero: '90000011', tipo: 'Aviso de Licitação', data: '25/08/2026', unidade: 'SEC-EXEMPLO/CPL', publico: true },
  { numero: '90000012', tipo: 'Contrato Social', data: '20/09/2026', unidade: 'SEC-EXEMPLO/CPL', publico: false },
  { numero: '90000013', tipo: 'Ata de Julgamento', data: '30/09/2026', unidade: 'SEC-EXEMPLO/CPL', publico: true },
];

export const ANDAMENTOS_EXEMPLO: AndExemplo[] = [
  { dataHora: '05/11/2026 10:12', unidade: 'SEC-EXEMPLO/CPL', descricao: 'Processo recebido na unidade' },
  { dataHora: '04/11/2026 17:40', unidade: 'SEC-EXEMPLO/CPL', descricao: 'Processo remetido pela unidade SEC-EXEMPLO/GAB' },
  { dataHora: '30/09/2026 16:03', unidade: 'SEC-EXEMPLO/CPL', descricao: 'Gerado documento público nº 90000013' },
  { dataHora: '20/09/2026 09:00', unidade: 'SEC-EXEMPLO/GAB', descricao: 'Dúvidas: contato.exemplo@exemplo.gov.br' },
  { dataHora: '19/08/2026 14:30', unidade: 'PROCURADORIA/CONTRAT', descricao: 'Processo recebido na unidade' },
  { dataHora: '01/07/2026 08:15', unidade: 'SEC-EXEMPLO/GERPLAN', descricao: 'Processo público gerado' },
];

const linhaDoc = (d: DocExemplo, i: number): string => {
  const numero = d.publico
    ? `<td align="center" style="padding-right:22px"><a href="javascript:void(0);" onclick="window.open('md_pesq_documento_consulta_externa.php?CodigoFicticio${i}AAAAAAAAAAAAAAAAAAAA');" title="${d.tipo}" class="ancoraPadraoAzul">${d.numero}</a></td>`
    : // Restrito: igual à página real, a célula do número não fecha o </td>.
      `<td align="center"><span class="retiraAncoraPadraoAzul">${d.numero}</span><img src="/infra_css/imagens/espaco.gif"><img src="../pesquisa/imagens/sei_chave_documento_restrito.svg" title="Acesso Restrito. &#13Provisoriamente">`;
  return `<tr class="infraTrClara"><td align="center" class="no-print"><input class="infraCheckbox" type="checkbox" value="${d.numero}"/></td>${numero}<td align="center">${d.tipo} </td><td align="center">${d.data}</td><td align="center">${d.data}</td><td align="center"><a class="ancoraSigla">${d.unidade}</a></td><td align="center" class="colunaAcoes"></td></tr>`;
};

const linhaAnd = (a: AndExemplo): string =>
  `<tr class="andamentoAberto"> <td align="center">${a.dataHora}</td> <td align="center"><a class="ancoraSigla">${a.unidade}</a></td> <td>${a.descricao}<span style="line-height:.5em"><br /></span></td></tr>`;

/** HTML da página fictícia. `semTabelas` = página sem as tabelas (como a tela de captcha ou um link vencido). */
export function paginaExemplo(opcoes: { semTabelas?: boolean } = {}): string {
  const cab = `<table id="tblCabecalho" class="infraTable" summary="Cabeçalho de Processo">
<tr><td width="20%"><b>Processo:</b></td><td>99.9.000000123-4</td></tr>
<tr><td width="20%"><b>Tipo:</b></td><td>Licitação</td></tr>
<tr><td width="20%"><b>Data de Geração:</b></td><td>01/07/2026</td></tr>
<tr><td width="20%"><b>Interessados:</b></td><td>Pessoa Fictícia da Silva</td></tr>
</table>`;
  if (opcoes.semTabelas)
    return `<html><body><form><img id="imgCaptcha" src="/infra_gerar_captcha.php"><input name="txtCaptcha"></form>${cab}</body></html>`;
  return `<html><head><meta http-equiv="Content-Type" content="text/html; charset=iso-8859-1"/></head><body>
${cab}
<table id="tblDocumentos" class="infraTable" summary="Lista de Documentos">
<caption class="infraCaption">Lista de Protocolos (${DOCUMENTOS_EXEMPLO.length} registros):</caption>
<tr><th class="infraTh">&nbsp;</th><th class="infraTh">Processo / Documento</th><th class="infraTh">Tipo</th><th class="infraTh">Data</th><th class="infraTh">Data de Inclusão</th><th class="infraTh">Unidade</th></tr>
${DOCUMENTOS_EXEMPLO.map(linhaDoc).join('\n')}
</table>
<table id="tblHistorico" class="infraTable" summary="Histórico de Andamentos">
<caption class="infraCaption">Lista de Andamentos (${ANDAMENTOS_EXEMPLO.length} registros):</caption>
<tr><th class="infraTh">Data/Hora</th><th class="infraTh">Unidade</th><th class="infraTh">Descrição</th></tr>
${ANDAMENTOS_EXEMPLO.map(linhaAnd).join('\n')}
</table>
</body></html>`;
}
