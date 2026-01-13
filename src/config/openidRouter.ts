import config from "./config.js"
// import { auth } from 'express-openid-connect';
// // import app from "../app.js"

interface IopId {
  authRequired : boolean
  auth0Logout :  boolean 
  secret : string
  baseURL : string
  clientID : string
  issuerBaseURL : string
}

const opidRouterConfig : IopId = {
  authRequired: false,
  auth0Logout: true,
  secret: String(config.secret),
  baseURL: String(config.baseurl),
  clientID: String(config.clientId),
  issuerBaseURL: String(config.issuerBaseUrl)
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

