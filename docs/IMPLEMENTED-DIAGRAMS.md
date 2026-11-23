# RFBAgent — diagramas do código implementado

Esses diagramas descrevem **somente o código presente na branch do PR #1**. Não representam produção, um Worker Cloudflare implantado, nem IA generativa funcional.

## C4 — contêineres do ambiente local
```mermaid
flowchart LR
  C[Cliente ou funcionário de teste] --> SPA[React TypeScript Vite localhost:5173]
  SPA --> AUTH[Firebase Auth Emulator 9099]
  SPA --> FS[Firestore Emulator 8080]
  SPA --> API[Node Gateway localhost:8787]
  API --> AUTH
  API --> FS
  TEST[Playwright e Node tests] --> SPA
  TEST --> FS
  CLOUD[Cloudflare static assets alvo futuro] -. NÃO PUBLICADO .-> SPA
```

## Domínio de dados por empresa
```mermaid
flowchart TD
  CO[companies companyId] --> MB[members userId role active]
  CO --> KB[knowledge docId version published]
  CO --> CF[agentConfig default language tone mode]
  CO --> CV[conversations conversationId customerUid status]
  CV --> MS[messages senderUid customerUid source createdAt]
  CV --> PR[proposals customerUid slot expiresAt status]
  CV --> BK[bookings proposalId customerUid status]
  CV --> AU[audit eventId actorUid type]
```

## Sequência — confirmação idempotente no gateway local
```mermaid
sequenceDiagram
  actor U as Cliente de teste autenticado
  participant UI as React SPA
  participant GW as Gateway localhost
  participant FA as Auth Emulator
  participant DB as Firestore Emulator
  U->>UI: Seleciona proposta e confirma
  UI->>GW: POST /api/bookings/confirm (Bearer ID token, accepted=true)
  GW->>FA: Verifica ID token
  FA-->>GW: uid
  GW->>DB: Transação: membro, conversa, proposta, booking
  alt Proposta pendente, válida e pertencente ao uid
    GW->>DB: Atualiza proposta, cria booking e audit atomico
    DB-->>GW: Confirmado
  else Booking já existe
    DB-->>GW: Retry idempotente, sem novo evento
  else Expirou ou sem acesso
    DB-->>GW: Erro 403 ou 409 sem gravar
  end
  GW-->>UI: Resultado identificado como EMULATOR
```

## Máquina de estado: solicitação humana e agendamento
```mermaid
stateDiagram-v2
  [*] --> open
  open --> human: Solicitação autorizada e auditada
  human --> human: Retry idempotente
  open --> resolved: Ação de funcionário (parcial)
  state Proposta {
    [*] --> pending
    pending --> confirmed: Confirmação aceita no gateway
    pending --> cancelled: Cancelamento
    pending --> expired: Prazo esgotado (verificado na ação)
  }
```

## Fronteiras de confiança

- Frontend não pode atribuir roles, escrever audit ou criar booking diretamente.
- Firestore Rules verificam membership, customerUid, papéis e campos aceitos; listagem de filhos do cliente exige filtro de ownership.
- Gateway local verifica ID token e realiza ações explícitas e auditáveis em transações; não recebe chaves de produção.
- Módulo lexical nunca aciona booking a partir de texto livre. Falha na recuperação oferece atendimento humano.
- Cloudflare e Firebase reais são fronteiras futuras sem homologação ou produção autorizada.

Fonte do escopo: docs/source/ESPECIFICACAO-RFB.txt e docs/source/DIAGRAMAS.md. Modelos originais preservados.
