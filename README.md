# RFBAgent — Atendimento que entende e executa com permissão

**Produto 08 do RFB Labs**, desenvolvido com o RFB Method GPT. O repositório foi inicializado em 22/11/2026; o desenvolvimento segue em um [PR draft #1](https://github.com/CristianoRFB/RFB-Agent/pull/1).

## O que funciona nesta demonstração

- Interface responsiva de atendimento com um cliente **fictício** e histórico persistente apenas no navegador (localStorage).
- Base de conhecimento com documentos versionados, respostas por **busca lexical** e identificação da fonte.
- Proposta de agendamento, confirmação expressa em etapa separada, cancelamento, expiração após 15 minutos, retry idempotente na mesma instância, registro sintético.
- Solicitação de atendimento humano **apenas registrada**: nenhum profissional é notificado.
- Navegação para Conversas, Conhecimento, Agendamentos e Auditoria local.

**Não há IA conectada, RAG semântico, login real, integração externa, persistência segura no servidor nem agendamentos reais.** É proibido inserir dados pessoais/empresariais reais nesta demo: identidade do usuário e registros podem ser adulterados no navegador. Não publicar como sistema de produção.

## Executar localmente — custo recorrente R$0

Sem dependências npm. Na raiz do projeto, com Python 3:

    python -m http.server 4173

Abrir http://localhost:4173 no navegador. Importações JavaScript precisam de servidor HTTP (não use file://). Clique em "Reiniciar demonstração" para descartar dados locais.

## Testes do domínio — Node 22

    node --test tests/*.test.mjs
    node --check src/domain.mjs
    node --check src/app.js

CI **PASS 7/7** no commit 9cc7c8e, com sintaxe validada. Evidência: [GitHub Actions run 45092093953](https://github.com/CristianoRFB/RFB-Agent/actions/runs/45092093953) e [relatório QA](qa/reports/runs/RUN-20261122-G1-CI.md). Playwright Chromium **PASS 3/3** em [GitHub Actions Browser QA](https://github.com/CristianoRFB/RFB-Agent/actions/runs/45092299566), com imagens sintéticas no artifact. Firestore Rules, segurança multi-tenant no servidor, auditoria visual completa e implantação **NOT_RUN**.

## Arquitetura e próximas fatias

Documentos preservados da metodologia: [especificação](docs/source/ESPECIFICACAO-RFB.txt), [Starter Pack](docs/source/STARTER-PACK.md), [diagramas](docs/source/DIAGRAMAS.md), [catálogo de 58 telas](docs/source/UX-DESIGN-AND-QA.md), [roadmap](docs/source/ROADMAP.md). Riscos: [ARCHITECTURE.md](docs/ARCHITECTURE.md).

1. Executar QA de navegador real em desktop/mobile, incluindo acessibilidade e fluxo completo.
2. Introduzir Firebase Auth + Firestore Emulator com Rules e testes negativos de tenant, ownership e papéis. Não conectar produção.
3. Implementar confirmação transacional no servidor e trilha confiável, mantendo modo simulado até homologação.
4. Migrar interface para React + TypeScript + Vite, preservando comportamento testado.
5. Só considerar Cloudflare Free e Firebase Spark após revisão de cotas e autorização; não ativar Blaze, billing ou APIs pagas por conta própria.

Estado canônico: [docs/rfb/STATE.json](docs/rfb/STATE.json); handoff em [docs/HANDOFF.md](docs/HANDOFF.md). Sem merge e sem deploy.
