import "dotenv/config";
const config = {
  PORT: process.env.PORT || 8080,
  DATABASE_URL: process.env.DATABASE_URL || "",
  STRIPE_API_KEY: process.env.STRIPE_API_KEY || "",
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || "",
  STRIPE_CONNECT_WEBHOOK_SECRET:
    process.env.STRIPE_CONNECT_WEBHOOK_SECRET || "",
  secret: process.env.SECRET || "",
  audience: process.env.AUDIENCE || "",
  baseurl: process.env.BASE_URL || "",
  issuerBaseUrl: process.env.ISSUER_BASE_URL || "",
  clientId: process.env.CLIENT_ID || "",
};

export default config;
