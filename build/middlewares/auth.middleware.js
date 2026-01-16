import { auth } from 'express-oauth2-jwt-bearer';
import config from '../config/config.js';
export const jwtCheck = auth({
    audience: config.audience,
    issuerBaseURL: config.issuerBaseUrl,
    tokenSigningAlg: 'RS256',
});
