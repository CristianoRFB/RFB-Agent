# RFBAgent — Atendimento que entende e executa com permissão

Produto 08 do RFB Labs, desenvolvido segundo o RFB Method GPT.

**Status:** software de homologação com dados sintéticos. Autenticação, permissões, histórico, busca lexical com fonte, propostas, confirmação transacional local, auditoria e solicitação humana foram implementados e testados no Firebase Emulator. **Não é IA generativa nem SaaS implantado.**

## Repositório e entrega

- Desenvolvimento em [PR draft #1](https://github.com/CristianoRFB/RFB-Agent/pull/1), sem merge e sem produção.
- Aplicação principal: pasta `web/` — React, TypeScript e Vite, login e Firestore no Emulator.
- Gateway autorizado: `gateway/server.mjs` — Node e Firebase Admin somente no localhost (não é Worker Cloudflare).
- Regras: `firebase/firestore.rules`; scripts e fixtures sintéticas no diretório `firebase/`.
- App antigo em `index.html` na raiz é demo **sem autenticação**; mantenha só como referência visual.

## Execução

Leia [docs/DEV-SETUP.md](docs/DEV-SETUP.md) para Node 24, Java 21, Firebase Emulators, seed de usuários fictícios, gateway, SPA e testes. Nunca use senhas, usuários reais ou conexão de produção.

## Qualidade

- Firestore Rules 13 testes PASS; gateway 10 PASS, domínio 7 PASS.
- Playwright integrado Chromium 3 PASS (Auth/Firestore/Gateway Emulator).
- React TypeScript + Vite build PASS.
- Detalhes e evidências: [docs/rfb/PROGRESS.md](docs/rfb/PROGRESS.md).

## Fonte e planejamento

[Especificação original](docs/source/ESPECIFICACAO-RFB.txt) · [Starter Pack](docs/source/STARTER-PACK.md) · [Catálogo de 58 telas](docs/source/UX-DESIGN-AND-QA.md) · [Diagramas do código](docs/IMPLEMENTED-DIAGRAMS.md) · [Rastreabilidade F01–F12](docs/FEATURE-TRACEABILITY.md) · [Plano Cloudflare](docs/CLOUDFLARE-PLAN.md).

**Meta R$ 0/mês:** nenhum produto pago habilitado, nenhum Cloudflare Worker/Pages RFBAgent criado. Cotas futuras precisam ser confirmadas. Não habilitar Blaze, pagamento, IA paga, SMS, produção ou merge sem revisão e autorização.

**90% do produto original NÃO foi atingido ou comprovado.** Código testado no Emulator é uma base operacional para desenvolvimento; APIs compatíveis com Cloudflare, IA semântica real, agenda externa, notificações, privacidade/backup e o catálogo integral de telas continuam pendentes.
