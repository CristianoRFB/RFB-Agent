# RFBAgent — matriz de funcionalidades F01–F12

Base documental original: docs/source/ESPECIFICACAO-RFB.txt, T001–T058 em docs/source/UX-DESIGN-AND-QA.md. Não confundir tela construída com sistema em produção.

| Recurso | Estado verificado ou limitado |
| --- | --- |
| F01 Chat/histórico | Implementado no Firestore Emulator, sob Rules |
| F02 Base versionada | Implementada no Emulator, gestor pode incrementar versão |
| F03 Busca semântica | NÃO IMPLEMENTADA: recuperação atual apenas lexical com fonte |
| F04 Respostas restritas à base | Simulador lexical com fonte pública ou fallback; não LLM |
| F05 Transferência humana | Status human sob papel atendente; sem notificação real |
| F06 Agendamento confirmado | Confirmar/cancelar transacional no gateway Node e Emulator; sem agenda externa |
| F07 Ferramentas allowlist | Gateway com rotas fixas, sem ferramentas livres; integração com LLM ausente |
| F08 Auditoria | Registro pelo gateway local; política de retenção/imutabilidade de produção pendente |
| F09 Simulador de agente | Simulador lexical determinístico, com fontes |
| F10 Linguagem | Configuração versionada no Firestore; efeito em IA ainda ausente |
| F11 Controle por empresa | Firestore Rules e testes negativos no Emulator |
| F12 Analytics | Contagens básicas autorizadas; indicadores de desempenho reais pendentes |

## Telas

Fluxos de login, inbox, detalhes de conversa, conhecimento, agendamentos, equipe, métricas e configurações já existem no React. Esses fluxos cobrem parcialmente T003, T005, T014, T029–T040, T050–T055; T056–T058 exigem painel completo de auditoria. Os demais T-IDs devem ser avaliados um a um e não foram automaticamente considerados entregues.

## 90% de conclusão

NÃO demonstrado. Pendências de alto peso: backend deployável no Cloudflare Free, autenticação/recuperação e provisionamento de produção, busca realmente semântica/LLM sob orçamento, notificação e transferência, métricas completas, auditoria, backups, privacidade/LGPD, testes e design integral T001–T058.

## Evidência

- Testes de regras: 10/10 PASS em https://github.com/CristianoRFB/RFB-Agent/actions/runs/45093812830 . Configurações adicionaram testes novos a serem verificados.
- Gateway: 6/6 PASS em https://github.com/CristianoRFB/RFB-Agent/actions/runs/45094519365 . Testes lexicais posteriores requerem CI do HEAD.
- React build/typecheck: PASS em https://github.com/CristianoRFB/RFB-Agent/actions/runs/45094548866 .
- Testes browser integrados: em investigação; não marcar PASS até evidência da última revisão.
