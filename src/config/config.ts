import "dotenv/config"
const config = {
    PORT : process.env.PORT || 8080,
    audience : process.env.AUDIENCE || "",
    issuerBaseUrl : process.env.ISSUER_BASE_URL || "",
}

export default config;