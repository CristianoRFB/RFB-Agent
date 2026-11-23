# HANDOFF — RFBAgent / 22 de novembro de 2026

Repositório: https://github.com/CristianoRFB/RFB-Agent
PR existente: https://github.com/CristianoRFB/RFB-Agent/pull/1 (draft; não mesclado)
Branch: feature/rfb-agent-g1-vertical-simulator
Baseline original main: f88e2039b9a84e7c7d18dbf7fb26b86436174bda
Último commit de código antes deste handoff: 02e4093dc9d1ec28bd08edcd07565f220e67a6f4

## Começar a próxima sessão

1. Ler docs/rfb/STATE.json, docs/FEATURE-TRACEABILITY.md, docs/CLOUDFLARE-PLAN.md, docs/DEV-SETUP.md.
2. Conferir HEAD real, Issues e PRs abertos e checks do commit atual; não recriar PR.
3. Reproduzir com Node24/Java21, somente Auth/Firestore Emulators, gateway 8787, React 5173; instruções completas em docs/DEV-SETUP.md.
4. Referenciar os últimos runs PASS: Rules 13/13, Gateway 10/10, React build, E2E integrado 3/3 (URLs em PROGRESS).
5. Verificar ainda QA por leitor de tela/contraste, negativa cross-tenant em staging e Worker adapter antes de deploy.

## Riscos e custos

Sem deploy Cloudflare. Conta Cloudflare consultada apenas read-only: nenhum Worker/Pages RFBAgent existente.
Nenhum Firebase real, Blaze, domínio próprio ou API de IA paga. Meta custo recorrente R$0, sujeita a quotas futuras.
Dados em desenvolvimento são sintéticos, Auth/Firebase Emulator, gateway Node localhost, não seguro para produção.
90% de conclusão do produto original NÃO comprovado. Não afirmar IA real ou sistema público pronto.

Status: TESTADO_EMULADOR para fatias principais; NOT_RUN produção; PR draft preservado.
