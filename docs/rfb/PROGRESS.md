# RFBAgent — checkpoint da rodada 22/11/2026

Repo: CristianoRFB/RFB-Agent | [PR draft #1](https://github.com/CristianoRFB/RFB-Agent/pull/1).
Branch: feature/rfb-agent-g1-vertical-simulator. Código publicado até 02e4093dc9d1ec28bd08edcd07565f220e67a6f4.

## Fatias concluídas no ambiente de teste

- 5 documentos originais do produto 08 versionados, sem sobrescrever origem.
- UI React + TypeScript + Vite buildável e responsiva, Firebase Auth Emulator e Firestore Emulator.
- 2 empresas sintéticas, 6 usuários sintéticos; papéis manager/attendant/customer com regras server-side, ownership e leitura cross-tenant negativa.
- Inbox com histórico persistente, base versionada, modo lexical com fontes e fallback seguro.
- Propor/confirmar/cancelar reserva SIMULADA via Gateway Node local com token autenticado e transação, expiração, retry e auditoria.
- Transferência humana interna, idempotente e auditada, sem notificar agentes reais.
- Configurações versionadas por gestor, tela de equipe, contagens locais e trilha de auditoria visível só staff.
- Pipelines CI separados e filtrados por caminhos para reduzir execução desnecessária.

## QA real verificado

- Node domínio 7/7 PASS — https://github.com/CristianoRFB/RFB-Agent/actions/runs/45095617034
- Firestore Rules 13/13 PASS — https://github.com/CristianoRFB/RFB-Agent/actions/runs/45095616989
- Gateway Auth/tenant/booking/handoff 10/10 PASS — https://github.com/CristianoRFB/RFB-Agent/actions/runs/45095823085
- React TypeScript + Vite PASS — https://github.com/CristianoRFB/RFB-Agent/actions/runs/45095617036
- Playwright E2E integrado Auth/Firestore/Gateway 3/3 PASS — https://github.com/CristianoRFB/RFB-Agent/actions/runs/45095857436
- Playwright demo legado 3/3 PASS — https://github.com/CristianoRFB/RFB-Agent/actions/runs/45095617046
- Todos os testes referem-se a dados SINTÉTICOS e ambiente local; não equivalem a homologação de produção.

## Bloqueios para 90%

- A produção NÃO está pronta. Falta adaptador Cloudflare Workers, projeto Firebase de homologação real, quota/custo, segredos, rate limiting e autorização expressa para publicar.
- Busca semântica ou LLM real não implementada. O produto rotula respostas como SIMULADOR LEXICAL.
- Sem agenda externa, entrega de notificações a funcionários nem transferência operacional a outro operador.
- Design e QA completos de todas as 58 telas, proteção de dados reais, backup/restore, política de retenção, acessibilidade integral, LGPD e observabilidade pendentes.
- 90% não atingido ou comprovado; NÃO calcular percentual artificial a partir da contagem de arquivos.

## Próximo recorte seguro

Construir backend compatível com Workers com idempotência transacional e autenticação apropriadas, verificar cotas Free, aprofundar T001–T058, auditar segurança, deixar homologação isolada. Não criar produção automaticamente.
