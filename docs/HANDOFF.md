# HANDOFF — RFBAgent, 23/11/2026

Repo: https://github.com/CristianoRFB/RFB-Agent
PR: https://github.com/CristianoRFB/RFB-Agent/pull/1 (draft; SEM MERGE)
Branch: feature/rfb-agent-g1-vertical-simulator
Code head antes do checkpoint: 75a697a6345f60ef66cf0b6de93623b30d1ad3ce

## Retomada obrigatória (RFB Method)
1. Conferir HEAD real/PR/Issues; ler docs/rfb/STATE.json, docs/rfb/PROGRESS.md, docs/FEATURE-TRACEABILITY.md, docs/CLOUDFLARE-PLAN.md, docs/DEV-SETUP.md.
2. Reproduzir Node24 + Java21, Firebase Emulators com contas fictícias, gateway Node local, React; rodar CI real (URLs no PROGRESS).
3. A implementação Worker está em worker/index.mjs, worker/actions.mjs, worker/firebase-auth.mjs e worker/firestore-rest.mjs. `cf build --mode staging` foi aprovado, mas `cf deploy` NÃO EXECUTADO.
4. A correção crítica de locks faz rollback de transações Firestore REST quando retornam sem gravação; manter testes de replay/cancel/concorrência.
5. Manter o PR #1 draft, não recriar PR nem fechar Issues sem revisão e aceites.

## Próximo recorte de produto
- Staging isolado real somente após autorização do usuário e verificação do Spark/Workers Free; secrets de conta de serviço IAM sob privilégio mínimo, nunca no Git.
- Acesso à API Worker habilitado só com RFB_WORKER_ENABLED=true em staging; política de rate limit, observabilidade, backup/restore, correção de índices e smoke test em URL staging.
- Avaliar IA semântica real sob orçamento zero comprovado, agendamento externo e notificação humana.
- Especificação tem 58 T-IDs, ainda não todos implementados ou auditados; refinar teste+design do catálogo.

## Garantias e limites
- Nenhum recurso criado no Cloudflare conectado, nenhum Firebase real vinculado, nenhum billing/cartão/Blaze ativado.
- Dados de CI são sintéticos. Zero deploy em produção e staging. Sem atendimentos reais ou IA generativa.
- O RFB Method exige logs e aceites: 90% NÃO demonstrado. Não afirmar sistema completo.
