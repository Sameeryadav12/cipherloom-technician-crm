import { z } from "zod";

export function validateEnv<TSchema extends z.ZodTypeAny>(
  schema: TSchema,
  rawEnv: NodeJS.ProcessEnv
): z.infer<TSchema> {
  const parsed = schema.safeParse(rawEnv);
  if (parsed.success) return parsed.data;

  const issues = parsed.error.issues
    .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
    .join("\n");

  throw new Error(`Invalid environment configuration:\n${issues}`);
}

