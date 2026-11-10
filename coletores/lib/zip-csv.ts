// Utilitários compartilhados pelos coletores de arquivos abertos (ZIP com um CSV dentro).
// Leitura em fluxo (não carrega o arquivo inteiro), CSV com aspas, ';' e quebras de linha dentro do campo.
import { spawn } from 'node:child_process';
import { createWriteStream } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

const tarBin = process.platform === 'win32' ? 'C:/Windows/System32/tar.exe' : 'bsdtar';
export type Linha = Record<string, string>;

export async function baixarArquivo(url: string, destino: string, cabecalhos: Record<string, string> = {}): Promise<string> {
  await mkdir(destino.replace(/[\/][^\/]+$/, ''), { recursive: true });
  for (let tentativa = 1; tentativa <= 3; tentativa++) {
    try {
      const r = await fetch(url, { headers: cabecalhos });
      if (!r.ok || !r.body) throw new Error(`HTTP ${r.status}`);
      await pipeline(Readable.fromWeb(r.body as any), createWriteStream(destino));
      return destino;
    } catch (e) {
      if (tentativa === 3) throw new Error(`${url}: ${(e as Error).message}`);
      await new Promise((ok) => setTimeout(ok, 5000 * tentativa)); // espera progressiva
    }
  }
  throw new Error('inalcançável');
}

export async function* registrosCsv(zip: string): AsyncGenerator<Linha> {
  const p = spawn(tarBin, ['-xOf', zip], { stdio: ['ignore', 'pipe', 'ignore'] });
  const dec = new TextDecoder('utf-8');
  let campo = '';
  let linha: string[] = [];
  let aspas = false;
  let cabecalho: string[] | null = null;
  let primeiro = true;
  const fechaLinha = function* (): Generator<Linha> {
    linha.push(campo);
    campo = '';
    if (!cabecalho) cabecalho = linha.map((c) => c.replace(/^\uFEFF/, '').trim());
    else if (linha.length === cabecalho.length) {
      const o: Linha = {};
      cabecalho.forEach((k, i) => (o[k] = linha[i]));
      yield o;
    }
    linha = [];
  };
  for await (const pedaco of p.stdout) {
    const texto = dec.decode(pedaco as Buffer, { stream: true });
    for (let i = 0; i < texto.length; i++) {
      const c = texto[i];
      if (primeiro) { primeiro = false; if (c === '\uFEFF') continue; }
      if (aspas) {
        if (c === '"') {
          if (texto[i + 1] === '"') { campo += '"'; i++; } else aspas = false;
        } else campo += c;
      } else if (c === '"') aspas = true;
      else if (c === ';') { linha.push(campo); campo = ''; }
      else if (c === '\n') yield* fechaLinha();
      else if (c !== '\r') campo += c;
    }
  }
  if (campo || linha.length) yield* fechaLinha();
}
