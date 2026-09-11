import mongoose from "mongoose";
import { createApp } from "./app";
import { connectToDatabase } from "./config/database";
import { env } from "./config/env";
import { seedIfEmpty } from "./services/sample-data.service";

const SHUTDOWN_TIMEOUT_MS = 10_000;

async function start() {
  await connectToDatabase(env.mongoUri);
  console.log("Connected to MongoDB");

  const seeded = await seedIfEmpty();
  if (seeded) {
    console.log(
      `Database was empty, loaded ${seeded.inserted.length} sample trips`,
    );
  }

  const app = createApp(env.corsOrigins);
  const server = app.listen(env.port, (error?: Error) => {
    if (error) {
      console.error(`Could not listen on port ${env.port}:`, error);
      process.exit(1);
    }
    console.log(`API listening on port ${env.port}`);
    console.log(`Allowed origins: ${env.corsOrigins.join(", ") || "none"}`);
  });

  const shutdown = (signal: NodeJS.Signals) => {
    console.log(`${signal} received, closing connections`);
    setTimeout(() => process.exit(1), SHUTDOWN_TIMEOUT_MS).unref();

    server.close(() => {
      mongoose
        .disconnect()
        .then(() => process.exit(0))
        .catch((error) => {
          console.error("Error while disconnecting from MongoDB:", error);
          process.exit(1);
        });
    });
  };

  process.once("SIGTERM", shutdown);
  process.once("SIGINT", shutdown);
}

start().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
