# Matriz F01–F12 e lacunas para a meta de 90%

Base: docs/source/ESPECIFICACAO-RFB.txt e catálogo T001–T058 em docs/source/UX-DESIGN-AND-QA.md.

| F | Implementação rastreada | Estado |
| --- | --- | --- |
| F01 Chat histórico | web/src/App.tsx; Firestore messages, Rules | Testado Emulator |
| F02 Base versionada | knowledge com versionamento e gestor autorizado | Testado Emulator |
| F03 Busca semântica com fonte | lexical com fonte em gateway, sem embeddings | PARCIAL, sem busca semântica |
| F04 Respostas restritas à base | simulador lexical publica fonte ou fallback | Testado simulador, não IA |
| F05 Transferência humana | endpoint idempotente `/api/conversations/handoff` + audit | Testado Emulator; não notifica pessoas |
| F06 Confirmação de agendamento | endpoint explícito, transação, expiração, retry, auditoria | Testado Emulator; sem agenda externa |
| F07 Ferramentas allowlist | rotas do gateway fixas e só local | Parcial; não há agente LLM |
| F08 Auditoria | gateway escreve logs; painel equipe sob Rules | Testado Emulator; sem retenção prod |
| F09 Simulador | lexical determinístico; demo antiga legada | Testado simulador |
| F10 Configuração | idioma/tom versionados manager-only | Parcial; não afeta IA inexistente |
| F11 Controle multiempresa | membership, roles, ownership, consulta filtrada | Testado Emulator |
| F12 Indicadores | contagens de dados autorizados | Parcial; sem KPIs operacionais |

## Telas

React: autenticação, navegação, inbox, histórico, lista/conteúdo de conhecimento, gerência de fontes, proposta/confirmação local, equipe, indicadores, auditoria e configurações. Catálogo completo T001–T058 permanece de origem. Nenhuma declaração de 58 telas implementadas.

## Pendências de alto peso

Cloudflare Worker API compatível e revisão de segurança; Firebase real isolado; IA semântica sem cobrança; notificações humanas; métricas reais; QA e wireframes desktop/mobile para todas as telas aplicáveis; privacidade e retenção/backup; homologação produção.

**90% do sistema não foi demonstrado**, portanto não há percentual confiável a publicar. Não use este código com dados reais até passar esses gates.
