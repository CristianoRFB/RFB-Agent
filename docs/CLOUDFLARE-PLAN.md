# Plano Cloudflare — RFBAgent (não implantado)

Consulta read-only de 22/11/2026: conta Cloudflare conectada, com Workers e Pages existentes de outros produtos; não foi encontrado projeto/Worker RFB-Agent. Nenhum recurso foi alterado.

## Arquitetura candidata

- SPA React/Vite em web/ com Cloudflare Workers Static Assets, subdomínio gratuito quando autorizado.
- Firebase Authentication e Firestore, com plano Spark e franquias reconfirmados antes de qualquer uso real.
- O gateway existente em gateway/server.mjs é Node + Firebase Admin exclusivo do Emulator. NÃO pode ser implantado diretamente no Cloudflare Workers.
- Integração futura necessita adaptador Worker e autenticação de servidor robusta, transações reais, credenciais gerenciadas por Secrets, limitação de taxa, isolamento entre empresas e replay protection.
- IA generativa/semântica apenas se houver opção compatível com R$0, limites confirmados e aprovação. O recuperador atual é lexical.

## Gates obrigatórios para deploy

1. Separar staging e produção sem compartilhar Firestore, tokens ou contas reais.
2. Verificar quotas Firebase e Cloudflare, preços vigentes, limites e risco de cobrança; nenhuma ativação automática de Blaze ou Workers Paid.
3. Validar gateway adaptado, Rules e testes negativos cross-tenant no runtime de destino.
4. Rate limiting, backups, rollback, observabilidade, logs sanitizados e LGPD.
5. Homologação mobile/desktop, autenticação, autorização, consentimento e execução explícita de ação.
6. Aprovação de publicação, sem merge silencioso, sem reutilizar Workers de outros sistemas.

Fontes: https://developers.cloudflare.com/workers/static-assets/ ; https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/ ; https://developers.cloudflare.com/workers/platform/limits/ ; https://firebase.google.com/docs/projects/billing/firebase-pricing-plans

Custo adicionado nesta rodada: R$0. Produção: NÃO IMPLANTADA.
