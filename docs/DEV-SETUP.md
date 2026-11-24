# RFBAgent — guia de execução local

Este projeto NÃO deve ser conectado à produção. O ambiente suportado nesta etapa usa exclusivamente Firebase Auth Emulator e Firestore Emulator.

## Requisitos: Node.js 24, Java 21, npm

Na raiz do repositório execute:
    npm install
    npm install --prefix web
    cp web/.env.example web/.env.local

Terminal 1: npm run emulators:start

Terminal 2, Linux/macOS:
    export FIRESTORE_EMULATOR_HOST=127.0.0.1:8080
    export FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099
    npm run emulators:seed
    npm run gateway:start

Terminal 3: npm run dev --prefix web

Abra http://127.0.0.1:5173. No PowerShell, configure as variáveis com $env:FIRESTORE_EMULATOR_HOST="127.0.0.1:8080" e $env:FIREBASE_AUTH_EMULATOR_HOST="127.0.0.1:9099".

## Contas fictícias, somente no Emulator

- Cliente Alpha: cliente@rfbagent.invalid
- Gestor Alpha: gestor@rfbagent.invalid
- Atendente Alpha: atendente@rfbagent.invalid
- Cliente Beta: cliente-b@rfbagent.invalid
- Senha sintética compartilhada: SenhaDemo123!

O seed recusa execução sem hosts de emulador exatos. Nunca reutilize estas credenciais nem insira dados reais.

## Testes

    npm run test:domain
    npm run test:rules
    npm run test:gateway
    npm run build --prefix web

Playwright + Auth/Firestore de ponta a ponta executam no workflow Full emulator browser QA. A interface antiga na raiz continua como demonstração exclusivamente local e sem autenticação.
