// Município ativo (o marcado como piloto em data/config/municipio.json, ou o primeiro).
import config from '../../data/config/municipio.json' with { type: 'json' };

type MunicipioConfig = { codigo_ibge: number; nome: string; uf: string; piloto?: boolean; nome_exibicao?: string; logo?: string; logo_alt?: string };

export function municipioAtivo() {
  const lista = config.municipios as MunicipioConfig[];
  const m = lista.find((x) => x.piloto) ?? lista[0];
  return {
    codigo_ibge: m.codigo_ibge,
    nome: m.nome,
    uf: m.uf,
    nomeExibicao: m.nome_exibicao ?? `Prefeitura de ${m.nome}`,
    logo: m.logo ?? '/brand/prefeitura-goiania.png',
    logoAlt: m.logo_alt ?? `Prefeitura de ${m.nome}`,
  };
}
