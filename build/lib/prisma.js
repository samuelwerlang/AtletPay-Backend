import config from "../config/config.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../node_modules/.prisma/client/client.js";
const connectionString = `${config.DATABASE_URL}`;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });
export { prisma };
