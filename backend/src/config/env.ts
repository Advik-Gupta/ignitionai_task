import "dotenv/config";
import { parseAllowedOrigins } from "../utils/cors-origins";

const DEFAULT_PORT = 4000;
const DEFAULT_CORS_ORIGIN = "http://localhost:3000";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. Copy .env.example to .env and fill it in.`,
    );
  }
  return value;
}

function parsePort(value: string | undefined): number {
  if (value === undefined || value === "") return DEFAULT_PORT;
  const port = Number(value);
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error(`PORT must be a positive whole number, got "${value}"`);
  }
  return port;
}

export const env = {
  mongoUri: required("MONGODB_URI"),
  port: parsePort(process.env.PORT),
  corsOrigins: parseAllowedOrigins(
    process.env.CORS_ORIGIN ?? DEFAULT_CORS_ORIGIN,
  ),
};
