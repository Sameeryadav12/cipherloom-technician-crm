import type { Request, Response } from "express";
import { env } from "../config/env.js";
import { prisma } from "../config/prisma.js";

export function getHealth(_req: Request, res: Response) {
  return res.status(200).json({
    success: true,
    message: "API is healthy",
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV
  });
}

export async function getReadiness(_req: Request, res: Response) {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return res.status(200).json({
      success: true,
      message: "API is ready",
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
      checks: { database: "ok" }
    });
  } catch {
    return res.status(503).json({
      success: false,
      message: "API not ready",
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
      checks: { database: "unavailable" }
    });
  }
}

