// import config from "./config.js"
// import { auth } from 'express-openid-connect';
// // import app from "../app.js"

const opidRouterConfig = {
  authRequired: false,
  auth0Logout: true,
  secret: "885f634ab793b24fd1c56a6f34f48fa641434dcc866bf4c195d7fecca552bd99",
  baseURL: 'http://localhost:8080',
  clientID: 'oFtjBC2E0ZeyUf5sNUV1h9PazuTI1s8r',
  issuerBaseURL: 'https://atletpay.us.auth0.com'
};

export default opidRouterConfig;

// //auth router attaches /login, /logout, and /callback routes to the baseURL
// app.use(auth(opidRouterConfig));

// // req.isAuthenticated is provided from the auth router
// app.get('/', (req, res) => {
//   res.send(req.oidc.isAuthenticated() ? 'Logged in' : 'Logged out');
// });

// app.listen(config.PORT, () => {
//   console.log(`Running on port ${config.PORT}`)
// })

