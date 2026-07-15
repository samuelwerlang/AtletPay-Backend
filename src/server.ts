import "dotenv/config";
import app from "./app.js";
import config from "./config/config.js";
import process from "process";
import { prisma } from "./lib/prisma.js";

const server = app.listen(config.PORT, () => {
  console.log(`Running on port ${config.PORT}`);
});

function gracefulShutdown() {

  server.close(async (err?: Error) => {
    if (err) {
      console.error("\nError during server shutdown:", err);
      process.exit(1);
    }
    try {
      await prisma.$disconnect();
      console.log("\x1b[33m\nDatabase connection closed. Exiting process...\x1b[0m");
      process.exit(0);
    } catch (error: any) {
      console.error("\nError during database disconnection:", error);
      process.exit(1);
    }
  });
}

// Process signal handlers for graceful shutdown

process.on("SIGINT", () => {
  console.log("\x1b[36m\nSIGINT received. Shutting down gracefully...\x1b[0m");
  gracefulShutdown();
}); 
process.on("SIGTERM", () => {
  console.log("\x1b[36m\nSIGTERM received. Shutting down gracefully...\x1b[0m");
  gracefulShutdown();
});
