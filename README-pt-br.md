# AtletPay Backend

API do AtletPay, um SaaS de gestão para personal trainers. A aplicação oferece controle de alunos, planos de treino e dieta, finanças e cobrança via Stripe, com um modelo de autorização que separa perfis de administrador, personal trainer e aluno.

## Visão geral do produto

O backend centraliza a lógica de negócio e integrações para um sistema de treinamento personalizado:

- Cadastro e vínculo de alunos (`Student`) a perfis de personal trainer.
- Biblioteca de exercícios reutilizável por personal.
- Criação e edição de planos de treino (`TrainingSheet`) e dieta (`DietPlan`).
- Gestão de despesas e planos de serviço do personal (`UserPlan`).
- Cobrança via Stripe com Checkout, Portal de cobrança e Stripe Connect.
- Webhooks para atualizar assinaturas, faturas e status de cobrança.

## Stack principal

- Node.js + Express
- TypeScript com ESM
- Prisma ORM
- PostgreSQL
- Auth0 para autenticação e autorização
- Stripe (Checkout, Billing Portal, Connect)
- Zod para validação de payloads

## Autenticação e perfis

A API utiliza Auth0 com Bearer JWT em rotas protegidas. As principais camadas de autorização são:

- `ADMIN`: pode gerenciar planos SaaS (`/api/saasplan`).
- `USER`: personal trainer que gerencia alunos, planos, treinos, dietas, exercícios, cobranças e Stripe.
- `STUDENT`: leitura limitada, principalmente para visualizar planos de treino e dieta.

> Rotas de webhook (`/webhook/*`) não exigem autenticação.

## Base de rotas

- Base protegida: `/api`
- Webhooks Stripe: `/webhook`
- Health check público: `/`

## Principais recursos e rotas

### Usuário

- `POST /api/user` — cria ou atualiza um usuário na base após login Auth0.
- `GET /api/user` — busca dados do usuário autenticado.
- `PATCH /api/user` — atualiza dados do usuário.
- `DELETE /api/user` — exclui usuário.

### Alunos (`Students`)

- `POST /api/student` — cria um aluno vinculado ao personal.
- `GET /api/students` — lista todos os alunos do personal.
- `GET /api/students/active` — lista alunos ativos.
- `GET /api/student/:studentId` — obtém um aluno específico.
- `PATCH /api/student/:studentId` — atualiza aluno.
- `DELETE /api/student/:studentId` — exclui aluno.

### Plano financeiro do personal (`UserPlan`)

- `POST /api/userplan` — cria um plano de cobrança do personal.
- `GET /api/userplans` — lista planos do personal.
- `GET /api/userplan/:id` — obtém um plano específico.
- `PATCH /api/userplan/:id` — atualiza plano.
- `DELETE /api/userplan/:id` — remove plano.

### Despesas (`Expenses`)

- `POST /api/expense` — registra despesa.
- `GET /api/expenses` — lista despesas.
- `GET /api/expense/:id` — obtém despesa por id.
- `DELETE /api/expense/:id` — exclui despesa.

### Planos SaaS (`SaaS Plan`)

- `POST /api/saasplan` — cria um plano SaaS (apenas `ADMIN`).

### Dietas (`DietPlan`)

- `POST /api/diet-plan` — cria um plano de dieta.
- `GET /api/diet-plans` — lista planos de dieta.
- `GET /api/diet-plan/:dietPlanId` — obtém plano de dieta por id.
- `PATCH /api/diet-plan/:dietPlanId` — atualiza plano.
- `DELETE /api/diet-plan/:dietPlanId` — exclui plano.
- `GET /api/meals` — consulta biblioteca de refeições.

### Treinos (`TrainingSheet`)

- `POST /api/training-sheet` — cria uma planilha de treino.
- `GET /api/training-sheets` — lista planilhas.
- `GET /api/training-sheet/:trainingSheetId` — obtém planilha por id.
- `PATCH /api/training-sheet/:trainingSheetId` — atualiza planilha.
- `DELETE /api/training-sheet/:trainingSheetId` — exclui planilha.

### Biblioteca de exercícios (`Exercise`)

- `POST /api/exercise` — cria exercício.
- `GET /api/exercises` — lista exercícios.
- `GET /api/exercise/:exerciseId` — obtém exercício por id.
- `PATCH /api/exercise/:exerciseId` — atualiza exercício.
- `DELETE /api/exercise/:exerciseId` — exclui exercício.

### Stripe e cobrança

- `POST /api/create-checkout-session` — inicia sessão Stripe Checkout para assinatura ou pagamento de SaaS.
- `POST /api/create-portal-session` — cria sessão do Stripe Billing Portal para o cliente gerenciar assinatura.
- `POST /api/create-connect-account` — cria conta Stripe Connect para o personal.
- `POST /api/create-account-link` — gera link de onboarding para conta Connect.
- `POST /api/checkout/connect` — inicia checkout de plano do personal usando Stripe Connect.

### CPF do usuário

- `POST /api/cpf` — cadastra CPF.
- `GET /api/cpf/:id` — obtém CPF cadastrado.
- `DELETE /api/cpf/:id` — remove CPF.

### Webhooks Stripe

- `POST /webhook/stripe/platform` — recebe eventos de plataforma Stripe.
- `POST /webhook/stripe/connect` — recebe eventos de contas conectadas.

## Fluxos relevantes para front-end

### 1. Cadastro e vínculo de aluno

1. Personal cria aluno com `POST /api/student`.
2. Aluno se autentica no Auth0.
3. Front-end chama `POST /api/user` para sincronizar perfil.
4. Backend tenta vincular aluno automaticamente por e-mail.

### 2. Criação de planilha de treino com exercício inline

O payload de `POST /api/training-sheet` aceita itens que podem ter:

- `exerciseId`: usa exercício existente.
- `exerciseName`: cria novo exercício automaticamente na biblioteca do personal.

### 3. Checkout e cobrança

- `POST /api/create-checkout-session` cria sessão Stripe para cobrança de assinatura.
- `POST /api/create-portal-session` redireciona para o portal de cobrança do cliente.
- `POST /api/checkout/connect` realiza checkout de um plano do personal para um aluno.

## Boas práticas para consumo

- Envie `Authorization: Bearer <token>` em todas as rotas `/api` protegidas.
- Use o `sub` do Auth0 para identificar o usuário no backend.
- Trate `403` e `401` para permissões e autenticação.
- Utilize os IDs retornados pelos recursos para fazer updates e deletes.

## Licença

Este projeto está licenciado sob a licença MIT.

---

MIT License

Copyright (c) 2026

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
