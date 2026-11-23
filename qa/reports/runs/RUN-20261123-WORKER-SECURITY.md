# QA RUN 2026-11-23 — Worker, tenant, booking, fila humana

PR #1 do RFBAgent. HEAD de código: 75a697a6345f60ef66cf0b6de93623b30d1ad3ce
Verificações reais do GitHub Actions: domínio 7/7, Rules 13/13, gateway 14/14, Worker unit 13/13, Firestore REST 4/4, React build PASS, cf build PASS, Playwright integrado 3/3 PASS.

## Regressões encontradas e resolvidas
- Risco P0: duas propostas podiam confirmar mesmo horário → lock por empresa e bloco UTC de 30min, cancelamento transacional e teste concorrente.
- Worker REST: `ABORTED Transaction lock timeout` após caminho read-only/replay; teste isolado e logs demonstraram locks abertos. Solução: `rollback` transação em branches sem escrita/erro, sem remover a checagem de concorrência.
- UI: teste de confirmação/handoff continha copy antigo e seletor de fila ambíguo; corrigido para verificar comportamento alvo e deixar CI reproduzível.
- Security: staff podia atualizar status sem audit diretamente pelo Firestore SDK; alteração negada em Rules, novos fluxos server-only com audit.

## Limitações
Todos os tests: dados sintéticos Firebase Auth/Firestore Emulator. Worker API compilado e REST validado no Emulator, não executado em Cloudflare Worker autenticado com service account real.
Não incluiu testes de produto com dados reais, LLM, calendário externo, e-mail/SMS, LGPD, performance em escala, WCAG total, rollback de staging.

## Evidências
- https://github.com/CristianoRFB/RFB-Agent/actions/runs/45179282407
- https://github.com/CristianoRFB/RFB-Agent/actions/runs/45179282287
- https://github.com/CristianoRFB/RFB-Agent/actions/runs/45179282618
- https://github.com/CristianoRFB/RFB-Agent/actions/runs/45179282327
- https://github.com/CristianoRFB/RFB-Agent/actions/runs/45179282353
- https://github.com/CristianoRFB/RFB-Agent/actions/runs/45179282396
- https://github.com/CristianoRFB/RFB-Agent/actions/runs/45179282459
