# RFBAgent — Atendimento que entende e executa com permissão

Produto 08 do RFB Labs desenvolvido conforme RFB Method. **Código de núcleo testado em emuladores; produção não configurada nem publicada.**

## O que funciona na homologação local

- React, TypeScript e Vite com Firebase Auth/Firestore Emulators, layout responsivo, inbox com histórico e fontes versionadas.
- Papéis cliente/atendente/gestor, isolamento de empresa e consultas filtradas pelo proprietário, com Firestore Rules.
- Simulador **LEXICAL** com referência à fonte versionada e fallback para humano. Sem LLM ou busca semântica real.
- Proposta de horário, confirmação explícita, uma reserva por intervalo de 30 minutos por empresa, cancelamento, retry idempotente e eventos de auditoria.
- Transferência humana, fila operacional para atendente/gestor, resolução auditada, histórico de eventos e contagens básicas.
- Editor de fontes versionadas, alternância de visibilidade e configurações do simulador por gerente.

## Cloudflare — código buildável, não implantado

- A pasta worker/ contém validação RSA SHA256 de tokens Firebase, OAuth 2.0 service account, Firestore REST transacional, seis rotas em allowlist e bloqueio por padrão.
- O frontend suporta modo staging somente via configuração explícita VITE_ENABLE_STAGING e Firebase público; nunca armazene chave de serviço em variável VITE_.
- A integração REST passou no Firestore Emulator e o cf CLI gerou pacote Worker + assets; **não equivale a Worker operando na Cloudflare**.
- O aplicativo não possui projeto Firebase de staging real, chave IAM, secret, domínio, implantação, billing ou produção configurada.

## QA comprovado

| Etapa | Resultado | Evidência |
| --- | --- | --- |
| Node unitário | 7/7 PASS | [run 45179282407](https://github.com/CristianoRFB/RFB-Agent/actions/runs/45179282407) |
| Firestore Rules | 13/13 PASS | [run 45179282287](https://github.com/CristianoRFB/RFB-Agent/actions/runs/45179282287) |
| Gateway local | 14/14 PASS | [run 45179282618](https://github.com/CristianoRFB/RFB-Agent/actions/runs/45179282618) |
| Worker segurança e ações | 13/13 PASS | [run 45179282327](https://github.com/CristianoRFB/RFB-Agent/actions/runs/45179282327) |
| Worker Firestore REST com emulador | 4/4 PASS | [run 45179282353](https://github.com/CristianoRFB/RFB-Agent/actions/runs/45179282353) |
| Build Cloudflare cf + Static Assets | PASS | [run 45179282396](https://github.com/CristianoRFB/RFB-Agent/actions/runs/45179282396) |
| Playwright Auth/Firestore/Gateway | 3/3 PASS | [run 45179282459](https://github.com/CristianoRFB/RFB-Agent/actions/runs/45179282459) |

## Referências

- [Inicialização local](docs/DEV-SETUP.md) · [Cloudflare e gates](docs/CLOUDFLARE-PLAN.md) · [Ameaças](docs/ARCHITECTURE.md)
- [Fonte original](docs/source/ESPECIFICACAO-RFB.txt) · [Starter Pack](docs/source/STARTER-PACK.md) · [58 telas](docs/source/UX-DESIGN-AND-QA.md) · [Diagramas implementados](docs/IMPLEMENTED-DIAGRAMS.md)
- [Rastreabilidade F01–F12](docs/FEATURE-TRACEABILITY.md) · [Estado](docs/rfb/STATE.json) · [Handoff](docs/HANDOFF.md)

**Ainda não há 90% ou conclusão integral demonstrada**. Faltam IA semântica real, uso com Firebase staging/produção, infraestrutura aprovada, APIs externas de agenda e notificações, catálogo completo de telas, segurança/privacidade/observabilidade de produção.

**Meta R$0/mês:** nenhuma operação financeira ou recurso Cloudflare/Firebase real foi criado; confirmar limites do Spark/Workers Free antes de qualquer deploy. [PR #1](https://github.com/CristianoRFB/RFB-Agent/pull/1) permanece DRAFT.
