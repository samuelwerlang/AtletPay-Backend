import express from "express";
import { jwtCheck } from "./middlewares/jwtCheck.middleware.js";

import usersRouter from "./routes/users.routes.js";
import studentsRouter from "./routes/students.routes.js";
import saasPlansRouter from "./routes/saas-plans.routes.js";
import { errorMiddleware } from "./middlewares/errorHandler.js";

const app = express();

// ================= MIDDLEWARES =================
app.use(express.json());

// ================= PUBLIC ROUTES =================
app.get("/", (req, res) => {
  res.json({ status: "API running 🚀" });
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
app.use("/api", jwtCheck, usersRouter);
app.use("/api", jwtCheck, studentsRouter);
app.use("/api", jwtCheck, saasPlansRouter);

app.get("/authorized", jwtCheck, (req, res) => {
  res.json({ message: "Secured Resource" });
});

app.get("/profile", jwtCheck, (req, res) => {
  res.json(req.auth?.payload);
});

// ================= ERROR HANDLER =================
app.use(errorMiddleware);

export default app;
