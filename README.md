# AtletPay Backend

Backend do AtletPay, um SaaS para personal trainers gerenciarem alunos, planos, treino, dieta e cobranca com Stripe.

## Resumo

- Stack: Node.js, Express, TypeScript (ESM), Prisma, PostgreSQL, Auth0, Stripe, Zod.
- API base: `/api`
- Webhooks: `/webhook/stripe/platform` e `/webhook/stripe/connect`
- Status atual: build e testes passando.

## Perfis e regras de acesso

- `ADMIN`
  - Pode criar planos SaaS (`POST /api/saasplan`).
- `USER` (personal)
  - Gerencia alunos, planos, treinos, dietas, exercicios, checkout e conectividade Stripe.
- `STUDENT`
  - Leitura apenas de treino e dieta.
  - Somente rotas `GET` em treino/dieta.
  - Precisa estar vinculado (`Student.studentUserId`) e ativo (`Student.isActive=true`).
  - Nao pode criar subscription/checkout (`403` nas rotas de billing).

## Fluxos principais

### 1) Conta de aluno vinculada por email

- O personal cria um `Student` com email.
- O aluno cria conta Auth0.
- Em `POST /api/user`, o backend faz upsert do `User` e tenta vincular automaticamente por email.
- Quando o vinculo e univoco, o usuario vira `role=STUDENT`.

### 2) Biblioteca de exercicios

- Modelo `Exercise` por personal (`userId`).
- CRUD dedicado (`/api/exercise*` e `/api/exercises`).
- `TrainingSheetExercise` referencia `exerciseId`.

### 3) Training Sheet com criacao inline de exercicio

Nos itens de exercicio da planilha, pode enviar:

- `exerciseId`: reutiliza exercicio existente.
- `exerciseName`: cria/reutiliza automaticamente na biblioteca dentro da mesma transacao.

## Endpoints

Todos exigem Bearer token Auth0, exceto webhooks e health root.

### Usuario

- `POST /api/user`
- `GET /api/user`
- `PATCH /api/user`
- `DELETE /api/user`

### Students

- `POST /api/student`
- `GET /api/students`
- `GET /api/students/active`
- `GET /api/student/:studentId`
- `PATCH /api/student/:studentId`
- `DELETE /api/student/:studentId`

### Expenses

- `POST /api/expense`
- `GET /api/expenses`
- `GET /api/expense/:id`
- `DELETE /api/expense/:id`

### User Plans (planos do personal)

- `POST /api/userplan`
- `GET /api/userplans`
- `GET /api/userplan/:id`
- `PATCH /api/userplan/:id`
- `DELETE /api/userplan/:id`

### SaaS Plans (admin)

- `POST /api/saasplan`

### Diet Plans

- `POST /api/diet-plan`
- `GET /api/diet-plans`
- `GET /api/diet-plan/:dietPlanId`
- `PATCH /api/diet-plan/:dietPlanId`
- `DELETE /api/diet-plan/:dietPlanId`
- `GET /api/meals`

### Training Sheets

- `POST /api/training-sheet`
- `GET /api/training-sheets`
- `GET /api/training-sheet/:trainingSheetId`
- `PATCH /api/training-sheet/:trainingSheetId`
- `DELETE /api/training-sheet/:trainingSheetId`

### Exercise Library

- `POST /api/exercise`
- `GET /api/exercises`
- `GET /api/exercise/:exerciseId`
- `PATCH /api/exercise/:exerciseId`
- `DELETE /api/exercise/:exerciseId`

### Stripe Platform e Connect

- `POST /api/create-checkout-session`
- `POST /api/create-portal-session`
- `POST /api/create-connect-account`
- `POST /api/create-account-link`
- `POST /api/checkout/connect`

### Webhooks (sem Auth)

- `POST /webhook/stripe/platform`
- `POST /webhook/stripe/connect`

## Exemplos de payload

### Criar exercicio

```json
{
  "name": "Remada Curvada",
  "description": "Pegada pronada, foco em dorsais"
}
```

### Criar training sheet com exercicio existente + inline

```json
{
  "name": "Treino A - Superiores",
  "startDate": "2026-03-22T08:00:00.000Z",
  "studentId": "11111111-2222-4333-8444-555555555555",
  "exercises": [
    {
      "exerciseId": "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
      "sets": 4,
      "repetitions": "8-10",
      "order": 0
    },
    {
      "exerciseName": "Desenvolvimento com Halteres",
      "sets": 3,
      "repetitions": "10-12",
      "order": 1
    }
  ]
}
```

## Setup local

### Pre-requisitos

- Node.js 18+
- PostgreSQL
- Tenant Auth0
- Conta Stripe

### Instalacao

```bash
npm install
```

### Variaveis de ambiente

Configure `.env` com:

- `PORT`
- `DATABASE_URL`
- `AUDIENCE`
- `ISSUER_BASE_URL`
- `CLIENT_ID`
- `BASE_URL`
- `STRIPE_API_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_CONNECT_WEBHOOK_SECRET` (recomendado)

### Banco e Prisma

```bash
npx prisma migrate dev
npx prisma generate
```

### Rodar em desenvolvimento

```bash
npm run dev
```

### Build e testes

```bash
npm run build
npm test -- --runInBand
```

## Deploy checklist

1. Build e testes verdes.
2. Aplicar migrations no ambiente alvo:

```bash
npx prisma migrate deploy
```

3. Garantir env vars de Auth0 e Stripe.
4. Configurar endpoints de webhook na Stripe.
5. Smoke test de rotas criticas:
   - `POST /api/user`
   - `GET /api/training-sheets`
   - `GET /api/diet-plans`
   - `POST /api/create-checkout-session` (apenas personal)

## Estrutura do projeto

- `src/app.ts` setup da aplicacao e rotas
- `src/controllers` validacao e camada HTTP
- `src/services` regra de negocio
- `src/middlewares` autenticacao/autorizacao e guard rails
- `src/routes` agrupamento de endpoints
- `prisma/schema.prisma` modelo de dados

## Licenca

Licenca a definir.
