/** Marca do produto. A plataforma já usa GovNexa. Para usar também no site público e no login, troque USAR_NO_SITE_PUBLICO para true (aguarda decisão do dono). */
export const MARCA = { nome: 'GovNexa', slogan: 'Inteligência para a gestão pública', nomeCompleto: 'GovNexa — Inteligência para a gestão pública' } as const;
export const MARCA_LEGADA = { nome: 'Atlas Goiânia Conecta', curto: 'Atlas Conecta' } as const;
export const USAR_NO_SITE_PUBLICO = false;
/** Nome da marca para uma página: plataforma sempre GovNexa; site público conforme USAR_NO_SITE_PUBLICO. */
export const nomeDaMarca = (plataforma: boolean): string => (plataforma || USAR_NO_SITE_PUBLICO ? MARCA.nome : MARCA_LEGADA.nome);
