# Cloudflare — readiness de integração RFBAgent, SEM DEPLOY

**Situação:** Worker ES module criado e compilado pelo `cf` CLI release-candidate com plugin Vite v2 em modo staging, gerando pacote Static Assets + API, sem fazer deploy.

## Código real

- web/cloudflare.config.ts e web/vite.config.ts: `cf build --mode staging`, `@cloudflare/vite-plugin@2.0.0-rc.0` somente para staging.
- worker/firebase-auth.mjs: verifica Firebase JWT RS256 via Google JWKS, com projeto, iss, aud, sub, timestamps e assinatura.
- worker/firestore-rest.mjs: OAuth de service account a partir de secrets, Firestore REST tipado e `rollback` em read-only/falha.
- worker/actions.mjs: confirmação/cancelamento de booking e proposta, handoff e resolução, recuperação lexical segura por documentos publicados.
- worker/index.mjs: rotas autenticadas e habilitação false por padrão, mesma origem, limite de JSON.
- web/src/firebase.ts: modo local Emulator por padrão, staging remoto só com env explícito HTTPS.

## QA com evidência

- [Build Cloudflare cf PASS](https://github.com/CristianoRFB/RFB-Agent/actions/runs/45179282396) — produzido pacote do Worker (~25 kB) e assets; sem publicação.
- [Worker testes unitários 13/13 PASS](https://github.com/CristianoRFB/RFB-Agent/actions/runs/45179282327).
- [Worker Firestore REST real Emulator 4/4 PASS](https://github.com/CristianoRFB/RFB-Agent/actions/runs/45179282353).

## Gate para staging seguro

1. Aprovação e criação de Firebase Spark ISOLADO, com e-mail/senha de teste, Firestore Rules/indexes e provisão administrativa inicial, sem dados de produção.
2. Conferir quotas vigentes do Spark e Workers Free, uso diário, comportamento em excesso de quota e necessidade de billing/card. Não ativar Blaze ou pagamento.
3. Conta de serviço de privilégio mínimo e secrets no Cloudflare para FIREBASE_SERVICE_EMAIL, FIREBASE_SERVICE_PRIVATE_KEY e FIREBASE_PROJECT_ID. NÃO commitar nem expor como VITE_.
4. Revisar verificação JWT/JWKS/IAM, controles de rate limits e CORS, transações no Firestore REAL staging, Cross-tenant adversarial, revogação de credenciais, logging seguro.
5. Apenas com ambiente staging e revisão válidos, habilitar `RFB_WORKER_ENABLED=true` de forma específica; validar URL staging com QA; produção requer gate adicional e autorização de release.

## Semântica de custo

Objetivo R$0 mensal apenas dentro das cotas Free/Spark confirmadas. Não garantir custo ilimitado nem configurar serviços que cobrem ao ultrapassar limites.

**Sem deploy atual.** Nenhum projeto Cloudflare ou binding/secrets de produção criado. Esta configuração não autoriza implantação automaticamente.

Docs oficiais consultados: https://developers.cloudflare.com/cf/projects/ ; https://developers.cloudflare.com/workers/vite-plugin/v2-beta/ ; https://firebase.google.com/docs/firestore/use-rest-api ; https://firebase.google.com/docs/emulator-suite/connect_firestore
