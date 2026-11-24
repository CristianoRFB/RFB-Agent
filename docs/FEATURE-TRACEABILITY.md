# RFBAgent — F01 a F12 (evidência vs lacunas)

Especificação original: docs/source/ESPECIFICACAO-RFB.txt; catálogo T001–T058 em docs/source/UX-DESIGN-AND-QA.md.

| Recurso | Entrega real | Situação |
| --- | --- | --- |
| F01 Chat/histórico | UI, Firestore conversas/mensagens, perfis e E2E | PASS Emulator; não produção |
| F02 Conhecimento versionado | Cadastro/edição incremental, publicação por gestor, fonte e versão | PASS Emulator |
| F03 Busca semântica com fonte | Busca lexical com tokenização e fonte, sem embeddings | PARCIAL — semantic search AUSENTE |
| F04 Resposta restrita à base | Apenas fonte publicada ou fallback sem fatos inventados | PASS simulador, não IA generativa |
| F05 Transferência humana | Cliente solicita, staff vê fila e resolve; eventos auditados; sem push externo | PASS Emulator, notificações AUSENTES |
| F06 Agendamento com confirmação | Slots exclusivos por empresa/30min, cancelamento, retry, token e auditoria; Worker REST e Node | PASS Emulator; agenda externa AUSENTE |
| F07 Ferramentas allowlist | Seis rotas verificadas, sem executor genérico de comandos | PASS código/Emulator; sem LLM |
| F08 Auditoria | Eventos server-only, timeline staff e status apenas via gateway | PASS Emulator; retenção/imutabilidade prod não homologadas |
| F09 Simulador | LEXICAL_SIMULATOR determinístico com proveniência, sempre rotulado | PASS Emulator, não real AI |
| F10 Idioma/configuração | Versão de idioma/tom por gestor, persistente; não modifica modelo IA inexistente | PARCIAL |
| F11 Controle por empresa | Rules e IAM Worker verificam tenant/role/customerUid | PASS Emulator; staging real pendente |
| F12 Analytics | Contagem por tenant de conversas, humanas, resolvidas, mensagens e propostas | PARCIAL; KPIs e relatórios históricos pendentes |

## Estado das 58 telas

A interface React dá suporte direto a login, shell, inbox, chat, base de conhecimento, proposta/revisão, confirmação de teste, fila humana, equipe, analytics parcial, settings e audit. Diversas entradas T001–T058 compartilham componentes e estados, mas não há validação integral de cada T-ID. Fonte de verdade preservada; não declarar 58 implementadas só por catálogo.

## Critério para 90%

Não há percentual confiável de prontidão de produção. Faltam Firebase staging, IA de fato sem serviço pago ou com franquia validada, notificação/calendário externo, tratamento de todos os estados do catálogo, privacidade/backup/retenção, observabilidade, rate limiting, segurança no Worker implantado e homologação real. **Meta de 90% NÃO demonstrada.**
