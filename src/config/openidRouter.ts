import config from "./config.js"

interface IopIdConfig {
  authRequired : boolean
  auth0Logout :  boolean 
  secret : string
  baseURL : string
  clientID : string
  issuerBaseURL : string
}

const opidRouterConfig : IopIdConfig = {
  authRequired: false,
  auth0Logout: true,
  secret: config.secret,
  baseURL : String(config.baseurl),
  clientID: config.clientId,
  issuerBaseURL: config.issuerBaseUrl
};

export default opidRouterConfig;

