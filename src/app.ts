import express from "express";
import { jwtCheck } from "./middlewares/jwtCheck.middleware.js";
import { errorMiddleware } from "./middlewares/errorHandler.js";
import stripeWebhook from "./routes/stripeWebhook.routes.js";
import usersRouter from "./routes/me.routes.js";
import studentsRouter from "./routes/students.routes.js";
import saasPlansRouter from "./routes/saas-plans.routes.js";
import expensesRouter from "./routes/expenses.routes.js";
import userPlansRouter from "./routes/plans.routes.js";
import studentPlansRouter from "./routes/studentplans.routes.js";

import createCheckoutSession from "./routes/stripeCheckoutSession.routes.js";
import createPortalSession from "./routes/stripePortalSession.routes.js";
import createConnectAccount from "./routes/stripeCreateConnectedAccount.routes.js";
import linkConnectAccount from "./routes/stripeConnectedAccountLink.routes.js";

const app = express();

// ================ WEBHOOKS ================
app.use("/api", stripeWebhook);
// ================= MIDDLEWARES =================
app.use(express.json());

// ================= PUBLIC ROUTES =================
app.get("/", (req, res) => {
  res.json({ status: "API running" });
});

app.get("/callback", (req, res) => {
  res.send(`
    <h1>Login OK</h1>
    <p>Copie o access_token da URL</p>
    <script>
    const hash = window.location.hash;
    document.body.innerHTML += "<pre>" + hash + "</pre>";
    </script>
    `);
});

// ================= PROTECTED ROUTES =================
app.use("/api", usersRouter);
app.use("/api", studentsRouter);
app.use("/api", saasPlansRouter);
app.use("/api", expensesRouter);
app.use("/api", userPlansRouter);
app.use("/api", studentPlansRouter);
app.use("/api", createCheckoutSession);
app.use("/api", createPortalSession);
app.use("/api", createConnectAccount);
app.use("/api", linkConnectAccount);

app.get("/authorized", jwtCheck, (req, res) => {
  res.json({ message: "Secured Resource" });
});

app.get("/profile", jwtCheck, (req, res) => {
  res.json(req.auth?.payload);
});

// ================= ERROR HANDLER =================
app.use(errorMiddleware);

export default app;
