# RFBAgent — arquitetura inicial e riscos

Fonte: RFB Method PR #4, produto 08.

Fluxo inicial: pergunta -> busca de informação autorizada com fonte -> resposta -> proposta de ação -> confirmação explícita separada -> execução simulada -> registro local. IA não implantada; buscas lexicais não são semantic search. Não permitir que texto livre dispare ações externas.

AV-01: autenticação do navegador não valida identidade; bloquear produção.
AV-02: cross-tenant/ownership precisam de regras de backend/Firestore Rules e testes negativos.
AV-03: confirmação e idempotência precisam de transação servidor para agendamento real.
AV-04: log em localStorage é demonstrativo, não auditoria imutável.
AV-05: ausência de IA real, API e integração com agenda, todos rotulados.
AV-06: custos e cotas de Firebase/Cloudflare devem ser revistos antes de deploy.

Destino: React + TypeScript + Vite, Firebase Authentication + Firestore Emulator e Cloudflare Free após autorização. Não habilitar Blaze, cobrança, SMS nem modelo pago.
