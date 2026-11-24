# RFBAgent — Starter Pack inicial (RFB Method)

> **ESTADO ATUAL:** `BLUEPRINT_ORIGINAL_PRESERVADO / STARTER_SPECIFIED / APP_NOT_CREATED / QA_NOT_RUN / DEPLOY_NOT_DONE`. Pasta no **RFB Method** apenas; **repositório individual ainda não informado/criado**. O conceito não equivale a software pronto.

## 00. Proveniência e separação de fontes

- **Especificação com marca RFB:** [ESPECIFICACAO-RFB.txt](ESPECIFICACAO-RFB.txt) e [Caderno RFB](../../originais/Caderno-RFB-14-Sistemas.txt) (307.928 bytes, SHA-256 `873348bb1a22adbc2908a05964e84f8ec72f91cbf7d0505bc8e3fcde45261f66`). **Não são bytes originais:** substituem apenas a nomenclatura do documento histórico preservado [aqui](../../originais/historico/Seven-Labs-Caderno-Completo-14-Sistemas.txt) (308.016 bytes, SHA-256 `936dc3a83096bfb8c1ae841c11635ac23023426e0cb8d7e9a098bae0125538d3`).
- **Pacote histórico do usuário:** `Seven-Labs-14-Produtos-Blueprints-2026-v1.zip`, 17.338.549 bytes, SHA-256 `f033e868d05c8605bdad96a07506c77be09c65409d4c0588960af759fda3a6ba`. **Pacote de trabalho RFB:** `RFB-Labs-14-Produtos-Starter-Packs.zip`, entregue no chat, SHA-256 `18ec68329562579cb068d3b2ce23532b7a8e9a6b21caf3918f753db72fbea066`. Os 255 PNGs foram preservados em pixels e exigem revisão visual da marca. Nenhum dos ZIPs foi commitado neste repo.
- **Este arquivo:** síntese/decisões operacionais geradas pelo RFB Method a partir da fonte (não é a fonte original).
- ID original `08`, nome `RFBAgent`. **Não renumerar**: a coleção tem IDs 01–11 e 13–15; 12 não faz parte da versão.
- Posição no portfólio profissional: **"Em planejamento — blueprint técnico e conceito de UX"**. NÃO publicar `case de produção`, `usuários reais`, `métricas` nem `software lançado`. Repositório futuro: `PENDING_USER_CREATION`.

## 01. Definição do produto — origem do usuário

**Segmento:** Assistente de atendimento com IA. **Slogan:** Atendimento que entende e executa com permissão.

**Problema:** Pequenas empresas perdem oportunidades quando atendimento e agendamento ficam manuais e sem histórico.

**Quem usa:** Empresários, recepcionistas e clientes.

**Prova de valor pretendida:** Cliente pede horário; agente consulta a agenda e só cria a reserva após confirmação explícita.

**Identidade visual proposta:** Inbox de atendimento, chat com IA e ações/agenda lado a lado.

## 02. MVP implementável, não somente protótipo ilustrado

**Hipótese da primeira fatia:** reproduzir a jornada principal abaixo com **dados sintéticos**, navegação de verdade, lógica testável e persistência/autorização quando o backend for introduzido. Começar com 1 fluxo completo; não implementar 58 telas superficiais ao mesmo tempo.

1. Cliente faz pergunta
2. Buscar fatos autorizados
3. Gerar resposta com fontes
4. Propor ação
5. Pedir confirmação
6. Executar e registrar

**Recorte de escopo G2 (decisão proposta):** `Chat com histórico + Base de conhecimento versionada + Busca semântica com fonte`; validar dependências de identidade, permissões e estados com a fonte original antes do código. Critério de demonstração: Cliente pede horário; agente consulta a agenda e só cria a reserva após confirmação explícita.

**Fora do primeiro slice (planejado):** Respostas restritas à base; Transferência humana; Agendamento com confirmação; Ferramentas em allowlist; Auditoria de ações; Simulador de agente; demais integrações conforme risco/custo. Nada dessas funções está implementado no repositório de metodologia.

## 03. Atores e regras de acesso

- **A-01 — Visitante:** definir recursos permitidos, negados e testes 401/403 por rota, tenant e ownership; nenhuma role vem do body do cliente.
- **A-02 — Cliente:** definir recursos permitidos, negados e testes 401/403 por rota, tenant e ownership; nenhuma role vem do body do cliente.
- **A-03 — Atendente:** definir recursos permitidos, negados e testes 401/403 por rota, tenant e ownership; nenhuma role vem do body do cliente.
- **A-04 — Gestor:** definir recursos permitidos, negados e testes 401/403 por rota, tenant e ownership; nenhuma role vem do body do cliente.
- **A-05 — Agente de IA:** definir recursos permitidos, negados e testes 401/403 por rota, tenant e ownership; nenhuma role vem do body do cliente.

## 04. Domínios e módulos

**Módulos originais (10):** Chat; Base de conhecimento; Agendamento; Transferência humana; Ferramentas da IA; Histórico; Configurações do agente; Permissões; Analytics; Auditoria.

**Entidades propostas (modelagem original, cardinalidades não homologadas):** Empresa; Usuario; Atendimento; Mensagem; Documento; ChunkConhecimento; Acao; Confirmacao; Agendamento; VersaoPrompt; LogAuditoria.

**Features originais (12):**
- [ ] **F-01** Chat com histórico — requisito/aceite AC-01; código e teste `NOT_RUN`.
- [ ] **F-02** Base de conhecimento versionada — requisito/aceite AC-02; código e teste `NOT_RUN`.
- [ ] **F-03** Busca semântica com fonte — requisito/aceite AC-03; código e teste `NOT_RUN`.
- [ ] **F-04** Respostas restritas à base — requisito/aceite AC-04; código e teste `NOT_RUN`.
- [ ] **F-05** Transferência humana — requisito/aceite AC-05; código e teste `NOT_RUN`.
- [ ] **F-06** Agendamento com confirmação — requisito/aceite AC-06; código e teste `NOT_RUN`.
- [ ] **F-07** Ferramentas em allowlist — requisito/aceite AC-07; código e teste `NOT_RUN`.
- [ ] **F-08** Auditoria de ações — requisito/aceite AC-08; código e teste `NOT_RUN`.
- [ ] **F-09** Simulador de agente — requisito/aceite AC-09; código e teste `NOT_RUN`.
- [ ] **F-10** Configuração de linguagem — requisito/aceite AC-10; código e teste `NOT_RUN`.
- [ ] **F-11** Controle por empresa — requisito/aceite AC-11; código e teste `NOT_RUN`.
- [ ] **F-12** Painel de desempenho — requisito/aceite AC-12; código e teste `NOT_RUN`.

## 05. Stack e decisão de R$0

**Stack candidata original:** React + TypeScript + Vite; Cloudflare Workers / Static Assets; Firebase Auth / Firestore; ferramentas opcionais conforme módulo.

**Especialização original:** Workers para orquestração e validação; Firebase para conversas e agenda; provedor de IA sob orçamento.

**Risco/custo apontado na fonte:** APIs de LLM, áudio STT/TTS e armazenamento vetorial têm custo; demo com limite e respostas simuladas.

**Risco de domínio:** IA é probabilística; jamais executar ação financeira ou sensível sem autorização verificável e trilha de auditoria.

**Decisão de implementação proposta:** React + TypeScript + Vite para interface responsiva; Firebase Emulator como primeira persistência testável; Workers/Static Assets e Firebase Auth/Firestore **somente quando houver necessidade e conta autorizada**. No projeto novo consultar Cloudflare CLI `cf` e documentação atual; projetos legados Wrangler ficam em Wrangler. Não instalar R2, Stream, mapas comerciais, pagamento real ou API de IA paga por padrão. Custo recorrente adicional alvo: **R$0**, sujeito às cotas e pré-requisitos reais; nunca prometer produção escalável gratuita.

**Segurança transversal:** sem credenciais no repositório; tokens validados em backend, Firestore Rules testadas, API privilegiada não confia no userId/tenantId/preço/role enviados pelo navegador; logs sem dados sensíveis. Para funcionalidades de assistente de atendimento com ia, revisar requisitos de segurança e leis pertinentes antes de dados reais.

## 06. Telas e diagramas

- [UX, layout desktop/mobile, catálogo T001–T058 e QA](UX-DESIGN-AND-QA.md) — conceitos originais do ZIP NÃO são screenshots de aplicativo.
- [Diagramas, riscos de modelagem, C4, UML e ERD](DIAGRAMAS.md) — desenhos de arquitetura **propostos**, validação de cardinalidade e semântica ainda pendente.
- [Roadmap e gates por fase](ROADMAP.md) — preparação para repositório independente, sem merge/deploy antecipado.

## 07. Critérios de entrega do Starter Pack

- [x] Requisito ORIGINAL transcrito e preservado, com identificador da fonte.
- [x] Resumo do problema, atores, módulos, jornada, 12 features, telas e dependências em documentos editáveis.
- [x] Diagramas editáveis Mermaid propostos; todos devem passar revisão de arquitetura antes de virar schema.
- [ ] Pesquisa externa do segmento atual, concorrentes e decisões de posicionamento com referências/data/observações `NOT_RESEARCHED_FOR_THIS_PROJECT`.
- [ ] Design PNG original do ZIP extraído e versionado no **repo individual** com integridade/licença (arquivo binário ainda não está nesta branch).
- [ ] Código React/TypeScript gerado, com build real e primeiro fluxo implementado `NOT_CREATED`.
- [ ] Regras Firebase/Workers com testes E2E, autenticação e autorização reais `NOT_RUN`.
- [ ] Capturas de tela verdadeiras, feedback de usuário, deploy/preview Cloudflare `NOT_RUN`.
- [ ] Aprovação do escopo e URL do repositório específico `PENDING_USER_CREATION`.

## 08. Handoff para o futuro repo `RFBAgent`

1. Criar repositório individual **quando solicitado pelo usuário**; verificar se já existe antes de propor novo, conferir Issues/PRs/HEAD.
2. Importar **sem modificar** original TXT e assets documentais do ZIP na pasta de `08-rfbagent`; registrar hashes no manifest; não confundir PNG de conceito com screenshot de produto.
3. Transportar Starter Pack/UX/Diagramas/Roadmap, adaptar paths e marcar tarefas do projeto no Issue tracker; a fonte original permanece referência imutável.
4. Antes de programar pesquisar mercado e UX do **nicho específico**, validar fluxo principal, DTO/Rules/segurança/uso em dispositivo, escolher stack realmente suportada e custo R$0.
5. Implementar primeira fatia da jornada acima e provar com testes executados; atualizar `ROADMAP.md` e `STATE/PROGRESS` a cada checkpoint; `codex:pc` prioriza browser, execução local, testes do Firebase Emulator e screenshot.
6. Somente quando demonstrável e realmente publicado incluir no **portfólio profissional** com selo `PROTÓTIPO` ou `PROJETO CONCLUÍDO` de acordo com evidência. Não editar o Worker profissional nesta rodada.
