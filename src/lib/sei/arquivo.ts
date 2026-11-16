// Lê o arquivo da página do SEI que a pessoa salvou no computador (Ctrl+S) e devolve o HTML como texto.
// Roda no navegador (o arquivo não sai do computador) e nos testes. Aceita:
// - "Página da Web, somente HTML" (.html/.htm), em ISO-8859-1 (original do SEI) ou UTF-8 (alguns navegadores convertem);
// - "Página da Web, arquivo único" (.mhtml/.mht), com a parte HTML em quoted-printable ou base64.

export const TAMANHO_MAXIMO_ARQUIVO = 8_000_000; // bytes

export type ResultadoArquivo = { ok: true; html: string } | { ok: false; erro: string };

const latin1 = (b: Uint8Array): string => new TextDecoder('iso-8859-1').decode(b);

/** Charset declarado no começo do HTML (meta), se houver. */
function charsetDeclarado(inicio: string): string | null {
  const m = /<meta[^>]+charset\s*=\s*["']?\s*([\w-]+)/i.exec(inicio);
  return m ? m[1].toLowerCase() : null;
}

function decodificar(bytes: Uint8Array, charset: string | null): string {
  const cs = charset ?? charsetDeclarado(latin1(bytes.subarray(0, 4096)));
  if (cs === 'utf-8' || cs === 'utf8') return new TextDecoder('utf-8').decode(bytes);
  if (cs && cs !== 'iso-8859-1' && cs !== 'latin1' && cs !== 'windows-1252') {
    // Charset incomum: tenta UTF-8 estrito e cai para Latin-1.
    try {
      return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    } catch {
      return latin1(bytes);
    }
  }
  return latin1(bytes);
}

/** Decodifica quoted-printable (=XX e quebras "=\n") para bytes. */
export function quotedPrintable(texto: string): Uint8Array {
  const limpo = texto.replace(/=\r?\n/g, '');
  const saida: number[] = [];
  for (let i = 0; i < limpo.length; i++) {
    const c = limpo[i];
    if (c === '=' && /^[0-9A-Fa-f]{2}$/.test(limpo.slice(i + 1, i + 3))) {
      saida.push(parseInt(limpo.slice(i + 1, i + 3), 16));
      i += 2;
    } else saida.push(limpo.charCodeAt(i) & 0xff);
  }
  return Uint8Array.from(saida);
}

/** Primeira parte text/html de um arquivo MHTML, já decodificada. */
function htmlDoMhtml(bruto: string): ResultadoArquivo {
  const fronteira = /boundary="?([^";\r\n]+)"?/i.exec(bruto)?.[1];
  if (!fronteira) return { ok: false, erro: 'Arquivo .mhtml sem as partes esperadas.' };
  for (const parte of bruto.split(`--${fronteira}`)) {
    const fimCab = parte.search(/\r?\n\r?\n/);
    if (fimCab < 0) continue;
    const cab = parte.slice(0, fimCab);
    if (!/content-type:\s*text\/html/i.test(cab)) continue;
    const corpo = parte.slice(fimCab).replace(/^\r?\n\r?\n/, '');
    const charset = /charset="?([\w-]+)/i.exec(cab)?.[1]?.toLowerCase() ?? null;
    const enc = /content-transfer-encoding:\s*([\w-]+)/i.exec(cab)?.[1]?.toLowerCase();
    let bytes: Uint8Array;
    if (enc === 'quoted-printable') bytes = quotedPrintable(corpo);
    else if (enc === 'base64') {
      try {
        bytes = Uint8Array.from(atob(corpo.replace(/\s+/g, '')), (ch) => ch.charCodeAt(0));
      } catch {
        return { ok: false, erro: 'Não consegui ler a parte da página dentro do .mhtml.' };
      }
    } else bytes = Uint8Array.from(corpo, (ch) => ch.charCodeAt(0) & 0xff);
    return { ok: true, html: decodificar(bytes, charset) };
  }
  return { ok: false, erro: 'O arquivo .mhtml não traz a página do processo.' };
}

/** Converte os bytes do arquivo salvo em HTML. Não interpreta nada: só decodifica. */
export function htmlDoArquivo(bytes: Uint8Array): ResultadoArquivo {
  if (!bytes || bytes.byteLength === 0) return { ok: false, erro: 'O arquivo está vazio.' };
  if (bytes.byteLength > TAMANHO_MAXIMO_ARQUIVO) return { ok: false, erro: 'Arquivo grande demais para ser a página de um processo.' };
  const inicio = latin1(bytes.subarray(0, 2048));
  if (/^\s*%PDF/.test(inicio)) return { ok: false, erro: 'Isso é um PDF. Aqui vai a página do processo salva pelo navegador (Ctrl+S).' };
  if (/^(?:From:|MIME-Version:|Content-Type:\s*multipart\/related)/im.test(inicio.slice(0, 600)) && /multipart\/related/i.test(inicio))
    return htmlDoMhtml(latin1(bytes));
  if (!/<(?:!doctype\s+html|html|head|body|table)\b/i.test(latin1(bytes.subarray(0, 200_000))))
    return { ok: false, erro: 'O arquivo não parece uma página da web salva.' };
  return { ok: true, html: decodificar(bytes, null) };
}
