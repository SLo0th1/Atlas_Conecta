-- Compromisso do projeto: decidido, condicionado (só executa com recurso externo) ou ideia.
ALTER TABLE projeto ADD COLUMN IF NOT EXISTS compromisso text CHECK (compromisso IN ('decidido','condicionado','ideia'));
