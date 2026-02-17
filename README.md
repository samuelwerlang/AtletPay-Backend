# AtletPay Backend (MVP)

Backend de um MVP para um SaaS de gerenciamento de alunos e automação de cobranças voltado a personal trainers. O foco é simplicidade, modelagem clara e endpoints essenciais para validar o produto.

Status: MVP funcional. Principais entidades, autenticação (Auth0), Stripe Platform (assinatura do SaaS), Stripe Connect (checkout do aluno nos planos do treinador) e webhooks estão implementados.

## Visão geral

- Objetivo: permitir que um personal trainer gerencie seus alunos, planos, despesas e cobranças, além de assinar planos do próprio SaaS.
- Stack:
  - Node.js + Express + TypeScript (ESM)
  - Prisma + PostgreSQL
  - Auth0 (JWT)
  - Zod (validação)
  - Stripe (Platform + Connect)
- Principais entidades:
  - User, Student, Expense, Charge, RecurringCharge
  - UserPlan (plano do treinador), StudentPlan (vínculo do aluno ao plano)
  - SaasPlan, Subscription (assinatura do SaaS)

## Funcionalidades (MVP)

Implementadas:

- Autenticação via Auth0 (JWT) com proteção por middleware.
- CRUD de alunos (Student).
- CRUD de despesas (Expense).
- Criação de planos do SaaS (SaasPlan) — restrito a ADMIN.
- CRUD de planos do treinador (UserPlan).
- Stripe Platform:
  - Checkout de assinatura do SaaS (`/api/create-checkout-session`).
  - Webhook de plataforma (atualiza `stripeCustomerId` e sincroniza `Subscription`).
  - Billing Portal (`/api/create-portal-session`).
- Stripe Connect:
  - Criação e onboarding de conta conectada do treinador:
    - `/api/create-connect-account`
    - `/api/create-account-link`
  - Checkout para o aluno comprar um UserPlan:
    - `/api/checkout/connect` (subscription ou payment, conforme o price)
  - Webhook de Connect:
    - Pagamentos avulsos: cria `Charge` e vincula `StudentPlan`.
    - Assinatura criada: cria `StudentPlan`.
    - Fatura criada: cria `Charge` PENDING por ciclo (externalId = invoice.id).
    - Pagamento de fatura efetuado: marca `Charge` como PAID, mantém plano ativo.
    - Pagamento de fatura falhou: marca `Charge` como FAILED/PAST_DUE e atualiza status do `StudentPlan`.
    - Assinatura cancelada: cancela `StudentPlan`.

Em progresso / Próximas:

- Testes Automatizados (Jest).
- Documentação OpenAPI/Swagger.

## Endpoints principais

Observação: todos os endpoints abaixo exigem Bearer token (Auth0) e passam pelos middlewares `jwtCheck` e `requireAuth`. Para `SaasPlan`, é necessário `requireAdmin`.

- Usuário (me)
  - POST `/api/me` — cria/atualiza o usuário autenticado (upsert por `auth0Id`)
  - GET `/api/me` — retorna dados do usuário autenticado
  - PATCH `/api/me` — atualiza dados do usuário autenticado
  - DELETE `/api/me` — apaga o usuário autenticado

- Alunos (Student)
  - POST `/api/student`
  - GET `/api/students`
  - GET `/api/student/:studentId`
  - PATCH `/api/student/:studentId`
  - DELETE `/api/student/:studentId`

- Despesas (Expense)
  - POST `/api/expense`
  - GET `/api/expenses`
  - GET `/api/expense/:id`
  - DELETE `/api/expense/:id`

- Planos do treinador (UserPlan)
  - POST `/api/plan`
  - GET `/api/plans`
  - GET `/api/plan/:id`
  - PATCH `/api/plan/:id`
  - DELETE `/api/plan/:id`

- Planos do SaaS (SaasPlan) — ADMIN
  - POST `/api/saasplan`

- Stripe Platform (SaaS)
  - POST `/api/create-checkout-session` — cria checkout de assinatura do SaaS (usa `lookup_key` do Price).
  - POST `/api/create-portal-session` — redireciona para Billing Portal do usuário.

- Stripe Connect (Treinador/Alunos)
  - POST `/api/create-connect-account` — cria conta conectada do treinador.
  - POST `/api/create-account-link` — cria link de onboarding.
  - POST `/api/checkout/connect` — cria checkout para o aluno comprar um `UserPlan` (subscription ou payment).

- Webhooks (sem Auth; corpo bruto)
  - POST `/webhook/stripe/platform` — eventos de Platform (SaaS).
  - POST `/webhook/stripe/connect` — eventos de Connect (alunos/planos do treinador).

## Exemplos (curl)

Substitua `TOKEN` pelo Bearer token do Auth0 e `<BASE_URL>` pela URL da API.

Criar plano do treinador:

```bash
curl -X POST <BASE_URL>/api/plan \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Plano Básico",
    "price": 100,
    "description": "Treino 3x por semana",
    "durationInWeeks": 4,
    "sessionsPerWeek": 3
  }'
```

Listar planos do treinador:

```bash
curl -H "Authorization: Bearer TOKEN" <BASE_URL>/api/plans
```

Criar aluno:

```bash
curl -X POST <BASE_URL>/api/student \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "name": "João", "email": "joao@example.com", "phone": "11999999999" }'
```

Despesas:

```bash
curl -X POST <BASE_URL>/api/expense \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "name": "Anilha", "amount": 250, "date": "2026-01-15", "category": "EQUIPMENT" }'
```

Checkout — assinatura do SaaS (Platform):

```bash
curl -X POST <BASE_URL>/api/create-checkout-session \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "lookup_key": "BASIC_PLAN" }'
```

Billing Portal (Platform):

```bash
curl -X POST <BASE_URL>/api/create-portal-session \
  -H "Authorization: Bearer TOKEN"
```

Criar conta Connect:

```bash
curl -X POST <BASE_URL>/api/create-connect-account \
  -H "Authorization: Bearer TOKEN"
```

Onboarding link da conta Connect:

```bash
curl -X POST <BASE_URL>/api/create-account-link \
  -H "Authorization: Bearer TOKEN"
```

Checkout — aluno compra `UserPlan` (Connect):

```bash
curl -X POST <BASE_URL>/api/checkout/connect \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "studentId": "UUID_DO_ALUNO", "userPlanId": "UUID_DO_PLANO" }'
```

## Como rodar localmente

Pré-requisitos:

- Node 18+
- PostgreSQL acessível
- Conta/tenant no Auth0 (audience, issuer, etc.)
- Conta Stripe e configuração dos endpoints de webhook

1. Instalação:

```bash
npm install
```

2. Configurar `.env`:

- `PORT` — porta do servidor (ex.: 8080)
- `DATABASE_URL` — conexão Postgres
- `SECRET` — segredo opcional
- `AUDIENCE` — Auth0 audience
- `BASE_URL` — base URL pública do backend (p/ redirects)
- `ISSUER_BASE_URL` — Auth0 issuer (ex.: https://YOUR-DOMAIN/)
- `CLIENT_ID` — Auth0 client id
- `STRIPE_API_KEY` — chave secreta da Stripe
- `STRIPE_WEBHOOK_SECRET` — secret do endpoint de webhook configurado
- (Opcional recomendado) `STRIPE_CONNECT_WEBHOOK_SECRET` — secret dedicado para o endpoint de Connect

3. Prisma:

```bash
npx prisma migrate dev --name init
npx prisma generate
```

4. Desenvolvimento:

```bash
npm run dev   # tsx watch src/server.ts
```

5. Produção:

```bash
npm run build
npm start     # node build/server.js
```

## Webhooks na Stripe

- Configure os endpoints:
  - Platform (SaaS): `POST <BASE_URL>/webhook/stripe/platform`
  - Connect (contas conectadas): `POST <BASE_URL>/webhook/stripe/connect`
- Use e verifique o `STRIPE_WEBHOOK_SECRET` (e idealmente um secret dedicado para Connect).
- Os webhooks usam `express.raw({ type: "application/json" })` para validação de assinatura.

## Arquitetura

- `src/app.ts` — setup do Express (middlewares/routers)
- `src/server.ts` — bootstrap do servidor
- `src/middlewares` — `jwtCheck`, `requireAuth`, `requireAdmin`, `errorMiddleware`, `checkSaasSubscription`, `blockIfSubscriptionExists`, `checkStripeAcc`
- `src/controllers` — validação (Zod), usuário autenticado, chama serviços
- `src/services` — regras de negócio (Prisma e Stripe)
- `src/routes` ��� agrupamento de rotas (API, Checkouts, Connect, Webhooks)
- `prisma/schema.prisma` — modelagem

## Qualidade e segurança

- Validações com Zod.
- Tratamento padronizado de erros (Prisma/Zod).
- Proteção de rotas com JWT (Auth0).
- Rate limiting com `express-rate-limit`.
- Acesso “scoped”: operações verificam `userId` do autenticado.
- Idempotência em cobranças via `externalId` (e.g., `invoice.id`).

## Roadmap resumido

- Melhorar idempotência e logs nos webhooks.
- Documentação OpenAPI/Swagger.

## Contribuição

- PRs são bem-vindas. Fluxo padrão com revisão antes do merge.
- Issues podem ser abertas para bugs, melhorias ou dúvidas.

## Licença

- MVP para avaliação técnica. Licença a definir.
