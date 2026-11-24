# RFBAGENT — Diagramas do Starter Pack (Mermaid editável)

> **ORIGEM:** entidades/estados/jornada retirados de `ESPECIFICACAO-RFB.txt`; relações propostas transcritas de `repos-individuais/08-rfbagent/DATA/RELACOES-DE-DOMINIO.md` do ZIP original enviado. Toda associação é **proposta**, sem cardinalidade homologada. **Nenhum desses gráficos comprova aplicação ou banco existente.** Mermaid é notação prática, não substitui artefato UML formal.

## D-001 — Atores e casos de uso (mapeamento inicial)

```mermaid
flowchart LR
  A1["Visitante"]
  A2["Cliente"]
  A3["Atendente"]
  A4["Gestor"]
  A5["Agente de IA"]
  UC1(["UC-01: Chat com histórico"])
  UC2(["UC-02: Base de conhecimento versionada"])
  UC3(["UC-03: Busca semântica com fonte"])
  UC4(["UC-04: Respostas restritas à base"])
  UC5(["UC-05: Transferência humana"])
  UC6(["UC-06: Agendamento com confirmação"])
  A1 --> UC1
  A2 --> UC2
  A3 --> UC3
  A4 --> UC4
  A5 --> UC5
  UC1 --> SYS["RFBAGENT (conceito)"]
  UC2 --> SYS["RFBAGENT (conceito)"]
  UC3 --> SYS["RFBAGENT (conceito)"]
  UC4 --> SYS["RFBAGENT (conceito)"]
  UC5 --> SYS["RFBAGENT (conceito)"]
  UC6 --> SYS["RFBAGENT (conceito)"]
```

O mapeamento é exploratório. Atribuição ator→caso tem de ser validada com a matriz de permissões; a ordem dos papéis na fonte não determina autorização automática.

## D-002 — Modelo conceitual de classes

```mermaid
classDiagram
  class Empresa {
    +string id
    +string status
    +string ownerId
    +int version
  }
  class Usuario {
    +string id
    +string status
    +string ownerId
    +int version
  }
  class Atendimento {
    +string id
    +string status
    +string ownerId
    +int version
  }
  class Mensagem {
    +string id
    +string status
    +string ownerId
    +int version
  }
  class Documento {
    +string id
    +string status
    +string ownerId
    +int version
  }
  class ChunkConhecimento {
    +string id
    +string status
    +string ownerId
    +int version
  }
  class Acao {
    +string id
    +string status
    +string ownerId
    +int version
  }
  class Confirmacao {
    +string id
    +string status
    +string ownerId
    +int version
  }
  class Agendamento {
    +string id
    +string status
    +string ownerId
    +int version
  }
  class VersaoPrompt {
    +string id
    +string status
    +string ownerId
    +int version
  }
  class LogAuditoria {
    +string id
    +string status
    +string ownerId
    +int version
  }
  Empresa --> Usuario : autoriza
  Empresa --> Atendimento : possui
  Atendimento --> Mensagem : troca
  Empresa --> Documento : indexa
  Documento --> ChunkConhecimento : divide
  Atendimento --> Acao : propõe
  Acao --> Confirmacao : exige
  Acao --> LogAuditoria : registra
  Atendimento --> Agendamento : pode criar
```

**Relações propostas da fonte (a validar):**
- `Empresa` → `Usuario` — autoriza
- `Empresa` → `Atendimento` — possui
- `Atendimento` → `Mensagem` — troca
- `Empresa` → `Documento` — indexa
- `Documento` → `ChunkConhecimento` — divide
- `Atendimento` → `Acao` — propõe
- `Acao` → `Confirmacao` — exige
- `Acao` → `LogAuditoria` — registra
- `Atendimento` → `Agendamento` — pode criar

Não são FK/coleções já criadas. `ownerId`/`version` são campos candidatos genéricos definidos no caderno; modelagem real terá índices, escopo de tenant, constraints e testes de concorrência.

## D-003 — Entidade-relacionamento sem cardinalidades inventadas

```mermaid
erDiagram
  Empresa {
    string id PK
    string status
    string ownerId
    datetime createdAt
  }
  Usuario {
    string id PK
    string status
    string ownerId
    datetime createdAt
  }
  Atendimento {
    string id PK
    string status
    string ownerId
    datetime createdAt
  }
  Mensagem {
    string id PK
    string status
    string ownerId
    datetime createdAt
  }
  Documento {
    string id PK
    string status
    string ownerId
    datetime createdAt
  }
  ChunkConhecimento {
    string id PK
    string status
    string ownerId
    datetime createdAt
  }
  Acao {
    string id PK
    string status
    string ownerId
    datetime createdAt
  }
  Confirmacao {
    string id PK
    string status
    string ownerId
    datetime createdAt
  }
  Agendamento {
    string id PK
    string status
    string ownerId
    datetime createdAt
  }
  VersaoPrompt {
    string id PK
    string status
    string ownerId
    datetime createdAt
  }
  LogAuditoria {
    string id PK
    string status
    string ownerId
    datetime createdAt
  }
```

Os nomes provêm do planejamento; as relações estão em D-002 mas **deliberadamente sem 1:1, 1:N ou N:M**, pois o ZIP proíbe inferir cardinalidade automaticamente. Definir cardinalidades, deleção, transações e tenant invariants antes do Firestore.

## D-004 — Arquitetura de contêineres candidata (visão C4 aproximada)

```mermaid
flowchart LR
  U["Visitante / Cliente"] --> UI["React + TypeScript + Vite
SPA/PWA (PLANEJADO)"]
  UI --> AUTH["Firebase Auth (PLANEJADO)"]
  UI --> API["Cloudflare Worker (PLANEJADO)"]
  API --> DB["Firestore Standard / Emulator (PLANEJADO)"]
  AUTH -. token validado .-> API
  TEST["Vitest + Playwright + Rules Emulator"] -. verifica .-> UI
  TEST -. verifica .-> API
```

Antes de deploy confirmar configuração atual de Cloudflare, Firebase Spark, SDK no runtime, limites/custos, upload, autenticação e isolamento. A arquitetura acima NÃO está operacional.

## D-005 — Sequência do fluxo principal (planejado)

```mermaid
sequenceDiagram
  actor U as Pessoa usuária de teste
  participant UI as SPA / Interface
  participant API as API autorizada (planejada)
  participant DB as Firebase Emulator (planejado)
  U->>UI: 1. Cliente faz pergunta
  UI->>API: Validar ação e autorização (1)
  API->>DB: Transação/consulta sintética (se aplicável)
  DB-->>API: Resultado de teste
  API-->>UI: Resultado ou erro autorizado
  U->>UI: 2. Buscar fatos autorizados
  UI->>API: Validar ação e autorização (2)
  API->>DB: Transação/consulta sintética (se aplicável)
  DB-->>API: Resultado de teste
  API-->>UI: Resultado ou erro autorizado
  U->>UI: 3. Gerar resposta com fontes
  UI->>API: Validar ação e autorização (3)
  API->>DB: Transação/consulta sintética (se aplicável)
  DB-->>API: Resultado de teste
  API-->>UI: Resultado ou erro autorizado
  U->>UI: 4. Propor ação
  UI->>API: Validar ação e autorização (4)
  API->>DB: Transação/consulta sintética (se aplicável)
  DB-->>API: Resultado de teste
  API-->>UI: Resultado ou erro autorizado
  U->>UI: 5. Pedir confirmação
  UI->>API: Validar ação e autorização (5)
  API->>DB: Transação/consulta sintética (se aplicável)
  DB-->>API: Resultado de teste
  API-->>UI: Resultado ou erro autorizado
  U->>UI: 6. Executar e registrar
  UI->>API: Validar ação e autorização (6)
  API->>DB: Transação/consulta sintética (se aplicável)
  DB-->>API: Resultado de teste
  API-->>UI: Resultado ou erro autorizado
  UI-->>U: Estado final ou recuperação
```

Pseudointeração, não endpoints existentes. Criar contratos reais em G1/G2, incluir falha de rede, permissão negada, retry, duplicação e concorrência.

## D-006 — Máquina de estados do domínio (fonte)

```mermaid
stateDiagram-v2
  [*] --> S0
  state "aberto" as S0
  state "em-ia" as S1
  state "aguardando-aprovacao" as S2
  state "com-humano" as S3
  state "resolvido" as S4
  state "falha" as S5
  S0 --> S1
  S1 --> S2
  S2 --> S3
  S3 --> S4
  S4 --> S5
  S5 --> [*]
```

Transições não autorizadas devem ser recusadas; definir precondição, agente, logs, efeitos transacionais e reversões para cada aresta.

## D-007 — Atividade e exceção principal

```mermaid
flowchart TD
  START(["Iniciar RFBAGENT"]) --> GUARD{"Autorização e dados válidos?"}
  GUARD -- "Não" --> DENY["Erro seguro e recuperação"]
  GUARD -- "Sim" --> T1["Cliente faz pergunta"]
  T1 --> T2["Buscar fatos autorizados"]
  T2 --> T3["Gerar resposta com fontes"]
  T3 --> T4["Propor ação"]
  T4 --> T5["Pedir confirmação"]
  T5 --> T6["Executar e registrar"]
  T6 --> END(["Fluxo demonstrado com dados sintéticos"])
  DENY --> START
```

O diagrama representa o cenário mínimo. Cenários alternativos não estão todos detalhados; desenvolver quando o primeiro fluxo estiver em código.

## Catálogo de diagramas: aplicabilidade de 14 UML + 4 C4 + ERD

| Tipo considerado | Estado |
|---|---|
| UML: casos de uso | RASCUNHO — atores e casos via fluxograma Mermaid, revisar UML formal |
| UML: classes | RASCUNHO — entidades e relações propostas do ZIP |
| UML: objetos | AVALIAR necessidade após contratos de dados |
| UML: pacotes | AVALIAR quando os módulos forem implementados |
| UML: componentes | AVALIAR depois da definição da API |
| UML: estrutura composta | AVALIAR apenas se houver interfaces internas complexas |
| UML: implantação | AVALIAR após decisão Cloudflare/Firebase e staging |
| UML: perfis | AVALIAR necessidade de estereótipos específicos |
| UML: atividades | RASCUNHO — jornada com autorização/erro |
| UML: estados | RASCUNHO — sequência de estados original |
| UML: sequência | RASCUNHO — interações previstas, backend NÃO implementado |
| UML: comunicação | AVALIAR após contrato de comunicação |
| UML: visão geral de interação | AVALIAR para fluxos concorrentes complexos |
| UML: timing | AVALIAR apenas se tempo/liveness for requisito |
| C4: contexto | RASCUNHO — atores externos ainda devem ser confirmados |
| C4: contêineres | RASCUNHO — stack original candidata, não deployed |
| C4: componentes | AVALIAR após implementação de API/UI |
| C4: código | AVALIAR após G2, sem diagrama vazio artificial |
| ERD | RASCUNHO — entidades sem inventar cardinalidades |

**Critério de manutenção:** requisitos `F-IDs` e telas `T001..T058` devem indicar o D-ID pertinente; nenhuma classe/relacionamento vai para produção sem teste Rules/contratos e revisão de modelagem. Diagramas de objetos, perfil, timing, composite structure etc. NÃO são gerados apenas para preencher catálogo quando não são adequados.
