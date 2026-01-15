import opidRouterConfig from './config/openidRouter.js';
import pkg from 'express-openid-connect';
const { auth, requiresAuth } = pkg;
import express from 'express';
import usersRouter from './routes/users.routes.js';
import studentsRouter from "./routes/students.routes.js";
//import { jwtCheck } from './middlewares/auth.middleware.js'
const app = express();
//MIDDLEWARES
app.use(express.json());
app.use(auth(opidRouterConfig));
app.use('/api', usersRouter, studentsRouter);
// req.isAuthenticated is provided from the auth router
app.get('/', (req, res) => {
    res.json(req.oidc.isAuthenticated() ? { authStatus: "logged in" } : { authStatus: "logged out" });
});
app.get('/authorized', requiresAuth(), async (req, res) => {
    res.json({
        message: "Secured Resource"
    });
});
app.get('/profile', requiresAuth(), (req, res) => {
    res.send(JSON.stringify(req.oidc.user, null, 2));
});
export default app;
