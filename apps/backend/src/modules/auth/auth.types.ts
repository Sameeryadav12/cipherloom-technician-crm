import type { User, UserRole } from "@prisma/client";

export type SafeUser = Pick<
  User,
  "id" | "name" | "email" | "role" | "isActive" | "createdAt" | "updatedAt"
>;

export type AccessTokenPayload = {
  sub: string;
  email: string;
  role: UserRole;
};

/** Must match `REFRESH_TOKEN_CLAIM` in `auth.constants.ts`. */
export type RefreshTokenPayload = {
  sub: string;
  tokenType: "refresh";
};
