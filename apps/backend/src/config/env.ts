import dotenv from "dotenv";
import { z } from "zod";
import { validateEnv } from "../utils/validate-env.js";

dotenv.config();

const booleanish = z.preprocess((value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    if (value.toLowerCase() === "true" || value === "1") return true;
    if (value.toLowerCase() === "false" || value === "0") return false;
  }
  return value;
}, z.boolean());

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(1),
  JWT_REFRESH_SECRET: z.string().min(1),
  JWT_ACCESS_EXPIRES_IN: z.string().min(1).default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().min(1).default("7d"),
  BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),
  INVOICE_TAX_RATE_PERCENT: z.coerce.number().min(0).max(100).default(0),
  CORS_ALLOWED_ORIGINS: z.string().default(""),
  API_JSON_LIMIT: z.string().default("1mb"),
  TRUST_PROXY: booleanish.default(false),
  ENABLE_DEV_TEST_ENDPOINTS: booleanish.default(false),
  ENABLE_MANUAL_AUTOMATION_RUN: booleanish.default(false),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().min(1000).default(60_000),
  RATE_LIMIT_AUTH_MAX: z.coerce.number().int().min(1).default(20),
  RATE_LIMIT_SENSITIVE_MAX: z.coerce.number().int().min(1).default(10)
});

export const env = validateEnv(envSchema, process.env);

