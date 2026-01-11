import "dotenv/config";
import { env } from "../config/env"


export const env = {
  PORT: Number(process.env.PORT) || 3333,
  DATABASE_URL: String(env.DATABASE_URL)
};
