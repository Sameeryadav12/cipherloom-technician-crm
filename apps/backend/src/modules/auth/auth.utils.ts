import bcrypt from "bcrypt";
import jwt, { type SignOptions } from "jsonwebtoken";
import type { UserRole } from "@prisma/client";
import { env } from "../../config/env.js";
import { REFRESH_TOKEN_CLAIM } from "./auth.constants.js";
import type { AccessTokenPayload, RefreshTokenPayload } from "./auth.types.js";

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, env.BCRYPT_SALT_ROUNDS);
}

export async function verifyPassword(
  plain: string,
  passwordHash: string
): Promise<boolean> {
  return bcrypt.compare(plain, passwordHash);
}

export function signAccessToken(input: {
  userId: string;
  email: string;
  role: UserRole;
}): string {
  const payload: AccessTokenPayload = {
    sub: input.userId,
    email: input.email,
    role: input.role
  };
  const options: SignOptions = {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions["expiresIn"]
  };
  return jwt.sign(payload, env.JWT_SECRET, options);
}

export function signRefreshToken(userId: string): string {
  const payload: RefreshTokenPayload = {
    sub: userId,
    tokenType: REFRESH_TOKEN_CLAIM
  };
  const options: SignOptions = {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as SignOptions["expiresIn"]
  };
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, options);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET);
  if (typeof decoded !== "object" || decoded === null) {
    throw new Error("Invalid access token");
  }
  const d = decoded as Record<string, unknown>;
  if (
    typeof d["sub"] !== "string" ||
    typeof d["email"] !== "string" ||
    typeof d["role"] !== "string"
  ) {
    throw new Error("Invalid access token");
  }
  return {
    sub: d["sub"],
    email: d["email"],
    role: d["role"] as UserRole
  };
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET);
  if (typeof decoded !== "object" || decoded === null) {
    throw new Error("Invalid refresh token");
  }
  const d = decoded as Record<string, unknown>;
  if (
    typeof d["sub"] !== "string" ||
    d["tokenType"] !== REFRESH_TOKEN_CLAIM
  ) {
    throw new Error("Invalid refresh token");
  }
  return { sub: d["sub"], tokenType: REFRESH_TOKEN_CLAIM };
}
