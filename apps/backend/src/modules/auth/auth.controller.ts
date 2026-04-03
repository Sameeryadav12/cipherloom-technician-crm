import type { Request, Response } from "express";
import type { LoginBody, RefreshBody, RegisterAdminBody } from "./auth.schemas.js";
import * as authService from "./auth.service.js";

export async function registerAdmin(req: Request, res: Response) {
  const body = req.body as RegisterAdminBody;
  const data = await authService.registerAdmin(body);
  return res.status(201).json({ success: true, data });
}

export async function login(req: Request, res: Response) {
  const body = req.body as LoginBody;
  const data = await authService.login(body);
  return res.status(200).json({ success: true, data });
}

export async function refresh(req: Request, res: Response) {
  const body = req.body as RefreshBody;
  const data = await authService.refreshSession(body);
  return res.status(200).json({ success: true, data });
}
