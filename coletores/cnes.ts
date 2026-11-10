// Coletor Fase 1: CNES (estabelecimentos de saúde) via API de Dados Abertos do Ministério da Saúde.
// Uso: node coletores/cnes.ts
// Fonte: docs/fontes/datasus.md. API sem chave; limite real de 20 registros por página (limit/offset).
// Leitos: cnes-leitos. Equipamentos: cnes-equipamentos não retorna dados úteis (ver ficha).
// Saída: data/core/cnes-<ibge>.json (proveniência + resumo + lista de unidades públicas e hospitais; sem dados de profissionais).
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const BASE = 'https://apidadosabertos.saude.gov.br';
const POR_PAGINA = 20; // a API limita a 20, mesmo pedindo mais
const PAUSA_MS = 350;
const config = JSON.parse(await readFile('data/config/municipio.json', 'utf8')).municipios[0];
const IBGE: number = config.codigo_ibge;
const IBGE6 = String(IBGE).slice(0, 6); // a API usa o código de 6 dígitos
const pausa = () => new Promise((ok) => setTimeout(ok, PAUSA_MS));

async function api(caminho: string): Promise<any> {
  for (let tentativa = 1; tentativa <= 6; tentativa++) {
    try {
      const r = await fetch(`${BASE}/${caminho}`, { headers: { accept: 'application/json' } });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return await r.json();
    } catch (e) {
      if (tentativa === 6) throw new Error(`CNES ${caminho.split('?')[0]}: ${(e as Error).message}`);
      await new Promise((ok) => setTimeout(ok, 8000 * tentativa)); // espera progressiva
    }
  }
}

/** Pagina por limit/offset até vir página vazia/incompleta. `aceita` filtra no cliente; `max` é trava de segurança. */
async function paginar(caminho: string, chave: string, max: number): Promise<{ itens: any[]; paginas: number; lidos: number }> {
  const itens: any[] = [];
  let offset = 0;
  let pag = 0;
  for (; pag < max; pag++) {
    const j = await api(`${caminho}${caminho.includes('?') ? '&' : '?'}limit=${POR_PAGINA}&offset=${offset}`);
    const lote: any[] = j[chave] ?? [];
    if (!lote.length) break; // a API pode devolver menos que o limit (cnes-leitos: 1 por página); só página vazia encerra
    itens.push(...lote);
    offset += lote.length;
    await pausa();
  }
  if (pag >= max) throw new Error(`CNES ${caminho}: limite de ${max} páginas atingido (possível laço)`);
  return { itens, paginas: pag, lidos: itens.length };
}

const contar = <T>(lista: T[], chave: (x: T) => string) => {
  const m: Record<string, number> = {};
  for (const x of lista) m[chave(x)] = (m[chave(x)] ?? 0) + 1;
  return Object.fromEntries(Object.entries(m).sort((a, b) => b[1] - a[1]));
};

// natureza jurídica (tabela do IBGE/CONCLA): 1xxx pública, 2xxx entidade empresarial, 3xxx sem fins lucrativos, 4xxx pessoa física
const natureza = (cod: string | null) => {
  const d = String(cod ?? '').trim()[0];
  return ({ '1': 'Administração pública', '2': 'Entidade empresarial', '3': 'Entidade sem fins lucrativos', '4': 'Pessoa física' } as Record<string, string>)[d] ?? 'Não informada';
};
const GESTAO: Record<string, string> = { M: 'Municipal', E: 'Estadual', D: 'Dupla', S: 'Sem gestão' };

// 1) tipos de unidade (descrições)
const tiposRes = await api('cnes/tipounidades?limit=200');
const tipos: Record<number, string> = Object.fromEntries((tiposRes.tipos_unidade ?? []).map((t: any) => [t.codigo_tipo_unidade, t.descricao_tipo_unidade]));
await pausa();

// 2) estabelecimentos do município
const est = await paginar(`cnes/estabelecimentos?codigo_municipio=${IBGE6}`, 'estabelecimentos', 1000);
const todos = est.itens.filter((e) => String(e.codigo_municipio) === IBGE6);
const unicos = new Map<number, any>(todos.map((e) => [e.codigo_cnes, e]));
const lista = [...unicos.values()];
if (!lista.length) throw new Error('CNES: nenhum estabelecimento retornado para o município');
const ativos = lista.filter((e) => !e.codigo_motivo_desabilitacao_estabelecimento);
const tipoNome = (e: any) => tipos[e.codigo_tipo_unidade] ?? `Tipo ${e.codigo_tipo_unidade}`;
const ehTipo = (e: any, palavra: RegExp) => palavra.test(tipoNome(e));

const resumo = {
  total_estabelecimentos: lista.length,
  desabilitados: lista.length - ativos.length,
  por_tipo_unidade: contar(ativos, tipoNome),
  por_esfera_administrativa: contar(ativos, (e) => e.descricao_esfera_administrativa ?? 'NÃO INFORMADA'),
  por_natureza_juridica: contar(ativos, (e) => natureza(e.descricao_natureza_juridica_estabelecimento)),
  por_gestao: contar(ativos, (e) => GESTAO[String(e.tipo_gestao ?? '').trim()] ?? (e.tipo_gestao ? String(e.tipo_gestao) : 'Não informada')),
  atendimento_ambulatorial_sus: ativos.filter((e) => e.estabelecimento_faz_atendimento_ambulatorial_sus === 'SIM').length,
  com_atendimento_hospitalar: ativos.filter((e) => e.estabelecimento_possui_atendimento_hospitalar === 1).length,
  com_centro_cirurgico: ativos.filter((e) => e.estabelecimento_possui_centro_cirurgico === 1).length,
  com_centro_obstetrico: ativos.filter((e) => e.estabelecimento_possui_centro_obstetrico === 1).length,
  com_centro_neonatal: ativos.filter((e) => e.estabelecimento_possui_centro_neonatal === 1).length,
  georreferenciados: ativos.filter((e) => e.latitude_estabelecimento_decimo_grau != null && e.longitude_estabelecimento_decimo_grau != null).length,
  // contagens úteis para fundamentar projetos (por descrição do tipo de unidade)
  unidades_basicas_saude: ativos.filter((e) => ehTipo(e, /CENTRO DE SAUDE|UNIDADE BASICA|POSTO DE SAUDE/i)).length,
  upas: ativos.filter((e) => ehTipo(e, /^PRONTO ATENDIMENTO/i)).length, // tipo CNES 73 (UPA/pronto atendimento)
  hospitais: ativos.filter((e) => ehTipo(e, /^HOSPITAL/i)).length, // exclui 'unidade móvel pré-hospitalar'
  caps_e_psicossocial: ativos.filter((e) => ehTipo(e, /PSICOSSOCIAL|CAPS/i)).length,
  policlinicas_e_especialidades: ativos.filter((e) => ehTipo(e, /POLICLINICA|CLINICA\/CENTRO DE ESPECIALIDADE/i)).length,
  laboratorios_e_diagnose: ativos.filter((e) => ehTipo(e, /APOIO.*DIAGNOSE|LABORATORIO/i)).length,
  samu_e_urgencia_movel: ativos.filter((e) => ehTipo(e, /MOVEL|SAMU/i)).length,
  // ATENÇÃO: 'esfera administrativa' e 'gestão' no CNES indicam quem GERE o estabelecimento (muitos privados contratados são 'municipal'); propriedade pública = natureza jurídica 1xxx
  administracao_publica: ativos.filter((e) => natureza(e.descricao_natureza_juridica_estabelecimento) === 'Administração pública').length,
  por_tipo_unidade_administracao_publica: contar(ativos.filter((e) => natureza(e.descricao_natureza_juridica_estabelecimento) === 'Administração pública'), tipoNome),
};

// Lista sem dado pessoal: exclui natureza "Pessoa física" (consultórios de profissionais individuais); sem telefone/e-mail/CNPJ.
const unidades = ativos
  .filter((e) => natureza(e.descricao_natureza_juridica_estabelecimento) !== 'Pessoa física' && !/CONSULTORIO ISOLADO/i.test(tipoNome(e))) // LGPD: consultórios isolados/pessoa física só entram nas contagens
  .filter((e) => natureza(e.descricao_natureza_juridica_estabelecimento) === 'Administração pública' || ehTipo(e, /^HOSPITAL|^PRONTO ATENDIMENTO|PSICOSSOCIAL/i))
  .map((e) => ({
    codigo_cnes: e.codigo_cnes, nome: e.nome_fantasia ?? e.nome_razao_social, tipo: tipoNome(e),
    natureza: natureza(e.descricao_natureza_juridica_estabelecimento), esfera_gestao: e.descricao_esfera_administrativa, gestao: GESTAO[String(e.tipo_gestao ?? '').trim()] ?? null,
    bairro: e.bairro_estabelecimento, atende_sus_ambulatorial: e.estabelecimento_faz_atendimento_ambulatorial_sus === 'SIM',
    internacao: e.estabelecimento_possui_atendimento_hospitalar === 1,
    latitude: e.latitude_estabelecimento_decimo_grau, longitude: e.longitude_estabelecimento_decimo_grau, data_atualizacao: e.data_atualizacao,
  }));

// 3) leitos (endpoint cnes-leitos filtra por co_ibge + nu_comp, mas devolve 1 registro por página): usa a competência mais recente com dados
await pausa();
let comp = 0;
let leitosLinhas: any[] = [];
let pagLeitos = 0;
{
  const hoje = new Date();
  for (let k = 0; k < 8 && !comp; k++) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - k, 1);
    const c = d.getFullYear() * 100 + d.getMonth() + 1;
    const teste = await api(`assistencia-a-saude/cnes-leitos?co_ibge=${IBGE6}&nu_comp=${c}&limit=${POR_PAGINA}`);
    await pausa();
    if ((teste.cnes_leitos ?? []).length) comp = c;
  }
  if (comp) {
    const r = await paginar(`assistencia-a-saude/cnes-leitos?co_ibge=${IBGE6}&nu_comp=${comp}`, 'cnes_leitos', 5000);
    leitosLinhas = r.itens.filter((l) => String(l.co_ibge) === IBGE6 && l.nu_comp === comp);
    pagLeitos = r.paginas;
  }
}
const q = (campo: string, l: any[]) => l.reduce((s, x) => s + (Number(x[campo]) || 0), 0);
const hospLeitos = new Set(leitosLinhas.map((l) => l.co_cnes));
const ehUti = (l: any) => /UTI/i.test(l.ds_leito ?? '');
const leitos = {
  competencia: comp || null,
  observacao: 'Fonte assistencia-a-saude/cnes-leitos (filtro co_ibge + nu_comp); a API devolve 1 registro por página. Linhas = tipo de leito por estabelecimento.',
  linhas: leitosLinhas.length,
  estabelecimentos_com_leitos: hospLeitos.size,
  leitos_existentes: q('qt_existente', leitosLinhas),
  leitos_sus: q('qt_sus', leitosLinhas),
  leitos_uti_existentes: q('qt_existente', leitosLinhas.filter(ehUti)),
  leitos_uti_sus: q('qt_sus', leitosLinhas.filter(ehUti)),
  por_grupo_natureza: Object.fromEntries(Object.entries(leitosLinhas.reduce((m: Record<string, number>, l) => ((m[l.no_grupo_nat_jur ?? 'N/I'] = (m[l.no_grupo_nat_jur ?? 'N/I'] ?? 0) + (Number(l.qt_existente) || 0)), m), {})).sort((a, b) => b[1] - a[1])),
  por_tipo_leito: Object.fromEntries(Object.entries(leitosLinhas.reduce((m: Record<string, number>, l) => ((m[String(l.tp_leito).trim()] = (m[String(l.tp_leito).trim()] ?? 0) + (Number(l.qt_existente) || 0)), m), {})).sort((a, b) => b[1] - a[1])),
};

const coleta = new Date().toISOString();
const saida = {
  proveniencia: {
    fonte: 'Ministério da Saúde — API de Dados Abertos (CNES: estabelecimentos, tipos de unidade e leitos)',
    url_origem: `${BASE}/cnes/estabelecimentos?codigo_municipio=${IBGE6}`,
    data_referencia: `CNES, registros com data_atualizacao até ${lista.map((e) => e.data_atualizacao).filter(Boolean).sort().at(-1) ?? 'n/d'}`,
    data_coleta: coleta,
    id_carga: `cnes-${coleta.slice(0, 10)}`,
    paginas_estabelecimentos: est.paginas,
    paginas_leitos: pagLeitos,
  },
  municipio: { codigo_ibge: IBGE, codigo_ibge_6: IBGE6, nome: config.nome, uf: config.uf },
  resumo,
  leitos,
  unidades_publicas_e_hospitais: unidades,
};
await mkdir('data/core', { recursive: true });
await writeFile(`data/core/cnes-${IBGE}.json`, JSON.stringify(saida, null, 1) + '\n');
console.log(`${config.nome}: ${lista.length} estabelecimentos (${ativos.length} ativos), ${resumo.unidades_basicas_saude} UBS, ${resumo.upas} UPA/PA, ${resumo.hospitais} hospitais, ${resumo.caps_e_psicossocial} CAPS; leitos (competência ${leitos.competencia}): ${leitos.leitos_existentes} existentes, ${leitos.leitos_sus} SUS, ${leitos.leitos_uti_existentes} UTI`);
