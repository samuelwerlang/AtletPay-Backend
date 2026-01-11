import express from "express";
import config from "../../config.js";
import { auth } from 'express-oauth2-jwt-bearer';
const app = express();
const jwtCheck = auth({
    audience: config.audience,
    issuerBaseURL: config.issuerBaseUrl,
    tokenSigningAlg: 'RS256'
});
// enforce on all endpoints
app.use(jwtCheck);
app.get('/authorized', function (req, res) {
    res.send('Secured Resource');
});
app.listen(config.PORT);
console.log('Running on port ', config.PORT);
