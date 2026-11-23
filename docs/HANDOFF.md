# HANDOFF RFBAgent — 22/11/2026

Repo: CristianoRFB/RFB-Agent; branch: feature/rfb-agent-g1-vertical-simulator; PR draft: https://github.com/CristianoRFB/RFB-Agent/pull/1
Base/main: f88e2039b9a84e7c7d18dbf7fb26b86436174bda
Starter/spec: d72f89ccb4351c36ee3490e216ebc3c2e32b1329
Último commit funcional: a34af92533a3e789eab3a31a47fb090fe002fc8a

## Reproduzir
Rodar a interface estática na pasta raiz com python -m http.server 4173 e abrir http://localhost:4173 (não abrir file:// porque importa módulos ES).
Rodar os testes: node --test tests/*.test.mjs, com Node.js 22 (nenhuma dependência npm).
Cenário: digitar 'Qual o horário de atendimento?', conferir fonte v1, propor horário futuro, confirmar somente no botão separado, confirmar retry sem duplicação, navegar em Auditoria e reiniciar.

## Evidência
V8 isolate domain smoke 6 PASS com structuredClone substituído por clone JSON; Node, Actions, browser, Firebase Rules e deploy NOT_RUN. Não inventar CI ou screenshot.

## Segurança/custo
Actor de teste controlado pelo browser, localStorage adulterável, auditoria local não confiável. Somente demonstração com dados sintéticos, sem IA real nem comunicação externa. Não habilitar pagamento, billing, SMS, login de clientes ou produção.

## Retomar
rfb:resume -> buscar HEAD atual, todos Issues e PRs (review/checks), fonte specs, docs/rfb/STATE.json, executar testes e QA com browser. S002: backend Auth/Firestore Rules no emulador, testes cross-tenant e confirmação verificável server-side. Depois migrar a UI para React+TypeScript+Vite e revisar 58 T-IDs conforme pertinência.
