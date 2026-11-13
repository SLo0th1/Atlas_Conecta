// Limitador de tentativas de login (vetores 6 e 9 da linha de base de segurança).
// Contagem por IP e por e-mail, com bloqueio progressivo depois de MAX_FALHAS falhas na janela.
// LIMITAÇÃO CONHECIDA: o estado fica na memória da função; em ambiente serverless cada instância tem a sua contagem
// e ela some quando a instância é reciclada. Serve como defesa em profundidade; a proteção principal contra força
// bruta distribuída deve ser a regra de Rate Limiting do Vercel Firewall (ver docs/seguranca.md).
const JANELA_MS = 15 * 60 * 1000; // falhas contam por 15 minutos
const MAX_FALHAS = 5; // a partir da 5ª falha na janela, bloqueia
const BLOQUEIO_BASE_MS = 60 * 1000; // 1 min, dobra a cada falha adicional
const BLOQUEIO_MAX_MS = 60 * 60 * 1000; // teto de 1 h
const MAX_REGISTROS = 5000; // evita crescimento ilimitado da memória

type Registro = { falhas: number; primeira: number; bloqueadoAte: number };
const registros = new Map<string, Registro>();

/** Chaves de contagem de uma tentativa: IP do cliente e e-mail normalizado (sem revelar se o e-mail existe). */
export function chavesDe(request: Request, email: unknown): string[] {
  const encaminhado = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const ip = encaminhado || request.headers.get('x-real-ip') || 'desconhecido';
  const chaves = [`ip:${ip.slice(0, 64)}`];
  if (typeof email === 'string' && email.trim()) chaves.push(`email:${email.trim().toLowerCase().slice(0, 120)}`);
  return chaves;
}

function limpar(agora: number) {
  if (registros.size < MAX_REGISTROS) return;
  for (const [chave, r] of registros) if (r.bloqueadoAte < agora && agora - r.primeira > JANELA_MS) registros.delete(chave);
  if (registros.size >= MAX_REGISTROS) registros.clear(); // último recurso: nunca deixar a memória crescer sem limite
}

/** Segundos até poder tentar de novo (0 = liberado). */
export function segundosBloqueado(chaves: string[], agora = Date.now()): number {
  let ate = 0;
  for (const c of chaves) ate = Math.max(ate, registros.get(c)?.bloqueadoAte ?? 0);
  return ate > agora ? Math.ceil((ate - agora) / 1000) : 0;
}

export function registrarFalha(chaves: string[], agora = Date.now()): void {
  limpar(agora);
  for (const c of chaves) {
    let r = registros.get(c);
    if (!r || agora - r.primeira > JANELA_MS) r = { falhas: 0, primeira: agora, bloqueadoAte: 0 };
    r.falhas += 1;
    if (r.falhas >= MAX_FALHAS) r.bloqueadoAte = agora + Math.min(BLOQUEIO_BASE_MS * 2 ** (r.falhas - MAX_FALHAS), BLOQUEIO_MAX_MS);
    registros.set(c, r);
  }
}

export function registrarSucesso(chaves: string[]): void {
  for (const c of chaves) registros.delete(c);
}
