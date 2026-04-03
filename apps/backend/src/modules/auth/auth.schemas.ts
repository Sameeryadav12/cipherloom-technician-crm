import { z } from "zod";

const nameLettersAndSpacesOnly = /^[A-Za-z ]+$/;

const passwordRules = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must be at most 128 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(
    /[^A-Za-z0-9]/,
    "Password must contain at least one special character"
  );

export const registerAdminBodySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be at most 100 characters")
    .regex(
      nameLettersAndSpacesOnly,
      "Name may only contain letters and spaces"
    ),
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Invalid email format")
    .transform((v) => v.toLowerCase()),
  password: passwordRules
});

export const loginBodySchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Invalid email format")
    .transform((v) => v.toLowerCase()),
  password: z.string().min(1, "Password must not be empty")
});

export const refreshBodySchema = z.object({
  refreshToken: z
    .string()
    .min(1, "refreshToken must be a non-empty string")
});

export type RegisterAdminBody = z.infer<typeof registerAdminBodySchema>;
export type LoginBody = z.infer<typeof loginBodySchema>;
export type RefreshBody = z.infer<typeof refreshBodySchema>;
