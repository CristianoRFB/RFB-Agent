# RUN-20261122-G1-BROWSER — QA Chromium real

Run: https://github.com/CristianoRFB/RFB-Agent/actions/runs/45092299566
Commit: 5af49046b5525e8346c7b0412aedd78c37c27311
Branch: feature/rfb-agent-g1-vertical-simulator
Data da execução: 2026-11-23 01:03 UTC (2026-11-22 22:03 America/Sao_Paulo)
Executor: GitHub-hosted Ubuntu, Playwright 1.64.1 Chromium

## Resultado
PASS 3/3 testes end-to-end, 0 falhas (log da execução confirmado)

1. Desktop viewport 1440x900: fonte versionada na resposta, mensagem sem reserva, proposta sem reserva, confirmação explícita, 1 reserva simulada, persistência após reload, auditoria, reset.
2. Mobile viewport 390x844: viewport funcional, navegação, texto de tentativa HTML permanece texto e não vira imagem/HTML, nenhuma reserva automática.
3. Teclado: link de pular conteúdo recebe foco e campo de mensagem pode ser focado.

## Capturas e limites
Artifact em GitHub: rfbagent-browser-evidence, ID 14780919544, com rfbagent-desktop.png e rfbagent-mobile.png (dados sintéticos); disponível pelo run acima. Prints gerados por navegador real, mas ainda não passaram por avaliação humana visual detalhada.

NÃO VERIFICADO: WCAG integral, contrastes medidos, leitor de tela, reduced motion em ambiente específico, Firebase Rules/Emulator, backend tenant isolation, webhook/agenda/IA real, deploy e produção.

Riscos P0 ainda abertos AV-01..03: usuário/role editável no navegador; isolamento cross-tenant só simulado; confirmação sem transação servidor. PR continua draft, não homologado.
