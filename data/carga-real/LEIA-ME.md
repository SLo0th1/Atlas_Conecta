# Carga real TEMPORÁRIA — será retirada em breve

Esta pasta contém a carga da planilha de obras prioritárias da Prefeitura de Goiânia (abas PIPELINE e BASE_OPERACIONAL) e dos cronogramas do GEPP, publicada **temporariamente** no repositório público por decisão do dono do projeto (15/11/2026), para que a plataforma mostre os dados reais enquanto o banco de dados não está configurado.

- Será retirada quando o banco de dados (ou o repositório privado de dados) estiver em uso; a partir daí, nenhum dado real fica no repositório.
- Origem: `npm run importar:carteira` e `npm run importar:cronogramas` (ver `conciliacao.md` e `cronogramas-conciliacao.md`).
- O sistema lê esta pasta antes dos dados de exemplo; os testes automáticos usam sempre `data/exemplo` (variável `GOVNEXA_EXEMPLO=1`).
