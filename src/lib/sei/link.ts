// Validação do link público de um processo no SEI.
// Só aceita a página de exibição da pesquisa pública, em HTTPS, de um endereço do SEI conhecido.
// Nunca aceita a tela de pesquisa (que pede captcha) nem links de outro site.

/** Endereços do SEI aceitos. Cada prefeitura nova acrescenta o seu aqui (ou, com o banco, na configuração da prefeitura). */
export const HOSTS_SEI = ['sei.goiania.go.gov.br'];

export const CAMINHO_PROCESSO = '/sei/modulos/pesquisa/md_pesq_processo_exibir.php';
const TOKEN = /^[A-Za-z0-9_-]{20,400}$/;
export const TAMANHO_MAXIMO_LINK = 600;

export type ResultadoLink = { ok: true; url: string } | { ok: false; erro: string };

export function validarLinkSei(texto: unknown, hosts: string[] = HOSTS_SEI): ResultadoLink {
  const bruto = String(texto ?? '').trim();
  if (!bruto) return { ok: false, erro: 'Cole o link da página do processo.' };
  if (bruto.length > TAMANHO_MAXIMO_LINK) return { ok: false, erro: 'Link longo demais para ser do SEI.' };
  let u: URL;
  try {
    u = new URL(bruto);
  } catch {
    return { ok: false, erro: 'Isso não é um link. Copie o endereço inteiro da barra do navegador.' };
  }
  if (u.protocol !== 'https:') return { ok: false, erro: 'O link precisa começar com https://.' };
  if (u.username || u.password || u.port) return { ok: false, erro: 'Link com usuário, senha ou porta não é aceito.' };
  if (!hosts.includes(u.hostname.toLowerCase())) return { ok: false, erro: `O link precisa ser do SEI da prefeitura (${hosts.join(', ')}).` };
  if (u.pathname === '/sei/modulos/pesquisa/md_pesq_processo_pesquisar.php')
    return { ok: false, erro: 'Esse é o link da tela de pesquisa. Abra o processo e copie o link da página dele.' };
  if (u.pathname !== CAMINHO_PROCESSO) return { ok: false, erro: 'Esse não é o link da página de um processo (md_pesq_processo_exibir.php).' };
  if (u.hash) return { ok: false, erro: 'Tire a parte depois do # do link.' };
  const token = u.search.slice(1);
  if (!TOKEN.test(token)) return { ok: false, erro: 'O código do processo no link está incompleto ou com caracteres estranhos.' };
  return { ok: true, url: `https://${u.hostname.toLowerCase()}${CAMINHO_PROCESSO}?${token}` };
}

/** Versão curta para mostrar na tela: endereço + começo do código. O link inteiro funciona como uma chave de acesso. */
export function mascararLinkSei(url: string): string {
  const r = validarLinkSei(url);
  if (!r.ok) return 'link inválido';
  const u = new URL(r.url);
  return `${u.hostname} · processo ${u.search.slice(1, 7)}…`;
}
