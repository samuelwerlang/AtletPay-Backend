import config from "./config.js";
const opidRouterConfig = {
    authRequired: false,
    auth0Logout: true,
    secret: config.secret,
    baseURL: String(config.baseurl),
    clientID: config.clientId,
    issuerBaseURL: config.issuerBaseUrl
};
export default opidRouterConfig;
