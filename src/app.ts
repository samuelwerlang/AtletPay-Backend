import express from "express";
import { jwtCheck } from "./middlewares/auth.middleware.js";

import usersRouter from "./routes/users.routes.js";
import studentsRouter from "./routes/students.routes.js";
import saasPlansRouter from "./routes/saas-plans.routes.js";

const app = express();

// ================= MIDDLEWARES =================
app.use(express.json());

// ================= PUBLIC ROUTES =================
app.get("/", (req, res) => {
  res.json({ status: "API running 🚀" });
});

// ================= PROTECTED ROUTES =================
app.use("/api", jwtCheck, usersRouter);
app.use("/api", jwtCheck, studentsRouter);
app.use("/api", jwtCheck, saasPlansRouter);

app.get("/authorized", jwtCheck, (req, res) => {
  res.json({ message: "Secured Resource" });
});

app.get("/profile", jwtCheck, (req, res) => {
  res.json(req.auth?.payload);
});

export default app;
