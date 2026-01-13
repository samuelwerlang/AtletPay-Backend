import opidRouterConfig from './config/openidRouter.js';
import { auth } from 'express-openid-connect';
import express from 'express';
//import { jwtCheck } from './middlewares/auth.middleware.js'
const app = express();
app.use(auth(opidRouterConfig));
// req.isAuthenticated is provided from the auth router
app.get('/', (req, res) => {
    res.send(req.oidc.isAuthenticated() ? 'Logged in' : 'Logged out');
});
app.get('/authorized', (req, res) => {
    res.send('Secured Resource');
});
export default app;
