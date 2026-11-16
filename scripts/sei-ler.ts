// Lê UMA vez a página pública de um processo no SEI e mostra o resumo na tela. Não grava nada.
// Uso: npm run sei:ler -- "<link público do processo>"
// Regras: só o link público já obtido (sem captcha); uma requisição; nenhum disfarce de navegador.
import { validarLinkSei } from '../src/lib/sei/link.ts';
import { lerPaginaProcesso } from '../src/lib/sei/leitor.ts';
import { marcosDoProcesso, ondeEsta, paralisacaoAberta, resumirProcesso, sugerirEtapa } from '../src/lib/sei/analise.ts';
import { hojeEmBrasilia } from '../src/lib/whatsapp/farol.ts';

const LIMITE_BYTES = 5_000_000; // a maior página real testada tinha ~400 KB
const br = (iso: string | null): string => (iso ? iso.slice(0, 10).split('-').reverse().join('/') : '—');

async function main(): Promise<number> {
  const r = validarLinkSei(process.argv[2]);
  if (!r.ok) {
    console.error(`Link recusado: ${r.erro}`);
    return 2;
  }
  const resp = await fetch(r.url, { signal: AbortSignal.timeout(30_000), redirect: 'error' });
  if (!resp.ok) {
    console.error(`O SEI respondeu ${resp.status}.`);
    return 1;
  }
  const tipo = resp.headers.get('content-type') ?? '';
  if (!/^text\/html\b/i.test(tipo)) {
    console.error(`O SEI respondeu com um tipo inesperado (${tipo.slice(0, 60) || 'sem tipo'}).`);
    return 1;
  }
  // Lê aos pedaços e para acima do limite (não confia no tamanho anunciado).
  const partes: Uint8Array[] = [];
  let lidos = 0;
  if (!resp.body) {
    console.error('O SEI respondeu sem conteúdo.');
    return 1;
  }
  const leitor = resp.body.getReader();
  for (;;) {
    const { done, value } = await leitor.read();
    if (done) break;
    lidos += value.byteLength;
    if (lidos > LIMITE_BYTES) {
      await leitor.cancel();
      console.error(`Página maior que ${LIMITE_BYTES / 1_000_000} MB; leitura interrompida.`);
      return 1;
    }
    partes.push(value);
  }
  const bytes = new Uint8Array(lidos);
  let pos = 0;
  for (const p of partes) {
    bytes.set(p, pos);
    pos += p.byteLength;
  }
  const charset = /charset=([\w-]+)/i.exec(tipo)?.[1] ?? 'iso-8859-1';
  const html = new TextDecoder(charset.toLowerCase() === 'utf-8' ? 'utf-8' : 'iso-8859-1').decode(bytes);
  const p = lerPaginaProcesso(html);
  if (!p) {
    console.error('A página não trouxe o processo (link vencido, captcha ou página mudou).');
    return 1;
  }
  const hoje = hojeEmBrasilia();
  const res = resumirProcesso(p);
  const onde = ondeEsta(p, hoje);
  console.log(`Processo ${p.numero ?? '?'} · ${p.tipo ?? '?'} · gerado em ${br(p.geradoEm)}`);
  console.log(`Documentos: ${res.documentos} (${res.publicos} públicos, ${res.restritos} restritos) · Andamentos: ${res.andamentos}${res.incompleto ? ' · ATENÇÃO: a página trouxe menos registros que a legenda' : ''}`);
  if (onde) console.log(`Onde está: ${onde.unidade} desde ${br(onde.desde)} (${onde.dias ?? '?'} dias) · último andamento ${br(onde.ultimo.dataHora)} ${onde.ultimo.dataHora.slice(11)}: ${onde.ultimo.descricao}`);
  console.log('Documentos-chave:');
  for (const m of marcosDoProcesso(p)) console.log(`  - ${m.marco.rotulo}: ${m.quantos} (primeiro em ${br(m.primeiro.data)}, ${m.primeiro.publico ? 'público' : 'restrito'})`);
  const s = sugerirEtapa(p, null);
  if (s.tipo !== 'sem_marco') console.log(`Etapa indicada pelos documentos: ${s.etapa}${s.conferir ? ' (conferir)' : ''}, pelo documento ${s.base.marco.rotulo}`);
  const par = paralisacaoAberta(p);
  if (par) console.log(`ALERTA: termo de paralisação em ${br(par.data)} sem termo de reinício depois.`);
  return 0;
}

main().then(
  (c) => process.exit(c),
  (e) => {
    console.error(`Falha ao ler o SEI: ${e instanceof Error ? e.message : String(e)}`);
    process.exit(1);
  },
);
