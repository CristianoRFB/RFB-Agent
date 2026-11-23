# RFBAgent — diagramas técnicos implementados (núcleo de teste, não produção)

## C4 — contêineres
```mermaid
flowchart LR
  U[Cliente ou Funcionário] --> SPA[React TypeScript Vite]
  SPA --> AUTH[Firebase Auth]
  SPA --> DB[Firestore]
  SPA --> EDGE[API Cloudflare Worker — SOMENTE BUILD]
  EDGE --> GOOGLE[Google JWKS e OAuth]
  EDGE --> REST[Firestore REST]
  REST --> DB
  LOCAL[Node Gateway LOCAL] --> EMU[Auth + Firestore Emulator]
  SPA -. modo localhost .-> LOCAL
  TEST[GitHub Actions] --> EMU
```

## Agendamento serializado
```mermaid
sequenceDiagram
  actor Cliente
  participant UI as React
  participant API as Gateway/Worker
  participant DB as Firestore Transaction
  Cliente->>UI: Confirma proposta explicitamente
  UI->>API: Bearer token + accepted=true
  API->>API: Verifica identidade e empresa
  API->>DB: Lê member, conversa, proposta e booking
  API->>DB: Lê lock company/slot_30min
  alt Proposta válida e slot vazio
    API->>DB: Cria lock, booking, audit e atualiza proposta
    DB-->>API: Sucesso
  else Indisponível
    API->>DB: Rollback sem escrita
    DB-->>API: 403 ou 409
  end
  API-->>UI: status + replay seguro
```

## Handoff auditado
```mermaid
stateDiagram-v2
  [*] --> open
  open --> human: Cliente ou staff solicita via gateway
  human --> resolved: Staff resolve via gateway
  human --> human: Retry devolve replay
  resolved --> resolved: Retry sem novo audit
```

## Regras de privilégio
- Cliente não altera role, status, auditoria ou booking pelo Firebase SDK.
- Client lê mensagens/booking filtrados por customerUid e empresa.
- Staff lê fila e audit, resolve no gateway, não diretamente pelo Firestore.
- A API Worker usa conta de serviço IAM e precisa validar manualmente papel e tenant; `RFB_WORKER_ENABLED=false` no build.

Outros diagramas da especificação original: docs/source/DIAGRAMAS.md. Nenhum diagrama representa integração de produção que não ocorreu.
