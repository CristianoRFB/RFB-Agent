# RFBAgent — arquitetura, controles e ameaças (atualizado)

Fonte produto: docs/source/ESPECIFICACAO-RFB.txt. Fonte plataforma: documentação Firebase REST/Rules e Cloudflare Workers Static Assets, consultada em 23/11/2026.

## Ambientes de confiança

1. UI React Vite: localhost Emulators por padrão. Modo staging opcional sob HTTPS e env explícito, sem embutir chaves privilegiadas.
2. Firebase Auth/Firestore Emulator: dados sintéticos, regras cliente e Auth local. `firebase/seed.mjs` só funciona com as duas variáveis localhost.
3. Gateway Node localhost: server-side Firebase Admin, autenticação de ID token, transações, audit. Usado em E2E local e desenvolvimento.
4. Worker Cloudflare: `worker/index.mjs` autentica token Firebase com JWKS Google RS256 (aud/iss/sub/exp), protege origin JSON/size, seis endpoints em allowlist. API só habilita com `RFB_WORKER_ENABLED=true` e `RFB_API_ENV=staging` e três segredos. Default false.
5. Firestore REST IAM: Worker assina OAuth2 JWT service-account via WebCrypto, envia `:beginTransaction/:batchGet/:commit/:rollback` e consulta somente conhecimento publicado. IAM ignora Firestore Security Rules, por isso autenticação/tenant/role é obrigatória em cada rota do Worker.

## Concorrência e integridade

- Reserve 1 vaga por empresa/bloco UTC de 30 minutos. A transação lê, verifica e cria `companies/{companyId}/slots/{slotId}` com precondição exists=false junto à proposta, booking e audit.
- Repetições do mesmo booking retornam replay sem criar outro evento; um booking cancelado não pode ser reativado.
- Cancelamento de booking confirmado é explícito, autenticado, transacional, destrava slot, registra audit; retry não duplica evento.
- Worker REST usa rollback em caminhos de erro e retorno sem escrita: evita travas da transação no Emulator. `inTransaction` tenta novamente conflitos limitados.
- Human handoff é aberto→human; apenas funcionários resolvem human→resolved com evento audit. Clientes/staff não podem alterar status diretamente via SDK Firestore.

## Riscos P0/P1 ainda pendentes

- Risco P0: sem Firebase staging real/segredos/least privilege IAM; não publicar nem aceitar dados de terceiros.
- Risco P0: sem demonstração da mesma implementação executada em Cloudflare Worker de verdade (cf build != deploy).
- Risco P1: endpoint de rate limiting e abuso, backup/restore, retenção e privacidade LGPD, telemetria redigida/observabilidade e chave de serviço rotativa.
- Risco P1: modo lexical não usa LLM nem embeddings; treinamento, detecção de prompt injection e resultados semânticos exigem avaliação separada.
- Risco P1: criação de conta, onboarding, calendário externo e avisos humanos não integrados; filas são internas.
- Risco P1: 58 telas exigem jornada desktop/mobile e critérios de erro, rede, permissão, acessibilidade e concorrência antes de concluir.

## Plano de rollout

Somente após aprovação explícita: preparar projeto Firebase Spark staging isolado, conferir quotas, regras e índices, provisionar secret no Worker, validar JWT/REST/IAM/tenancy em staging, testar build e URL de prévia autorizada, reversão e backup. Depois revisão final e autorização separada de produção.

Nenhum ambiente Cloudflare/Firebase real foi modificado nesta rodada.
