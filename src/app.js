import express from 'express';
import { jwtCheck } from './middlewares/auth.middleware.js';
const app = express();
app.use(jwtCheck);
app.get('/authorized', (req, res) => {
    res.send('Secured Resource');
});
export default app;
