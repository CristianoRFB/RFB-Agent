# QA RUN — G2 RFBAgent Auth + Firestore Emulator

Checkpoint de execução 2026-11-22 America/Sao_Paulo / 2026-11-23 UTC.
Branch feature/rfb-agent-g1-vertical-simulator — [PR #1](https://github.com/CristianoRFB/RFB-Agent/pull/1).
Último commit funcional antes dos docs: 02e4093dc9d1ec28bd08edcd07565f220e67a6f4.

## Verificações reais

- **PASS 7/7** Node domínio: https://github.com/CristianoRFB/RFB-Agent/actions/runs/45095617034
- **PASS 13/13** Firestore Rules: https://github.com/CristianoRFB/RFB-Agent/actions/runs/45095616989
- **PASS 10/10** Gateway: https://github.com/CristianoRFB/RFB-Agent/actions/runs/45095823085
- **PASS** React typecheck e Vite build: https://github.com/CristianoRFB/RFB-Agent/actions/runs/45095617036
- **PASS 3/3** Playwright integrado Auth + Firestore + Node gateway: https://github.com/CristianoRFB/RFB-Agent/actions/runs/45095857436
- **PASS 3/3** Playwright demo anterior: https://github.com/CristianoRFB/RFB-Agent/actions/runs/45095617046

## Regressão resolvida

Playwright inicialmente falhou ao mostrar mensagem após enviar; log QA_DIAG_AFTER_SEND revelou consulta de subcoleção rejeitada pelas Firestore Rules (caminho de lista). `customerUid` foi incluído nos filhos, Rules e query foram ajustadas com checagem de propriedade; E2E depois passou.
Testes posteriores foram corrigidos quando antiga expectativa textual não correspondia mais à descrição de gateway, mantendo verificação de botão de reserva real desabilitado.

## Limitações objetivas

Executado apenas em `demo-rfbagent` local, contas sintéticas, gateway Node localhost. Screenshots no artifact do run Playwright, não equivalem a avaliação WCAG integral ou screenshots de produção.
Sem Firestore/Cloudflare de produção, IA semântica, calendário externo, envio de notificações ou testes de performance/recuperação de falhas em serviço real.
**NÃO HOMOLOGADO para dados reais ou publicação como serviço.**
