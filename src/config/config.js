import "dotenv/config";
const config = {
    PORT: process.env.PORT || 8080,
    DATABASE_URL: process.env.DATABASE_URL || "",
    audience: process.env.AUDIENCE || "",
    issuerBaseUrl: process.env.ISSUER_BASE_URL || "",
};
export default config;
