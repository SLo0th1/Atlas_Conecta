// Tipos da leitura da página pública de um processo no SEI (pesquisa pública, md_pesq_processo_exibir.php).
// Só entram dados de processo (números, tipos, datas, unidades e descrições de andamento). Interessados não entram.

export interface DocumentoSei {
  numero: string; // número SEI do documento
  tipo: string; // como aparece na coluna "Tipo" (ex.: "Edital", "Parecer Jurídico 12")
  data: string | null; // AAAA-MM-DD
  unidade: string; // sigla da unidade (ex.: "SECAP/GERCES")
  publico: boolean; // true = a página traz o link do conteúdo; false = restrito (conteúdo entra por PDF)
}

export interface AndamentoSei {
  dataHora: string; // AAAA-MM-DDTHH:MM
  unidade: string;
  descricao: string;
}

export interface ProcessoSei {
  numero: string | null; // número do processo (ex.: "26.9.000000446-9")
  tipo: string | null; // ex.: "Licitação"
  geradoEm: string | null; // AAAA-MM-DD
  totalDocumentos: number | null; // número da legenda "Lista de Protocolos (N registros)"
  totalAndamentos: number | null; // número da legenda "Lista de Andamentos (N registros)"
  documentos: DocumentoSei[]; // na ordem da página (mais antigo primeiro)
  andamentos: AndamentoSei[]; // mais recente primeiro
}
