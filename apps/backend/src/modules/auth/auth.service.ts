import { Prisma, type User, UserRole } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { AppError } from "../../utils/app-error.js";
import type { LoginBody, RefreshBody, RegisterAdminBody } from "./auth.schemas.js";
import type { RefreshTokenPayload, SafeUser } from "./auth.types.js";
import * as authUtils from "./auth.utils.js";

function toSafeUser(user: User): SafeUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

export async function registerAdmin(input: RegisterAdminBody) {
  const adminCount = await prisma.user.count({
    where: { role: UserRole.ADMIN }
  });
  if (adminCount > 0) {
    throw new AppError({
      statusCode: 403,
      message:
        "Administrator registration is closed. An admin account already exists."
    });
  }

  const passwordHash = await authUtils.hashPassword(input.password);

  let user: User;
  try {
    user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash,
        role: UserRole.ADMIN
      }
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      throw new AppError({
        statusCode: 409,
        message: "Email already registered"
      });
    }
    throw e;
  }

  const accessToken = authUtils.signAccessToken({
    userId: user.id,
    email: user.email,
    role: user.role
  });
  const refreshToken = authUtils.signRefreshToken(user.id);

  return {
    user: toSafeUser(user),
    accessToken,
    refreshToken
  };
}

export async function login(input: LoginBody) {
  const user = await prisma.user.findUnique({
    where: { email: input.email }
  });
  if (!user) {
    throw new AppError({
      statusCode: 401,
      message: "Invalid email or password"
    });
  }
  if (!user.isActive) {
    throw new AppError({
      statusCode: 403,
      message: "Account is disabled"
    });
  }

  const valid = await authUtils.verifyPassword(input.password, user.passwordHash);
  if (!valid) {
    throw new AppError({
      statusCode: 401,
      message: "Invalid email or password"
    });
  }

  const accessToken = authUtils.signAccessToken({
    userId: user.id,
    email: user.email,
    role: user.role
  });
  const refreshToken = authUtils.signRefreshToken(user.id);

  return {
    user: toSafeUser(user),
    accessToken,
    refreshToken
  };
}

export async function refreshSession(input: RefreshBody) {
  let payload: RefreshTokenPayload;
  try {
    payload = authUtils.verifyRefreshToken(input.refreshToken);
  } catch {
    throw new AppError({
      statusCode: 401,
      message: "Invalid or expired refresh token"
    });
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) {
    throw new AppError({
      statusCode: 401,
      message: "Invalid or expired refresh token"
    });
  }
  if (!user.isActive) {
    throw new AppError({
      statusCode: 403,
      message: "Account is disabled"
    });
  }

  const accessToken = authUtils.signAccessToken({
    userId: user.id,
    email: user.email,
    role: user.role
  });
  const refreshToken = authUtils.signRefreshToken(user.id);

  return {
    user: toSafeUser(user),
    accessToken,
    refreshToken
  };
}
