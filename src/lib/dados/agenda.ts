// Agenda iCalendar (.ics) com os prazos do bloco Captação: importável no Google Agenda, Outlook e Apple Calendar.
// Eventos de dia inteiro, com lembretes 30 e 7 dias antes. Só datas futuras; UIDs estáveis para atualizar em vez de duplicar.
// Plano Mestre 5.4: "todo alerta pode virar evento na agenda da equipe responsável".
import { dados, type Documento } from './index.ts';
import { IBGE } from './alertas.ts';

const iso = (d: string | null | undefined): string | null => {
  if (!d) return null;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(d)) return `${d.slice(6)}-${d.slice(3, 5)}-${d.slice(0, 2)}`;
  return /^\d{4}-\d{2}-\d{2}/.test(d) ? d.slice(0, 10) : null;
};
const ymd = (d: string) => d.replace(/-/g, '');
const mais1 = (d: string) => { const t = new Date(`${d}T00:00:00Z`); t.setUTCDate(t.getUTCDate() + 1); return t.toISOString().slice(0, 10); };
const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
/** Dobra linhas longas (RFC 5545: máximo de 75 octetos). */
const dobra = (linha: string): string => {
  const partes: string[] = [];
  let resto = linha;
  while (Buffer.byteLength(resto) > 74) {
    let corte = 74;
    while (Buffer.byteLength(resto.slice(0, corte)) > 74) corte -= 1;
    partes.push(resto.slice(0, corte));
    resto = ' ' + resto.slice(corte);
  }
  partes.push(resto);
  return partes.join('\r\n');
};

type Evento = { uid: string; data: string; titulo: string; descricao: string; categoria: string };

export function eventosDaAgenda(hoje: Date = new Date()): Evento[] {
  const limite = hoje.toISOString().slice(0, 10);
  const ev: Evento[] = [];
  const ac = dados.acompanhamento(IBGE);
  for (const c of ((ac?.convenios as Documento[]) ?? []).filter((x) => /^Em execu/i.test(x.situacao ?? ''))) {
    const fim = iso(c.vigencia_fim);
    if (fim && fim >= limite)
      ev.push({ uid: `vigencia-${c.nr_convenio}`, data: fim, titulo: `Fim da vigência do convênio ${c.nr_convenio}`, categoria: 'Convênio', descricao: `${c.objeto ?? ''} | Concedente: ${c.orgao_superior ?? '—'} | Repasse ${c.valor_repasse ?? '—'}, liberado ${c.valor_desembolsado ?? 0}. Avaliar prorrogação ou aditivo.` });
    const pc = iso(c.limite_prestacao_contas);
    if (pc && pc >= limite)
      ev.push({ uid: `prestacao-${c.nr_convenio}`, data: pc, titulo: `Limite da prestação de contas do convênio ${c.nr_convenio}`, categoria: 'Convênio', descricao: `${c.objeto ?? ''} | Preparar e enviar a prestação de contas.` });
  }
  const cauc = dados.cauc(IBGE);
  for (const i of ((cauc?.itens as Documento[]) ?? [])) {
    const v = iso(i.validade);
    if (i.situacao === 'regular' && v && v >= limite)
      ev.push({ uid: `cauc-${i.item}-${v}`, data: v, titulo: `CAUC: vence a comprovação do item ${i.item}`, categoria: 'CAUC', descricao: `${i.descricao}. Renovar a comprovação antes do vencimento (pendência no CAUC bloqueia transferências voluntárias).` });
  }
  for (const p of ((dados.programasAbertos(IBGE)?.programas as Documento[]) ?? [])) {
    const prazo = iso(p.prazos?.proposta_ate ?? p.prazos?.emendas_ate ?? p.prazos?.beneficiario_especifico_ate);
    if (prazo && prazo >= limite)
      ev.push({ uid: `programa-${p.codigo}-${prazo}`, data: prazo, titulo: `Prazo do programa ${p.codigo}: ${String(p.nome).slice(0, 70)}`, categoria: 'Oportunidade', descricao: `${p.nome} (${p.orgao_superior}). ${p.prazos?.proposta_ate ? 'Prazo de proposta.' : 'Prazo de propostas ligadas a emendas parlamentares.'} Ver detalhes na aba Oportunidades.` });
  }
  return ev.sort((a, b) => a.data.localeCompare(b.data));
}

export function gerarAgendaIcs(hoje: Date = new Date()): string {
  const agora = hoje.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const linhas: string[] = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Atlas Conecta//Captacao//PT-BR', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'X-WR-CALNAME:Atlas Conecta - Captacao', 'X-WR-TIMEZONE:America/Sao_Paulo'];
  for (const e of eventosDaAgenda(hoje)) {
    linhas.push(
      'BEGIN:VEVENT', `UID:${e.uid}@atlas-conecta`, `DTSTAMP:${agora}`,
      `DTSTART;VALUE=DATE:${ymd(e.data)}`, `DTEND;VALUE=DATE:${ymd(mais1(e.data))}`,
      `SUMMARY:${esc(e.titulo)}`, `DESCRIPTION:${esc(e.descricao)}`, `CATEGORIES:${esc(e.categoria)}`, 'TRANSP:TRANSPARENT',
      'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${esc(e.titulo)}`, 'TRIGGER:-P30D', 'END:VALARM',
      'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${esc(e.titulo)}`, 'TRIGGER:-P7D', 'END:VALARM',
      'END:VEVENT',
    );
  }
  linhas.push('END:VCALENDAR');
  return linhas.map(dobra).join('\r\n') + '\r\n';
}
