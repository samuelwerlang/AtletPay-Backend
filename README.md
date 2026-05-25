# AtletPay Backend

This is the backend API for AtletPay, a SaaS platform that helps personal trainers manage students, training programs, diet plans, finances, and Stripe billing.

## Product Overview

AtletPay centralizes business logic and integrations for a personalized fitness management service:

- Student registration and linking to a trainer profile (`Student`).
- Reusable exercise library for each trainer.
- Training plan creation and editing (`TrainingSheet`).
- Diet plan creation and editing (`DietPlan`).
- Expense tracking and trainer service plans (`UserPlan`).
- Stripe billing with Checkout sessions, Billing Portal, and Stripe Connect onboarding.
- Webhooks to keep subscriptions, invoices, and billing status synchronized.

## Core Stack

- Node.js + Express
- TypeScript with ESM
- Prisma ORM
- PostgreSQL
- Auth0 for authentication and authorization
- Stripe (Checkout, Billing Portal, Connect)
- Zod for payload validation

## Authentication and Roles

The API uses Auth0 with Bearer JWT for protected routes. Main authorization roles:

- `ADMIN`: can create SaaS plans (`/api/saasplan`).
- `USER`: a personal trainer who manages students, plans, training, diets, exercises, billing, and Stripe actions.
- `STUDENT`: limited read access, mainly for viewing training and diet plans.

> Webhook routes (`/webhook/*`) do not require authentication.

## Base Routes

- Protected API base: `/api`
- Stripe webhooks: `/webhook`
- Public health check: `/`

## Main Resources and Endpoints

### User

- `POST /api/user` — create or update a user after Auth0 login.
- `GET /api/user` — retrieve the authenticated user profile.
- `PATCH /api/user` — update the user profile.
- `DELETE /api/user` — delete the user.

### Students

- `POST /api/student` — create a student linked to the trainer.
- `GET /api/students` — list all students for the trainer.
- `GET /api/students/active` — list active students.
- `GET /api/student/:studentId` — get a specific student.
- `PATCH /api/student/:studentId` — update a student.
- `DELETE /api/student/:studentId` — delete a student.

### Trainer Plans (`UserPlan`)

- `POST /api/userplan` — create a trainer service plan.
- `GET /api/userplans` — list trainer plans.
- `GET /api/userplan/:id` — get a specific plan.
- `PATCH /api/userplan/:id` — update a plan.
- `DELETE /api/userplan/:id` — delete a plan.

### Expenses

- `POST /api/expense` — record an expense.
- `GET /api/expenses` — list expenses.
- `GET /api/expense/:id` — get expense details.
- `DELETE /api/expense/:id` — delete an expense.

### SaaS Plans

- `POST /api/saasplan` — create a SaaS plan (ADMIN only).

### Diet Plans

- `POST /api/diet-plan` — create a diet plan.
- `GET /api/diet-plans` — list diet plans.
- `GET /api/diet-plan/:dietPlanId` — get a diet plan by ID.
- `PATCH /api/diet-plan/:dietPlanId` — update a diet plan.
- `DELETE /api/diet-plan/:dietPlanId` — delete a diet plan.
- `GET /api/meals` — get the meals library.

### Training Sheets

- `POST /api/training-sheet` — create a training sheet.
- `GET /api/training-sheets` — list training sheets.
- `GET /api/training-sheet/:trainingSheetId` — get a training sheet by ID.
- `PATCH /api/training-sheet/:trainingSheetId` — update a training sheet.
- `DELETE /api/training-sheet/:trainingSheetId` — delete a training sheet.

### Exercise Library

- `POST /api/exercise` — create an exercise.
- `GET /api/exercises` — list exercises.
- `GET /api/exercise/:exerciseId` — get an exercise.
- `PATCH /api/exercise/:exerciseId` — update an exercise.
- `DELETE /api/exercise/:exerciseId` — delete an exercise.

### Stripe and Billing

- `POST /api/create-checkout-session` — start a Stripe Checkout session for SaaS subscription or payment.
- `POST /api/create-portal-session` — create a Stripe Billing Portal session.
- `POST /api/create-connect-account` — create a Stripe Connect account for the trainer.
- `POST /api/create-account-link` — generate an onboarding link for the Connect account.
- `POST /api/checkout/connect` — create a checkout session for a trainer plan using Stripe Connect.

### User Tax ID (CPF)

- `POST /api/cpf` — create a CPF record.
- `GET /api/cpf/:id` — retrieve a CPF record.
- `DELETE /api/cpf/:id` — delete a CPF record.

### Stripe Webhooks

- `POST /webhook/stripe/platform` — receive Stripe platform events.
- `POST /webhook/stripe/connect` — receive Stripe Connect account events.

## Front-end Usage Flows

### 1. Student registration and linking

1. The trainer creates a student with `POST /api/student`.
2. The student authenticates using Auth0.
3. The front-end calls `POST /api/user` to synchronize the profile.
4. The backend attempts automatic student linking by email.

### 2. Creating training sheets with inline exercises

`POST /api/training-sheet` accepts exercise items with either:

- `exerciseId` — use an existing exercise.
- `exerciseName` — create a new exercise in the trainer's library automatically.

### 3. Billing flow

- `POST /api/create-checkout-session` starts the Stripe Checkout flow.
- `POST /api/create-portal-session` redirects to the Stripe Billing Portal.
- `POST /api/checkout/connect` starts a checkout flow for student billing via trainer plans.

## Best Practices for API Consumers

- Send `Authorization: Bearer <token>` on all protected `/api` requests.
- Use the Auth0 `sub` claim to identify the user in the backend.
- Handle `401` and `403` responses for authentication and authorization issues.
- Use returned resource IDs to perform updates and deletes reliably.

## License

This project is licensed under the MIT License.
