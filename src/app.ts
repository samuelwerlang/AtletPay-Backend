import express from "express";
import cron from "node-cron";
import {
  deactivateStudents,
  reconcileStudentUserLinks,
} from "./cronJobs/studentCronJobs.js";
import { jwtCheck } from "./middlewares/jwtCheck.middleware.js";
import { errorMiddleware } from "./middlewares/errorHandler.js";
import stripeWebhook from "./routes/webHooks/stripePlatformWebhook.routes.js";
import stripeStudentWebhook from "./routes/webHooks/stripeConnectWebhook.routes.js";
import usersRouter from "./routes/user.routes.js";
import studentsRouter from "./routes/students.routes.js";
import saasPlansRouter from "./routes/saasPlans.routes.js";
import expensesRouter from "./routes/expenses.routes.js";
import userPlansRouter from "./routes/userPlans.routes.js";
import trainingSheetsRouter from "./routes/trainingSheets.routes.js";
import dietPlansRouter from "./routes/dietPlans.routes.js";
import exercisesRouter from "./routes/exercises.routes.js";
import usertaxIdRouter from "./routes/usertaxId.routes.js";
// import studentPlansRouter from "./routes/studentplans.routes.js";

import createCheckoutSession from "./routes/Checkouts/stripeCheckoutSession.routes.js";
import createStudentPlanCheckout from "./routes/Checkouts/stripeConnectCheckoutSession.routes.js";
import createPortalSession from "./routes/stripePortalSession.routes.js";
import createConnectAccount from "./routes/Connect/stripeCreateConnectedAccount.routes.js";
import linkConnectAccount from "./routes/Connect/stripeConnectedAccountLink.routes.js";

import { rateLimit } from "express-rate-limit";
import { StudentPlanStatus } from "@prisma/client";
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
  standardHeaders: "draft-8", // draft-6: `RateLimit-*` headers; draft-7 & draft-8: combined `RateLimit` header
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
  ipv6Subnet: 60, // Set to 60 or 64 to be less aggressive, or 52 or 48 to be more aggressive
  message: "Requests limit reached",
  // store: ... , // Redis, Memcached, etc.
});

const app = express();

// Cron Jobs
cron.schedule("*/3 * * * *", deactivateStudents);
cron.schedule("0 0 */1 * * *", reconcileStudentUserLinks);

// ================ RATE LIMITER ============
app.use("/api", limiter);

// ================ WEBHOOKS ================
app.use("/webhook", stripeWebhook);
app.use("/webhook", stripeStudentWebhook);
// ================= MIDDLEWARES ============
app.use(express.json());

// ================= PUBLIC ROUTES ==========
app.get("/", (req, res) => {
  res.json({ status: "API running" });
});

// ================= PROTECTED ROUTES =================
app.use("/api", usersRouter);
app.use("/api", studentsRouter);
app.use("/api", saasPlansRouter);
app.use("/api", expensesRouter);
app.use("/api", userPlansRouter);
app.use("/api", trainingSheetsRouter);
app.use("/api", dietPlansRouter);
app.use("/api", exercisesRouter);
app.use("/api", usertaxIdRouter);
app.use("/api", createCheckoutSession);
app.use("/api", createPortalSession);
app.use("/api", createConnectAccount);
app.use("/api", linkConnectAccount);
app.use("/api", createStudentPlanCheckout);

app.get("/authorized", jwtCheck, (req, res) => {
  res.json({ message: "Secured Resource" });
});

app.get("/profile", jwtCheck, (req, res) => {
  res.json(req.auth?.payload);
});

// ================= ERROR HANDLER =================
app.use(errorMiddleware);

export default app;
