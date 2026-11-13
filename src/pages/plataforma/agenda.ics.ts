// Agenda iCalendar dos prazos do bloco Captação. Fica sob /plataforma/, portanto protegida pelo login (middleware).
import type { APIRoute } from 'astro';
import { gerarAgendaIcs } from '../../lib/dados/agenda.ts';

export const GET: APIRoute = () =>
  new Response(gerarAgendaIcs(), { headers: { 'Content-Type': 'text/calendar; charset=utf-8', 'Cache-Control': 'private, no-store' } });
