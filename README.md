# AtletPay Backend (MVP)

Para recrutadores: este é o backend de um MVP para um SaaS de gerenciamento de alunos e automação de cobranças voltado a personal trainers. O foco é simplicidade, modelagem clara e endpoints essenciais para validar o produto.

Status: em desenvolvimento ativo. As principais entidades, autenticação (Auth0) e rotas iniciais já estão funcionando.

## Visão geral

- Objetivo: permitir que um personal trainer gerencie seus alunos, planos, despesas e cobranças, além de assinar planos do próprio SaaS.
- Stack:
  - Node.js + Express + TypeScript (ESM)
  - Prisma + PostgreSQL
  - Auth0 (JWT)
  - Validação com Zod
- Principais entidades:
  - User, Student, Expense, Charge, RecurringCharge
  - UserPlan (plano do treinador), StudentPlan (vínculo do aluno ao plano)
  - SaasPlan, Subscription (assinatura do SaaS)

## Funcionalidades (MVP)

Implementadas:
- Autenticação via Auth0 (JWT) e proteção por middleware.
- CRUD básico de alunos (Student).
- CRUD de despesas (Expense).
- Criação de planos do SaaS (SaasPlan) — restrito a ADMIN.
- CRUD de planos do treinador (UserPlan) e listagem.
- Tratamento de erros centralizado (Prisma/Zod).

Em progresso / Próximas:
- Vinculação de StudentPlan com cálculo automático de datas.
- Cobranças e recorrências (Charge/RecurringCharge).
- Integração com gateway de pagamento (Stripe/Mercado Pago/Asaas) e webhooks.
- Fluxo de Subscription do SaaS com limites (maxStudents/maxPlans).

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

### Exemplos (curl)

Substitua `TOKEN` pelo Bearer token do Auth0.

Criar plano do treinador:
```bash
curl -X POST https://<base-url>/api/plan \
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
curl -H "Authorization: Bearer TOKEN" https://<base-url>/api/plans
```

Criar aluno:
```bash
curl -X POST https://<base-url>/api/student \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "name": "João", "email": "joao@example.com", "phone": "11999999999" }'
```

Criar despesa:
```bash
curl -X POST https://<base-url>/api/expense \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "name": "Anilha", "amount": 250, "date": "2026-01-15", "category": "EQUIPMENT" }'
```

## Como rodar localmente

Pré-requisitos:
- Node 18+
- PostgreSQL acessível
- Conta/tenant no Auth0 (audience, issuer, etc.)

1) Clone e instale:
```bash
npm install
```

2) Configure `.env` (veja variáveis abaixo).

3) Prisma:
```bash
npx prisma migrate deploy
npx prisma generate
```

4) Desenvolvimento:
- Recomendo usar `tsx`:
```bash
npm run dev   # tsx watch src/server.ts
```

5) Produção:
```bash
npm run build
npm start     # node build/server.js
```

## Variáveis de ambiente (.env)

- `PORT` — porta do servidor (ex.: 8080)
- `DATABASE_URL` — conexão Postgres (ex.: postgres://user:pass@host:5432/db)
- `SECRET` — segredo opcional de app
- `AUDIENCE` — audience do Auth0
- `BASE_URL` — base URL pública do backend (string)
- `ISSUER_BASE_URL` — issuer do Auth0 (ex.: https://YOUR-DOMAIN/)
- `CLIENT_ID` — client id (Auth0)

## Arquitetura

- `src/app.ts` — setup do Express (middlewares/routers)
- `src/server.ts` — bootstrap do servidor
- `src/middlewares` — `jwtCheck`, `requireAuth`, `requireAdmin`, `errorMiddleware`
- `src/controllers` — orquestram validações (Zod), o usuário autenticado e chamam serviços
- `src/services` — lógica de negócios e acesso ao Prisma
- `src/lib/prisma.ts` — inicializa Prisma com adapter-pg
- `prisma/schema.prisma` — modelagem completa

## Qualidade e segurança

- Validação de entrada com Zod.
- Tratamento padronizado de erros (Prisma/Zod/Erro genérico).
- Proteção de rotas com JWT (Auth0).
- Princípio de “scoped access”: operações sempre verificam o `userId` do autenticado.

## Roadmap resumido

- Automação de cobranças (geração de `Charge` a partir de `StudentPlan`).
- Integração com gateway (Stripe/Mercado Pago/Asaas) e webhooks.
- Fluxo de Subscription do SaaS com limites por plano.
- Documentação OpenAPI/Swagger.

## Contribuição

- PRs são bem-vindas. Fluxo padrão com revisão antes do merge.
- Issues podem ser abertas para bugs, melhorias ou dúvidas.

## Licença

Este projeto é disponibilizado como MVP para avaliação técnica. Licença a definir.
